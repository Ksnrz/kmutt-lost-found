import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// API สำหรับสร้างโพสต์ใหม่
router.post('/', requireAuth, async (req, res) => {
    const {
        location_id,
        post_type,
        custody_type,
        title,
        description,
        event_date,
        contact_text
    } = req.body;

// กำหนด user_id จาก req.user.user_id ที่ได้จาก middleware
    const user_id = req.user.user_id;
// เช็คข้อมูลที่จำเป็น
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

    // เช็คประเภทโพสต์
    if (!['LOST', 'FOUND'].includes(post_type)) {
        return res.status(400).json({
            error: 'ประเภทโพสต์ไม่ถูกต้อง'
        });
    }

    // เช็ควิธีเก็บสิ่งของ
    if (
    (post_type === 'LOST' && custody_type != null) ||
    (post_type === 'FOUND' &&
        !['DEPOSITED', 'SELF_KEPT'].includes(custody_type))
    ) {
    return res.status(400).json({
        error: 'วิธีเก็บสิ่งของไม่ถูกต้อง'
    });
    }

// ทำการไปเพิ่มข้อมูลใน database
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
        title,
        description,
        event_date,
        contact_text
    ]
    );
    res.status(201).json({
        message: 'สร้างประกาศสำเร็จ',
        post: result.rows[0]
    });
});


// API สำหรับดึงประกาศรายชิ้นตาม post_id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
        `SELECT
            posts.*,
            locations.building_name
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

export default router;