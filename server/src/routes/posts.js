
import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

const uploadDir = path.resolve('uploads');

// API สำหรับสร้างโพสต์ใหม่
router.post('/', requireAuth, upload.array('images', 5), async (req, res) => {
    const {
        location_id,
        post_type,
        custody_type,
        title,
        description,
        event_date,
        contact_text
    } = req.body;

    const user_id = req.user.user_id;

    if (
        !location_id ||
        !post_type ||
        !title?.trim() ||
        !description?.trim() ||
        !event_date ||
        !contact_text?.trim()
    ) {
        return res.status(400).json({
            error: 'กรุณากรอกข้อมูลให้ครบถ้วน'
        });
    }

    if (!['LOST', 'FOUND'].includes(post_type)) {
        return res.status(400).json({
            error: 'ประเภทโพสต์ไม่ถูกต้อง'
        });
    }

    if (
        (post_type === 'LOST' && custody_type != null) ||
        (post_type === 'FOUND' &&
            !['DEPOSITED', 'SELF_KEPT'].includes(custody_type))
    ) {
        return res.status(400).json({
            error: 'วิธีเก็บสิ่งของไม่ถูกต้อง'
        });
    }

    const result = await pool.query(
        `INSERT INTO posts (
            user_id,
            location_id,
            post_type,
            custody_type,
            title,
            description,
            event_date,
            contact_text
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            user_id,
            location_id,
            post_type,
            custody_type ?? null,
            title.trim(),
            description.trim(),
            event_date,
            contact_text.trim()
        ]
    );

    const post = result.rows[0];
    const images = [];

    for (const file of req.files || []) {
        const imageUrl = `/uploads/${file.filename}`;

        const imageResult = await pool.query(
            `INSERT INTO item_images (
                post_id,
                item_image_url
            )
            VALUES ($1, $2)
            RETURNING *`,
            [post.post_id, imageUrl]
        );

        images.push(imageResult.rows[0]);
    }

    res.status(201).json({
        message: 'สร้างประกาศสำเร็จ',
        post,
        images
    });
});

// API สำหรับดึงรายการประกาศที่ยังเปิดอยู่
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                posts.*,
                locations.building_name,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'item_image_id', item_image_id,
                                'item_image_url', item_image_url
                            )
                        )
                        FROM item_images
                        WHERE item_images.post_id = posts.post_id
                    ),
                    '[]'::json
                ) AS images
            FROM posts
            JOIN locations
                ON posts.location_id = locations.location_id
            WHERE posts.post_status = 'OPEN'
            ORDER BY posts.created_at DESC
        `);

        res.json({
            posts: result.rows
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            error: 'ไม่สามารถดึงรายการประกาศได้'
        });
    }
});

// API สำหรับดึงประกาศรายชิ้น
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                posts.*,
                locations.building_name,
                locations.pickup_detail,
                locations.pickup_name,
                locations.pickup_phone,
                locations.open_hours,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'item_image_id', item_image_id,
                                'item_image_url', item_image_url
                            )
                        )
                        FROM item_images
                        WHERE item_images.post_id = posts.post_id
                    ),
                    '[]'::json
                ) AS images
            FROM posts
            JOIN locations
                ON posts.location_id = locations.location_id
            WHERE posts.post_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'ไม่พบประกาศนี้'
            });
        }

        res.json({
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Get post detail error:', error);
        res.status(500).json({
            error: 'ไม่สามารถดึงรายละเอียดประกาศได้'
        });
    }
});

// API สำหรับแก้ไขประกาศและจัดการรูปภาพ
router.patch(
    '/:id',
    requireAuth,
    upload.array('images', 5),
    async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.user_id;

        const {
            location_id,
            post_type,
            custody_type,
            title,
            description,
            event_date,
            contact_text
        } = req.body;

        const uploadedFiles = req.files || [];

        let client;
        let transactionStarted = false;
        let oldImageUrls = [];

        try {
            if (
                !location_id ||
                !post_type ||
                !title?.trim() ||
                !description?.trim() ||
                !event_date ||
                !contact_text?.trim()
            ) {
                return res.status(400).json({
                    error: 'กรุณากรอกข้อมูลให้ครบถ้วน'
                });
            }

            if (!['LOST', 'FOUND'].includes(post_type)) {
                return res.status(400).json({
                    error: 'ประเภทโพสต์ไม่ถูกต้อง'
                });
            }

            if (
                (post_type === 'LOST' && custody_type != null && custody_type !== '') ||
                (post_type === 'FOUND' &&
                    !['DEPOSITED', 'SELF_KEPT'].includes(custody_type))
            ) {
                return res.status(400).json({
                    error: 'วิธีเก็บสิ่งของไม่ถูกต้อง'
                });
            }

            let deleteImageIds = [];

            try {
                deleteImageIds = req.body.delete_image_ids
                    ? JSON.parse(req.body.delete_image_ids)
                    : [];
            } catch {
                return res.status(400).json({
                    error: 'ข้อมูลรูปภาพที่ต้องการลบไม่ถูกต้อง'
                });
            }

            if (
                !Array.isArray(deleteImageIds) ||
                deleteImageIds.some((imageId) => !/^\d+$/.test(String(imageId)))
            ) {
                return res.status(400).json({
                    error: 'ข้อมูลรูปภาพที่ต้องการลบไม่ถูกต้อง'
                });
            }

            client = await pool.connect();
            await client.query('BEGIN');
            transactionStarted = true;

            // ตรวจสอบสิทธิ์เจ้าของโพสต์และสถานะ
            const postCheck = await client.query(
                `SELECT post_id
                 FROM posts
                 WHERE post_id = $1
                   AND user_id = $2
                   AND post_status = 'OPEN'
                 FOR UPDATE`,
                [id, user_id]
            );

            if (postCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(404).json({
                    error: 'ไม่พบประกาศ หรือคุณไม่มีสิทธิ์แก้ไขประกาศนี้'
                });
            }

            // ลบรูปเดิมเฉพาะรูปที่เป็นของโพสต์นี้
            for (const imageId of deleteImageIds) {
                const deleted = await client.query(
                    `DELETE FROM item_images
                     WHERE item_image_id = $1
                       AND post_id = $2
                     RETURNING item_image_url`,
                    [imageId, id]
                );

                oldImageUrls.push(
                    ...deleted.rows.map((row) => row.item_image_url)
                );
            }

            // ตรวจสอบจำนวนรูปที่เหลือก่อนเพิ่มรูปใหม่
            const imageCountResult = await client.query(
                `SELECT COUNT(*)::int AS total
                 FROM item_images
                 WHERE post_id = $1`,
                [id]
            );

            const remainingImages = imageCountResult.rows[0].total;

            if (remainingImages + uploadedFiles.length > 5) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    error: 'สามารถมีรูปภาพได้ไม่เกิน 5 รูป'
                });
            }

            // อัปเดตข้อมูลประกาศ
            const result = await client.query(
                `UPDATE posts
                 SET
                    location_id = $1,
                    post_type = $2,
                    custody_type = $3,
                    title = $4,
                    description = $5,
                    event_date = $6,
                    contact_text = $7
                 WHERE post_id = $8
                   AND user_id = $9
                   AND post_status = 'OPEN'
                 RETURNING *`,
                [
                    location_id,
                    post_type,
                    custody_type || null,
                    title.trim(),
                    description.trim(),
                    event_date,
                    contact_text.trim(),
                    id,
                    user_id
                ]
            );

            // เพิ่มรูปใหม่
            for (const file of uploadedFiles) {
                const imageUrl = `/uploads/${file.filename}`;

                await client.query(
                    `INSERT INTO item_images (
                        post_id,
                        item_image_url
                    )
                    VALUES ($1, $2)`,
                    [id, imageUrl]
                );
            }

            await client.query('COMMIT');
            transactionStarted = false;

            // ลบไฟล์รูปเก่าจาก uploads หลังบันทึกฐานข้อมูลสำเร็จ
            for (const imageUrl of oldImageUrls) {
                const filename = path.basename(imageUrl || '');

                if (
                    filename &&
                    imageUrl === `/uploads/${filename}`
                ) {
                    try {
                        await fs.unlink(path.join(uploadDir, filename));
                    } catch (error) {
                        if (error.code !== 'ENOENT') {
                            console.error('Delete old image error:', error);
                        }
                    }
                }
            }

            // ดึงรายการรูปภาพล่าสุด
            const imagesResult = await pool.query(
                `SELECT item_image_id, item_image_url
                 FROM item_images
                 WHERE post_id = $1
                 ORDER BY item_image_id`,
                [id]
            );

            res.json({
                message: 'แก้ไขประกาศสำเร็จ',
                post: result.rows[0],
                images: imagesResult.rows
            });
        } catch (error) {
            if (transactionStarted && client) {
                await client.query('ROLLBACK').catch(() => {});
            }

            // ลบไฟล์รูปใหม่ที่อัปโหลดมา หากบันทึกไม่สำเร็จ
            for (const file of uploadedFiles) {
                try {
                    await fs.unlink(path.join(uploadDir, file.filename));
                } catch (unlinkError) {
                    if (unlinkError.code !== 'ENOENT') {
                        console.error('Cleanup uploaded image error:', unlinkError);
                    }
                }
            }

            console.error('Update post error:', error);

            if (!res.headersSent) {
                res.status(500).json({
                    error: 'ไม่สามารถแก้ไขประกาศได้'
                });
            }
        } finally {
            if (client) {
                client.release();
            }
        }
    }
);

// API สำหรับยกเลิกประกาศ
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // one statement, so the post and its open claims are cancelled together
    const result = await pool.query(
        `WITH cancelled AS (
            UPDATE posts
            SET post_status = 'CANCELLED'
            WHERE post_id = $1
              AND user_id = $2
              AND post_status = 'OPEN'
            RETURNING *
         ), claims AS (
            UPDATE verify_items
            SET verify_status = 'CANCELLED',
                note = 'ระบบยกเลิกอัตโนมัติเนื่องจากประกาศนี้ถูกยกเลิก'
            WHERE post_id IN (SELECT post_id FROM cancelled)
              AND verify_status IN ('PENDING', 'ACCEPTED')
         )
         SELECT * FROM cancelled`,
        [id, user_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: 'ไม่พบประกาศ หรือคุณไม่มีสิทธิ์ยกเลิกประกาศนี้'
        });
    }

    res.json({
        message: 'ยกเลิกประกาศสำเร็จ',
        post: result.rows[0]
    });
});

export default router;
