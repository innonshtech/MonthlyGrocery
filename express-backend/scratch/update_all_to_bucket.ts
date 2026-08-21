import { supabase } from '../src/config/supabase';

const BUCKET_URL = 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products';

// Mapping categories / keywords to Supabase Bucket PNGs
const BUCKET_MAPPINGS = [
  { keyword: 'atta', url: `${BUCKET_URL}/aashirvaad_atta_10kg.png` },
  { keyword: 'flour', url: `${BUCKET_URL}/aashirvaad_atta_10kg.png` },
  { keyword: 'oil', url: `${BUCKET_URL}/fortune_mustard_oil_5l.png` },
  { keyword: 'mustard', url: `${BUCKET_URL}/fortune_mustard_oil_5l.png` },
  { keyword: 'sunflower', url: `${BUCKET_URL}/fortune_mustard_oil_5l.png` },
  { keyword: 'ghee', url: `${BUCKET_URL}/amul_pure_ghee_1l.png` },
  { keyword: 'rice', url: `${BUCKET_URL}/daawat_basmati_rice_5kg.png` },
  { keyword: 'basmati', url: `${BUCKET_URL}/daawat_basmati_rice_5kg.png` },
  { keyword: 'dal', url: `${BUCKET_URL}/daawat_basmati_rice_5kg.png` },
  { keyword: 'toor', url: `${BUCKET_URL}/daawat_basmati_rice_5kg.png` },
  { keyword: 'chana', url: `${BUCKET_URL}/daawat_basmati_rice_5kg.png` },
  { keyword: 'tea', url: `${BUCKET_URL}/tata_tea_gold_500g.png` },
  { keyword: 'masala', url: `${BUCKET_URL}/everest_garam_masala_100g.png` },
  { keyword: 'chilli', url: `${BUCKET_URL}/everest_garam_masala_100g.png` },
  { keyword: 'turmeric', url: `${BUCKET_URL}/everest_garam_masala_100g.png` },
  { keyword: 'powder', url: `${BUCKET_URL}/everest_garam_masala_100g.png` },
  { keyword: 'detergent', url: `${BUCKET_URL}/surf_excel_detergent_3kg.png` },
  { keyword: 'surf', url: `${BUCKET_URL}/surf_excel_detergent_3kg.png` },
  { keyword: 'cleaner', url: `${BUCKET_URL}/lizol_floor_cleaner_2l.png` },
  { keyword: 'lizol', url: `${BUCKET_URL}/lizol_floor_cleaner_2l.png` },
  { keyword: 'harpic', url: `${BUCKET_URL}/lizol_floor_cleaner_2l.png` },
  { keyword: 'noodle', url: `${BUCKET_URL}/maggi_masala_noodles_12pack.png` },
  { keyword: 'maggi', url: `${BUCKET_URL}/maggi_masala_noodles_12pack.png` },
  { keyword: 'biscuit', url: `${BUCKET_URL}/maggi_masala_noodles_12pack.png` },
  { keyword: 'cookie', url: `${BUCKET_URL}/maggi_masala_noodles_12pack.png` },
  { keyword: 'parle', url: `${BUCKET_URL}/maggi_masala_noodles_12pack.png` },
  { keyword: 'sev', url: `${BUCKET_URL}/maggi_masala_noodles_12pack.png` },
  { keyword: 'bournvita', url: `${BUCKET_URL}/cadbury_bournvita_1kg.png` },
  { keyword: 'handwash', url: `${BUCKET_URL}/cadbury_bournvita_1kg.png` },
  { keyword: 'dettol', url: `${BUCKET_URL}/cadbury_bournvita_1kg.png` },
  { keyword: 'diaper', url: `${BUCKET_URL}/cadbury_bournvita_1kg.png` },
  { keyword: 'almond', url: `${BUCKET_URL}/daawat_basmati_rice_5kg.png` },
  { keyword: 'salt', url: `${BUCKET_URL}/aashirvaad_atta_10kg.png` },
];

async function updateAllProductsToBucket() {
  console.log('--- Fetching all products from Supabase ---');
  const { data: products, error } = await supabase.from('products').select('id, name, sku, primary_category');
  
  if (error || !products) {
    console.error('Error fetching products:', error?.message);
    return;
  }

  console.log(`Found ${products.length} products. Updating all to Supabase Storage Bucket URLs...`);

  let updatedCount = 0;

  for (const prod of products) {
    const text = `${prod.name} ${prod.sku || ''} ${prod.primary_category || ''}`.toLowerCase();
    
    // Find matching bucket image
    const match = BUCKET_MAPPINGS.find(m => text.includes(m.keyword));
    const targetUrl = match ? match.url : `${BUCKET_URL}/aashirvaad_atta_10kg.png`;

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: targetUrl })
      .eq('id', prod.id);

    if (!updateError) {
      updatedCount++;
      console.log(`✓ [${prod.name}] ➔ ${targetUrl}`);
    } else {
      console.error(`Failed to update ${prod.name}:`, updateError.message);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount}/${products.length} products to 100% Supabase Bucket URLs!`);
}

updateAllProductsToBucket().then(() => process.exit(0));
