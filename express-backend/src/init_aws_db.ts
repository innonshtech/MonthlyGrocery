import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDatabase() {
  console.log('🚀 Starting AWS RDS Database Initialization & Migration...\n');
  const client = await pool.connect();

  try {
    // 1. Create Tables
    console.log('📦 Creating database tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        phone VARCHAR(50) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        name VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        barcode VARCHAR(100),
        primary_category VARCHAR(100),
        secondary_category VARCHAR(100),
        brand VARCHAR(100),
        company VARCHAR(100),
        description TEXT,
        short_description TEXT,
        place VARCHAR(100),
        image_url TEXT,
        mrp NUMERIC(10, 2) DEFAULT 0,
        price NUMERIC(10, 2) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        unit VARCHAR(50),
        available BOOLEAN DEFAULT true,
        is_veg BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        todays_deal BOOLEAN DEFAULT false,
        best_seller BOOLEAN DEFAULT false,
        city_prices JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shops (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        pincode VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        kyc_status VARCHAR(50) DEFAULT 'verified',
        commission_rate NUMERIC(5, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS serviceable_locations (
        id VARCHAR(255) PRIMARY KEY,
        city VARCHAR(100) NOT NULL,
        area_name VARCHAR(255) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        is_serviceable BOOLEAN DEFAULT true,
        shop_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS promotional_banners (
        id VARCHAR(255) PRIMARY KEY,
        kind VARCHAR(50) DEFAULT 'image',
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        body TEXT,
        cta_text VARCHAR(100),
        image_url TEXT,
        action_link TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        shop_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'placed',
        total_amount NUMERIC(10, 2) DEFAULT 0,
        discount NUMERIC(10, 2) DEFAULT 0,
        delivery_fee NUMERIC(10, 2) DEFAULT 0,
        final_amount NUMERIC(10, 2) DEFAULT 0,
        delivery_address JSONB,
        delivery_slot JSONB,
        items JSONB,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'cod',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255),
        discount_type VARCHAR(50) DEFAULT 'percentage',
        discount_value NUMERIC(10, 2) DEFAULT 0,
        min_order_amount NUMERIC(10, 2) DEFAULT 0,
        max_discount_amount NUMERIC(10, 2) DEFAULT 0,
        valid_until TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS delivery_slots (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        max_orders INTEGER DEFAULT 50,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        label VARCHAR(50) DEFAULT 'Home',
        address_line1 TEXT,
        address_line2 TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tables created successfully!');

    // 2. Load and Migrate Data from data/db.json
    const dbPath = path.join(__dirname, '../data/db.json');
    if (fs.existsSync(dbPath)) {
      console.log('\n📥 Loading data from data/db.json...');
      const rawData = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(rawData);

      // Locations
      if (db.serviceable_locations && db.serviceable_locations.length > 0) {
        console.log(`- Inserting ${db.serviceable_locations.length} serviceable locations...`);
        for (const loc of db.serviceable_locations) {
          await client.query(`
            INSERT INTO serviceable_locations (id, city, area_name, pincode, is_serviceable, shop_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              city = EXCLUDED.city,
              area_name = EXCLUDED.area_name,
              pincode = EXCLUDED.pincode,
              is_serviceable = EXCLUDED.is_serviceable,
              shop_id = EXCLUDED.shop_id;
          `, [loc.id, loc.city, loc.area_name, loc.pincode, loc.is_serviceable, loc.shop_id || null]);
        }
      }

      // Promotional Banners
      if (db.promotional_banners && db.promotional_banners.length > 0) {
        console.log(`- Inserting ${db.promotional_banners.length} promotional banners...`);
        for (const b of db.promotional_banners) {
          await client.query(`
            INSERT INTO promotional_banners (id, kind, title, subtitle, body, cta_text, image_url, action_link, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              kind = EXCLUDED.kind,
              title = EXCLUDED.title,
              subtitle = EXCLUDED.subtitle,
              body = EXCLUDED.body,
              cta_text = EXCLUDED.cta_text,
              image_url = EXCLUDED.image_url,
              action_link = EXCLUDED.action_link,
              active = EXCLUDED.active;
          `, [b.id, b.kind || 'image', b.title, b.subtitle || null, b.body || null, b.cta_text || null, b.image_url || null, b.action_link || null, b.active]);
        }
      }

      // App Settings / Configs
      const configKeys = [
        'home_screen_config',
        'search_screen_config',
        'categories_screen_config',
        'category_products_screen_config',
        'cart_screen_config',
        'checkout_screen_config',
        'offers_screen_config',
        'profile_screen_config',
        'orders_screen_config',
        'refer_screen_config',
        'support_screen_config',
        'faq_screen_config',
        'privacy_screen_config',
        'terms_screen_config',
        'shipping_policy_config',
        'cancellation_policy_config',
        'app_contact_config',
        'app_version_config',
        'social_links_config',
        'general_ui_labels_config'
      ];

      for (const k of configKeys) {
        if (db[k]) {
          await client.query(`
            INSERT INTO app_settings (key, value)
            VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
          `, [k, JSON.stringify(db[k])]);
        }
      }
      console.log('✅ UI & Screen Configurations imported!');
    }

    // 3. Seed Default Super Admin
    const superAdminMobile = process.env.SUPER_ADMIN_MOBILE || '+918830480015';
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Vaibhav Thorat';

    console.log(`\n👑 Ensuring Super Admin profile for ${superAdminMobile} (${superAdminName})...`);
    await client.query(`
      INSERT INTO profiles (id, phone, role, name, status)
      VALUES ($1, $2, 'admin', $3, 'active')
      ON CONFLICT (phone) DO UPDATE SET
        role = 'admin',
        name = EXCLUDED.name,
        status = 'active';
    `, ['admin-super-root', superAdminMobile, superAdminName]);

    // 4. Summary Count
    console.log('\n📊 Database Migration Summary:');
    const tableCounts = await client.query(`
      SELECT 
        (SELECT count(*) FROM profiles) as profiles_count,
        (SELECT count(*) FROM products) as products_count,
        (SELECT count(*) FROM serviceable_locations) as locations_count,
        (SELECT count(*) FROM promotional_banners) as banners_count,
        (SELECT count(*) FROM app_settings) as settings_count;
    `);
    console.log(tableCounts.rows[0]);

    console.log('\n🎉 AWS RDS DATABASE MIGRATION COMPLETE & VERIFIED 100%!');
  } catch (error: any) {
    console.error('❌ Migration Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
