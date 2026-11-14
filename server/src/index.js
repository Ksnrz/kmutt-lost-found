import express from 'express';
import { pool } from './db.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import postsRouter from './routes/posts.js';
import locationsRouter from './routes/locations.js';

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
    'Content-Type, Authorization'
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

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/posts', postsRouter);
app.use('/api/locations', locationsRouter);

// Access uploaded images
app.use('/uploads', express.static('uploads'));

app.use('/api', (req, res) =>
  res.status(404).json({ error: 'Not found' })
);

const PG_ERRORS = {
  '23505': [409, 'Already exists'],         // unique violation
  '23503': [400, 'Referenced row not found'], // foreign key
  '23514': [400, 'Invalid value'],          // check constraint
  '22P02': [400, 'Invalid input'],          // bad number/uuid syntax
  '22001': [400, 'Value too long'],        // varchar length exceeded
};

app.use((err, req, res, next) => {
  const [status, message] = PG_ERRORS[err.code] ?? [
    err.status ?? 500,
    err.status ? err.message : 'Internal server error',
  ];

  if (status >= 500) console.error(err);

  res.status(status).json({ error: message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API on http://localhost:${port}`);
});