import fs from 'fs';
import path from 'path';
import { supabase } from './config/supabase';
import { readDb, writeDb } from './config/localDb';

async function clearMasterCatalog() {
  console.log('🔄 Starting Master Catalog data cleanup...');

  // 1. Fetch all products to create a secure backup first
  const { data: allProducts, error: fetchErr } = await supabase
    .from('products')
    .select('*');

  if (fetchErr) {
    console.error('❌ Failed to fetch products for backup:', fetchErr.message);
    process.exit(1);
  }

  const count = allProducts ? allProducts.length : 0;
  console.log(`📦 Found ${count} products in Supabase.`);

  // Save backup to file
  const backupPath = path.join(__dirname, '../data/products_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(allProducts, null, 2), 'utf-8');
  console.log(`💾 Successfully backed up ${count} products to ${backupPath}`);

  // 2. Clear product_city_prices table
  console.log('🧹 Clearing product_city_prices...');
  const { error: cityPriceErr } = await supabase
    .from('product_city_prices')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (cityPriceErr) {
    console.warn('⚠️ Warning while clearing product_city_prices:', cityPriceErr.message);
  } else {
    console.log('✅ product_city_prices cleared.');
  }

  // 3. Clear shop_products in localDb if present
  try {
    const db = readDb();
    if (Array.isArray(db.shop_products) && db.shop_products.length > 0) {
      db.shop_products = [];
      writeDb(db);
      console.log('✅ Local db.shop_products cleared.');
    }
  } catch (err: any) {
    console.warn('⚠️ localDb check:', err.message);
  }

  // 4. Delete all products from Supabase
  console.log('🗑️ Deleting all records from products table...');
  const { error: deleteErr } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteErr) {
    console.error('❌ Failed to delete products:', deleteErr.message);
    process.exit(1);
  }

  // 5. Verification
  const { data: remaining, error: verifyErr } = await supabase
    .from('products')
    .select('id');

  const remainingCount = remaining ? remaining.length : 0;
  console.log(`✨ Verification complete: Remaining products in catalog: ${remainingCount}`);

  if (remainingCount === 0) {
    console.log('🎉 All 222 products successfully deleted from Master Catalog!');
  } else {
    console.warn(`⚠️ Warning: ${remainingCount} products still remain.`);
  }
}

clearMasterCatalog().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
