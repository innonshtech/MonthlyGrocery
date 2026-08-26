import { readDb, writeDb } from '../src/config/localDb';

async function updateDbCategories() {
  console.log('=== Updating categories list in db.json ===');
  
  const db = readDb();
  db.categories = [
    { id: 'cat-1', name: 'Atta & Rice' },
    { id: 'cat-2', name: 'Oils & Ghee' },
    { id: 'cat-3', name: 'Dals & Pulses' },
    { id: 'cat-4', name: 'Spices & Masala' },
    { id: 'cat-5', name: 'Dry Fruits' },
    { id: 'cat-6', name: 'Snacks' },
    { id: 'cat-7', name: 'Beverages' },
    { id: 'cat-8', name: 'Biscuits' },
    { id: 'cat-9', name: 'Cleaning' },
    { id: 'cat-10', name: 'Personal Care' },
    { id: 'cat-11', name: 'Home & Kitchen' },
    { id: 'cat-12', name: 'Baby Care' }
  ];
  
  writeDb(db);
  console.log('✓ Categories successfully aligned in db.json!');
}

updateDbCategories().then(() => process.exit(0));
