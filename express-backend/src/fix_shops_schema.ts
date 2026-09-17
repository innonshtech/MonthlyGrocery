import { pool } from './config/db';

async function fixShopsSchema() {
  console.log('🔧 Starting shops table schema repair in AWS RDS...');
  const client = await pool.connect();

  try {
    // 1. Add owner_id, shop_name, status columns if they don't exist
    await client.query(`
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';
    `);
    console.log('✅ Columns (owner_id, shop_name, status) added or verified.');

    // 2. Populate shop_name and status from existing columns
    await client.query(`
      UPDATE shops 
      SET shop_name = name 
      WHERE (shop_name IS NULL OR shop_name = '') AND name IS NOT NULL;

      UPDATE shops 
      SET status = kyc_status 
      WHERE (status IS NULL OR status = '') AND kyc_status IS NOT NULL;
    `);

    // 3. Link owner_id to super_admin or admin profile if null
    const profileRes = await client.query(`
      SELECT id, phone, name, role 
      FROM profiles 
      WHERE role IN ('admin', 'super_admin') 
      LIMIT 1;
    `);

    if (profileRes.rows.length > 0) {
      const adminId = profileRes.rows[0].id;
      await client.query(`
        UPDATE shops 
        SET owner_id = $1 
        WHERE owner_id IS NULL;
      `, [adminId]);
      console.log(`✅ Linked existing shops to merchant admin profile (${profileRes.rows[0].name}, ID: ${adminId})`);
    }

    // 4. Verify columns
    const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shops' 
      ORDER BY ordinal_position;
    `);
    console.log('\n📦 Current shops table columns in AWS RDS:');
    console.table(colsRes.rows);

    const dataRes = await client.query(`
      SELECT id, name, shop_name, owner_id, status 
      FROM shops;
    `);
    console.log('\n🏪 Current shops in AWS RDS:');
    console.table(dataRes.rows);

    console.log('\n🎉 SHOPS SCHEMA REPAIR COMPLETED 100%!');
  } catch (err: any) {
    console.error('❌ Error updating shops schema:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixShopsSchema();
