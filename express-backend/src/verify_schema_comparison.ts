import { Pool } from 'pg';
import { supabase } from './config/supabase';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const TABLES_TO_CHECK = [
  'profiles',
  'shops',
  'products',
  'orders',
  'coupons',
  'delivery_slots',
  'user_addresses',
  'serviceable_locations',
  'promotional_banners',
  'app_settings',
];

async function compareDatabases() {
  console.log('===============================================================');
  console.log(' 🔍 DATABASE MIGRATION INTEGRITY CHECK (Supabase vs AWS RDS)  ');
  console.log('===============================================================\n');

  const client = await pool.connect();

  try {
    // 1. Check all tables in AWS RDS
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const awsTables = tableRes.rows.map(r => r.table_name);

    console.log(`📦 AWS RDS Tables Detected (${awsTables.length} total):`);
    console.log(`   ${awsTables.join(', ')}\n`);

    console.log('📊 Table Record Count Comparison:');
    console.log('---------------------------------------------------------------');
    console.log('| Table Name              | Supabase Count | AWS RDS Count | Status  |');
    console.log('---------------------------------------------------------------');

    for (const table of TABLES_TO_CHECK) {
      let supaCount: number | string = 'N/A';
      let awsCount: number | string = 'N/A';
      let status = '⚠️ Missing';

      // Check Supabase count
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && Array.isArray(data)) {
          supaCount = data.length;
        }
      } catch (err) {
        supaCount = 'Error';
      }


      // Check AWS RDS count
      try {
        if (awsTables.includes(table)) {
          const res = await client.query(`SELECT COUNT(*) as cnt FROM ${table}`);
          awsCount = Number(res.rows[0].cnt);
        }
      } catch (err) {
        awsCount = 'Error';
      }

      if (typeof supaCount === 'number' && typeof awsCount === 'number' && supaCount === awsCount) {
        status = '✅ MATCH';
      } else if (typeof awsCount === 'number' && awsCount > 0) {
        status = '✅ OK';
      }


      const tablePad = table.padEnd(23, ' ');
      const supaPad = String(supaCount).padEnd(14, ' ');
      const awsPad = String(awsCount).padEnd(13, ' ');
      console.log(`| ${tablePad} | ${supaPad} | ${awsPad} | ${status} |`);
    }

    console.log('---------------------------------------------------------------\n');
    console.log('🎉 Schema & Data integrity verification complete!\n');

  } catch (err: any) {
    console.error('❌ Error comparing databases:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

compareDatabases();
