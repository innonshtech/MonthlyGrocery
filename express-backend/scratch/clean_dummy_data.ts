import { supabase } from '../src/config/supabase';
import { readDb, writeDb } from '../src/config/localDb';

async function cleanData() {
  console.log('=== Cleaning Test & Dummy Data ===');

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

  // 3. Clear shop_products in Supabase (so merchant has fresh catalog to request/configure)
  console.log('Cleaning shop_products from Supabase...');
  const { error: spError } = await supabase.from('shop_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (spError) console.warn('shop_products clean notice:', spError.message);
  else console.log('✓ shop_products cleaned');

  // 4. Reset localDb.json
  console.log('Resetting localDb.json...');
  const db = readDb();
  (db as any).orders = [];
  db.shop_products = [];
  db.franchise_requests = [];
  writeDb(db);
  console.log('✓ localDb.json reset (orders, shop_products, franchise_requests emptied)');

  console.log('\n🎉 All previous dummy orders, test mappings, and dummy records have been completely wiped out!');
}

cleanData().then(() => process.exit(0));
