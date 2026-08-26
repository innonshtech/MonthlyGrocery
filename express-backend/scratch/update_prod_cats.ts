import { supabase } from '../src/config/supabase';

async function updateProductCategories() {
  console.log('=== Updating product categories to match Oils & Ghee ===');
  
  const { data: prods, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, primary_category');

  if (fetchErr) {
    console.error('Error fetching products:', fetchErr.message);
    return;
  }

  console.log('Current Products:', prods);

  for (const p of prods || []) {
    if (p.primary_category === 'Cooking Essentials' || p.name.includes('Oil')) {
      const { error: uErr } = await supabase
        .from('products')
        .update({ primary_category: 'Oils & Ghee' })
        .eq('id', p.id);

      if (uErr) {
        console.error(`Error updating product ${p.name}:`, uErr.message);
      } else {
        console.log(`✓ Updated ${p.name} category to "Oils & Ghee"`);
      }
    }
  }
}

updateProductCategories().then(() => process.exit(0));
