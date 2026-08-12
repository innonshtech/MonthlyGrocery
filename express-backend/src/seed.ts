import { supabase } from './config/supabase';

const dummyProducts = [
  {
    name: "Aashirvaad Shudh Chakki Atta 10kg",
    sku: "AASH-ATTA-10KG",
    barcode: "8901725181222",
    primary_category: "Atta & Rice",
    secondary_category: "Atta",
    brand: "Aashirvaad",
    company: "ITC",
    description: "100% whole wheat chakki atta with zero maida. Stays soft for up to 6 hours.",
    short_description: "100% whole wheat chakki flour",
    place: "Madhya Pradesh",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    mrp: 499.0,
    price: 449.0,
    stock: 100,
    unit: "10 Kg",
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
    primary_category: "Cooking Essentials",
    secondary_category: "Mustard Oil",
    brand: "Fortune",
    company: "Adani Wilmar",
    description: "Pure cold pressed mustard oil with strong aroma and high pungency.",
    short_description: "Cold pressed pure mustard oil",
    place: "Rajasthan",
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
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
    primary_category: "Cooking Essentials",
    secondary_category: "Salt",
    brand: "Tata",
    company: "Tata Consumer Products",
    description: "Iodized low-sodium salt, ideal for managing active blood pressure.",
    short_description: "Iodized low sodium table salt",
    place: "Gujarat",
    image_url: "https://images.unsplash.com/photo-1618038483079-b86a3e40760c?w=600&q=80",
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
    primary_category: "Dairy Staples",
    secondary_category: "Ghee",
    brand: "Amul",
    company: "GCMMF",
    description: "Rich granular pure cow ghee made from fresh milk cream. Trusted taste.",
    short_description: "Pure premium cow milk ghee",
    place: "Gujarat",
    image_url: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80",
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
    secondary_category: "Basmati Rice",
    brand: "Daawat",
    company: "LT Foods",
    description: "Rich aroma, long slender grains, ideal for daily biryani or pulao.",
    short_description: "Fragrant daily use basmati rice",
    place: "Haryana",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
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
    name: "Maggi 2-Minute Masala Noodles 12-Pack",
    sku: "MAGG-NOOD-12P",
    barcode: "8901058895612",
    primary_category: "Packaged Foods",
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
    primary_category: "Household Items",
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
    primary_category: "Pulses & Grains",
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
    primary_category: "Pulses & Grains",
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
    primary_category: "Cooking Essentials",
    secondary_category: "Spices",
    brand: "Catch",
    company: "DS Group",
    description: "Premium grounded turmeric powder with natural curcumin oils preserved.",
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
    primary_category: "Cooking Essentials",
    secondary_category: "Spices",
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

async function seed() {
  console.log("Starting product seeding...");

  // 1. Fetch default shop
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .maybeSingle();

  if (shopError || !shop) {
    console.error("Error: Default shop not seeded yet. Run server.ts first to auto-seed shop!");
    process.exit(1);
  }

  console.log(`Found shop: ${shop.id}`);

  // 2. Clear existing products to prevent duplicates
  const { error: clearError } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (clearError) {
    console.error("Failed to clear existing products:", clearError.message);
    process.exit(1);
  }

  console.log("Existing products cleared from PostgreSQL.");

  // 3. Insert new products
  for (const dp of dummyProducts) {
    const productData = {
      shop_id: shop.id,
      name: dp.name,
      sku: dp.sku,
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
      available: dp.available,
      is_veg: dp.is_veg,
      featured: dp.featured,
      todays_deal: dp.todays_deal,
      best_seller: dp.best_seller
    };

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (insertError || !inserted) {
      console.error(`Failed to insert product ${dp.name}:`, insertError?.message);
      continue;
    }

    console.log(`Inserted: ${inserted.name} (${inserted.id})`);

    // 4. Insert city prices for this product
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

  console.log("Product database seeding completed successfully!");
  process.exit(0);
}

seed();
