import { pool } from '../src/config/db';
import { getProductFamilyKey } from '../src/routes/products';
import { parseProductMedia } from '../src/utils/productMedia';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeFamilies() {
  const res = await pool.query('SELECT * FROM products ORDER BY name ASC');
  const products = res.rows;

  const familyMap = new Map<string, any[]>();
  for (const p of products) {
    const key = getProductFamilyKey(p);
    if (!familyMap.has(key)) {
      familyMap.set(key, []);
    }
    familyMap.get(key)!.push(p);
  }

  const totalFamilies = familyMap.size; // Should be 356
  let familiesWithNoImage = 0;
  let familiesWithImage = 0;
  let familiesPartiallyWithImage = 0;

  const noImageFamilies: any[] = [];
  const withImageFamilies: any[] = [];
  const partialFamilies: any[] = [];

  const unassignedFamiliesByCategory: Record<string, number> = {};
  const totalFamiliesByCategory: Record<string, number> = {};

  for (const [key, siblings] of familyMap.entries()) {
    const primaryCat = siblings[0].primary_category || 'Uncategorized';
    totalFamiliesByCategory[primaryCat] = (totalFamiliesByCategory[primaryCat] || 0) + 1;

    // Check images across siblings
    let siblingWithImageCount = 0;
    for (const s of siblings) {
      const media = parseProductMedia(s);
      const hasImg = (media.images && media.images.length > 0 && media.images.some(img => img && img.trim())) ||
                     (media.primary_image_url && media.primary_image_url.trim());
      if (hasImg) {
        siblingWithImageCount++;
      }
    }

    const representative = siblings[0];

    if (siblingWithImageCount === 0) {
      familiesWithNoImage++;
      unassignedFamiliesByCategory[primaryCat] = (unassignedFamiliesByCategory[primaryCat] || 0) + 1;
      noImageFamilies.push({
        family_key: key,
        name: representative.name,
        brand: representative.brand,
        primary_category: primaryCat,
        secondary_category: representative.secondary_category,
        variants_count: siblings.length,
        variants: siblings.map(s => ({ id: s.id, name: s.name, sku: s.sku }))
      });
    } else if (siblingWithImageCount === siblings.length) {
      familiesWithImage++;
      withImageFamilies.push({
        family_key: key,
        name: representative.name,
        variants_count: siblings.length
      });
    } else {
      // Partial: some variants have image, some do not
      familiesPartiallyWithImage++;
      partialFamilies.push({
        family_key: key,
        name: representative.name,
        with_image: siblingWithImageCount,
        total_variants: siblings.length,
        variants: siblings.map(s => ({
          id: s.id,
          name: s.name,
          sku: s.sku,
          has_image: Boolean(
            (s.image_url && s.image_url.trim()) ||
            (s.primary_image_url && s.primary_image_url.trim()) ||
            (s.images && s.images.trim() && s.images !== '[]')
          )
        }))
      });
    }
  }

  console.log('========================================================');
  console.log(`TOTAL UNIQUE DISPLAY PRODUCTS (FAMILIES): ${totalFamilies}`);
  console.log(`TOTAL RAW PRODUCT ROWS IN DATABASE: ${products.length}`);
  console.log('========================================================');
  console.log(`1. Families with NO image uploaded on ANY variant: ${familiesWithNoImage}`);
  console.log(`2. Families with images on ALL variants: ${familiesWithImage}`);
  console.log(`3. Families with PARTIAL images (some variants have, some don't): ${familiesPartiallyWithImage}`);
  console.log(`   -> Total Families that have at least 1 image uploaded: ${familiesWithImage + familiesPartiallyWithImage}`);
  console.log('========================================================');

  console.log('\n--- UNASSIGNED FAMILIES BY CATEGORY ---');
  Object.entries(unassignedFamiliesByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const tot = totalFamiliesByCategory[cat] || 0;
      console.log(`- ${cat}: ${count} / ${tot} without image (${((count / tot) * 100).toFixed(1)}%)`);
    });

  if (partialFamilies.length > 0) {
    console.log('\n--- PARTIAL FAMILIES DETAILS ---');
    for (const p of partialFamilies) {
      console.log(`- ${p.name} (${p.with_image}/${p.total_variants} variants have image)`);
    }
  }

  // Save report
  fs.writeFileSync(
    path.join(__dirname, 'unassigned_families_report.json'),
    JSON.stringify({
      totalFamilies,
      familiesWithNoImage,
      familiesWithImage,
      familiesPartiallyWithImage,
      unassignedFamiliesByCategory,
      noImageFamilies,
      partialFamilies
    }, null, 2)
  );

  await pool.end();
}

analyzeFamilies();
