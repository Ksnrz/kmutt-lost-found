import express from 'express';
import { pool } from './db.js';
import claimRoutes from './routes/claimRoutes.js';

const app = express();
app.use(express.json());

app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

// ระบบ VERIFY (ตรวจสอบสิทธิ์และส่งมอบสิ่งของ)
app.use('/api/claims', claimRoutes);

// Mount each resource here, one file per person, e.g.
// import postsRouter from './routes/posts.js';
// app.use('/api/posts', postsRouter);

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
