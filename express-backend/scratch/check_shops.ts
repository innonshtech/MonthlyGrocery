import { supabase } from '../src/config/supabase';

async function checkShops() {
  const { data: shops, error } = await supabase.from('shops').select('id, shop_name, status');
  console.log('Total shops:', shops?.length ?? 0);
  console.log('Shops:', JSON.stringify(shops, null, 2));
  if (error) console.error('Error:', error.message);
  
  // Also check products table columns
  const { data: prod, error: e2 } = await supabase.from('products').select('*').limit(1);
  console.log('\nSample product columns:', prod ? Object.keys(prod[0] || {}) : 'no products');
  if (e2) console.error('Products error:', e2.message);
}
checkShops().then(() => process.exit(0));
