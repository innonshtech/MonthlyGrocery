import { supabase } from './config/supabase';

async function check() {
  console.log("Fetching users from auth.users...");
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth listUsers error:", authError.message);
  } else {
    console.log(`Found ${authUsers?.users.length || 0} users in auth.users:`);
    for (const u of authUsers?.users || []) {
      console.log(`- ID: ${u.id}, Phone: ${u.phone}, Metadata:`, u.user_metadata);
    }
  }

  console.log("\nFetching profiles from public.profiles...");
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  if (profileError) {
    console.error("Profiles select error:", profileError.message);
  } else {
    console.log(`Found ${profiles?.length || 0} profiles in public.profiles:`);
    for (const p of profiles || []) {
      console.log(`- ID: ${p.id}, Phone: ${p.phone}, Role: ${p.role}, Name: ${p.name}`);
    }
  }
  process.exit(0);
}

check();
