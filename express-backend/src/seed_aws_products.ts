import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function seedProducts() {
  const client = await pool.connect();
  try {
    const seedFile = require('./seed');
    console.log('Seeding products into AWS RDS...');
    
    // We can also insert common products
    const sampleProducts = [
      {
        id: 'prod-atta-10kg',
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
        image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png",
        mrp: 499.0,
        price: 449.0,
        stock: 100,
        unit: "10 Kg",
        available: true,
        is_veg: true,
        featured: true,
        todays_deal: true,
        best_seller: true,
        city_prices: JSON.stringify([
          { city_name: "Mumbai", mrp: 499.0, price: 449.0, wholesaler_price: 380.0, is_live: true },
          { city_name: "Pune", mrp: 499.0, price: 439.0, wholesaler_price: 380.0, is_live: true }
        ])
      },
      {
        id: 'prod-mustard-5l',
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
        city_prices: JSON.stringify([
          { city_name: "Mumbai", mrp: 899.0, price: 799.0, wholesaler_price: 680.0, is_live: true },
          { city_name: "Pune", mrp: 899.0, price: 789.0, wholesaler_price: 680.0, is_live: true }
        ])
      },
      {
        id: 'prod-tata-salt-1kg',
        name: "Tata Salt Lite 1kg",
        sku: "TATA-SALT-1KG",
        barcode: "8901058002313",
        primary_category: "Spices & Masala",
        secondary_category: "Salt",
        brand: "Tata",
        company: "Tata Consumer Products",
        description: "Low sodium vacuum evaporated iodized salt.",
        short_description: "Low sodium iodized salt",
        place: "Gujarat",
        image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/tata_salt_1kg.png",
        mrp: 45.0,
        price: 38.0,
        stock: 200,
        unit: "1 Kg",
        available: true,
        is_veg: true,
        featured: false,
        todays_deal: false,
        best_seller: true,
        city_prices: JSON.stringify([
          { city_name: "Mumbai", mrp: 45.0, price: 38.0, wholesaler_price: 30.0, is_live: true },
          { city_name: "Pune", mrp: 45.0, price: 38.0, wholesaler_price: 30.0, is_live: true }
        ])
      },
      {
        id: 'prod-basmati-5kg',
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
        city_prices: JSON.stringify([
          { city_name: "Mumbai", mrp: 520.0, price: 460.0, wholesaler_price: 380.0, is_live: true },
          { city_name: "Pune", mrp: 520.0, price: 455.0, wholesaler_price: 380.0, is_live: true }
        ])
      },
      {
        id: 'prod-maggi-12p',
        name: "Maggi 2-Minute Masala Noodles 12-Pack",
        sku: "MAGG-NOOD-12P",
        barcode: "8901058895612",
        primary_category: "Snacks",
        secondary_category: "Noodles",
        brand: "Maggi",
        company: "Nestle",
        description: "Classic favorite Indian masala instant noodles value pack.",
        short_description: "12-pack instant masala noodles",
        place: "Goa",
        image_url: "https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/maggi_12pack.png",
        mrp: 168.0,
        price: 152.0,
        stock: 120,
        unit: "840 g",
        available: true,
        is_veg: true,
        featured: true,
        todays_deal: true,
        best_seller: true,
        city_prices: JSON.stringify([
          { city_name: "Mumbai", mrp: 168.0, price: 152.0, wholesaler_price: 135.0, is_live: true },
          { city_name: "Pune", mrp: 168.0, price: 150.0, wholesaler_price: 135.0, is_live: true }
        ])
      }
    ];

    for (const p of sampleProducts) {
      await client.query(`
        INSERT INTO products (
          id, name, sku, barcode, primary_category, secondary_category, brand, company,
          description, short_description, place, image_url, mrp, price, stock, unit,
          available, is_veg, featured, todays_deal, best_seller, city_prices
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock;
      `, [
        p.id, p.name, p.sku, p.barcode, p.primary_category, p.secondary_category, p.brand, p.company,
        p.description, p.short_description, p.place, p.image_url, p.mrp, p.price, p.stock, p.unit,
        p.available, p.is_veg, p.featured, p.todays_deal, p.best_seller, p.city_prices
      ]);
    }
    console.log('✅ Products seeded successfully into AWS RDS!');
  } catch (err: any) {
    console.error('Error seeding products:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts();
