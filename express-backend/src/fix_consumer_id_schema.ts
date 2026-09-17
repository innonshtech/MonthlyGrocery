import { pool } from './config/db';

async function fixConsumerIdSchema() {
  console.log('🔧 Adding consumer_id column and syncing with user_id in AWS RDS...');
  const client = await pool.connect();
  try {
    // 1. ORDERS Table
    console.log('1. Updating orders table with consumer_id...');
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS consumer_id VARCHAR(255);
      UPDATE orders SET consumer_id = user_id WHERE (consumer_id IS NULL OR consumer_id = '') AND user_id IS NOT NULL;
      UPDATE orders SET user_id = consumer_id WHERE (user_id IS NULL OR user_id = '') AND consumer_id IS NOT NULL;
    `);

    // 2. ADDRESSES Table
    console.log('2. Updating addresses table with consumer_id...');
    await client.query(`
      ALTER TABLE addresses ADD COLUMN IF NOT EXISTS consumer_id VARCHAR(255);
      UPDATE addresses SET consumer_id = user_id WHERE (consumer_id IS NULL OR consumer_id = '') AND user_id IS NOT NULL;
      UPDATE addresses SET user_id = consumer_id WHERE (user_id IS NULL OR user_id = '') AND consumer_id IS NOT NULL;
    `);

    console.log('✅ consumer_id column successfully added and synced across orders and addresses tables!');

    const orderCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';");
    console.log('ORDERS Columns:', orderCols.rows.map((r: any) => r.column_name).sort());

    const addrCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'addresses';");
    console.log('ADDRESSES Columns:', addrCols.rows.map((r: any) => r.column_name).sort());

  } catch (err: any) {
    console.error('❌ Error updating consumer_id schema:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixConsumerIdSchema();
