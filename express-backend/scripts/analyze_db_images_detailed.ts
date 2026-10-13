import { pool } from '../src/config/db';
import { parseProductMedia } from '../src/utils/productMedia';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeDetailed() {
  const client = await pool.connect();
  try {
    console.log('--- STARTING COMPREHENSIVE DB PRODUCT IMAGE ANALYSIS ---');

    // 1. Get total count in products
    const totalCountRes = await client.query('SELECT count(*) FROM products;');
    const totalCount = parseInt(totalCountRes.rows[0].count, 10);

    // 2. Query all products with their image related columns
    const productsRes = await client.query(`
      SELECT id, name, sku, barcode, primary_category, secondary_category, 
             brand, company, shop_id, image_url, primary_image_url, images, description
      FROM products
      ORDER BY name ASC;
    `);

    const products = productsRes.rows;

    let noImageCount = 0;
    let hasImageCount = 0;

    const noImageList: any[] = [];
    const hasImageList: any[] = [];

    // Category breakdown of unassigned images
    const unassignedByCategory: Record<string, number> = {};
    const totalByCategory: Record<string, number> = {};

    for (const p of products) {
      const cat = p.primary_category || 'Uncategorized';
      totalByCategory[cat] = (totalByCategory[cat] || 0) + 1;

      // Use standard media parser
      const media = parseProductMedia(p);

      // Check if image string is empty, null, '[]', '""', etc.
      const rawImg = (p.image_url || '').trim();
      const rawPrimary = (p.primary_image_url || '').trim();
      const rawImagesArr = p.images;

      // Check media parsed result
      const parsedImages = media.images.filter((img: string) => img && img.trim().length > 0);
      const parsedPrimary = (media.primary_image_url || '').trim();

      const hasValidImage = parsedImages.length > 0 || parsedPrimary.length > 0;

      if (!hasValidImage) {
        noImageCount++;
        unassignedByCategory[cat] = (unassignedByCategory[cat] || 0) + 1;
        noImageList.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          brand: p.brand,
          primary_category: p.primary_category,
          secondary_category: p.secondary_category,
          shop_id: p.shop_id,
          image_url: p.image_url,
          primary_image_url: p.primary_image_url,
          images: p.images
        });
      } else {
        hasImageCount++;
        hasImageList.push({
          id: p.id,
          name: p.name,
          imagesCount: parsedImages.length,
          primary: parsedPrimary || parsedImages[0]
        });
      }
    }

    console.log(`TOTAL PRODUCTS IN DATABASE: ${totalCount}`);
    console.log(`PRODUCTS WITH IMAGE ASSIGNED: ${hasImageCount}`);
    console.log(`PRODUCTS WITHOUT IMAGE ASSIGNED: ${noImageCount}`);
    console.log(`IMAGE COVERAGE: ${((hasImageCount / totalCount) * 100).toFixed(2)}%`);

    console.log('\n--- UNASSIGNED IMAGES BY CATEGORY ---');
    Object.entries(unassignedByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const total = totalByCategory[cat] || 0;
        console.log(`- ${cat}: ${count} / ${total} unassigned (${((count / total) * 100).toFixed(1)}% missing)`);
      });

    // Write full report to a json file for precise inspection
    const reportPath = path.join(__dirname, 'unassigned_products_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      totalCount,
      hasImageCount,
      noImageCount,
      unassignedByCategory,
      noImageList
    }, null, 2));

    console.log(`\nDetailed report written to: ${reportPath}`);

  } catch (err) {
    console.error('Error during analysis:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeDetailed();
