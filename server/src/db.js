import pg from 'pg';

// One shared pool for the whole app: import { pool } from '../db.js'
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
