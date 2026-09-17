import { pool } from './config/db';

async function checkAndFixProductsSchema() {
  console.log('🔍 Checking products table schema on AWS RDS...');
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';");
    const existingCols = res.rows.map((r: any) => r.column_name);
    console.log('Existing columns in products:', existingCols.sort());

    console.log('🔧 Adding missing columns to products table...');
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_category VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS secondary_category VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS company VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS place VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesaler_price NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS gst NUMERIC(5, 2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'units';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT true;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS todays_deal BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS best_seller BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS family_key VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity_value NUMERIC(10, 2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_label VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Sync shop_id from shops if null
    const shopsRes = await client.query("SELECT id FROM shops LIMIT 1;");
    if (shopsRes.rows.length > 0) {
      const defaultShopId = shopsRes.rows[0].id;
      await client.query("UPDATE products SET shop_id = $1 WHERE shop_id IS NULL OR shop_id = '';", [defaultShopId]);
    }

    const updatedRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';");
    console.log('✅ Updated products columns in AWS RDS:', updatedRes.rows.map((r: any) => r.column_name).sort());
    console.log('🎉 products table is 100% aligned!');
  } catch (err: any) {
    console.error('❌ Error updating products schema:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndFixProductsSchema();
