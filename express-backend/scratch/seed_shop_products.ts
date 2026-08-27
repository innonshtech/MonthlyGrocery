import { supabase } from '../src/config/supabase';
import { readDb, writeDb } from '../src/config/localDb';

async function seedShopProducts() {
  console.log('=== SEEDING SHOP PRODUCTS FROM SUPABASE TO DB.JSON ===');

  // Fetch all master products from Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Failed to fetch master products:', error.message);
    process.exit(1);
  }

  console.log(`Found ${products.length} master products in Supabase.`);

  const db = readDb();
  
  // Clean existing shop products mapping to start fresh
  db.shop_products = [];

  // Use the default active shop ID (Thorat Wholesalers)
  const targetShopId = "4548b0b3-5a4d-4608-84a8-6fb5164af613";

  products.forEach((p, index) => {
    const mrp = parseFloat(p.mrp) || 0;
    const price = parseFloat(p.price) || mrp || 100;
    
    // Selling price: let's use the master price
    // Discount percentage: mrp > price ? percentage savings : 10%
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 10;

    const sp = {
      id: `sp-seed-${index}-${Math.random().toString(36).substring(7)}`,
      shop_id: targetShopId,
      product_id: p.id,
      selling_price: price,
      discount_percentage: discount,
      stock: 100,
      available: true,
      status: 'approved' as const
    };

    db.shop_products.push(sp);
    console.log(`Mapped product: "${p.name}" (mrp: ₹${mrp}, selling_price: ₹${price})`);
  });

  writeDb(db);
  console.log('✓ Successfully mapped all products to Thorat Wholesalers in db.json!');
}

seedShopProducts().then(() => process.exit(0));
