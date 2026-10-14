import { pool } from '../src/config/db';

async function querySql() {
  const total = await pool.query('SELECT COUNT(*) FROM products;');
  
  // Products where all image columns are strictly null or empty string
  const strictlyEmpty = await pool.query(`
    SELECT COUNT(*) FROM products 
    WHERE (image_url IS NULL OR TRIM(image_url) = '' OR TRIM(image_url) = '[]')
      AND (primary_image_url IS NULL OR TRIM(primary_image_url) = '')
      AND (images IS NULL OR TRIM(images) = '' OR TRIM(images) = '[]' OR TRIM(images) = '{}')
  `);

  // Products where at least one image column has a non-empty value
  const strictlyHas = await pool.query(`
    SELECT COUNT(*) FROM products 
    WHERE NOT (
      (image_url IS NULL OR TRIM(image_url) = '' OR TRIM(image_url) = '[]')
      AND (primary_image_url IS NULL OR TRIM(primary_image_url) = '')
      AND (images IS NULL OR TRIM(images) = '' OR TRIM(images) = '[]' OR TRIM(images) = '{}')
    )
  `);

  console.log('Total products:', total.rows[0].count);
  console.log('Strictly unassigned (null/empty/[]):', strictlyEmpty.rows[0].count);
  console.log('Assigned image in DB:', strictlyHas.rows[0].count);

  // Group by primary_category for unassigned products
  const categoryBreakdown = await pool.query(`
    SELECT 
      COALESCE(primary_category, 'Uncategorized') as category,
      COUNT(*) as total_count,
      COUNT(*) FILTER (
        WHERE (image_url IS NULL OR TRIM(image_url) = '' OR TRIM(image_url) = '[]')
          AND (primary_image_url IS NULL OR TRIM(primary_image_url) = '')
          AND (images IS NULL OR TRIM(images) = '' OR TRIM(images) = '[]' OR TRIM(images) = '{}')
      ) as unassigned_count,
      COUNT(*) FILTER (
        WHERE NOT (
          (image_url IS NULL OR TRIM(image_url) = '' OR TRIM(image_url) = '[]')
          AND (primary_image_url IS NULL OR TRIM(primary_image_url) = '')
          AND (images IS NULL OR TRIM(images) = '' OR TRIM(images) = '[]' OR TRIM(images) = '{}')
        )
      ) as assigned_count
    FROM products
    GROUP BY primary_category
    ORDER BY unassigned_count DESC;
  `);

  console.log('\n--- CATEGORY BREAKDOWN ---');
  for (const r of categoryBreakdown.rows) {
    console.log(`${r.category}: Total=${r.total_count}, Unassigned=${r.unassigned_count}, Assigned=${r.assigned_count}`);
  }

  await pool.end();
}

querySql();
