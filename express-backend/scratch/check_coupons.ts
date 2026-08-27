import { supabase } from '../src/config/supabase';

async function checkCoupons() {
  const { data, error } = await supabase.from('coupons').select('*');
  if (error) {
    console.error('Error fetching coupons:', error.message);
  } else {
    console.log('Current Supabase Coupons count:', data?.length);
    console.log('Coupons:', JSON.stringify(data, null, 2));
  }
}

checkCoupons().then(() => process.exit(0));
