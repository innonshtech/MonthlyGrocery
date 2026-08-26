import { supabase } from '../src/config/supabase';

async function clearMasterCatalogue() {
  console.log('=== Clearing Master Product Catalogue from Supabase ===');

  // 1. First delete city_prices (child table)
  const { error: cpError } = await supabase
    .from('city_prices')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (cpError) console.warn('city_prices:', cpError.message);
  else console.log('✓ city_prices cleared');

  // 2. Delete all products
  const { error: pError } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (pError) console.error('products error:', pError.message);
  else console.log('✓ All products cleared from master catalogue');

  // 3. Verify
  const { data: remaining } = await supabase.from('products').select('id');
  console.log(`\nRemaining products in DB: ${remaining?.length ?? 0}`);
  console.log('\n🎉 Master Catalogue completely wiped! Super Admin can now add real products fresh.');
}

clearMasterCatalogue().then(() => process.exit(0));
