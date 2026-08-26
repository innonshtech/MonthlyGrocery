import { supabase } from '../src/config/supabase';
import { readDb, writeDb } from '../src/config/localDb';

async function checkAndAssignShops() {
  console.log('=== Checking Users, Shops and Mappings ===');

  // Fetch shops
  const { data: shops, error: sErr } = await supabase.from('shops').select('*');
  if (sErr) {
    console.error('Shops fetch error:', sErr.message);
    return;
  }
  console.log('Registered Shops:', JSON.stringify(shops, null, 2));

  // Let's check db.json serviceable locations
  const db = readDb();
  console.log('\nLocations in db.json before assignment:', JSON.stringify(db.serviceable_locations, null, 2));

  // Assign Thorat Wholesalers (4548b0b3-5a4d-4608-84a8-6fb5164af613) to serve Kothrud and Baner
  const thoratShop = shops?.find(s => s.shop_name.includes('Thorat') || s.id === '4548b0b3-5a4d-4608-84a8-6fb5164af613');
  const defaultShop = shops?.[0];
  const assignedShopId = thoratShop ? thoratShop.id : (defaultShop ? defaultShop.id : null);

  if (assignedShopId) {
    console.log(`\nAssigning Shop ID: ${assignedShopId} to all locations in Pune and Mumbai...`);
    db.serviceable_locations = db.serviceable_locations.map(loc => {
      // Map it
      return {
        ...loc,
        shop_id: assignedShopId
      };
    });
    writeDb(db);
    console.log('✓ Locations updated successfully!');
  } else {
    console.warn('No shops found to assign!');
  }

  // Also check products currently in Supabase
  const { data: prods, error: pErr } = await supabase.from('products').select('id, name, primary_category, unit, mrp, price');
  if (pErr) console.error('Products error:', pErr.message);
  else console.log('\nProducts currently in Master Catalog:', prods);
}

checkAndAssignShops().then(() => process.exit(0));
