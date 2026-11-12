import express from 'express';
import { pool } from './db.js';
import claimRoutes from './routes/claimRoutes.js';

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, x-test-user'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

// ระบบ VERIFY (ตรวจสอบสิทธิ์และส่งมอบสิ่งของ)
app.use('/api/claims', claimRoutes);

// Access uploaded images
app.use('/uploads', express.static('uploads'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Express 5 forwards errors thrown in async handlers here, so routes need no try/catch.
// Shared format for every error: { "error": "..." }
const PG_ERRORS = {
  '23505': [409, 'Already exists'],         // unique violation
  '23503': [400, 'Referenced row not found'], // foreign key
  '23514': [400, 'Invalid value'],          // check constraint
  '22P02': [400, 'Invalid input'],          // bad number/uuid syntax
};
app.use((err, req, res, next) => {
  const [status, message] = PG_ERRORS[err.code] ?? [err.status ?? 500, err.status ? err.message : 'Internal server error'];
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
