import { readDb, writeDb } from '../src/config/localDb';

async function forceEnableProducts() {
  console.log('=== FORCING ALL CONFIGURED PRODUCTS TO BE LIVE & AVAILABLE ===');
  
  const db = readDb();
  if (db.shop_products && db.shop_products.length > 0) {
    db.shop_products = db.shop_products.map((sp: any) => {
      console.log(`Setting product_id ${sp.product_id} (shop_id: ${sp.shop_id}) to available: true`);
      return {
        ...sp,
        available: true,
        status: 'approved'
      };
    });
    writeDb(db);
    console.log('✓ All products set to available: true successfully!');
  } else {
    console.log('No shop products mapped yet in db.json!');
  }
}

forceEnableProducts().then(() => process.exit(0));
