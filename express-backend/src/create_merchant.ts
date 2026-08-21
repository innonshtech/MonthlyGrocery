import { supabase } from './config/supabase';

async function createMerchant() {
  const shopName = "Thorat Wholesalers";
  const ownerName = "Thorat Shopkeeper";
  const mobile = "9000000000"; // 10 digits
  const cleanMobile = "919000000000"; // E164 normalized

  console.log(`Checking if merchant user ${mobile} exists...`);

  // 1. Check if user already exists in auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingUser = authUsers?.users.find(u => u.phone === `+${cleanMobile}`);

  let ownerId: string;

  if (existingUser) {
    ownerId = existingUser.id;
    console.log(`User already exists in auth: ${ownerId}. Ensuring role is admin...`);
    
    // Update profile role to admin
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ role: 'admin', name: ownerName })
      .eq('id', ownerId);

    if (profileUpdateError) {
      console.error("Failed to update profile role:", profileUpdateError.message);
      process.exit(1);
    }
  } else {
    console.log("Creating new merchant user in auth...");
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      phone: `+${cleanMobile}`,
      phone_confirm: true,
      user_metadata: { name: ownerName, role: 'admin' }
    });

    if (createUserError || !newUser.user) {
      console.error("Failed to create auth user:", createUserError?.message);
      process.exit(1);
    }

    ownerId = newUser.user.id;

    // Create profile
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .upsert({
        id: ownerId,
        phone: cleanMobile,
        role: 'admin',
        name: ownerName
      });

    if (profileInsertError) {
      console.error("Failed to insert profiles row:", profileInsertError.message);
    }
  }

  // 2. Check if a shop already exists for this owner
  const { data: existingShop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (existingShop) {
    console.log(`Shop already exists for this merchant: ${existingShop.id}`);
  } else {
    console.log("Creating approved shop for this merchant...");
    const { data: newShop, error: shopError } = await supabase
      .from('shops')
      .insert({
        owner_id: ownerId,
        shop_name: shopName,
        status: 'approved'
      })
      .select()
      .single();

    if (shopError || !newShop) {
      console.error("Failed to create shop:", shopError?.message);
      process.exit(1);
    }
    console.log(`Shop created successfully: ${newShop.shop_name} (${newShop.id})`);
  }

  console.log(`\nSuccess! Merchant login credentials for phone testing:`);
  console.log(`- Mobile Number: ${mobile}`);
  console.log(`- OTP Bypass Code: 123456`);
  console.log(`Select the 'Admin' tab on the login screen of the mobile app to access the Merchant Console.`);
  process.exit(0);
}

createMerchant();
