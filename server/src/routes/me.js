import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const COLUMNS = 'user_id, student_id, email, first_name, last_name, phone_number, contact_info';

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE user_id = $1`, [req.user.user_id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// My posts (all statuses) for the Account page, with how many claims still wait for my review
router.get('/posts', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.post_id, p.post_type, p.custody_type, p.title, p.event_date, p.post_status, p.created_at,
            l.building_name,
            (SELECT count(*)::int FROM verify_items v
              WHERE v.post_id = p.post_id AND v.verify_status = 'PENDING') AS pending_count,
            (SELECT COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.student_id)
               FROM verify_items v JOIN users u ON u.user_id = v.user_id
              WHERE v.post_id = p.post_id AND v.verify_status = 'PENDING'
              ORDER BY v.created_at DESC LIMIT 1) AS latest_claimant,
            (SELECT item_image_url FROM item_images i
              WHERE i.post_id = p.post_id ORDER BY i.item_image_id LIMIT 1) AS image_url
       FROM posts p
       JOIN locations l ON l.location_id = p.location_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC`,
    [req.user.user_id]
  );
  res.json({ posts: rows });
});

// A field that is omitted (or null) keeps its old value; send '' to clear it (except the phone).
router.patch('/', async (req, res) => {
  const { first_name, last_name, phone_number, contact_info } = req.body ?? {};
  // Thai mobile, digits only (the client strips the dashes); required, so it cannot be cleared
  if (phone_number != null && !/^0[689]\d{8}$/.test(phone_number)) {
    return res.status(400).json({ error: phone_number === '' ? 'กรุณากรอกเบอร์โทร' : 'เบอร์โทรไม่ถูกต้อง' });
  }
  const { rows } = await pool.query(
    `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       phone_number = COALESCE($3, phone_number), contact_info = COALESCE($4, contact_info)
     WHERE user_id = $5 RETURNING ${COLUMNS}`,
    [first_name, last_name, phone_number, typeof contact_info === 'string' ? contact_info.trim() : null, req.user.user_id]
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

