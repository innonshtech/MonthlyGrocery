import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Dynamic coupons repository
const BACKEND_COUPONS = [
  {
    id: 'c-1',
    code: 'MONTHLY100',
    title: '₹100 off on monthly orders above ₹2,000',
    discount_type: 'fixed',
    discount_value: 100,
    min_order_amount: 2000,
    max_discount: 100,
    expires_at: '31 Aug 2026',
    badge: 'Best Value',
    description: 'Flat ₹100 instant deduction on your bulk monthly grocery basket.'
  },
  {
    id: 'c-2',
    code: 'FIRSTSAVE',
    title: '15% off up to ₹300 on first order',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 1500,
    max_discount: 300,
    expires_at: '15 Sep 2026',
    badge: 'Welcome Offer',
    description: 'Special welcome discount for new household grocery shoppers.'
  },
  {
    id: 'c-3',
    code: 'BASKET50',
    title: '₹50 off on "Save as a basket" order',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_amount: 1000,
    max_discount: 50,
    expires_at: '31 Aug 2026',
    badge: 'Recurring Saver',
    description: 'Save an additional ₹50 when reordering any saved monthly basket.'
  },
  {
    id: 'c-4',
    code: 'BULK250',
    title: 'Flat ₹250 off on jumbo pantry orders above ₹4,000',
    discount_type: 'fixed',
    discount_value: 250,
    min_order_amount: 4000,
    max_discount: 250,
    expires_at: '30 Sep 2026',
    badge: 'Mega Pantry',
    description: 'Extra bulk discount for large family monthly pantry orders.'
  }
];

// 1. GET /api/coupons - Fetch all live active coupons
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        return res.json({ success: true, coupons: data });
      }
    }

    return res.json({ success: true, coupons: BACKEND_COUPONS });
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

    const matched = BACKEND_COUPONS.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

    if (!matched) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    }

    if (amount < matched.min_order_amount) {
      return res.status(400).json({
        success: false,
        error: `Add ₹${matched.min_order_amount - amount} more to apply coupon ${matched.code}`
      });
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
