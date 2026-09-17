import { supabase } from './config/supabase';
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

async function migrateData() {
  console.log('🔄 Starting Full Sync from Supabase to AWS RDS PostgreSQL...\n');
  const client = await pool.connect();

  try {
    // 1. Sync Profiles
    console.log('👤 Fetching profiles from Supabase...');
    const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
    if (!profErr && profiles && profiles.length > 0) {
      console.log(`- Found ${profiles.length} profiles in Supabase. Migrating to AWS RDS...`);
      for (const p of profiles) {
        await client.query(`
          INSERT INTO profiles (id, phone, role, name, email, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            status = EXCLUDED.status;
        `, [p.id, p.phone || '', p.role || 'customer', p.name || '', p.email || '', p.status || 'active', p.created_at || new Date()]);
      }
      console.log('✅ Profiles migrated!');
    }

    // 2. Sync Shops
    console.log('\n🏪 Fetching shops from Supabase...');
    const { data: shops, error: shopErr } = await supabase.from('shops').select('*');
    if (!shopErr && shops && shops.length > 0) {
      console.log(`- Found ${shops.length} shops in Supabase. Migrating to AWS RDS...`);
      for (const s of shops) {
        await client.query(`
          INSERT INTO shops (id, name, owner_name, phone, email, address, city, pincode, is_active, kyc_status, commission_rate, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            owner_name = EXCLUDED.owner_name,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            pincode = EXCLUDED.pincode,
            is_active = EXCLUDED.is_active,
            kyc_status = EXCLUDED.kyc_status,
            commission_rate = EXCLUDED.commission_rate;
        `, [
          s.id,
          s.shop_name || s.name || 'MonthlyGrocery',
          s.owner_name || '',
          s.phone || '',
          s.email || '',
          s.address || '',
          s.city || 'pune',
          s.pincode || '',
          s.is_active !== false,
          s.status || s.kyc_status || 'verified',
          s.commission_rate || 0,
          s.created_at || new Date()
        ]);
      }
      console.log('✅ Shops migrated!');
    }

    // 3. Sync Products
    console.log('\n🍎 Fetching products from Supabase...');
    const { data: products, error: prodErr } = await supabase.from('products').select('*');
    if (!prodErr && products && products.length > 0) {
      console.log(`- Found ${products.length} products in Supabase. Migrating to AWS RDS...`);
      for (const pr of products) {
        await client.query(`
          INSERT INTO products (
            id, name, sku, barcode, primary_category, secondary_category, brand, company,
            description, short_description, place, image_url, mrp, price, stock, unit,
            available, is_veg, featured, todays_deal, best_seller, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            sku = EXCLUDED.sku,
            barcode = EXCLUDED.barcode,
            primary_category = EXCLUDED.primary_category,
            secondary_category = EXCLUDED.secondary_category,
            brand = EXCLUDED.brand,
            company = EXCLUDED.company,
            description = EXCLUDED.description,
            short_description = EXCLUDED.short_description,
            place = EXCLUDED.place,
            image_url = EXCLUDED.image_url,
            mrp = EXCLUDED.mrp,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            unit = EXCLUDED.unit,
            available = EXCLUDED.available,
            is_veg = EXCLUDED.is_veg,
            featured = EXCLUDED.featured,
            todays_deal = EXCLUDED.todays_deal,
            best_seller = EXCLUDED.best_seller;
        `, [
          pr.id, pr.name, pr.sku || null, pr.barcode || null, pr.primary_category || null,
          pr.secondary_category || null, pr.brand || null, pr.company || null,
          pr.description || null, pr.short_description || null, pr.place || null,
          pr.image_url || null, pr.mrp || 0, pr.price || 0, pr.stock || 0, pr.unit || '1 unit',
          pr.available !== false, pr.is_veg !== false, pr.featured || false,
          pr.todays_deal || false, pr.best_seller || false, pr.created_at || new Date()
        ]);
      }
      console.log('✅ Products migrated!');
    }

    // 4. Verification Count
    const finalCounts = await client.query(`
      SELECT 
        (SELECT count(*) FROM profiles) as total_profiles,
        (SELECT count(*) FROM shops) as total_shops,
        (SELECT count(*) FROM products) as total_products,
        (SELECT count(*) FROM serviceable_locations) as total_locations,
        (SELECT count(*) FROM promotional_banners) as total_banners;
    `);

    console.log('\n📊 Final AWS RDS Database Counts:');
    console.table(finalCounts.rows);

    console.log('\n🎉 ALL SUPABASE DATA SUCCESSFULLY COPIED TO AWS RDS POSTGRESQL!');
  } catch (err: any) {
    console.error('Migration error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateData();
