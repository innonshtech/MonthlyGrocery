import { supabase } from '../src/config/supabase';

async function test() {
  const { data, error } = await supabase.from('products').select('*');
  console.log("Supabase products count:", data?.length, "Error:", error);
  if (data && data.length > 0) {
    console.log("Sample product:", data[0]);
  }
}
test();
