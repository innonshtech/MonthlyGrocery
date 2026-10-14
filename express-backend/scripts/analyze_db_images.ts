import { pool } from '../src/config/db';
import { parseProductMedia } from '../src/utils/productMedia';

async function analyze() {
  const client = await pool.connect();
  try {
    console.log('=== DATABASE PRODUCT & IMAGE ANALYSIS ===\n');

    // 1. Find all relevant tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map((r: any) => r.table_name);
    console.log('All public tables in DB:', tables.join(', '));

    // Check relevant tables like products, master_catalog, etc.
    const productTables = tables.filter((t: string) => 
      t.includes('product') || t.includes('catalog') || t.includes('item')
    );
    console.log('\nRelevant product/catalog tables:', productTables);

    for (const tableName of productTables) {
      console.log(`\n========================================`);
      console.log(`ANALYZING TABLE: ${tableName}`);
      console.log(`========================================`);

      // Get columns
      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      const cols = colsRes.rows.map((r: any) => r.column_name);
      console.log(`Columns (${cols.length}):`, cols.join(', '));

      // Get all rows
      const rowsRes = await client.query(`SELECT * FROM ${tableName}`);
      const rows = rowsRes.rows;
      console.log(`Total rows in ${tableName}: ${rows.length}`);

      let unassignedCount = 0;
      let assignedCount = 0;
      const unassignedList: any[] = [];
      const assignedList: any[] = [];

      for (const row of rows) {
        // Evaluate images using both column checks and parseProductMedia if applicable
        const media = parseProductMedia(row);
        const rawImageUrl = row.image_url;
        const rawPrimaryImageUrl = row.primary_image_url;
        const rawImages = row.images;

        const hasMediaImages = media.images && media.images.length > 0 && media.images.some((img: string) => img && img.trim() !== '');
        const hasPrimaryImage = media.primary_image_url && media.primary_image_url.trim() !== '';

        const hasAnyImage = hasMediaImages || hasPrimaryImage;

        if (!hasAnyImage) {
          unassignedCount++;
          unassignedList.push({
            id: row.id,
            name: row.name || row.title || 'N/A',
            sku: row.sku || 'N/A',
            category: row.primary_category || row.category || 'N/A',
            sub_category: row.secondary_category || row.sub_category || 'N/A',
            shop_id: row.shop_id || 'N/A',
            raw_image_url: rawImageUrl,
            raw_primary_image_url: rawPrimaryImageUrl,
            raw_images: rawImages
          });
        } else {
          assignedCount++;
          assignedList.push({
            id: row.id,
            name: row.name || row.title,
            primary_image: media.primary_image_url,
            images_count: media.images.length
          });
        }
      }

      console.log(`\nSummary for ${tableName}:`);
      console.log(`  Total Products: ${rows.length}`);
      console.log(`  With Image Assigned: ${assignedCount}`);
      console.log(`  WITHOUT Image Assigned: ${unassignedCount}`);

      if (unassignedCount > 0) {
        console.log(`\nList of Products with NO image in ${tableName}:`);
        unassignedList.forEach((p, idx) => {
          console.log(`  ${idx + 1}. [ID: ${p.id}] Name: "${p.name}" | SKU: ${p.sku} | Category: ${p.category} | Shop: ${p.shop_id}`);
        });
      }
    }

  } catch (err: any) {
    console.error('Error analyzing database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

analyze();
