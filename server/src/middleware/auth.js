import jwt from 'jsonwebtoken';

// Expects header `Authorization: Bearer <token>` (token comes from POST /api/auth/login).
// Routes read req.user.user_id.
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
  try {
    const { user_id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { user_id };
    next();
  } catch {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  }
}
