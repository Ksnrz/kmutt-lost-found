
import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

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

// API สำหรับดึงรายการประกาศทั้งหมด
router.get('/', async (req, res) => {
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
        ORDER BY posts.created_at DESC
    `);

    res.json({
        posts: result.rows
    });
});

// API สำหรับดึงประกาศรายชิ้น
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        `SELECT
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
});

// API สำหรับแก้ไขประกาศ
router.patch('/:id', requireAuth, async (req, res) => {
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
            custody_type ?? null,
            title.trim(),
            description.trim(),
            event_date,
            contact_text.trim(),
            id,
            user_id
        ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: 'ไม่พบประกาศ หรือคุณไม่มีสิทธิ์แก้ไขประกาศนี้'
        });
    }

    res.json({
        message: 'แก้ไขประกาศสำเร็จ',
        post: result.rows[0]
    });
});

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