import { pool } from '../src/config/db';
import { parseProductMedia } from '../src/utils/productMedia';

async function findTheOne() {
  const res = await pool.query('SELECT * FROM products');
  for (const p of res.rows) {
    // Logic from analyze_db_images_detailed:
    const media = parseProductMedia(p);
    const parsedImages = media.images.filter((img: string) => img && img.trim().length > 0);
    const parsedPrimary = (media.primary_image_url || '').trim();
    const hasValidImageDetailed = parsedImages.length > 0 || parsedPrimary.length > 0;

    // Logic from checkExact:
    const rawImg = (p.image_url || '').trim();
    const rawPrimary = (p.primary_image_url || '').trim();
    const rawImages = (p.images || '').trim();
    const hasAnyRaw = Boolean(rawImg || rawPrimary || (rawImages && rawImages !== '[]' && rawImages !== '{}'));
    const hasAnyMedia = Boolean((media.primary_image_url && media.primary_image_url.trim()) || (media.images && media.images.length > 0 && media.images.some((x: string) => x && x.trim())));
    const isAssignedExact = !(!hasAnyRaw && !hasAnyMedia);

    if (hasValidImageDetailed !== isAssignedExact) {
      console.log('FOUND THE ROW:');
      console.log('ID:', p.id);
      console.log('Name:', p.name);
      console.log('SKU:', p.sku);
      console.log('image_url:', p.image_url);
      console.log('primary_image_url:', p.primary_image_url);
      console.log('images:', p.images);
      console.log('description:', p.description);
      console.log('hasValidImageDetailed:', hasValidImageDetailed);
      console.log('isAssignedExact:', isAssignedExact);
    }
  }
  await pool.end();
}

findTheOne();
