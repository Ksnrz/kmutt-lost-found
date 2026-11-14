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

export default router;
