import { pool } from '../src/config/db';

async function checkRecentUpdates() {
  const res = await pool.query(`
    SELECT id, name, sku, image_url, primary_image_url, images, updated_at 
    FROM products 
    ORDER BY updated_at DESC 
    LIMIT 20
  `);
  console.log('Most recently updated products:');
  for (const r of res.rows) {
    console.log(`${r.updated_at?.toISOString()} | ${r.name} | img: ${r.image_url || r.primary_image_url || r.images || 'NONE'}`);
  }
  await pool.end();
}
checkRecentUpdates();
