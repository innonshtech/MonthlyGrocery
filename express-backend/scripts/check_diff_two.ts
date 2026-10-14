import { pool } from '../src/config/db';
import { parseProductMedia } from '../src/utils/productMedia';

async function checkDiffTwo() {
  const res = await pool.query(`SELECT * FROM products`);
  for (const p of res.rows) {
    const rawImg = (p.image_url || '').trim();
    const rawPrimary = (p.primary_image_url || '').trim();
    const rawImages = (p.images || '').trim();
    
    // SQL check condition:
    const sqlUnassigned = (
      (!p.image_url || rawImg === '' || rawImg === '[]') &&
      (!p.primary_image_url || rawPrimary === '') &&
      (!p.images || rawImages === '' || rawImages === '[]' || rawImages === '{}')
    );

    // Media parse condition:
    const media = parseProductMedia(p);
    const parsedImages = (media.images || []).filter((img: string) => img && typeof img === 'string' && img.trim().length > 0);
    const parsedPrimary = (media.primary_image_url || '').trim();
    const mediaHasImage = parsedImages.length > 0 || parsedPrimary.length > 0;
    const mediaUnassigned = !mediaHasImage;

    if (sqlUnassigned !== mediaUnassigned) {
      console.log('DIFFERING PRODUCT:');
      console.log('ID:', p.id);
      console.log('Name:', p.name);
      console.log('sqlUnassigned:', sqlUnassigned);
      console.log('mediaUnassigned:', mediaUnassigned);
      console.log('image_url:', JSON.stringify(p.image_url));
      console.log('primary_image_url:', JSON.stringify(p.primary_image_url));
      console.log('images:', JSON.stringify(p.images));
      console.log('description:', JSON.stringify(p.description));
      console.log('media:', JSON.stringify(media));
      console.log('-------------------------------------------');
    }
  }
  await pool.end();
}

checkDiffTwo();
