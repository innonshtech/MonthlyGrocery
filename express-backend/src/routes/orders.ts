import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

function generateDisplayOrderId(): string {
  return `MG${Math.floor(10000 + Math.random() * 90000)}`;
}

function formatPaymentMethodLabel(method?: string): string {
  if (!method) return 'Cash on Delivery';
  if (method === 'COD') return 'Cash on Delivery';
  if (method === 'UPI') return 'UPI';
  if (method === 'CARD') return 'Card';
  return method;
}

// 1. POST /checkout and POST /: Create a new order (Checkout Flow)
const handleCheckout = async (req: AuthRequest, res: Response) => {
  const {
    shop_id,
    items,
    total_amount,
    shipping_address,
    delivery_address,
    delivery_slot,
    delivery_slot_date,
    delivery_slot_window_id,
    payment_method,
    coupon_code,
    discount_amount,
    deliver_to_label,
    product_savings,
  } = req.body;

  const finalAddress = shipping_address || delivery_address || 'Pune, Maharashtra';

  if (!items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({ success: false, error: 'Incomplete order checkout details' });
  }

  try {
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;

    // Strict Server-Side Coupon Verification
    let validatedDiscount = 0;
    let finalPayableAmount = parseFloat(total_amount);

    if (coupon_code) {
      const { getMergedCouponsList } = require('./coupons');
      const coupons = getMergedCouponsList();
      const matchedCoupon = coupons.find((c: any) => c.code.toUpperCase() === coupon_code.trim().toUpperCase());
      
      if (!matchedCoupon) {
        return res.status(400).json({ success: false, error: 'Invalid coupon code' });
      }

      // Reconstruct original amount before any client-applied discount
      const originalAmount = parseFloat(total_amount) + (parseFloat(discount_amount) || 0);

      // 1. Min order amount check
      if (originalAmount < matchedCoupon.min_order_amount) {
        return res.status(400).json({ 
          success: false, 
          error: `Minimum order amount of ₹${matchedCoupon.min_order_amount} not met for coupon ${matchedCoupon.code}.` 
        });
      }

      const orders = db.orders || [];
      const userOrders = orders.filter((o: any) => o.consumer_id === req.user!.id && o.status !== 'cancelled');
      const orderCount = userOrders.length;

      // 2. Target audience check
      const target = matchedCoupon.target_audience || 'all';
      if (target === 'new' && orderCount > 0) {
        return res.status(400).json({ success: false, error: 'This coupon is only valid for your first order.' });
      }
      if (target === 'loyal' && orderCount < 1) {
        return res.status(400).json({ success: false, error: 'This coupon is only valid for returning customers.' });
      }

      // 3. User usage limits check
      const userUsageCount = userOrders.filter((o: any) => o.coupon_code?.toUpperCase() === matchedCoupon.code.toUpperCase()).length;
      const userLimit = matchedCoupon.usage_limit_per_user || 1;
      if (userUsageCount >= userLimit) {
        return res.status(400).json({ success: false, error: 'You have already reached the limit for this coupon.' });
      }

      // 4. Global limit check
      if (matchedCoupon.max_global_uses) {
        const globalUsage = orders.filter((o: any) => o.coupon_code?.toUpperCase() === matchedCoupon.code.toUpperCase() && o.status !== 'cancelled').length;
        if (globalUsage >= matchedCoupon.max_global_uses) {
          return res.status(400).json({ success: false, error: 'This coupon campaign has reached its redemption limit.' });
        }
      }

      // Calculate server-side discount
      if (matchedCoupon.discount_type === 'fixed') {
        validatedDiscount = matchedCoupon.discount_value;
      } else {
        validatedDiscount = Math.min((originalAmount * matchedCoupon.discount_value) / 100, matchedCoupon.max_discount);
      }
      validatedDiscount = Math.round(validatedDiscount);
      finalPayableAmount = Math.max(0, originalAmount - validatedDiscount);
    }

    // 1. Resolve Shop ID (fallback to first active shop if not specified)
    let targetShopId = shop_id;
    if (!targetShopId) {
      const { data: defaultShop } = await supabase.from('shops').select('id').limit(1).maybeSingle();
      targetShopId = defaultShop?.id || 'e183b9e2-463d-4d9c-80b2-d2d2b05b7591';
    }

    // Validate delivery slot availability (dynamic capacity from merchant config)
    if (delivery_slot_date && delivery_slot_window_id) {
      const { validateSlotSelection } = require('../services/deliverySlots');
      const slotCheck = validateSlotSelection(targetShopId, delivery_slot_date, delivery_slot_window_id);
      if (!slotCheck.valid) {
        return res.status(400).json({ success: false, error: slotCheck.error });
      }
    }

    // 2. Generate random 4-digit Delivery OTP (Swiggy/Zomato style)
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Insert order into Supabase with validated final amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        consumer_id: req.user!.id,
        shop_id: targetShopId,
        total_amount: finalPayableAmount,
        delivery_address: finalAddress,
        status: 'confirmed',
      })
      .select()
      .single();

    if (orderError || !order) {
      return res.status(500).json({ success: false, error: orderError?.message || 'Failed to place order' });
    }

    // 4. Prepare order items
    const orderItems = items.map((it: any) => ({
      order_id: order.id,
      product_id: it.product_id || it.id,
      quantity: parseInt(it.quantity) || 1,
      unit_price: parseFloat(it.price || it.unit_price) || 0.00,
    }));

    // 5. Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.warn('Order items insert notice:', itemsError.message);
    }

    if (!db.orders) db.orders = [];

    const displayId = generateDisplayOrderId();
    const validatedProductSavings = Math.max(0, parseFloat(String(product_savings)) || 0);

    const enrichedOrder = {
      id: order.id,
      display_id: displayId,
      consumer_id: req.user!.id,
      consumer_name: req.user!.mobile || 'Customer',
      shop_id: targetShopId,
      total_amount: finalPayableAmount,
      discount_amount: validatedDiscount,
      product_savings: validatedProductSavings,
      total_savings: validatedProductSavings + validatedDiscount,
      coupon_code: coupon_code || null,
      shipping_address: finalAddress,
      deliver_to_label: deliver_to_label || null,
      delivery_slot: delivery_slot || 'Tomorrow Morning',
      delivery_slot_date: delivery_slot_date || null,
      delivery_slot_window_id: delivery_slot_window_id || null,
      delivery_otp: deliveryOtp,
      payment_method: payment_method || 'COD',
      payment_method_label: formatPaymentMethodLabel(payment_method || 'COD'),
      status: 'confirmed',
      created_at: new Date().toISOString(),
      order_items: items.map((it: any) => ({
        product_id: it.product_id || it.id,
        product_name: it.name || it.product_name || 'Grocery Item',
        quantity: parseInt(it.quantity) || 1,
        unit_price: parseFloat(it.price || it.unit_price) || 0.00,
        unit: it.unit || '1 unit',
        image_url: it.image_url || '',
      }))
    };

    db.orders.unshift(enrichedOrder);
    writeDb(db);

    return res.json({
      success: true,
      message: 'Order placed successfully',
      order: enrichedOrder
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during checkout' });
  }
};

router.post('/checkout', authMiddleware, handleCheckout);
router.post('/', authMiddleware, handleCheckout);

// 2. GET /mine & /my: Consumer order history (Swiggy/Zomato Real-time sync)
const handleFetchMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    const localUserOrders = (db.orders || []).filter((o: any) => o.consumer_id === req.user!.id);

    const productIds = new Set<string>();
    for (const order of localUserOrders) {
      for (const item of order.order_items || []) {
        if (item.product_id) productIds.add(item.product_id);
      }
    }

    let catalogMap = new Map<string, { name: string; image_url: string; unit: string }>();
    if (productIds.size > 0) {
      const { data: catalogProducts } = await supabase
        .from('products')
        .select('id, name, image_url, unit')
        .in('id', Array.from(productIds));
      for (const p of catalogProducts || []) {
        catalogMap.set(p.id, {
          name: p.name,
          image_url: p.image_url || '',
          unit: p.unit || '1 unit',
        });
      }
    }

    const enrichLocalOrderItems = (order: any) => {
      order.order_items = (order.order_items || []).map((it: any) => {
        const catalog = catalogMap.get(it.product_id);
        if (!catalog) return it;
        return {
          ...it,
          product_name:
            !it.product_name || it.product_name === 'Grocery Item'
              ? catalog.name
              : it.product_name,
          image_url: it.image_url || catalog.image_url || '',
          unit: it.unit || catalog.unit || '1 unit',
        };
      });
      return order;
    };

    for (let i = 0; i < localUserOrders.length; i++) {
      localUserOrders[i] = enrichLocalOrderItems(localUserOrders[i]);
    }

    // Also fetch from Supabase
    const { data: supaOrders } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        delivery_address,
        created_at,
        order_items (
          id,
          quantity,
          unit_price,
          products (
            name,
            image_url,
            unit
          )
        )
      `)
      .eq('consumer_id', req.user!.id)
      .order('created_at', { ascending: false });

    // Merge and format
    const mergedMap = new Map();
    for (const lo of localUserOrders) {
      mergedMap.set(lo.id, lo);
    }

    for (const so of supaOrders || []) {
      if (!mergedMap.has(so.id)) {
        mergedMap.set(so.id, {
          id: so.id,
          status: so.status,
          total_amount: so.total_amount,
          shipping_address: so.delivery_address,
          delivery_slot: 'Today, 7:00 AM - 10:00 AM',
          delivery_otp: '4819',
          created_at: so.created_at,
          order_items: (so.order_items || []).map((oi: any) => ({
            product_name: oi.products?.name || 'Grocery Item',
            unit_price: oi.unit_price,
            quantity: oi.quantity,
            unit: oi.products?.unit || '1 unit',
            image_url: oi.products?.image_url || '',
          }))
        });
      }
    }

    const finalOrders = Array.from(mergedMap.values());
    return res.json({ success: true, orders: finalOrders });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

router.get('/mine', authMiddleware, handleFetchMyOrders);
router.get('/my', authMiddleware, handleFetchMyOrders);

// GET /:order_id — Single order confirmation / detail (consumer)
router.get('/:order_id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { order_id } = req.params;

  try {
    const { readDb } = require('../config/localDb');
    const db = readDb() as any;
    const localOrder = (db.orders || []).find(
      (o: any) => o.id === order_id || o.display_id === order_id
    );

    if (localOrder) {
      if (localOrder.consumer_id !== req.user!.id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      return res.json({
        success: true,
        order: {
          ...localOrder,
          payment_method_label: localOrder.payment_method_label ||
            formatPaymentMethodLabel(localOrder.payment_method),
          total_savings: localOrder.total_savings ??
            ((localOrder.product_savings || 0) + (localOrder.discount_amount || 0)),
        },
      });
    }

    const { data: supaOrder, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        delivery_address,
        created_at,
        consumer_id
      `)
      .eq('id', order_id)
      .maybeSingle();

    if (error || !supaOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (supaOrder.consumer_id !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({
      success: true,
      order: {
        id: supaOrder.id,
        display_id: `MG${String(supaOrder.id).replace(/-/g, '').slice(-5).toUpperCase()}`,
        total_amount: supaOrder.total_amount,
        shipping_address: supaOrder.delivery_address,
        deliver_to_label: supaOrder.delivery_address,
        delivery_slot: 'Scheduled delivery',
        payment_method: 'COD',
        payment_method_label: 'Cash on Delivery',
        status: supaOrder.status,
        created_at: supaOrder.created_at,
        product_savings: 0,
        discount_amount: 0,
        total_savings: 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3. GET /merchant/all: Merchant incoming orders list
router.get('/merchant/all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    const orders = db.orders || [];
    return res.json({ success: true, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 4. POST /:order_id/status: Merchant update order status (Swiggy/Zomato Operational Pipeline)
router.post('/:order_id/status', authMiddleware, async (req: AuthRequest, res) => {
  const { order_id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid order status value' });
  }

  try {
    // 1. Update in localDb
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb();
    if (!db.orders) db.orders = [];

    const orderIdx = db.orders.findIndex((o: any) => o.id === order_id);
    if (orderIdx !== -1) {
      db.orders[orderIdx].status = status;
      writeDb(db);
    }

    // 2. Update in Supabase
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', order_id);

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: orderIdx !== -1 ? db.orders[orderIdx] : { id: order_id, status }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 5. GET /platform/all: Retrieve all orders platform-wide (Super Admin)
router.get('/platform/all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    return res.json({ success: true, orders: db.orders || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
