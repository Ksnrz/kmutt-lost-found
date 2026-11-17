import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const COLUMNS = 'user_id, student_id, email, first_name, last_name, phone_number';

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE user_id = $1`, [req.user.user_id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// A field that is omitted (or null) keeps its old value; send '' to clear it.
router.patch('/', async (req, res) => {
  const { first_name, last_name, phone_number } = req.body ?? {};
  // Thai mobile, digits only (the client strips the dashes); '' clears the number
  if (phone_number && !/^0[689]\d{8}$/.test(phone_number)) {
    return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  }
  const { rows } = await pool.query(
    `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       phone_number = COALESCE($3, phone_number) WHERE user_id = $4 RETURNING ${COLUMNS}`,
    [first_name, last_name, phone_number, req.user.user_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});


// ============================================================
// GET /api/me/posts — ประกาศที่ฉันสร้าง พร้อมจำนวน PENDING claims
// ============================================================
router.get('/posts', async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { rows } = await pool.query(
      `SELECT
         p.post_id,
         p.title,
         p.post_type,
         p.custody_type,
         p.post_status,
         p.created_at,
         l.building_name,
         COUNT(v.verify_id) FILTER (WHERE v.verify_status = 'PENDING') AS pending_count
       FROM posts p
       LEFT JOIN locations l ON p.location_id = l.location_id
       LEFT JOIN verify_items v ON p.post_id = v.post_id
       WHERE p.user_id = $1
       GROUP BY p.post_id, l.building_name
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json({ ok: true, posts: rows });
  } catch (err) {
    next(err);
  }
});

export default router;

