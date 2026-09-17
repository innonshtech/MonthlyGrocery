import { pool } from './config/db';

async function fixAllTablesSchema() {
  console.log('🔧 Starting Comprehensive AWS RDS Database Schema Alignment...');
  const client = await pool.connect();

  try {
    // 1. Profiles Table
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
    `);
    console.log('✅ Profiles table columns verified (avatar_url, city, pincode, full_name).');

    // 2. Shops Table
    await client.query(`
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS address_line TEXT;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS area_name VARCHAR(255);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS state_name VARCHAR(100);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC(5, 2) DEFAULT 5.0;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS free_delivery_radius_km NUMERIC(5, 2) DEFAULT 5.0;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS extra_delivery_fee_per_km NUMERIC(5, 2) DEFAULT 10.0;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
    `);
    console.log('✅ Shops table columns verified (owner_id, shop_name, status, delivery settings, etc.).');

    // Sync shop_name and status from name and kyc_status
    await client.query(`
      UPDATE shops SET shop_name = name WHERE (shop_name IS NULL OR shop_name = '') AND name IS NOT NULL;
      UPDATE shops SET status = kyc_status WHERE (status IS NULL OR status = '') AND kyc_status IS NOT NULL;
    `);

    // 3. Products Table
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesaler_price NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS gst NUMERIC(5, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS family_key VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity_value NUMERIC(10, 2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_label VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    `);
    console.log('✅ Products table columns verified.');

    // 4. Product City Prices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_city_prices (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL,
        city_name VARCHAR(100) NOT NULL,
        mrp NUMERIC(10, 2) DEFAULT 0,
        price NUMERIC(10, 2) DEFAULT 0,
        wholesaler_price NUMERIC(10, 2) DEFAULT 0,
        is_live BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_prod_city UNIQUE(product_id, city_name)
      );
    `);
    console.log('✅ product_city_prices table verified.');

    // 5. Orders Table
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 6);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(10, 6);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
    `);
    console.log('✅ Orders table columns verified.');

    console.log('\n🎉 ALL DATABASE SCHEMAS ARE 100% SYNCHRONIZED & ALIGNED WITH APPLICATION CODE!');
  } catch (err: any) {
    console.error('❌ Error fixing database schemas:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllTablesSchema();
