import { supabase } from './config/supabase';
import { readDb, writeDb } from './config/localDb';

type InsertedProduct = {
  id: string;
  sku: string;
  mrp: number;
  price: number;
  todays_deal: boolean;
};

/** Merchant inventory overrides for local catalog (TC-CUST-020 / 022 demo). */
function upsertLocalShopProductOverrides(
  shopId: string,
  items: Array<{ product_id: string; selling_price: number; stock: number; available: boolean }>,
) {
  const db = readDb();
  if (!db.shop_products) db.shop_products = [];

  for (const item of items) {
    const idx = db.shop_products.findIndex(
      (sp) => sp.shop_id === shopId && sp.product_id === item.product_id,
    );
    const base = {
      shop_id: shopId,
      product_id: item.product_id,
      selling_price: item.selling_price,
      discount_percentage: 0,
      stock: item.stock,
      available: item.available,
      status: 'approved' as const,
    };
    if (idx >= 0) {
      db.shop_products[idx] = { ...db.shop_products[idx], ...base };
    } else {
      db.shop_products.push({
        id: `sp-seed-${item.product_id}`,
        ...base,
      });
    }
  }

  writeDb(db);
  console.log(
    'Local shop_products synced: Aashirvaad Shudh 1kg/10kg in stock, 5kg merchant stock=0 (TC-CUST-022).',
  );
}

async function resolveSeededBySkus(
  seeded: InsertedProduct[],
  skus: string[],
): Promise<Map<string, InsertedProduct>> {
  const map = new Map(seeded.map((p) => [p.sku, p]));
  for (const sku of skus) {
    if (map.has(sku)) continue;
    const { data: row } = await supabase.from('products').select('id, sku').eq('sku', sku).maybeSingle();
    if (row?.id) {
      const dummy = dummyProducts.find((d) => d.sku === sku);
      map.set(sku, {
        id: row.id,
        sku,
        mrp: dummy?.mrp ?? 0,
        price: dummy?.price ?? 0,
        todays_deal: dummy?.todays_deal ?? false,
      });
    }
  }
  return map;
}

async function syncAashirvaadShudhDemoInventory(shopId: string, seeded: InsertedProduct[]) {
  const bySku = await resolveSeededBySkus(seeded, ['AASH-ATTA-1KG', 'AASH-ATTA-5KG', 'AASH-ATTA-10KG']);
  const oneKg = bySku.get('AASH-ATTA-1KG');
  const fiveKg = bySku.get('AASH-ATTA-5KG');
  const tenKg = bySku.get('AASH-ATTA-10KG');
  if (!oneKg || !fiveKg || !tenKg) {
    console.warn(
      'Aashirvaad Shudh SKUs missing — skip shop_products demo inventory.',
      { oneKg: !!oneKg, fiveKg: !!fiveKg, tenKg: !!tenKg },
    );
    return;
  }

  const overrides = [
    { product_id: oneKg.id, selling_price: oneKg.price, stock: 100, available: true },
    { product_id: fiveKg.id, selling_price: fiveKg.price, stock: 0, available: true },
    { product_id: tenKg.id, selling_price: tenKg.price, stock: 80, available: true },
  ];

  upsertLocalShopProductOverrides(shopId, overrides);

  for (const row of overrides) {
    const { error } = await supabase.from('shop_products').upsert(
      {
        shop_id: shopId,
        product_id: row.product_id,
        selling_price: row.selling_price,
        discount_percentage: 0,
        stock: row.stock,
        available: row.available,
        status: 'approved',
      },
      { onConflict: 'shop_id,product_id' },
    );
    if (error && !error.message.includes('does not exist')) {
      console.warn(`Supabase shop_products upsert (${row.product_id}):`, error.message);
    }
  }
}

const AASHIRVAAD_SHUDH_FAMILY = "aashirvaad-shudh-chakki-atta";

const dummyProducts = [
  {
    name: "Aashirvaad Shudh Chakki Atta 1kg",
    sku: "AASH-ATTA-1KG",
    family_key: AASHIRVAAD_SHUDH_FAMILY,
    barcode: "8901725181208",
    primary_category: "Atta & Rice",
    secondary_category: "Atta",
    brand: "Aashirvaad",
    company: "ITC",
    description: "100% whole wheat chakki atta with zero maida. Stays soft for up to 6 hours.",
    short_description: "100% whole wheat chakki flour",
    place: "Madhya Pradesh",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png",
    mrp: 65.0,
    price: 58.0,
    stock: 100,
    unit: "1 Kg",
    quantity_value: 1,
    quantity_unit: "kg",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 65.0, price: 58.0, wholesaler_price: 48.0, is_live: true },
      { city_name: "Pune", mrp: 65.0, price: 56.0, wholesaler_price: 48.0, is_live: true }
    ]
  },
  {
    name: "Aashirvaad Shudh Chakki Atta 5kg",
    sku: "AASH-ATTA-5KG",
    family_key: AASHIRVAAD_SHUDH_FAMILY,
    barcode: "8901725181215",
    primary_category: "Atta & Rice",
    secondary_category: "Atta",
    brand: "Aashirvaad",
    company: "ITC",
    description: "100% whole wheat chakki atta with zero maida. Stays soft for up to 6 hours.",
    short_description: "100% whole wheat chakki flour",
    place: "Madhya Pradesh",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png",
    mrp: 299.0,
    price: 269.0,
    stock: 100,
    unit: "5 Kg",
    quantity_value: 5,
    quantity_unit: "kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 299.0, price: 269.0, wholesaler_price: 220.0, is_live: true },
      { city_name: "Pune", mrp: 299.0, price: 259.0, wholesaler_price: 220.0, is_live: true }
    ]
  },
  {
    name: "Aashirvaad Shudh Chakki Atta 10kg",
    sku: "AASH-ATTA-10KG",
    family_key: AASHIRVAAD_SHUDH_FAMILY,
    barcode: "8901725181222",
    primary_category: "Atta & Rice",
    secondary_category: "Atta",
    brand: "Aashirvaad",
    company: "ITC",
    description:
      '100% whole wheat chakki atta with zero maida. Stays soft for up to 6 hours.\n<!--media:{"images":["https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png","https://images.unsplash.com/photo-1586201375761-83865001e26c?w=800&q=80","https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80"],"video_url":"https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}-->',
    short_description: "100% whole wheat chakki flour",
    place: "Madhya Pradesh",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png",
    mrp: 499.0,
    price: 449.0,
    stock: 100,
    unit: "10 Kg",
    quantity_value: 10,
    quantity_unit: "kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: true,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 499.0, price: 449.0, wholesaler_price: 380.0, is_live: true },
      { city_name: "Pune", mrp: 499.0, price: 439.0, wholesaler_price: 380.0, is_live: true }
    ]
  },
  {
    name: "Fortune Premium Kachi Ghani Mustard Oil 5L",
    sku: "FORT-MUST-5L",
    barcode: "8906007281313",
    primary_category: "Oils & Ghee",
    secondary_category: "Mustard Oil",
    brand: "Fortune",
    company: "Adani Wilmar",
    description: "Pure cold pressed mustard oil with strong aroma and high pungency.",
    short_description: "Cold pressed pure mustard oil",
    place: "Rajasthan",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/fortune_mustard_oil_5l.png",
    mrp: 899.0,
    price: 799.0,
    stock: 50,
    unit: "5 L",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 899.0, price: 799.0, wholesaler_price: 680.0, is_live: true },
      { city_name: "Pune", mrp: 899.0, price: 789.0, wholesaler_price: 680.0, is_live: true }
    ]
  },
  {
    name: "Tata Salt Lite 1kg",
    sku: "TATA-SALT-1KG",
    barcode: "8901058002313",
    primary_category: "Spices & Masala",
    secondary_category: "Salt",
    brand: "Tata",
    company: "Tata Consumer Products",
    description: "Iodized low-sodium salt, ideal for managing active blood pressure.",
    short_description: "Iodized low sodium table salt",
    place: "Gujarat",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/tata_salt_lite_1kg.png",
    mrp: 28.0,
    price: 24.0,
    stock: 200,
    unit: "1 Kg",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 28.0, price: 24.0, wholesaler_price: 18.0, is_live: true },
      { city_name: "Pune", mrp: 28.0, price: 24.0, wholesaler_price: 18.0, is_live: true }
    ]
  },
  {
    name: "Amul Pure Ghee 1L Tin",
    sku: "AMUL-GHEE-1L",
    barcode: "8901262070016",
    primary_category: "Oils & Ghee",
    secondary_category: "Ghee",
    brand: "Amul",
    company: "GCMMF",
    description: "Rich granular pure cow ghee made from fresh milk cream. Trusted taste.",
    short_description: "Pure premium cow milk ghee",
    place: "Gujarat",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/amul_pure_ghee_1l.png",
    mrp: 700.0,
    price: 649.0,
    stock: 80,
    unit: "1 L",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: true,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 700.0, price: 649.0, wholesaler_price: 550.0, is_live: true },
      { city_name: "Pune", mrp: 700.0, price: 649.0, wholesaler_price: 550.0, is_live: true }
    ]
  },
  {
    name: "Daawat Rozana Super Basmati Rice 5kg",
    sku: "DAAW-RICE-5KG",
    barcode: "8901537006121",
    primary_category: "Atta & Rice",
    secondary_category: "Rice",
    brand: "Daawat",
    company: "LT Foods",
    description: "Rich aroma, long slender grains, ideal for daily biryani or pulao.",
    short_description: "Fragrant daily use basmati rice",
    place: "Haryana",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/daawat_basmati_rice_5kg.png",
    mrp: 500.0,
    price: 425.0,
    stock: 120,
    unit: "5 Kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 500.0, price: 425.0, wholesaler_price: 320.0, is_live: true },
      { city_name: "Pune", mrp: 500.0, price: 420.0, wholesaler_price: 320.0, is_live: true }
    ]
  },
  {
    name: "Fortune Chakki Fresh Atta 5kg",
    sku: "FORT-ATTA-5KG",
    barcode: "8906007281206",
    primary_category: "Atta & Rice",
    secondary_category: "Atta",
    brand: "Fortune",
    company: "Adani Wilmar",
    description: "Chakki fresh atta made from 100% MP wheat. Soft rotis for daily use.",
    short_description: "MP sharbati chakki atta",
    place: "Madhya Pradesh",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png",
    mrp: 300.0,
    price: 265.0,
    stock: 90,
    unit: "5 Kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: true,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 300.0, price: 265.0, wholesaler_price: 220.0, is_live: true },
      { city_name: "Pune", mrp: 300.0, price: 255.0, wholesaler_price: 220.0, is_live: true }
    ]
  },
  {
    name: "Pillsbury Chakki Fresh Atta 5kg",
    sku: "PILL-ATTA-5KG",
    barcode: "8906007281314",
    primary_category: "Atta & Rice",
    secondary_category: "Atta",
    brand: "Pillsbury",
    company: "General Mills",
    description: "Soft and fluffy rotis with premium whole wheat chakki atta.",
    short_description: "Whole wheat chakki atta",
    place: "Madhya Pradesh",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png",
    mrp: 310.0,
    price: 275.0,
    stock: 85,
    unit: "5 Kg",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 310.0, price: 275.0, wholesaler_price: 230.0, is_live: true },
      { city_name: "Pune", mrp: 310.0, price: 270.0, wholesaler_price: 230.0, is_live: true }
    ]
  },
  {
    name: "India Gate Classic Basmati Rice 5kg",
    sku: "INDG-RICE-5KG",
    barcode: "8901537006122",
    primary_category: "Atta & Rice",
    secondary_category: "Rice",
    brand: "India Gate",
    company: "KRBL",
    description: "Aged basmati rice with long grains and rich aroma.",
    short_description: "Classic aged basmati rice",
    place: "Haryana",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/daawat_basmati_rice_5kg.png",
    mrp: 520.0,
    price: 460.0,
    stock: 70,
    unit: "5 Kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: true,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 520.0, price: 460.0, wholesaler_price: 380.0, is_live: true },
      { city_name: "Pune", mrp: 520.0, price: 455.0, wholesaler_price: 380.0, is_live: true }
    ]
  },
  {
    name: "Kohinoor Royale Basmati Rice 5kg",
    sku: "KOHN-RICE-5KG",
    barcode: "8901537006123",
    primary_category: "Atta & Rice",
    secondary_category: "Rice",
    brand: "Kohinoor",
    company: "LT Foods",
    description: "Extra-long grain basmati ideal for biryani and pulao.",
    short_description: "Royale basmati rice",
    place: "Haryana",
    image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/daawat_basmati_rice_5kg.png",
    mrp: 540.0,
    price: 480.0,
    stock: 65,
    unit: "5 Kg",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 540.0, price: 480.0, wholesaler_price: 400.0, is_live: true },
      { city_name: "Pune", mrp: 540.0, price: 475.0, wholesaler_price: 400.0, is_live: true }
    ]
  },
  {
    name: "Maggi 2-Minute Masala Noodles 12-Pack",
    sku: "MAGG-NOOD-12P",
    barcode: "8901058895612",
    primary_category: "Snacks",
    secondary_category: "Noodles",
    brand: "Maggi",
    company: "Nestle",
    description: "Classic Indian instant noodles with the signature masala taste maker.",
    short_description: "Classic masala instant noodles pack",
    place: "Delhi",
    image_url: "https://images.unsplash.com/photo-1612966608967-302915b06f2e?w=600&q=80",
    mrp: 180.0,
    price: 168.0,
    stock: 150,
    unit: "12 Pack",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: true,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 180.0, price: 168.0, wholesaler_price: 130.0, is_live: true },
      { city_name: "Pune", mrp: 180.0, price: 168.0, wholesaler_price: 130.0, is_live: true }
    ]
  },
  {
    name: "Surf Excel Easy Wash Detergent Powder 5kg",
    sku: "SURF-DETG-5KG",
    barcode: "8901030753011",
    primary_category: "Cleaning",
    secondary_category: "Detergents",
    brand: "Surf Excel",
    company: "Hindustan Unilever",
    description: "Tough stain removal in one wash. Formulated for bucket washing.",
    short_description: "Stain removing detergent powder",
    place: "Maharashtra",
    image_url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&q=80",
    mrp: 680.0,
    price: 599.0,
    stock: 60,
    unit: "5 Kg",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 680.0, price: 599.0, wholesaler_price: 490.0, is_live: true },
      { city_name: "Pune", mrp: 680.0, price: 589.0, wholesaler_price: 490.0, is_live: true }
    ]
  },
  {
    name: "Tata Tea Premium 1kg",
    sku: "TATA-TEA-1KG",
    barcode: "8901058002160",
    primary_category: "Beverages",
    secondary_category: "Tea",
    brand: "Tata Tea",
    company: "Tata Consumer Products",
    description: "Unique blend of big tea leaves for aroma and small leaves for strong taste.",
    short_description: "Premium black tea leaf blend",
    place: "Assam",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80",
    mrp: 420.0,
    price: 380.0,
    stock: 100,
    unit: "1 Kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 420.0, price: 380.0, wholesaler_price: 300.0, is_live: true },
      { city_name: "Pune", mrp: 420.0, price: 375.0, wholesaler_price: 300.0, is_live: true }
    ]
  },
  {
    name: "Dettol Liquid Handwash Refill 1.5L",
    sku: "DETT-HWSH-1.5L",
    barcode: "8901396328229",
    primary_category: "Personal Care",
    secondary_category: "Handwash",
    brand: "Dettol",
    company: "Reckitt Benckiser",
    description: "Trusted germ protection formula. Keeps hands soft and hygienic.",
    short_description: "Liquid antibacterial hand wash",
    place: "Himachal Pradesh",
    image_url: "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600&q=80",
    mrp: 240.0,
    price: 210.0,
    stock: 90,
    unit: "1.5 L",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: false,
    city_prices: [
      { city_name: "Mumbai", mrp: 240.0, price: 210.0, wholesaler_price: 160.0, is_live: true },
      { city_name: "Pune", mrp: 240.0, price: 210.0, wholesaler_price: 160.0, is_live: true }
    ]
  },
  {
    name: "Rajdhani Kabuli Chana 1kg",
    sku: "RAJD-CHAN-1KG",
    barcode: "8906023250212",
    primary_category: "Dals & Pulses",
    secondary_category: "Chana",
    brand: "Rajdhani",
    company: "Rajdhani Group",
    description: "Premium bold size white chickpeas, high in protein and fibers.",
    short_description: "Bold white chickpeas",
    place: "Madhya Pradesh",
    image_url: "https://images.unsplash.com/photo-1585998082988-067f827150a0?w=600&q=80",
    mrp: 150.0,
    price: 130.0,
    stock: 110,
    unit: "1 Kg",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: true,
    best_seller: false,
    city_prices: [
      { city_name: "Mumbai", mrp: 150.0, price: 130.0, wholesaler_price: 95.0, is_live: true },
      { city_name: "Pune", mrp: 150.0, price: 125.0, wholesaler_price: 95.0, is_live: true }
    ]
  },
  {
    name: "Rajdhani Toor Dal 2kg",
    sku: "RAJD-TDAL-2KG",
    barcode: "8906023250123",
    primary_category: "Dals & Pulses",
    secondary_category: "Dal",
    brand: "Rajdhani",
    company: "Rajdhani Group",
    description: "Premium quality unpolished pigeon peas. Handpicked grains.",
    short_description: "Unpolished yellow split toor dal",
    place: "Madhya Pradesh",
    image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
    mrp: 320.0,
    price: 280.0,
    stock: 120,
    unit: "2 Kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 320.0, price: 280.0, wholesaler_price: 220.0, is_live: true },
      { city_name: "Pune", mrp: 320.0, price: 275.0, wholesaler_price: 220.0, is_live: true }
    ]
  },
  {
    name: "Parle-G Gold Biscuits 1kg Pack",
    sku: "PARL-BIS-1KG",
    barcode: "8901163228882",
    primary_category: "Snacks",
    secondary_category: "Biscuits",
    brand: "Parle",
    company: "Parle Products",
    description: "The gold edition of India's favorite glucose biscuit. Richer and tastier.",
    short_description: "Premium glucose biscuits pack",
    place: "Gujarat",
    image_url: "https://images.unsplash.com/photo-1558961317-19277a22f782?w=600&q=80",
    mrp: 120.0,
    price: 110.0,
    stock: 150,
    unit: "1 Kg",
    available: true,
    is_veg: true,
    featured: true,
    todays_deal: false,
    best_seller: true,
    city_prices: [
      { city_name: "Mumbai", mrp: 120.0, price: 110.0, wholesaler_price: 85.0, is_live: true },
      { city_name: "Pune", mrp: 120.0, price: 110.0, wholesaler_price: 85.0, is_live: true }
    ]
  },
  {
    name: "Catch Turmeric Powder 500g",
    sku: "CATC-HALD-500G",
    barcode: "8901058004515",
    primary_category: "Spices & Masala",
    secondary_category: "Turmeric",
    short_description: "Pure grounded turmeric powder",
    place: "Andhra Pradesh",
    image_url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80",
    mrp: 160.0,
    price: 140.0,
    stock: 100,
    unit: "500g",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: false,
    city_prices: [
      { city_name: "Mumbai", mrp: 160.0, price: 140.0, wholesaler_price: 95.0, is_live: true },
      { city_name: "Pune", mrp: 140.0, price: 140.0, wholesaler_price: 95.0, is_live: true }
    ]
  },
  {
    name: "Catch Red Chilli Powder 500g",
    sku: "CATC-MIRCH-500G",
    barcode: "8901058004522",
    primary_category: "Spices & Masala",
    secondary_category: "Chilli",
    brand: "Catch",
    company: "DS Group",
    description: "Pure red hot pepper powder. Adds rich red color and heat to dishes.",
    short_description: "Spicy grounded red pepper powder",
    place: "Andhra Pradesh",
    image_url: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&q=80",
    mrp: 220.0,
    price: 190.0,
    stock: 100,
    unit: "500g",
    available: true,
    is_veg: true,
    featured: false,
    todays_deal: false,
    best_seller: false,
    city_prices: [
      { city_name: "Mumbai", mrp: 220.0, price: 190.0, wholesaler_price: 140.0, is_live: true },
      { city_name: "Pune", mrp: 190.0, price: 190.0, wholesaler_price: 140.0, is_live: true }
    ]
  }
];

async function resolveShopId(): Promise<string> {
  const db = readDb();
  let { data: shops, error: shopError } = await supabase
    .from('shops')
    .select('id, shop_name')
    .limit(1);

  let shop = shops?.[0];

  if (shopError) {
    console.error('Error checking shop:', shopError.message);
    process.exit(1);
  }

  if (!shop) {
    console.log('No shop in Supabase — creating default MonthlyGrocery shop...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin')
      .maybeSingle();

    const ownerId = profile?.id;
    if (!ownerId) {
      const { data: fallbackProfile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (!fallbackProfile?.id) {
        console.error('No profile found. Run npm run dev once so server seeds super admin.');
        process.exit(1);
      }
      const { data: newShop, error: insertError } = await supabase
        .from('shops')
        .insert({
          owner_id: fallbackProfile.id,
          shop_name: 'MonthlyGrocery',
          status: 'approved',
        })
        .select('id, shop_name')
        .single();
      if (insertError || !newShop) {
        console.error('Failed to create shop:', insertError?.message);
        process.exit(1);
      }
      shop = newShop;
    } else {
      const { data: newShop, error: insertError } = await supabase
        .from('shops')
        .insert({
          owner_id: ownerId,
          shop_name: 'MonthlyGrocery',
          status: 'approved',
        })
        .select('id, shop_name')
        .single();
      if (insertError || !newShop) {
        console.error('Failed to create shop:', insertError?.message);
        process.exit(1);
      }
      shop = newShop;
    }
    console.log(`Created shop: ${shop.shop_name} (${shop.id})`);
  } else {
    console.log(`Using shop: ${shop.shop_name ?? 'MonthlyGrocery'} (${shop.id})`);
  }

  if (db.serviceable_locations?.length) {
    let changed = false;
    for (const loc of db.serviceable_locations) {
      if (loc.shop_id !== shop.id) {
        loc.shop_id = shop.id;
        changed = true;
      }
    }
    if (changed) {
      writeDb(db);
      console.log('Updated serviceable_locations shop_id to match Supabase shop.');
    }
  }

  return shop.id;
}

async function seed() {
  console.log("Starting product seeding...");

  const shopId = await resolveShopId();

  const insertedProducts: InsertedProduct[] = [];

  // Upsert catalog products (no mass delete — orders reference product rows)
  for (const dp of dummyProducts) {
    const productData: Record<string, unknown> = {
      shop_id: shopId,
      name: dp.name,
      sku: dp.sku,
      family_key: (dp as any).family_key || null,
      barcode: dp.barcode,
      primary_category: dp.primary_category,
      secondary_category: dp.secondary_category,
      brand: dp.brand,
      company: dp.company,
      description: dp.description,
      short_description: dp.short_description,
      place: dp.place,
      image_url: dp.image_url,
      mrp: dp.mrp,
      price: dp.price,
      stock: dp.stock,
      unit: dp.unit,
      quantity_value: (dp as any).quantity_value ?? null,
      quantity_unit: (dp as any).quantity_unit ?? null,
      available: dp.available,
      is_veg: dp.is_veg,
      featured: dp.featured,
      todays_deal: dp.todays_deal,
      best_seller: dp.best_seller,
    };
    if ((dp as any).video_url) {
      productData.video_url = (dp as any).video_url;
    }

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', dp.sku)
      .maybeSingle();

    let inserted: { id: string; name: string } | null = null;

    if (existing?.id) {
      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existing.id)
        .select('id, name')
        .single();
      if (updateError || !updated) {
        console.error(`Failed to update product ${dp.name}:`, updateError?.message);
        continue;
      }
      inserted = updated;
      console.log(`Updated: ${updated.name} (${updated.id})`);
    } else {
      const { data: created, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select('id, name')
        .single();
      if (insertError || !created) {
        console.error(`Failed to insert product ${dp.name}:`, insertError?.message);
        continue;
      }
      inserted = created;
      console.log(`Inserted: ${created.name} (${created.id})`);
    }

    if (inserted) {
      insertedProducts.push({
        id: inserted.id,
        sku: dp.sku,
        mrp: dp.mrp,
        price: dp.price,
        todays_deal: dp.todays_deal,
      });

      // Refresh city prices for this SKU
      await supabase.from('product_city_prices').delete().eq('product_id', inserted.id);

      const cityPrices = dp.city_prices.map(cp => ({
        product_id: inserted.id,
        city_name: cp.city_name,
        mrp: cp.mrp,
        price: cp.price,
        wholesaler_price: cp.wholesaler_price,
        is_live: cp.is_live
      }));

      const { error: cityPricesError } = await supabase
        .from('product_city_prices')
        .insert(cityPrices);

      if (cityPricesError) {
        console.error(`Failed to insert city prices for ${inserted.name}:`, cityPricesError.message);
      }
    }

  }

  await syncAashirvaadShudhDemoInventory(shopId, insertedProducts);

  console.log("Product database seeding completed successfully!");
  process.exit(0);
}

seed();
