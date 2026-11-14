import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// API สำหรับดึงรายการสถานที่ทั้งหมด
router.get('/', async (req, res) => {
    const result = await pool.query(
        `SELECT *
         FROM locations
         ORDER BY building_name ASC`
    );

    res.json({
        locations: result.rows
    });
});

export default router;