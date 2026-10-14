import { pool } from '../src/config/db';
import { parseProductMedia } from '../src/utils/productMedia';

async function checkExact() {
  const res = await pool.query(`
    SELECT id, name, sku, image_url, primary_image_url, images, description, primary_category 
    FROM products
  `);

  console.log(`Total rows retrieved: ${res.rows.length}`);

  let diffCount = 0;
  for (const p of res.rows) {
    const rawImg = (p.image_url || '').trim();
    const rawPrimary = (p.primary_image_url || '').trim();
    const rawImages = (p.images || '').trim();
    const media = parseProductMedia(p);

    const check1 = Boolean(rawImg || rawPrimary || (rawImages && rawImages !== '[]' && rawImages !== '{}'));
    
    const parsedImages = (media.images || []).filter((img: string) => img && typeof img === 'string' && img.trim().length > 0);
    const parsedPrimary = (media.primary_image_url || '').trim();
    const check2 = Boolean(parsedImages.length > 0 || parsedPrimary.length > 0);

    if (check1 !== check2) {
      diffCount++;
      console.log('DIFF PRODUCT:', p.id, p.name);
      console.log('check1 (raw):', check1, 'check2 (media):', check2);
      console.log('p.image_url:', JSON.stringify(p.image_url));
      console.log('p.primary_image_url:', JSON.stringify(p.primary_image_url));
      console.log('p.images:', JSON.stringify(p.images));
      console.log('media:', JSON.stringify(media));
    }
  }

  console.log('Total differences between raw & parseProductMedia:', diffCount);
  await pool.end();
}

checkExact();
