const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 'super-admin-root', mobile: '+918830480015', role: 'super_admin' },
  'super-secret-jwt-token-key-change-me',
  { expiresIn: '7d' }
);

async function testCreate() {
  // Try adding a subcategory to Fruits & Vegetables (cat-1791469930827-bob5cw7)
  const res = await fetch('http://13.233.159.143/api/admin/subcategories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({
      category_id: 'cat-1791469930827-bob5cw7',
      name: 'Fresh Vegetables',
      sort_order: 1,
      active: true,
    }),
  });
  const data = await res.json();
  console.log('Result:', res.status, data);
}

testCreate();
