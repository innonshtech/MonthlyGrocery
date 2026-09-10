import { supabase } from '../src/config/supabase';

async function updateName() {
  const { data, error } = await supabase
    .from('products')
    .update({ name: 'Fortune oil 1 L' })
    .eq('id', '35326e0a-8dfe-4f36-acad-badef35cb765')
    .select();

  if (error) {
    console.error('Update error:', error);
  } else {
    console.log('Successfully updated product name:', data);
  }
}

updateName();
