import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// 1. POST /checkout and POST /: Create a new order (Checkout Flow)
const handleCheckout = async (req: AuthRequest, res: Response) => {
  const {
    shop_id,
    items,
    total_amount,
    shipping_address,
    delivery_address,
    delivery_slot,
    payment_method,
    coupon_code,
    discount_amount
  } = req.body;

  const finalAddress = shipping_address || delivery_address || 'Pune, Maharashtra';

  if (!items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({ success: false, error: 'Incomplete order checkout details' });
  }

  try {
    // 1. Resolve Shop ID (fallback to first active shop if not specified)
    let targetShopId = shop_id;
    if (!targetShopId) {
      const { data: defaultShop } = await supabase.from('shops').select('id').limit(1).maybeSingle();
      targetShopId = defaultShop?.id || 'e183b9e2-463d-4d9c-80b2-d2d2b05b7591';
    }

    // 2. Generate random 4-digit Delivery OTP (Swiggy/Zomato style)
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Insert order into Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        consumer_id: req.user!.id,
        shop_id: targetShopId,
        total_amount: parseFloat(total_amount),
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

    // 6. Save in localDb as well for instant merchant/delivery synchronization
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb();
    if (!db.orders) db.orders = [];

    const enrichedOrder = {
      id: order.id,
      consumer_id: req.user!.id,
      consumer_name: req.user!.mobile || 'Customer',
      shop_id: targetShopId,
      total_amount: parseFloat(total_amount),
      discount_amount: parseFloat(discount_amount) || 0,
      coupon_code: coupon_code || null,
      shipping_address: finalAddress,
      delivery_slot: delivery_slot || 'Tomorrow Morning',
      delivery_otp: deliveryOtp,
      payment_method: payment_method || 'UPI',
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
