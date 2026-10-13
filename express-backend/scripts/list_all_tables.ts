import { pool } from '../src/config/db';

async function listAllTables() {
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('--- ALL TABLES AND ROW COUNTS ---');
  for (const row of res.rows) {
    const tableName = row.table_name;
    const countRes = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    console.log(`- ${tableName}: ${countRes.rows[0].count} rows`);
  }
  await pool.end();
}

listAllTables();
