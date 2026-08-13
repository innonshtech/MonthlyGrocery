import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// 1. POST /: Create a new order (Checkout)
router.post('/', authMiddleware, requireRole(['consumer']), async (req: AuthRequest, res) => {
  const { shop_id, items, total_amount, delivery_address } = req.body;

  if (!shop_id || !items || !Array.isArray(items) || items.length === 0 || !total_amount || !delivery_address) {
    return res.status(400).json({ success: false, error: 'Incomplete order checkout details' });
  }

  try {
    // 1. Insert order metadata into orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        consumer_id: req.user!.id,
        shop_id,
        total_amount: parseFloat(total_amount),
        delivery_address,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      return res.status(500).json({ success: false, error: orderError?.message || 'Failed to place order' });
    }

    // 2. Prepare order items with unit prices
    const orderItems = items.map((it: any) => ({
      order_id: order.id,
      product_id: it.product_id,
      quantity: parseInt(it.quantity) || 1,
      unit_price: parseFloat(it.price) || 0.00,
    }));

    // 3. Insert items in bulk
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Cleanup order metadata if items insert fails (manual rollback)
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ success: false, error: itemsError.message });
    }

    return res.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during checkout' });
  }
});

// 2. GET /mine: Consumer order history (includes items & product names)
router.get('/mine', authMiddleware, requireRole(['consumer']), async (req: AuthRequest, res) => {
  try {
    const { data: orders, error } = await supabase
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

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, orders: orders || [] });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3. GET /merchant/all: Merchant incoming orders list
router.get('/merchant/all', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    // Fetch the shop owned by this merchant
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not registered.' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        delivery_address,
        created_at,
        profiles (
          name,
          phone
        ),
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
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, orders: orders || [] });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 4. POST /:order_id/status: Merchant update order status
router.post('/:order_id/status', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { order_id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid order status value' });
  }

  try {
    // Fetch shop owned by this merchant
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not registered.' });
    }

    // Update order status if it belongs to this merchant's shop
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order_id)
      .eq('shop_id', shop.id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or access denied.' });
    }

    return res.json({ success: true, message: 'Order status updated successfully', order });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 5. GET /platform/all: Retrieve all orders platform-wide (Super Admin only)
router.get('/platform/all', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        delivery_address,
        created_at,
        shop_id,
        shops (
          shop_name
        ),
        profiles (
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, orders: orders || [] });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
