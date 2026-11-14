import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { student_id, email, password } = req.body;
  if( !student_id || !email || !password) {
    return res.status(400).json({error: 'กรอกข้อมูลไม่ครบ'})
  }
  const password_hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(`INSERT INTO users (student_id, email, password_hash)
    VALUES ($1, $2, $3) RETURNING user_id, student_id, email`,
    [student_id, email, password_hash]
  );
  res.status(201).json(rows[0]);
});

// login with student_id or email (the Login page has one field for both)
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body ?? {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  }
  const { rows } = await pool.query(
    'SELECT user_id, student_id, email, password_hash FROM users WHERE student_id = $1 OR email = $1',
    [identifier]
  );
  const user = rows[0];
  // same message for "no such user" and "wrong password" so nobody can probe which accounts exist
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'รหัสนักศึกษา/อีเมล หรือรหัสผ่านไม่ถูกต้อง' });
  }
  const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { user_id: user.user_id, student_id: user.student_id, email: user.email } });
});

export default router;
