import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load config
dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from './config/db';

import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import shopsRouter from './routes/shops';
import adminRouter from './routes/adminControls';
import couponsRouter from './routes/coupons';
import deliverySlotsRouter from './routes/deliverySlots';
import addressesRouter from './routes/addresses';

const app = express();
const PORT = Number(process.env.PORT) || 8001;

// Middlewares
app.use(cors());

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MonthlyGrocery Express Backend (AWS RDS PostgreSQL)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MonthlyGrocery Express Backend (AWS RDS PostgreSQL)',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MonthlyGrocery Express API (Powered by AWS RDS)',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Seed / Verify super_admin on startup
async function ensureSuperAdmin() {
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

  console.log('Running startup database checks on AWS RDS PostgreSQL...');

  try {
    // 1. Check if the Super Admin profile already exists
    let { data: profile, error: profileError } = await db
      .from('profiles')
      .select('*')
      .eq('phone', saMobileClean)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking admin profile in AWS RDS:', profileError.message);
      return;
    }

    if (!profile) {
      console.log(`Seeding Super Admin user for ${saMobileE164}...`);
      const { data: authUser, error: authError } = await db.auth.admin.createUser({
        phone: saMobileE164,
        user_metadata: {
          name: saName,
          role: 'super_admin',
        }
      });

      if (authError || !authUser?.user) {
        console.error('Failed to create admin profile in AWS RDS:', authError?.message);
        return;
      }

      // Fetch the created profile
      const { data: newProfile } = await db
        .from('profiles')
        .select('*')
        .eq('phone', saMobileClean)
        .maybeSingle();

      profile = newProfile;
    }

    // Force role to super_admin if it is not
    if (profile && profile.role !== 'super_admin') {
      await db
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', profile.id);
      
      console.log(`Updated user ${saMobileE164} role to super_admin.`);
    } else if (profile) {
      console.log(`Super Admin verified in AWS RDS: ${profile.name || saName} (${saMobileE164})`);
    }

    console.log('Database startup checks complete.');
  } catch (err: any) {
    console.error('Database startup checks failed with exception:', err.message || err);
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
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Node.js Express Server listening on http://0.0.0.0:${PORT}`);
    await ensureSuperAdmin();
  });
}

export default app;

