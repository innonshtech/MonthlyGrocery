import { pool } from '../src/config/db';

async function checkSampleAssigned() {
  const res = await pool.query(`
    SELECT name, image_url, primary_image_url 
    FROM products 
    WHERE image_url IS NOT NULL AND TRIM(image_url) != '' AND TRIM(image_url) != '[]'
    LIMIT 10;
  `);
  for (const r of res.rows) {
    console.log(`${r.name} -> ${r.image_url}`);
  }
  await pool.end();
}

checkSampleAssigned();
