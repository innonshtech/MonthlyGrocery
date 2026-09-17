import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000
});

async function testConnection() {
  console.log("Connecting to AWS RDS PostgreSQL at:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time, version();');
    console.log("SUCCESS! Connected to AWS RDS PostgreSQL!");
    console.log("Current Server Time:", res.rows[0].current_time);
    console.log("PostgreSQL Version:", res.rows[0].version);
    client.release();
    await pool.end();
  } catch (err: any) {
    console.error("Connection Failed:", err.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
