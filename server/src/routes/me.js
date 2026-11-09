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

// shortcut: a field that is omitted (or null) keeps its old value, so a name can't be cleared back to empty; upgrade if the Account page needs "remove phone".
router.patch('/', async (req, res) => {
  const { first_name, last_name, phone_number } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       phone_number = COALESCE($3, phone_number) WHERE user_id = $4 RETURNING ${COLUMNS}`,
    [first_name, last_name, phone_number, req.user.user_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

export default router;
