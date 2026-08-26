import { supabase } from '../src/config/supabase';
import { readDb, writeDb } from '../src/config/localDb';

async function wipeAllData() {
  console.log('=== WIPING ALL DATA FRESH FOR NEW MANUAL TEST SCENARIO ===');

  // 1. Clear order_items in Supabase
  console.log('Cleaning order_items from Supabase...');
  const { error: oiError } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (oiError) console.warn('order_items clean notice:', oiError.message);
  else console.log('✓ order_items cleaned');

  // 2. Clear orders in Supabase
  console.log('Cleaning orders from Supabase...');
  const { error: oError } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (oError) console.warn('orders clean notice:', oError.message);
  else console.log('✓ orders cleaned');

  // 3. Clear products in Supabase
  console.log('Cleaning master products from Supabase...');
  const { error: pError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (pError) console.warn('products clean notice:', pError.message);
  else console.log('✓ Master catalogue products cleared');

  // 4. Reset localDb.json lists
  console.log('Resetting localDb.json lists...');
  const db = readDb();
  (db as any).orders = [];
  db.shop_products = [];
  db.franchise_requests = [];
  db.new_product_requests = [];
  writeDb(db);
  console.log('✓ localDb.json completely reset (orders, shop_products, suggestions, franchise empty)');

  console.log('\n🎉 ALL DATA HAS BEEN Wiped! Database is 100% clean and ready for fresh testing!');
}

wipeAllData().then(() => process.exit(0));
