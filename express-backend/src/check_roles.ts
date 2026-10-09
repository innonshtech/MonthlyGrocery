import { query } from './config/db';

async function main() {
  await query("UPDATE profiles SET role = 'customer' WHERE phone = '918830480015' OR mobile = '918830480015' OR id = '397d4357-7f92-404a-8372-abaf507e3357'");
  console.log('Updated role to customer for Vaibhav Thorat');
  
  const { rows: profiles } = await query('SELECT id, name, full_name, phone, mobile, role, status FROM profiles ORDER BY created_at DESC');
  console.log('=== PROFILES ===');
  console.log(profiles);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
