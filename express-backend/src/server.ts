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

// Support both standalone Express and Vercel serverless functions (pre-parsed req.body)
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
      return next();
    } catch {
      // Continue to express.json
    }
  }
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: 'Invalid JSON request payload' });
    }
    next();
  });
});

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: 'Invalid URL-encoded payload' });
    }
    next();
  });
});

// Routes (Supports both /api/* and root /*)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/products', productsRouter);
app.use('/products', productsRouter);

app.use('/api/orders', ordersRouter);
app.use('/orders', ordersRouter);

app.use('/api/shops', shopsRouter);
app.use('/shops', shopsRouter);

app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);

app.use('/api/coupons', couponsRouter);
app.use('/coupons', couponsRouter);

app.use('/api/delivery-slots', deliverySlotsRouter);
app.use('/delivery-slots', deliverySlotsRouter);

app.use('/api/addresses', addressesRouter);
app.use('/addresses', addressesRouter);

// Public Config Endpoint
const sendConfig = (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    min_order_limit: parseInt(process.env.MIN_ORDER_LIMIT || '2500', 10)
  });
};
app.get('/api/config', sendConfig);
app.get('/config', sendConfig);

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

// Global Error Handler - always return JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server (Only when not running as Vercel serverless function)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Node.js Express Server listening on http://localhost:${PORT}`);
    await seedDatabase();
  });
}

export default app;
