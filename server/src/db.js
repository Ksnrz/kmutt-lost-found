import pg from 'pg';

// DATE columns come back as 'YYYY-MM-DD' strings; the default Date object at local midnight shifts the day in UTC+7
pg.types.setTypeParser(1082, (v) => v);

// One shared pool for the whole app: import { pool } from '../db.js'
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
