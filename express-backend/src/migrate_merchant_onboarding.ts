import { query } from './config/db';

async function migrate() {
  console.log('Migrating shops table for Merchant Onboarding & Documents...');
  await query(`
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(50);
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS aadhaar_doc_url TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(50);
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS fssai_doc_url TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS pan_doc_url TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS gstin VARCHAR(50);
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_photo_url TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS street_address TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS detailed_address TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS onboarding_source VARCHAR(50) DEFAULT 'merchant_app';
  `);
  
  const res = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'shops' 
    ORDER BY column_name;
  `);
  console.log('Shops columns now:', res.rows.map(r => r.column_name).join(', '));
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
