import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkFinal() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT 
      (SELECT count(*) FROM profiles) as total_users,
      (SELECT count(*) FROM shops) as total_shops,
      (SELECT count(*) FROM products) as total_products,
      (SELECT count(*) FROM serviceable_locations) as total_locations,
      (SELECT count(*) FROM promotional_banners) as total_banners,
      (SELECT count(*) FROM app_settings) as total_configs;
  `);
  console.log("=========================================");
  console.log("   AWS RDS POSTGRESQL DATABASE STATUS    ");
  console.log("=========================================");
  console.table(res.rows);
  client.release();
  await pool.end();
}

checkFinal();
