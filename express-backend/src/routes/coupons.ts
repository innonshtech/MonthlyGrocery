import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { readDb } from '../config/localDb';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-me';

// Default fallback coupons repository
const BACKEND_COUPONS = [
  {
    id: 'c-1',
    code: 'MONTHLY100',
    title: '₹100 off on orders above ₹2,500',
    discount_type: 'fixed',
    discount_value: 100,
    min_order_amount: 2500,
    max_discount: 100,
    expires_at: '31 Aug 2026',
    badge: 'Best Value',
    description: 'Flat ₹100 instant deduction on your bulk monthly grocery basket.',
    target_audience: 'all',
    usage_limit_per_user: 1
  },
  {
    id: 'c-2',
    code: 'FRESH15',
    title: '15% off up to ₹200 on fresh staples',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 1500,
    max_discount: 200,
    expires_at: '20 Aug 2026',
    badge: 'Staples Special',
    description: 'Save 15% up to ₹200 on fresh staples and kitchen essentials.',
    target_audience: 'all',
    usage_limit_per_user: 3
  },
  {
    id: 'c-3',
    code: 'FIRST50',
    title: '₹50 off your first monthly order',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_amount: 1000,
    max_discount: 50,
    expires_at: '15 Sep 2026',
    badge: 'Welcome Offer',
    description: 'Special discount of flat ₹50 on your first grocery delivery.',
    target_audience: 'new',
    usage_limit_per_user: 1
  },
  {
    id: 'c-4',
    code: 'BASKET50',
    title: '₹50 off on "Save as a basket" order',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_amount: 1000,
    max_discount: 50,
    expires_at: '31 Aug 2026',
    badge: 'Pantry Saver',
    description: 'Get flat ₹50 off when checking out with a saved grocery basket.',
    target_audience: 'loyal',
    usage_limit_per_user: 2
  }
];

// Helper to load and merge both Local Admin-Created coupons and Fallback coupons
export const getMergedCouponsList = () => {
  let adminCoupons: any[] = [];
  try {
    const db = readDb() as any;
    if (db && db.coupons) {
      adminCoupons = db.coupons.map((c: any) => ({
        id: c.id || `cpn-${Date.now()}`,
        code: c.code.toUpperCase(),
        title: c.description || `${c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`} OFF on orders above ₹${c.min_order_value}`,
        discount_type: c.discount_type === 'flat' ? 'fixed' : c.discount_type,
        discount_value: c.discount_value,
        min_order_amount: c.min_order_value || 0,
        max_discount: c.max_discount || c.discount_value,
        expires_at: '31 Dec 2026',
        badge: c.discount_type === 'percentage' ? 'Percentage Off' : 'Flat Discount',
        description: c.description || 'Special promo coupon configured by Super Admin.',
        target_audience: c.target_audience || 'all',
        usage_limit_per_user: c.usage_limit_per_user ? parseInt(c.usage_limit_per_user) : 1,
        max_global_uses: c.max_global_uses ? parseInt(c.max_global_uses) : undefined
      }));
    }
  } catch (err) {
    console.error('Coupons DB read error:', err);
  }

  // Combine and deduplicate by code (Admin overrides fallback)
  const merged = [...adminCoupons];
  for (const c of BACKEND_COUPONS) {
    if (!merged.some(m => m.code.toUpperCase() === c.code.toUpperCase())) {
      merged.push(c);
    }
  }
  return merged;
};

export function filterCouponsForUser(userId: string | null, orders: any[] = []) {
  const userOrders = userId
    ? orders.filter((o: any) => o.consumer_id === userId && o.status !== 'cancelled')
    : [];
  const orderCount = userOrders.length;
  const coupons = getMergedCouponsList();

  return coupons.filter((c) => {
    const target = c.target_audience || 'all';
    if (target === 'new' && orderCount > 0) return false;
    if (target === 'loyal' && orderCount < 1) return false;

    if (userId) {
      const userUsage = userOrders.filter(
        (o: any) => o.coupon_code?.toUpperCase() === c.code.toUpperCase(),
      ).length;
      const userLimit = c.usage_limit_per_user || 1;
      if (userUsage >= userLimit) return false;
    }

    if (c.max_global_uses) {
      const globalUsage = orders.filter(
        (o: any) =>
          o.coupon_code?.toUpperCase() === c.code.toUpperCase() &&
          o.status !== 'cancelled',
      ).length;
      if (globalUsage >= c.max_global_uses) return false;
    }

    return true;
  });
};

// 1. GET /api/coupons - Fetch targeted live active coupons
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    // Optional Auth parsing to decode user context
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
      } catch (e) {
        // Ignore invalid token
      }
    }

    const db = readDb() as any;
    const orders = db.orders || [];
    const filteredCoupons = filterCouponsForUser(userId, orders);

    return res.json({ success: true, coupons: filteredCoupons });
  } catch (err: any) {
    return res.json({ success: true, coupons: BACKEND_COUPONS });
  }
});

// 2. POST /api/coupons/apply - Validate and calculate exact discount
router.post('/apply', async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, cart_amount } = req.body;
    const amount = parseFloat(cart_amount) || 0;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }

    // Optional Auth parsing to decode user context
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
      } catch (e) {
        // Ignore invalid token
      }
    }

    const coupons = getMergedCouponsList();
    const matched = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

    if (!matched) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    }

    // 1. Min Order Amount Check
    if (amount < matched.min_order_amount) {
      return res.status(400).json({
        success: false,
        error: `Add ₹${matched.min_order_amount - amount} more to apply coupon ${matched.code}`
      });
    }

    const db = readDb() as any;
    const orders = db.orders || [];

    // 2. Target Audience Check
    const userOrders = userId ? orders.filter((o: any) => o.consumer_id === userId && o.status !== 'cancelled') : [];
    const orderCount = userOrders.length;
    const target = matched.target_audience || 'all';
    if (target === 'new' && orderCount > 0) {
      return res.status(400).json({ success: false, error: 'This coupon is valid for your first order only.' });
    }
    if (target === 'loyal' && orderCount < 1) {
      return res.status(400).json({ success: false, error: 'This coupon is valid for returning customers only.' });
    }

    // 3. User Usage Limit Check
    if (userId) {
      const userUsage = userOrders.filter((o: any) => o.coupon_code?.toUpperCase() === matched.code.toUpperCase()).length;
      const userLimit = matched.usage_limit_per_user || 1;
      if (userUsage >= userLimit) {
        return res.status(400).json({ success: false, error: 'You have already used this coupon code.' });
      }
    }

    // 4. Global Limit Check
    if (matched.max_global_uses) {
      const globalUsage = orders.filter((o: any) => o.coupon_code?.toUpperCase() === matched.code.toUpperCase() && o.status !== 'cancelled').length;
      if (globalUsage >= matched.max_global_uses) {
        return res.status(400).json({ success: false, error: 'This coupon campaign has reached its redemption limit.' });
      }
    }

    let calculatedDiscount = 0;
    if (matched.discount_type === 'fixed') {
      calculatedDiscount = matched.discount_value;
    } else {
      calculatedDiscount = Math.min((amount * matched.discount_value) / 100, matched.max_discount);
    }

    return res.json({
      success: true,
      coupon: matched,
      discount_amount: Math.round(calculatedDiscount),
      message: `Coupon ${matched.code} applied! You saved ₹${Math.round(calculatedDiscount)}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to apply coupon' });
  }
});

export default router;
