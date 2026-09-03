import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { supabase } from './config/supabase';

// Load config
dotenv.config({ path: path.join(__dirname, '../.env') });

import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import shopsRouter from './routes/shops';
import adminRouter from './routes/adminControls';
import couponsRouter from './routes/coupons';
import deliverySlotsRouter from './routes/deliverySlots';
import addressesRouter from './routes/addresses';

const app = express();
const PORT = process.env.PORT || 8001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/delivery-slots', deliverySlotsRouter);
app.use('/api/addresses', addressesRouter);

// Public Config Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    min_order_limit: parseInt(process.env.MIN_ORDER_LIMIT || '2500', 10)
  });
});

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Seeding Script (Super Admin & Shop)
async function seedDatabase() {
  const saMobileRaw = process.env.SUPER_ADMIN_MOBILE || '+918830480015';
  const saName = process.env.SUPER_ADMIN_NAME || 'Vaibhav Thorat';

  // Normalize phone for DB queries (pure digits) vs API calls (with +)
  const cleanPhone = (phone: string) => {
    let clean = phone.replace(/[^\d]/g, '');
    if (clean.length === 10) clean = '91' + clean;
    return clean;
  };

  const saMobileClean = cleanPhone(saMobileRaw);
  const saMobileE164 = '+' + saMobileClean;

  console.log('Running startup database checks...');

  try {
    // 1. Check if the Super Admin profile already exists
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', saMobileClean)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking admin profile:', profileError.message);
      return;
    }

    if (!profile) {
      console.log(`Seeding Super Admin user for ${saMobileE164}...`);
      // Create user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: saMobileE164,
        phone_confirm: true,
        user_metadata: {
          name: saName,
          role: 'super_admin',
        }
      });

      if (authError || !authUser.user) {
        console.error('Failed to create admin in auth.users:', authError?.message);
        return;
      }

      // Fetch the created profile
      const { data: newProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', saMobileClean)
        .single();

      if (fetchError || !newProfile) {
        console.error('Failed to fetch new profile:', fetchError?.message);
        return;
      }

      profile = newProfile;
    }

    // Force role to super_admin if it is not
    if (profile.role !== 'super_admin') {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', profile.id)
        .select()
        .single();
      
      if (!updateError && updated) {
        profile = updated;
      }
    }

    // 2. Check if a default Shop is configured
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (shopError) {
      console.error('Error checking shop:', shopError.message);
      return;
    }

    if (!shop) {
      console.log('Seeding default shop: MonthlyGrocery...');
      const { error: insertShopError } = await supabase
        .from('shops')
        .insert({
          owner_id: profile.id,
          shop_name: 'MonthlyGrocery',
          status: 'approved',
        });

      if (insertShopError) {
        console.error('Failed to seed default shop:', insertShopError.message);
      } else {
        console.log('Default shop seeded successfully.');
      }
    } else {
      console.log(`Using active shop: ${shop.shop_name} (${shop.id})`);
    }

    console.log('Database startup checks complete.');

  } catch (err: any) {
    console.error('Database seeding failed with exception:', err.message || err);
  }
}

// Start Server (Only when not running as Vercel serverless function)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Node.js Express Server listening on http://localhost:${PORT}`);
    await seedDatabase();
  });
}

export default app;
