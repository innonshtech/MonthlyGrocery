import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import {
  enrichConsumerOrder,
  applyStatusTimestamps,
  canConsumerCancelOrder,
  buildDefaultRefundMessage,
  sanitizeOrderAddress,
  normalizeMerchantOrderStatus,
  resolveMerchantOrderStatus,
  MERCHANT_ORDER_STATUSES,
} from '../utils/orderEnrichment';
import { resolveShopIdForLocation } from '../services/shopResolution';

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

async function fetchCatalogMap(productIds: string[]) {
  const catalogMap = new Map<string, { name: string; image_url: string; unit: string }>();
  if (!productIds.length) return catalogMap;

  const { data: catalogProducts } = await supabase
    .from('products')
    .select('id, name, image_url, unit')
    .in('id', productIds);

  for (const p of catalogProducts || []) {
    catalogMap.set(p.id, {
      name: p.name,
      image_url: p.image_url || '',
      unit: p.unit || '1 unit',
    });
  }
  return catalogMap;
}

function enrichOrderItems(order: any, catalogMap: Map<string, { name: string; image_url: string; unit: string }>) {
  order.order_items = (order.order_items || []).map((it: any) => {
    const catalog = catalogMap.get(it.product_id);
    const catalogName = catalog?.name?.trim();
    const itemName = (it.product_name || it.name || '').trim();
    const resolvedName =
      catalogName ||
      (itemName && itemName.toLowerCase() !== 'grocery item' ? itemName : '');
    return {
      ...it,
      product_name: resolvedName,
      name: resolvedName,
      image_url: it.image_url || catalog?.image_url || '',
      unit: it.unit || catalog?.unit || '1 unit',
    };
  });
  return order;
}

async function enrichOrderFromSupabaseItems(order: any) {
  const productIds = (order.order_items || [])
    .map((it: any) => it.product_id)
    .filter(Boolean);
  const catalogMap = await fetchCatalogMap(productIds);
  return enrichOrderItems(order, catalogMap);
}

function mapOrderItemsForMerchant(items: any[] = []) {
  return items.map((it: any) => {
    const name = it.products?.name || it.product_name || it.name || 'Item';
    const unit = it.products?.unit || it.unit || '1 unit';
    const imageUrl = it.products?.image_url || it.image_url || '';
    return {
      ...it,
      product_name: name,
      name,
      unit,
      image_url: imageUrl,
      products: it.products || { name, unit, image_url: imageUrl },
    };
  });
}

function resolveConsumerProfile(order: any, profile?: { name?: string; phone?: string; mobile?: string } | null) {
  const rawName = String(order.consumer_name || '').trim();
  const looksLikePhone = /^\d{10,15}$/.test(rawName.replace(/[^\d]/g, ''));

  if (profile) {
    return {
      name: profile.name || (looksLikePhone ? 'Customer' : rawName) || 'Customer',
      phone: profile.phone || profile.mobile || (looksLikePhone ? rawName : null),
    };
  }

  return {
    name: looksLikePhone ? 'Customer' : rawName || 'Customer',
    phone: looksLikePhone ? rawName : null,
  };
}

async function enrichMerchantOrder(order: any, profileMap: Map<string, any>) {
  const profile = profileMap.get(order.consumer_id);
  const normalizedStatus = normalizeMerchantOrderStatus(order.status);
  const deliveryAddress = sanitizeOrderAddress(
    order.delivery_address || order.shipping_address || order.deliver_to_label,
  );

  return enrichConsumerOrder({
    ...order,
    status: normalizedStatus,
    delivery_address: deliveryAddress,
    shipping_address: deliveryAddress,
    profiles: resolveConsumerProfile(order, profile),
    order_items: mapOrderItemsForMerchant(order.order_items),
  });
}

// 1. POST /checkout and POST /: Create a new order (Checkout Flow)
const handleCheckout = async (req: AuthRequest, res: Response) => {
  const {
    shop_id,
    city,
    area_name,
    pincode,
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

  const finalAddress = sanitizeOrderAddress(shipping_address || delivery_address);

  if (!items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({ success: false, error: 'Incomplete order checkout details' });
  }

  if (!city?.trim() || !area_name?.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Delivery city and area are required for checkout.',
      code: 'LOCATION_REQUIRED',
    });
  }

  if (!finalAddress) {
    return res.status(400).json({ success: false, error: 'Delivery address is required' });
  }

  if (!delivery_slot?.trim()) {
    return res.status(400).json({ success: false, error: 'Delivery slot is required' });
  }

  const deliverLabel = sanitizeOrderAddress(deliver_to_label) || finalAddress;

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

    const itemShopIds = items
      .map((it: any) => it.shop_id)
      .filter(Boolean);
    const cartShopId = itemShopIds[0] || shop_id || null;

    let targetShopId = resolveShopIdForLocation({
      shopId: cartShopId,
      city,
      areaName: area_name,
      pincode,
    });

    let targetShop: any = null;
    if (targetShopId) {
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name, status')
        .eq('id', targetShopId)
        .maybeSingle();
      if (data && data.status === 'approved') {
        targetShop = data;
      }
    }

    if (!targetShop) {
      // Dynamic fallback to any active/approved store in Supabase
      const { data: firstShop } = await supabase
        .from('shops')
        .select('id, shop_name, status')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (firstShop) {
        targetShop = firstShop;
        targetShopId = firstShop.id;
      }
    }

    if (!targetShop) {
      return res.status(400).json({
        success: false,
        error: 'No active store is available to fulfill this order. Please register a store in Superadmin.',
        code: 'SHOP_NOT_FOUND',
      });
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
        status: 'pending',
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

    const productIds = items.map((it: any) => it.product_id || it.id).filter(Boolean);
    const catalogMap = await fetchCatalogMap(productIds);

    const mappedOrderItems = items.map((it: any) => {
      const productId = it.product_id || it.id;
      const catalog = catalogMap.get(productId);
      const itemName = (it.name || it.product_name || '').trim();
      const productName =
        catalog?.name?.trim() ||
        (itemName && itemName.toLowerCase() !== 'grocery item' ? itemName : '') ||
        '';
      return {
        product_id: productId,
        product_name: productName,
        name: productName,
        quantity: parseInt(it.quantity) || 1,
        unit_price: parseFloat(it.price || it.unit_price) || 0.00,
        unit: it.unit || catalog?.unit || '1 unit',
        image_url: it.image_url || catalog?.image_url || '',
      };
    });

    const enrichedOrder = {
      id: order.id,
      display_id: displayId,
      consumer_id: req.user!.id,
      consumer_name: req.user!.mobile || 'Customer',
      shop_id: targetShopId,
      shop_name: targetShop.shop_name || null,
      total_amount: finalPayableAmount,
      discount_amount: validatedDiscount,
      product_savings: validatedProductSavings,
      total_savings: validatedProductSavings + validatedDiscount,
      coupon_code: coupon_code || null,
      shipping_address: finalAddress,
      deliver_to_label: deliverLabel,
      delivery_slot: delivery_slot.trim(),
      delivery_slot_date: delivery_slot_date || null,
      delivery_slot_window_id: delivery_slot_window_id || null,
      delivery_otp: deliveryOtp,
      payment_method: payment_method || 'COD',
      payment_method_label: formatPaymentMethodLabel(payment_method || 'COD'),
      status: 'pending',
      created_at: new Date().toISOString(),
      order_items: mappedOrderItems,
    };

    db.orders.unshift(enrichedOrder);
    writeDb(db);

    return res.json({
      success: true,
      message: `Order placed successfully with ${targetShop.shop_name || 'your area store'}`,
      order: enrichConsumerOrder(enrichedOrder),
      shop_id: targetShopId,
      shop_name: targetShop.shop_name || null,
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

    const catalogMap = await fetchCatalogMap(Array.from(productIds));

    const enrichedLocal = localUserOrders.map((order: any) =>
      enrichConsumerOrder(enrichOrderItems({ ...order }, catalogMap)),
    );

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
          product_id,
          products (
            name,
            image_url,
            unit
          )
        )
      `)
      .eq('consumer_id', req.user!.id)
      .order('created_at', { ascending: false });

    const mergedMap = new Map<string, any>();
    for (const lo of enrichedLocal) {
      mergedMap.set(lo.id, lo);
    }

    for (const so of supaOrders || []) {
      if (!mergedMap.has(so.id)) {
        const mappedItems = (so.order_items || []).map((oi: any) => ({
          product_id: oi.product_id,
          product_name: oi.products?.name || '',
          name: oi.products?.name || '',
          unit_price: oi.unit_price,
          quantity: oi.quantity,
          unit: oi.products?.unit || '1 unit',
          image_url: oi.products?.image_url || '',
        }));

        const supaOrder = enrichConsumerOrder(
          await enrichOrderFromSupabaseItems({
            id: so.id,
            status: so.status,
            total_amount: so.total_amount,
            shipping_address: so.delivery_address,
            deliver_to_label: so.delivery_address,
            delivery_slot: null,
            delivery_otp: null,
            payment_method: null,
            payment_method_label: null,
            product_savings: 0,
            discount_amount: 0,
            created_at: so.created_at,
            confirmed_at: so.created_at,
            order_items: mappedItems,
          }),
        );
        mergedMap.set(so.id, supaOrder);
      }
    }

    const finalOrders = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return res.json({ success: true, orders: finalOrders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

router.get('/mine', authMiddleware, handleFetchMyOrders);
router.get('/my', authMiddleware, handleFetchMyOrders);

router.get('/monthly-hub-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb() as any;
    const consumerId = req.user!.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const localOrders = (db.orders || [])
      .filter((o: any) => o.consumer_id === consumerId)
      .map((o: any) => enrichConsumerOrder(o));

    let supaOrders: any[] = [];
    const { data: supaData } = await supabase
      .from('orders')
      .select('id, total_amount, discount_amount, status, created_at, order_items(quantity, unit_price)')
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });

    if (supaData?.length) {
      supaOrders = supaData.map((o: any) =>
        enrichConsumerOrder({
          ...o,
          order_items: o.order_items || [],
        }),
      );
    }

    const mergedMap = new Map<string, any>();
    for (const o of localOrders) mergedMap.set(o.id, o);
    for (const o of supaOrders) {
      if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
    }

    const orders = Array.from(mergedMap.values())
      .filter((o) => (o.status || '').toLowerCase() !== 'cancelled')
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    const savedThisMonth = orders
      .filter((o) => new Date(o.created_at) >= monthStart)
      .reduce((sum, o) => sum + (Number(o.total_savings) || 0), 0);

    const lastOrder = orders[0];
    let lastOrderItemCount = 0;
    let lastOrderMonth = '';
    if (lastOrder) {
      lastOrderItemCount =
        Number(lastOrder.item_count) ||
        (lastOrder.order_items || []).reduce(
          (sum: number, it: any) => sum + (parseInt(String(it.quantity), 10) || 1),
          0,
        );
      lastOrderMonth = new Date(lastOrder.created_at).toLocaleDateString('en-IN', { month: 'long' });
    }

    return res.json({
      success: true,
      summary: {
        saved_this_month: Math.round(savedThisMonth),
        last_order_item_count: lastOrderItemCount,
        last_order_month: lastOrderMonth,
        has_last_order: Boolean(lastOrder),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// POST /:order_id/cancel — Consumer cancel before packing
router.post('/:order_id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { order_id } = req.params;

  try {
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;
    if (!db.orders) db.orders = [];

    const orderIdx = db.orders.findIndex(
      (o: any) => o.id === order_id || o.display_id === order_id,
    );

    if (orderIdx === -1) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = db.orders[orderIdx];
    if (order.consumer_id !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (!canConsumerCancelOrder(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'This order can no longer be cancelled because packing has started.',
      });
    }

    order.status = 'cancelled';
    order.cancelled_by = 'consumer';
    applyStatusTimestamps(order, 'cancelled');
    order.refund_message = buildDefaultRefundMessage(order);
    db.orders[orderIdx] = order;
    writeDb(db);

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);

    const enriched = enrichConsumerOrder(
      await enrichOrderFromSupabaseItems({ ...order }),
    );
    return res.json({ success: true, order: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// POST /reconcile-basket — Live catalog prices for saved basket items
router.post('/reconcile-basket', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reconcileBasketItems } = require('../services/reconcileBasket');
    const city = String(req.body?.city || req.query.city || '').trim();
    const area = String(req.body?.area_name || req.body?.area || req.query.area_name || '').trim();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    const reconciled = await reconcileBasketItems(items, city || undefined, area || undefined);

    return res.json({ success: true, items: reconciled });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// GET /copy-last-month — Reconcile most recent order with live catalog
router.get('/copy-last-month', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { readDb } = require('../config/localDb');
    const { buildCopyLastMonth } = require('../services/copyLastMonth');
    const db = readDb() as any;
    const screen = db.copy_last_month_screen || {};
    const city = String(req.query.city || '').trim();
    const area = String(req.query.area_name || req.query.area || '').trim();
    const pincode = String(req.query.pincode || '').trim();

    const basket = await buildCopyLastMonth(
      req.user!.id,
      city || undefined,
      area || undefined,
      {
        changes_all_good_message: screen.changes_all_good_message || '',
        changes_both_template: screen.changes_both_template || '',
        changes_repriced_only_template: screen.changes_repriced_only_template || '',
        changes_unavailable_only_template: screen.changes_unavailable_only_template || '',
      },
      pincode || undefined,
    );

    return res.json({ success: true, basket });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// GET /one-click-cart — Smart monthly basket from order history
router.get('/one-click-cart', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { readDb } = require('../config/localDb');
    const { buildOneClickCart } = require('../services/oneClickCart');
    const db = readDb() as any;
    const screen = db.one_click_cart_screen || {};
    const city = String(req.query.city || '').trim();
    const area = String(req.query.area_name || req.query.area || '').trim();
    const pincode = String(req.query.pincode || '').trim();

    const basket = await buildOneClickCart(
      req.user!.id,
      city || undefined,
      area || undefined,
      screen.section_label_overrides || {},
      Number(screen.source_months) || 3,
      pincode || undefined,
    );

    return res.json({ success: true, basket });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// GET /:order_id — Single order confirmation / detail (consumer)
router.get('/:order_id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { order_id } = req.params;

  try {
    const { readDb } = require('../config/localDb');
    const db = readDb() as any;
    const normalizedLookup = String(order_id).replace(/^#/, '');
    const localOrder = (db.orders || []).find(
      (o: any) =>
        o.id === order_id ||
        o.display_id === order_id ||
        String(o.display_id || '').replace(/^#/, '') === normalizedLookup,
    );

    if (localOrder) {
      if (localOrder.consumer_id !== req.user!.id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const enriched = enrichConsumerOrder(
        await enrichOrderFromSupabaseItems({ ...localOrder }),
      );
      return res.json({ success: true, order: enriched });
    }

    const { data: supaOrder, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        delivery_address,
        created_at,
        consumer_id,
        order_items (
          id,
          quantity,
          unit_price,
          product_id,
          products (
            name,
            image_url,
            unit
          )
        )
      `)
      .eq('id', order_id)
      .maybeSingle();

    if (error || !supaOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (supaOrder.consumer_id !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const mappedItems = (supaOrder.order_items || []).map((oi: any) => ({
      product_id: oi.product_id,
      product_name: oi.products?.name || '',
      name: oi.products?.name || '',
      unit_price: oi.unit_price,
      quantity: oi.quantity,
      unit: oi.products?.unit || '1 unit',
      image_url: oi.products?.image_url || '',
    }));

    const localShadow = (db.orders || []).find(
      (o: any) => o.id === order_id || o.display_id === order_id,
    );

    const enriched = enrichConsumerOrder(
      await enrichOrderFromSupabaseItems({
        id: supaOrder.id,
        display_id: localShadow?.display_id,
        total_amount: supaOrder.total_amount,
        shipping_address: localShadow?.shipping_address || supaOrder.delivery_address,
        deliver_to_label: localShadow?.deliver_to_label || supaOrder.delivery_address,
        delivery_slot: localShadow?.delivery_slot || null,
        delivery_otp: localShadow?.delivery_otp || null,
        payment_method: localShadow?.payment_method || 'COD',
        payment_method_label: localShadow?.payment_method_label || null,
        status: localShadow?.status || supaOrder.status,
        created_at: supaOrder.created_at,
        confirmed_at: localShadow?.confirmed_at || supaOrder.created_at,
        product_savings: localShadow?.product_savings || 0,
        discount_amount: localShadow?.discount_amount || 0,
        coupon_code: localShadow?.coupon_code || null,
        order_items: localShadow?.order_items?.length ? localShadow.order_items : mappedItems,
      }),
    );

    return res.json({ success: true, order: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3. GET /merchant/all: Merchant incoming orders list (scoped to merchant shop)
router.get('/merchant/all', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, shop_name')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const localOrders = (db.orders || []).filter((o: any) => o.shop_id === shop.id);

    const mergedMap = new Map<string, any>();
    for (const o of localOrders) {
      mergedMap.set(o.id, o);
    }

    const { data: supaData, error: supaError } = await supabase
      .from('orders')
      .select(`
        id,
        consumer_id,
        shop_id,
        total_amount,
        status,
        delivery_address,
        created_at,
        order_items (
          id,
          product_id,
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

    if (supaError) {
      return res.status(500).json({ success: false, error: supaError.message });
    }

    for (const so of supaData || []) {
      if (mergedMap.has(so.id)) continue;

      const mappedItems = (so.order_items || []).map((oi: any) => ({
        product_id: oi.product_id,
        product_name: oi.products?.name || '',
        name: oi.products?.name || '',
        quantity: oi.quantity,
        unit_price: oi.unit_price,
        unit: oi.products?.unit || '1 unit',
        image_url: oi.products?.image_url || '',
        products: oi.products || null,
      }));

      mergedMap.set(so.id, {
        id: so.id,
        consumer_id: so.consumer_id,
        shop_id: so.shop_id,
        status: so.status,
        total_amount: so.total_amount,
        delivery_address: so.delivery_address,
        shipping_address: so.delivery_address,
        created_at: so.created_at,
        order_items: mappedItems,
      });
    }

    const consumerIds = Array.from(
      new Set(
        Array.from(mergedMap.values())
          .map((o: any) => o.consumer_id)
          .filter(Boolean),
      ),
    );

    const productIds = Array.from(
      new Set(
        Array.from(mergedMap.values()).flatMap((o: any) =>
          (o.order_items || []).map((it: any) => it.product_id).filter(Boolean),
        ),
      ),
    );
    const catalogMap = await fetchCatalogMap(productIds);

    for (const [orderId, order] of mergedMap.entries()) {
      mergedMap.set(orderId, enrichOrderItems(order, catalogMap));
    }

    const profileMap = new Map<string, any>();
    if (consumerIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, phone, mobile')
        .in('id', consumerIds);

      for (const profile of profiles || []) {
        profileMap.set(profile.id, profile);
      }
    }

    const finalOrders = await Promise.all(
      Array.from(mergedMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((order) => enrichMerchantOrder(order, profileMap)),
    );

    return res.json({ success: true, shop_name: shop.shop_name, orders: finalOrders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 4. POST /:order_id/status: Merchant update order status (Swiggy/Zomato Operational Pipeline)
router.post('/:order_id/status', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { order_id } = req.params;
  const { status, delivery_partner_name, refund_message } = req.body;

  const normalizedStatus = resolveMerchantOrderStatus(status);
  if (!normalizedStatus) {
    return res.status(400).json({
      success: false,
      error: `Invalid order status. Allowed values: ${MERCHANT_ORDER_STATUSES.join(', ')}`,
    });
  }

  try {
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb();
    if (!db.orders) db.orders = [];

    const orderIdx = db.orders.findIndex((o: any) => o.id === order_id);
    if (orderIdx !== -1 && db.orders[orderIdx].shop_id !== shop.id) {
      return res.status(403).json({ success: false, error: 'You can only update orders for your shop' });
    }

    const { data: supaOrder } = await supabase
      .from('orders')
      .select('id, shop_id')
      .eq('id', order_id)
      .maybeSingle();

    if (supaOrder && supaOrder.shop_id !== shop.id) {
      return res.status(403).json({ success: false, error: 'You can only update orders for your shop' });
    }

    if (orderIdx !== -1) {
      db.orders[orderIdx].status = normalizedStatus;
      applyStatusTimestamps(db.orders[orderIdx], normalizedStatus);
      if (delivery_partner_name) {
        db.orders[orderIdx].delivery_partner_name = delivery_partner_name;
      }
      if (normalizedStatus === 'cancelled') {
        if (!db.orders[orderIdx].cancelled_by) {
          db.orders[orderIdx].cancelled_by = 'support';
        }
        db.orders[orderIdx].refund_message = buildDefaultRefundMessage(db.orders[orderIdx]);
      } else if (refund_message) {
        db.orders[orderIdx].refund_message = refund_message;
      }
      writeDb(db);
    }

    await supabase
      .from('orders')
      .update({ status: normalizedStatus })
      .eq('id', order_id);

    return res.json({
      success: true,
      message: `Order status updated to ${normalizedStatus}`,
      order: orderIdx !== -1 ? enrichConsumerOrder(db.orders[orderIdx]) : { id: order_id, status: normalizedStatus },
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
