import { supabase } from '../src/config/supabase';

async function inspectSchema() {
  const { data: shops } = await supabase.from('shops').select('id').limit(1);
  const shopId = shops && shops.length > 0 ? shops[0].id : null;

  const { data: newProd, error } = await supabase.from('products').insert({
    shop_id: shopId,
    name: 'Schema Test Temp',
    sku: 'SCHEMATEMP-' + Date.now(),
    primary_category: 'Oils & Ghee',
    mrp: 100,
    price: 90,
    unit: '1 L'
  }).select('*').single();

  if (error) {
    console.error('Error inserting test product:', error.message);
  } else {
    console.log('Inserted product keys (Columns):', Object.keys(newProd));
    // Clean up
    await supabase.from('products').delete().eq('id', newProd.id);
    console.log('✓ Cleaned up test product');
  }
}

inspectSchema().then(() => process.exit(0));
