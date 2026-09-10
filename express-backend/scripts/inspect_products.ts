import { supabase } from '../src/config/supabase';
import { parseProductMedia } from '../src/utils/productMedia';

async function main() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`\n=== Total Products in DB: ${products?.length} ===\n`);
  for (const p of products || []) {
    const media = parseProductMedia(p);
    console.log(`ID: ${p.id}`);
    console.log(`  Name:        ${p.name}`);
    console.log(`  Unit:        ${p.unit}`);
    console.log(`  SKU:         ${p.sku}`);
    console.log(`  Category:    ${p.primary_category}`);
    console.log(`  Images (${media.images.length}):`, media.images);
    console.log(`  Video:       ${media.video_url}`);
    console.log('----------------------------------------------------');
  }
}

main();
