import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load config (.env)
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
import aiRouter from './routes/ai';
import { uploadsProxyMiddleware } from './middleware/uploadsProxy';

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

// Static uploads + S3 proxy when object is not on disk (private bucket)
const uploadsStatic = express.static(path.join(__dirname, '../uploads'));
app.use('/uploads', uploadsProxyMiddleware, uploadsStatic);
app.use('/api/uploads', uploadsProxyMiddleware, uploadsStatic);

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
app.use('/api/api/delivery-slots', deliverySlotsRouter);

app.use('/api/addresses', addressesRouter);
app.use('/addresses', addressesRouter);

app.use('/api/ai', aiRouter);
app.use('/ai', aiRouter);

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

// Public Privacy Policy Webpage for Play Store & App Store compliance
const renderPrivacyPolicy = (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - EVER & EVER MERCHANT</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px 15px; background: #F8FAFC; }
        .card { background: #FFFFFF; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h1 { color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; }
        h2 { color: #1E293B; margin-top: 24px; }
        p, li { color: #475569; font-size: 15px; }
        ul { padding-left: 20px; }
        .footer { margin-top: 30px; font-size: 13px; color: #94A3B8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Privacy Policy</h1>
        <p><strong>Effective Date:</strong> January 1, 2026<br><strong>Apps Covered:</strong> EVER (Customer App) and EVER MERCHANT (Partner App)</p>
        
        <h2>1. Overview</h2>
        <p>Welcome to EVER. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how our applications collect, use, disclose, and safeguard your data when you use our mobile applications and grocery ordering services.</p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Personal Information:</strong> Name, phone number, and delivery addresses provided during registration and order checkout.</li>
          <li><strong>Location Data:</strong> Approximate and precise geolocation (when permitted) to find nearby grocery stores, confirm delivery addresses, and enable real-time order tracking.</li>
          <li><strong>Camera & Storage:</strong> Access to camera/photo gallery (optional) to allow merchant store registration, document verification, and customer profile updates.</li>
          <li><strong>Order & Transaction Data:</strong> Items purchased, order history, scheduled delivery slots, and payment status.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To process, fulfill, and deliver your grocery orders on time.</li>
          <li>To authenticate user accounts via secure SMS OTP.</li>
          <li>To provide customer support, order updates, and delivery alerts.</li>
          <li>To improve application performance and prevent fraud.</li>
        </ul>

        <h2>4. Data Sharing & Security</h2>
        <p>We do not sell your personal data. We only share necessary delivery details with our verified delivery partners and merchants strictly for order fulfillment. We use industry-standard encryption (HTTPS/SSL) and secure cloud infrastructure to protect all stored information.</p>

        <h2>5. Account Deletion & Data Rights</h2>
        <p>You have the right to access, update, or request permanent deletion of your account and personal data at any time via the in-app "Delete Account" feature or by contacting our support team.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions or concerns regarding this Privacy Policy, please contact us at:<br><strong>Email:</strong> support@evergrocery.com / monthlygrocery7@gmail.com</p>
      </div>
      <div class="footer">&copy; 2026 EVER. All Rights Reserved.</div>
    </body>
    </html>
  `);
};
app.get('/privacy-policy', renderPrivacyPolicy);
app.get('/api/privacy-policy', renderPrivacyPolicy);
app.get('/privacy', renderPrivacyPolicy);
app.get('/api/privacy', renderPrivacyPolicy);

// Automatically ensure all AWS RDS PostgreSQL tables and columns are created & aligned
async function ensureDatabaseSchema() {
  try {
    const { pool } = require('./config/db');
    const client = await pool.connect();
    try {
      // 1. Profiles Table
      await client.query(`
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
      `);

      // 2. Shops Table
      await client.query(`
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS address_line TEXT;
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS area_name VARCHAR(255);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS state_name VARCHAR(100);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC(5, 2) DEFAULT 5.0;
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS free_delivery_radius_km NUMERIC(5, 2) DEFAULT 5.0;
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS extra_delivery_fee_per_km NUMERIC(5, 2) DEFAULT 10.0;
        ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
      `);

      // Sync shop_name and status from name and kyc_status
      await client.query(`
        UPDATE shops SET shop_name = name WHERE (shop_name IS NULL OR shop_name = '') AND name IS NOT NULL;
        UPDATE shops SET status = kyc_status WHERE (status IS NULL OR status = '') AND kyc_status IS NOT NULL;
      `);

      // 3. Products Table
      await client.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_category VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS secondary_category VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS place VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesaler_price NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS gst NUMERIC(5, 2) DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'units';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT true;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS todays_deal BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS best_seller BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS family_key VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity_value NUMERIC(10, 2);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(50);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_label VARCHAR(100);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS city VARCHAR(100);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
      `);

      // 4. Product City Prices Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_city_prices (
          id SERIAL PRIMARY KEY,
          product_id VARCHAR(255) NOT NULL,
          city_name VARCHAR(100) NOT NULL,
          mrp NUMERIC(10, 2) DEFAULT 0,
          price NUMERIC(10, 2) DEFAULT 0,
          wholesaler_price NUMERIC(10, 2) DEFAULT 0,
          is_live BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_prod_city UNIQUE(product_id, city_name)
        );
      `);

      // 5. Orders Table
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS consumer_id VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_id VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 6);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(10, 6);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot VARCHAR(100);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_savings NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE orders ALTER COLUMN delivery_address TYPE TEXT USING delivery_address::text;
        ALTER TABLE orders ALTER COLUMN delivery_slot TYPE TEXT USING delivery_slot::text;
        UPDATE orders SET consumer_id = user_id WHERE (consumer_id IS NULL OR consumer_id = '') AND user_id IS NOT NULL;
        UPDATE orders SET user_id = consumer_id WHERE (user_id IS NULL OR user_id = '') AND consumer_id IS NOT NULL;
      `);

      // 6. Order Items Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          order_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          product_name VARCHAR(255),
          price NUMERIC(10, 2) NOT NULL,
          quantity INTEGER NOT NULL,
          unit VARCHAR(50),
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE order_items ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
      `);

      // 6b. Shop Products Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS shop_products (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          shop_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          selling_price NUMERIC(10, 2) DEFAULT 0,
          discount_percentage NUMERIC(5, 2) DEFAULT 0,
          stock INTEGER DEFAULT 0,
          available BOOLEAN DEFAULT true,
          status VARCHAR(50) DEFAULT 'approved',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_shop_product UNIQUE(shop_id, product_id)
        );
      `);

      // 7. Addresses Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS addresses (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          consumer_id VARCHAR(255),
          full_name VARCHAR(255),
          phone VARCHAR(50),
          address_line TEXT,
          area_name VARCHAR(255),
          city VARCHAR(100),
          pincode VARCHAR(20),
          state_name VARCHAR(100),
          landmark TEXT,
          latitude NUMERIC(10, 6),
          longitude NUMERIC(10, 6),
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE addresses ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
        ALTER TABLE addresses ADD COLUMN IF NOT EXISTS consumer_id VARCHAR(255);
        UPDATE addresses SET consumer_id = user_id WHERE (consumer_id IS NULL OR consumer_id = '') AND user_id IS NOT NULL;
        UPDATE addresses SET user_id = consumer_id WHERE (user_id IS NULL OR user_id = '') AND consumer_id IS NOT NULL;
      `);

      // 8. Coupons Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id VARCHAR(255) PRIMARY KEY,
          code VARCHAR(100) UNIQUE NOT NULL,
          title VARCHAR(255),
          description TEXT,
          discount_type VARCHAR(50) DEFAULT 'percentage',
          discount_value NUMERIC(10, 2) NOT NULL,
          min_order_amount NUMERIC(10, 2) DEFAULT 0,
          max_discount_amount NUMERIC(10, 2),
          is_active BOOLEAN DEFAULT true,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ AWS RDS PostgreSQL schema verified & aligned on startup.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('⚠️ AWS RDS schema alignment note:', err.message);
  }
}

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
    await ensureDatabaseSchema();
    await ensureSuperAdmin();
  });
}

export default app;

