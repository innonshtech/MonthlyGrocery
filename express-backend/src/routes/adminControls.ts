import { Router } from 'express';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { readDb, writeDb, ServiceableLocation, PromotionalBanner, FranchiseRequest, ShopProduct, AreaNotifyRequest } from '../config/localDb';
import { supabase } from '../config/supabase';
import { packUnitPayloadFromInput, resolvePackUnitLabel } from '../utils/packUnit';

const router = Router();

// GET /onboarding: Public onboarding copy & slide config (Figma redesign flow)
router.get('/onboarding', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.onboarding) {
      return res.status(503).json({ success: false, error: 'Onboarding content not configured' });
    }
    return res.json({ success: true, onboarding: db.onboarding });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /home: Public home screen copy (B1 Blinkit-style redesign)
router.get('/home', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.home_screen) {
      return res.status(503).json({ success: false, error: 'Home screen content not configured' });
    }
    return res.json({ success: true, home: db.home_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /home: Update home screen copy (Super Admin only)
router.post('/home', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.home_screen) {
      return res.status(503).json({ success: false, error: 'Home screen content not configured' });
    }
    const allowedKeys = [
      'delivering_label', 'location_prefix', 'choose_location_label', 'delivery_pill_text',
      'search_placeholder', 'mmg_label', 'mmg_title', 'mmg_subtitle',
      'categories_title', 'categories_see_all', 'deals_title', 'deals_see_all',
      'loading_deals_label', 'empty_deals_label', 'reorder_title', 'reorder_subtitle_template',
      'reorder_cta_label', 'first_basket_title', 'first_basket_subtitle', 'first_basket_cta_label',
      'load_error_message', 'retry_label', 'location_required_deals_label',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid home screen fields provided' });
    }

    db.home_screen = { ...db.home_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, home: db.home_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /search-screen: Public B2 search screen copy
router.get('/search-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.search_screen) {
      return res.status(503).json({ success: false, error: 'Search screen content not configured' });
    }
    return res.json({ success: true, search: db.search_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /search-screen: Update search screen copy (Super Admin only)
router.post('/search-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.search_screen) {
      return res.status(503).json({ success: false, error: 'Search screen content not configured' });
    }
    const allowedKeys = [
      'search_placeholder', 'popular_searches_label', 'products_section_label',
      'empty_title_template', 'empty_subtitle', 'location_required_message',
      'choose_location_label', 'load_error_message', 'retry_label',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid search screen fields provided' });
    }

    db.search_screen = { ...db.search_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, search: db.search_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /categories-screen: Public B3 categories screen copy
router.get('/categories-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.categories_screen) {
      return res.status(503).json({ success: false, error: 'Categories screen content not configured' });
    }
    return res.json({ success: true, categories: db.categories_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /categories-screen: Update categories screen copy (Super Admin only)
router.post('/categories-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.categories_screen) {
      return res.status(503).json({ success: false, error: 'Categories screen content not configured' });
    }
    const allowedKeys = [
      'title', 'search_placeholder', 'section_grocery_label', 'section_snacks_label',
      'section_household_label', 'section_default_label', 'empty_message',
      'load_error_message', 'retry_label',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid categories screen fields provided' });
    }

    db.categories_screen = { ...db.categories_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, categories: db.categories_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /category-products-screen: Public B4 product list copy
router.get('/category-products-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.category_products_screen) {
      return res.status(503).json({ success: false, error: 'Category products screen content not configured' });
    }
    return res.json({ success: true, category_products: db.category_products_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /category-products-screen: Update product list copy (Super Admin only)
router.post('/category-products-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.category_products_screen) {
      return res.status(503).json({ success: false, error: 'Category products screen content not configured' });
    }
    const allowedKeys = [
      'search_placeholder_template', 'items_count_template', 'sort_label', 'sub_category_all_label',
      'empty_message', 'deals_title', 'location_required_message', 'choose_location_label',
      'load_error_message', 'retry_label', 'view_cart_label', 'cart_item_label', 'cart_items_template',
      'add_button_label', 'filter_sheet_title', 'filter_sort_section_label', 'filter_sort_relevance',
      'filter_sort_price_low', 'filter_sort_price_high', 'filter_sort_discount',
      'filter_pack_section_label', 'filter_clear_label', 'filter_apply_label',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid category products screen fields provided' });
    }

    db.category_products_screen = { ...db.category_products_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, category_products: db.category_products_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /product-detail-screen: Public C1 product detail copy
router.get('/product-detail-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.product_detail_screen) {
      return res.status(503).json({ success: false, error: 'Product detail screen content not configured' });
    }
    return res.json({ success: true, product_detail: db.product_detail_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /product-detail-screen: Update product detail copy (Super Admin only)
router.post('/product-detail-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.product_detail_screen) {
      return res.status(503).json({ success: false, error: 'Product detail screen content not configured' });
    }
    const allowedKeys = [
      'delivery_window_label',
      'highlights_section_label',
      'add_to_cart_label',
      'unit_price_suffix_template',
      'not_found_message',
      'location_required_message',
      'choose_location_label',
      'load_error_message',
      'retry_label',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid product detail screen fields provided' });
    }

    db.product_detail_screen = { ...db.product_detail_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, product_detail: db.product_detail_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /cart-screen: Public C2 cart copy
router.get('/cart-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.cart_screen) {
      return res.status(503).json({ success: false, error: 'Cart screen content not configured' });
    }
    return res.json({ success: true, cart: db.cart_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /cart-screen: Update cart copy (Super Admin only)
router.post('/cart-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.cart_screen) {
      return res.status(503).json({ success: false, error: 'Cart screen content not configured' });
    }
    const allowedKeys = [
      'title',
      'cart_item_label',
      'cart_items_template',
      'empty_title',
      'empty_message',
      'start_shopping_label',
      'reorder_last_month_label',
      'save_basket_label',
      'apply_coupon_label',
      'coupon_applied_template',
      'bill_details_title',
      'bill_item_total_label',
      'bill_savings_label',
      'bill_delivery_fee_label',
      'bill_delivery_fee_value',
      'bill_coupon_discount_label',
      'bill_to_pay_label',
      'sticky_to_pay_label',
      'proceed_to_pay_label',
      'below_min_title_template',
      'below_min_footnote_template',
      'savings_banner_template',
      'add_more_checkout_template',
      'min_order_alert_template',
      'empty_preview_image_1',
      'empty_preview_image_2',
      'load_error_message',
      'retry_label',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid cart screen fields provided' });
    }

    db.cart_screen = { ...db.cart_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, cart: db.cart_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /offers-coupons-screen: Public C3 offers & coupons copy
router.get('/offers-coupons-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.offers_coupons_screen) {
      return res.status(503).json({ success: false, error: 'Offers screen content not configured' });
    }
    return res.json({ success: true, offers_coupons: db.offers_coupons_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /offers-coupons-screen: Update offers screen copy (Super Admin only)
router.post('/offers-coupons-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.offers_coupons_screen) {
      return res.status(503).json({ success: false, error: 'Offers screen content not configured' });
    }
    const allowedKeys = [
      'title',
      'manual_code_placeholder',
      'manual_apply_label',
      'available_section_label',
      'expires_template',
      'list_apply_label',
      'empty_message',
      'load_error_message',
      'retry_label',
      'min_order_alert_title',
      'min_order_alert_template',
      'invalid_coupon_alert_title',
      'apply_failed_fallback',
      'connection_error_title',
      'connection_error_message',
      'unlock_offer_template',
      'audience_new_guideline',
      'audience_loyal_guideline',
      'audience_all_guideline',
      'usage_limit_template',
    ] as const;

    const patch: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        patch[key] = String(req.body[key]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid offers screen fields provided' });
    }

    db.offers_coupons_screen = { ...db.offers_coupons_screen, ...patch };
    writeDb(db);
    return res.json({ success: true, offers_coupons: db.offers_coupons_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

function patchScreenConfig(
  db: any,
  key: 'orders_screen' | 'order_tracking_screen' | 'order_detail_screen' | 'monthly_grocery_hub_screen' | 'one_click_cart_screen' | 'copy_last_month_screen' | 'saved_baskets_screen' | 'account_screen' | 'edit_profile_screen' | 'saved_addresses_screen' | 'add_address_screen' | 'my_coupons_screen' | 'help_support_screen' | 'delete_account_screen' | 'system_states_screen',
  responseKey: string,
  allowedKeys: readonly string[],
  body: Record<string, unknown>,
) {
  if (!db[key]) {
    return { error: `${key} content not configured`, status: 503 };
  }
  const patch: Record<string, string> = {};
  for (const field of allowedKeys) {
    if (body[field] !== undefined && body[field] !== null) {
      patch[field] = String(body[field]);
    }
  }
  if (Object.keys(patch).length === 0) {
    return { error: 'No valid fields provided', status: 400 };
  }
  db[key] = { ...db[key], ...patch };
  writeDb(db);
  return { data: db[key], responseKey };
}

router.get('/orders-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.orders_screen) {
      return res.status(503).json({ success: false, error: 'Orders screen content not configured' });
    }
    return res.json({ success: true, orders: db.orders_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/orders-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'orders_screen', 'orders', [
      'title', 'guest_title', 'guest_subtitle', 'guest_cta_label', 'empty_title', 'empty_message',
      'empty_cta_label', 'past_orders_section_label', 'active_arriving_template', 'track_button_label',
      'items_count_template', 'reorder_button_label', 'delivered_status_template', 'delivery_otp_label',
      'status_out_for_delivery',
      'status_confirmed', 'status_packed', 'load_error_message', 'retry_label', 'reorder_success_title',
      'reorder_success_message_template', 'reorder_keep_browsing_label', 'reorder_view_cart_label',
      'reorder_error_message', 'error_alert_title', 'default_product_name',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, orders: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/order-tracking-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.order_tracking_screen) {
      return res.status(503).json({ success: false, error: 'Order tracking screen content not configured' });
    }
    return res.json({ success: true, tracking: db.order_tracking_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/order-tracking-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'order_tracking_screen', 'tracking', [
      'title', 'out_for_delivery_banner', 'arriving_template', 'subtitle', 'delivery_otp_label',
      'delivery_otp_subtitle', 'timeline_confirmed', 'timeline_packed', 'timeline_dispatched',
      'timeline_out_for_delivery', 'timeline_delivered', 'timeline_pending_time', 'timeline_expected_template',
      'delivery_partner_label', 'view_summary_title', 'view_summary_subtitle_template', 'help_title',
      'help_subtitle', 'load_error_message', 'retry_label',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, tracking: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/order-detail-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.order_detail_screen) {
      return res.status(503).json({ success: false, error: 'Order detail screen content not configured' });
    }
    return res.json({ success: true, order_detail: db.order_detail_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/order-detail-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'order_detail_screen', 'order_detail', [
      'title', 'items_section_template', 'items_not_delivered_template', 'qty_template',
      'delivery_details_section_label', 'delivered_to_label', 'delivery_window_label', 'paid_via_label',
      'paid_via_template', 'bill_details_title', 'bill_item_total_label', 'bill_coupon_template',
      'bill_savings_label', 'bill_delivery_fee_label', 'bill_delivery_fee_value', 'bill_total_paid_label',
      'reorder_button_label', 'invoice_label', 'get_help_label', 'status_timeline_section_label',
      'active_arriving_template', 'status_out_for_delivery', 'status_confirmed', 'status_packed',
      'timeline_confirmed',
      'timeline_packed', 'timeline_dispatched', 'timeline_out_for_delivery', 'timeline_delivered',
      'timeline_pending_time', 'timeline_expected_template', 'delivery_otp_label', 'delivery_otp_subtitle',
      'delivery_partner_label', 'delivered_status_label',
      'delivered_on_template', 'cancelled_status_label', 'cancelled_on_template',
      'cancelled_by_you_label', 'cancelled_by_support_label', 'reorder_cancelled_button_label',
      'cancelled_help_label', 'cancel_order_label', 'cancel_order_confirm_title',
      'cancel_order_confirm_message', 'cancel_order_confirm_yes', 'cancel_order_confirm_no',
      'cancel_order_error_message', 'refund_initiated_template',
      'refund_eta_message', 'load_error_message', 'retry_label', 'reorder_success_title',
      'reorder_success_message_template', 'reorder_keep_browsing_label', 'reorder_view_cart_label',
      'reorder_error_message', 'error_alert_title', 'default_product_name',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, order_detail: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/monthly-grocery-hub-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.monthly_grocery_hub_screen) {
      return res.status(503).json({ success: false, error: 'Monthly grocery hub screen content not configured' });
    }
    return res.json({ success: true, monthly_grocery_hub: db.monthly_grocery_hub_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/monthly-grocery-hub-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'monthly_grocery_hub_screen', 'monthly_grocery_hub', [
      'title', 'hero_badge', 'hero_title', 'hero_subtitle', 'hero_savings_template',
      'card_one_click_title', 'card_one_click_subtitle', 'card_copy_title',
      'card_copy_subtitle_template', 'card_copy_empty_subtitle', 'card_saved_title',
      'card_saved_subtitle_template', 'card_saved_empty_subtitle', 'card_build_title',
      'card_build_soon_badge', 'card_build_subtitle', 'load_error_message', 'retry_label',
      'metrics_error_message', 'no_last_order_title', 'no_last_order_message',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, monthly_grocery_hub: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/one-click-cart-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.one_click_cart_screen) {
      return res.status(404).json({ success: false, error: 'One-click cart screen config not found' });
    }
    return res.json({ success: true, one_click_cart: db.one_click_cart_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/one-click-cart-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'one_click_cart_screen', 'one_click_cart', [
      'title', 'generating_title', 'generating_subtitle', 'insight_title_template',
      'insight_subtitle_template', 'items_count_template', 'add_all_label',
      'add_all_success_title', 'add_all_success_message_template', 'keep_browsing_label',
      'view_cart_label', 'empty_title', 'empty_message', 'empty_cta_label',
      'no_location_title', 'no_location_message', 'load_error_message', 'retry_label',
      'unavailable_label', 'source_months', 'section_label_overrides',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, one_click_cart: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/copy-last-month-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.copy_last_month_screen) {
      return res.status(404).json({ success: false, error: 'Copy last month screen config not found' });
    }
    return res.json({ success: true, copy_last_month: db.copy_last_month_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/copy-last-month-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'copy_last_month_screen', 'copy_last_month', [
      'title', 'insight_title_template', 'insight_subtitle_template',
      'changes_all_good_message', 'changes_both_template', 'changes_repriced_only_template',
      'changes_unavailable_only_template', 'available_count_template', 'add_to_cart_label',
      'add_success_title', 'add_success_message_template', 'keep_browsing_label', 'view_cart_label',
      'empty_title', 'empty_message', 'empty_cta_label', 'no_location_title', 'no_location_message',
      'load_error_message', 'retry_label', 'unavailable_label', 'view_similar_label', 'was_price_template',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, copy_last_month: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/saved-baskets-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.saved_baskets_screen) {
      return res.status(404).json({ success: false, error: 'Saved baskets screen config not found' });
    }
    return res.json({ success: true, saved_baskets: db.saved_baskets_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/saved-baskets-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'saved_baskets_screen', 'saved_baskets', [
      'title', 'new_basket_label', 'items_summary_template', 'add_to_cart_label',
      'add_success_title', 'add_success_message_template', 'keep_browsing_label', 'view_cart_label',
      'empty_title', 'empty_message', 'empty_cta_label', 'save_sheet_title', 'save_sheet_subtitle',
      'basket_name_label', 'default_basket_name_template', 'items_will_save_template',
      'save_basket_button_label', 'success_title', 'success_message_template',
      'view_saved_baskets_label', 'done_label', 'empty_cart_title', 'empty_cart_message',
      'no_location_title', 'no_location_message', 'unavailable_skip_message',
      'load_error_message', 'retry_label', 'preview_name_count',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, saved_baskets: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/account-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.account_screen) {
      return res.status(404).json({ success: false, error: 'Account screen config not found' });
    }
    return res.json({ success: true, account: db.account_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/account-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'account_screen', 'account', [
      'title', 'edit_label', 'savings_header', 'savings_since_template',
      'menu_saved_addresses', 'menu_my_coupons', 'menu_help_support', 'menu_about_terms',
      'logout_label', 'guest_title', 'guest_subtitle', 'guest_login_label',
      'guest_delivery_area_label', 'guest_delivery_area_template', 'guest_no_area_label',
      'about_alert_title', 'about_alert_message', 'logout_sheet_title', 'logout_sheet_subtitle',
      'logout_cancel_label', 'logout_confirm_label', 'load_error_message', 'retry_label',
      'metrics_error_message',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, account: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/edit-profile-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.edit_profile_screen) {
      return res.status(404).json({ success: false, error: 'Edit profile screen config not found' });
    }
    return res.json({ success: true, edit_profile: db.edit_profile_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/edit-profile-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'edit_profile_screen', 'edit_profile', [
      'title', 'change_photo_label', 'change_photo_alert_title', 'change_photo_alert_message',
      'full_name_label', 'full_name_placeholder', 'phone_label', 'verified_label',
      'email_label', 'email_placeholder', 'delete_account_label', 'save_button_label',
      'name_required_title', 'name_required_message', 'save_success_title', 'save_success_message',
      'save_error_message', 'load_error_message', 'retry_label',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, edit_profile: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/saved-addresses-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.saved_addresses_screen) {
      return res.status(404).json({ success: false, error: 'Saved addresses screen config not found' });
    }
    return res.json({ success: true, saved_addresses: db.saved_addresses_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/saved-addresses-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'saved_addresses_screen', 'saved_addresses', [
      'title', 'select_title', 'empty_title', 'empty_message', 'add_address_label',
      'deliver_button_label', 'default_badge_label', 'select_alert_title', 'select_alert_message',
      'load_error_message', 'retry_label',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, saved_addresses: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/add-address-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.add_address_screen) {
      return res.status(404).json({ success: false, error: 'Add address screen config not found' });
    }
    return res.json({ success: true, add_address: db.add_address_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/add-address-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'add_address_screen', 'add_address', [
      'add_title', 'edit_title', 'flat_label', 'flat_placeholder', 'street_label', 'street_placeholder',
      'landmark_label', 'landmark_placeholder', 'pincode_label', 'pincode_placeholder',
      'phone_label', 'phone_placeholder', 'save_as_label', 'tag_home_key', 'tag_home_label',
      'tag_work_key', 'tag_work_label', 'tag_other_key', 'tag_other_label', 'default_tag_key',
      'save_button_label', 'saving_button_label', 'login_required_title', 'login_required_message',
      'incomplete_title', 'incomplete_message', 'save_error_title', 'load_error_message', 'retry_label',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, add_address: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/my-coupons-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.my_coupons_screen) {
      return res.status(404).json({ success: false, error: 'My coupons screen config not found' });
    }
    return res.json({ success: true, my_coupons: db.my_coupons_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/my-coupons-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const result = patchScreenConfig(db, 'my_coupons_screen', 'my_coupons', [
      'title', 'banner_title', 'banner_subtitle', 'section_label', 'expires_template',
      'list_copy_label', 'empty_message', 'copy_alert_title', 'copy_alert_message_template',
      'copy_alert_go_cart_label', 'copy_alert_ok_label', 'load_error_message', 'retry_label',
      'audience_new_guideline', 'audience_loyal_guideline', 'audience_all_guideline',
      'usage_limit_template',
    ], req.body);
    if (result.error) return res.status(result.status || 400).json({ success: false, error: result.error });
    return res.json({ success: true, my_coupons: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/help-support-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.help_support_screen) {
      return res.status(404).json({ success: false, error: 'Help support screen config not found' });
    }
    const { enrichHelpSupportScreen } = require('../services/helpSupport');
    const help_support = enrichHelpSupportScreen(db);
    return res.json({ success: true, help_support });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/help-support-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.help_support_screen) {
      return res.status(503).json({ success: false, error: 'Help support screen content not configured' });
    }

    const allowedKeys = [
      'title', 'chat_title', 'chat_subtitle', 'call_title', 'call_subtitle',
      'phone_number', 'whatsapp_phone', 'whatsapp_message',
      'chat_fallback_alert_title', 'chat_fallback_alert_message',
      'call_fallback_alert_title', 'call_fallback_alert_message',
      'call_fallback_message_template', 'faq_section_label',
      'delivery_areas_answer_template', 'load_error_message', 'retry_label',
    ];
    const patch: Record<string, string> = {};
    for (const field of allowedKeys) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        patch[field] = String(req.body[field]);
      }
    }
    if (Object.keys(patch).length > 0) {
      db.help_support_screen = { ...db.help_support_screen, ...patch };
    }
    if (Array.isArray(req.body.faqs)) {
      db.help_support_screen.faqs = req.body.faqs;
    }
    writeDb(db);

    const { enrichHelpSupportScreen } = require('../services/helpSupport');
    return res.json({ success: true, help_support: enrichHelpSupportScreen(db) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/delete-account-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.delete_account_screen) {
      return res.status(404).json({ success: false, error: 'Delete account screen config not found' });
    }
    return res.json({ success: true, delete_account: db.delete_account_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/delete-account-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.delete_account_screen) {
      return res.status(503).json({ success: false, error: 'Delete account screen content not configured' });
    }

    const allowedKeys = [
      'title', 'warning_text', 'section_label', 'active_orders_warning',
      'agreement_label', 'delete_button_label', 'cancel_label',
      'agreement_required_title', 'agreement_required_message',
      'delete_error_message', 'success_title', 'success_subtitle',
      'success_active_orders_note', 'success_back_home_label',
      'load_error_message', 'retry_label',
    ];
    const patch: Record<string, string> = {};
    for (const field of allowedKeys) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        patch[field] = String(req.body[field]);
      }
    }
    if (Object.keys(patch).length > 0) {
      db.delete_account_screen = { ...db.delete_account_screen, ...patch };
    }
    if (Array.isArray(req.body.deleted_items)) {
      db.delete_account_screen.deleted_items = req.body.deleted_items;
    }
    writeDb(db);
    return res.json({ success: true, delete_account: db.delete_account_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/system-states-screen', async (_req, res) => {
  try {
    const db = readDb();
    if (!db.system_states_screen) {
      return res.status(404).json({ success: false, error: 'System states screen config not found' });
    }
    return res.json({ success: true, system_states: db.system_states_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/system-states-screen', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    if (!db.system_states_screen) {
      return res.status(503).json({ success: false, error: 'System states screen content not configured' });
    }

    const mergeVariant = (
      current: Record<string, string>,
      patch: Record<string, unknown> | undefined,
    ) => {
      if (!patch || typeof patch !== 'object') return current;
      const next = { ...current };
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined && value !== null) {
          next[key] = String(value);
        }
      }
      return next;
    };

    if (req.body.offline) {
      db.system_states_screen.offline = mergeVariant(
        db.system_states_screen.offline as any,
        req.body.offline,
      ) as any;
    }
    if (req.body.unserviceable) {
      db.system_states_screen.unserviceable = mergeVariant(
        db.system_states_screen.unserviceable as any,
        req.body.unserviceable,
      ) as any;
    }
    if (req.body.error) {
      db.system_states_screen.error = mergeVariant(
        db.system_states_screen.error as any,
        req.body.error,
      ) as any;
    }
    if (req.body.maintenance) {
      db.system_states_screen.maintenance = mergeVariant(
        db.system_states_screen.maintenance as any,
        req.body.maintenance,
      ) as any;
    }
    if (req.body.load_error_message !== undefined) {
      db.system_states_screen.load_error_message = String(req.body.load_error_message);
    }
    if (req.body.retry_label !== undefined) {
      db.system_states_screen.retry_label = String(req.body.retry_label);
    }

    writeDb(db);
    return res.json({ success: true, system_states: db.system_states_screen });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 1. Serviceable Locations (Geographical Zones)
// ==========================================

// GET /locations: Retrieve all serviceable zones (Public)
router.get('/locations', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /locations: Add or Update a zone (Super Admin only)
router.post('/locations', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id, city, area_name, pincode, is_serviceable, shop_id } = req.body;

  if (!city || !area_name || !pincode) {
    return res.status(400).json({ success: false, error: 'City, Area name, and PIN code are required' });
  }

  try {
    const db = readDb();
    
    if (id) {
      // Update existing
      db.serviceable_locations = db.serviceable_locations.map(loc => 
        loc.id === id ? { ...loc, city, area_name, pincode, is_serviceable: is_serviceable !== false, shop_id: shop_id || null } : loc
      );
    } else {
      // Add new
      const newLoc: ServiceableLocation = {
        id: `loc-${Date.now()}`,
        city,
        area_name,
        pincode,
        is_serviceable: is_serviceable !== false,
        shop_id: shop_id || null
      };
      db.serviceable_locations.push(newLoc);
    }

    writeDb(db);
    return res.json({ success: true, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /locations/:id: Delete a zone (Super Admin only)
router.delete('/locations/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const db = readDb();
    db.serviceable_locations = db.serviceable_locations.filter(loc => loc.id !== id);
    writeDb(db);
    return res.json({ success: true, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// 2. Promotional Banners (Festive campaigns)
// ==========================================

// GET /banners: Retrieve active banners (Public)
router.get('/banners', async (req, res) => {
  try {
    const db = readDb();
    const activeBanners = db.promotional_banners.filter(b => b.active);
    return res.json({ success: true, banners: activeBanners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /banners/all: Retrieve all banners including inactive ones (Super Admin only)
router.get('/banners/all', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, banners: db.promotional_banners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /banners: Add or Update a banner (Super Admin only)
router.post('/banners', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const {
    id,
    title,
    image_url,
    action_link,
    active,
    kind,
    subtitle,
    body,
    cta_text,
  } = req.body;

  const bannerKind = kind === 'promo' ? 'promo' : 'image';

  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  if (bannerKind === 'image' && !image_url) {
    return res.status(400).json({ success: false, error: 'Image URL is required for image banners' });
  }

  try {
    const db = readDb();

    const payload: PromotionalBanner = {
      id: id || `banner-${Date.now()}`,
      title,
      image_url: image_url || '',
      action_link: action_link || '',
      active: active !== false,
      kind: bannerKind,
      subtitle: subtitle || undefined,
      body: body || undefined,
      cta_text: cta_text || undefined,
    };

    if (id) {
      db.promotional_banners = db.promotional_banners.map((b) =>
        b.id === id ? { ...b, ...payload, id } : b
      );
    } else {
      db.promotional_banners.push(payload);
    }

    writeDb(db);
    return res.json({ success: true, banners: db.promotional_banners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /banners/:id: Delete a banner (Super Admin only)
router.delete('/banners/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const db = readDb();
    db.promotional_banners = db.promotional_banners.filter(b => b.id !== id);
    writeDb(db);
    return res.json({ success: true, banners: db.promotional_banners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// 3. Franchise Requests (Partnership Leads)
// ==========================================

// GET /franchise: List all partnership inquiries (Super Admin only)
router.get('/franchise', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, requests: db.franchise_requests });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /franchise: Submit a new inquiry (Public)
router.post('/franchise', async (req, res) => {
  const { name, phone, email, city, message } = req.body;

  if (!name || !phone || !city) {
    return res.status(400).json({ success: false, error: 'Name, phone number, and city are required' });
  }

  try {
    const db = readDb();
    const newReq: FranchiseRequest = {
      id: `req-${Date.now()}`,
      name,
      phone,
      email: email || '',
      city,
      message: message || '',
      created_at: new Date().toISOString()
    };
    db.franchise_requests.push(newReq);
    writeDb(db);
    return res.json({ success: true, message: 'Franchise inquiry submitted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /area-notify: Request notification when area becomes serviceable (Public)
router.post('/area-notify', async (req, res) => {
  const { city, area_name, phone } = req.body;

  if (!city?.trim() || !area_name?.trim()) {
    return res.status(400).json({ success: false, error: 'City and area name are required' });
  }

  try {
    const db = readDb();
    if (!db.area_notify_requests) db.area_notify_requests = [];
    const newReq: AreaNotifyRequest = {
      id: `area-notify-${Date.now()}`,
      city: city.trim(),
      area_name: area_name.trim(),
      phone: phone?.trim() || undefined,
      created_at: new Date().toISOString(),
    };
    db.area_notify_requests.push(newReq);
    writeDb(db);
    return res.json({ success: true, message: 'Notification request saved' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Master Cities & Areas Manager
// ==========================================

// GET /cities: Get all registered cities (Public)
router.get('/cities', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, cities: db.cities || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /cities: Add a new city (Super Admin only)
router.post('/cities', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { name, region } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'City name is required' });
  }

  try {
    const db = readDb();
    // Check if city name already exists (case-insensitive)
    const exists = db.cities.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'City is already registered' });
    }

    const newCity = {
      id: `city-${Date.now()}`,
      name: name.trim(),
      region: region?.trim() || undefined,
    };
    db.cities.push(newCity);
    writeDb(db);
    return res.json({ success: true, cities: db.cities });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /cities/:id: Delete a city and its areas (Super Admin only)
router.delete('/cities/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const city = db.cities.find(c => c.id === id);
    db.cities = db.cities.filter(c => c.id !== id);
    // Cascade delete areas belonging to this city
    db.areas = db.areas.filter(a => a.city_id !== id);
    if (city) {
      const cityKey = city.name.trim().toLowerCase();
      db.serviceable_locations = db.serviceable_locations.filter(
        (loc) => loc.city.trim().toLowerCase() !== cityKey,
      );
    }
    writeDb(db);
    return res.json({ success: true, cities: db.cities });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /areas: Get all areas (Public)
router.get('/areas', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, areas: db.areas || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /areas: Add a new area/locality under a city (Super Admin only)
router.post('/areas', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { city_id, name, pincode, is_serviceable } = req.body;
  if (!city_id || !name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'City ID and Area name are required' });
  }

  try {
    const db = readDb();
    const city = db.cities.find(c => c.id === city_id);
    if (!city) {
      return res.status(400).json({ success: false, error: 'Invalid City ID' });
    }

    // Check if area already exists in this city (case-insensitive)
    const exists = db.areas.some(a => a.city_id === city_id && a.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'Area/locality is already registered under this city' });
    }

    const newArea = {
      id: `area-${Date.now()}`,
      city_id,
      name: name.trim()
    };
    db.areas.push(newArea);

    const areaKey = name.trim().toLowerCase();
    const cityKey = city.name.trim().toLowerCase();
    const existingLoc = db.serviceable_locations.find(
      (loc) =>
        loc.city.trim().toLowerCase() === cityKey &&
        loc.area_name.trim().toLowerCase() === areaKey,
    );
    if (!existingLoc) {
      db.serviceable_locations.push({
        id: `loc-${Date.now()}`,
        city: city.name,
        area_name: name.trim(),
        pincode: pincode?.trim() || '000000',
        is_serviceable: is_serviceable !== false,
        shop_id: null,
      });
    } else {
      existingLoc.is_serviceable = is_serviceable !== false;
      if (pincode?.trim()) existingLoc.pincode = pincode.trim();
    }

    writeDb(db);
    return res.json({ success: true, areas: db.areas, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /areas/:id: Delete an area (Super Admin only)
router.delete('/areas/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const area = db.areas.find(a => a.id === id);
    const city = area ? db.cities.find(c => c.id === area.city_id) : undefined;
    db.areas = db.areas.filter(a => a.id !== id);
    if (area && city) {
      const cityKey = city.name.trim().toLowerCase();
      const areaKey = area.name.trim().toLowerCase();
      db.serviceable_locations = db.serviceable_locations.filter(
        (loc) =>
          loc.city.trim().toLowerCase() !== cityKey ||
          loc.area_name.trim().toLowerCase() !== areaKey,
      );
    }
    writeDb(db);
    return res.json({ success: true, areas: db.areas, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to get merchant's shop_id from Supabase
async function getMerchantShopId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}

// ==========================================
// 5. Merchant SKU Selection & Request Endpoints
// ==========================================

// GET /shop-products: Get list of shop products and their request statuses (Merchant only)
router.get('/shop-products', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }
    const db = readDb();
    const shopProds = db.shop_products.filter(sp => sp.shop_id === shopId);
    
    if (shopProds.length === 0) {
      return res.json({ success: true, shop_products: [] });
    }

    // Fetch product details from Supabase
    const productIds = shopProds.map(sp => sp.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, primary_category, image_url, mrp, unit, quantity_value, quantity_unit, short_description, description')
      .in('id', productIds);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const joined = shopProds.map(sp => {
      const p = products?.find((prod: any) => prod.id === sp.product_id);
      return {
        ...sp,
        name: p?.name || 'Unknown Product',
        sku: p?.sku || '',
        brand: p?.brand || '',
        primary_category: p?.primary_category || '',
        image_url: p?.image_url || '',
        mrp: p?.mrp || 0,
        unit: resolvePackUnitLabel(p || {}) || p?.unit || '',
        quantity_value: p?.quantity_value,
        quantity_unit: p?.quantity_unit,
        short_description: p?.short_description || '',
        description: p?.description || '',
      };
    });

    return res.json({ success: true, shop_products: joined });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-products/request: Merchant requests a Master SKU (Merchant only)
router.post('/shop-products/request', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    // Verify product exists in Supabase Master catalogue
    const { data: masterProduct, error: pError } = await supabase
      .from('products')
      .select('id, price, mrp')
      .eq('id', product_id)
      .maybeSingle();

    if (pError || !masterProduct) {
      return res.status(404).json({ success: false, error: 'Master product not found in central catalogue' });
    }

    const db = readDb();
    
    // Check if already requested or mapped
    const existing = db.shop_products.find(sp => sp.shop_id === shopId && sp.product_id === product_id);
    if (existing) {
      return res.status(400).json({ success: false, error: `SKU already has status: ${existing.status}` });
    }

    const newShopProduct: ShopProduct = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shop_id: shopId,
      product_id: product_id,
      selling_price: parseFloat(masterProduct.price) || 0,
      discount_percentage: Math.max(0, Math.round(((parseFloat(masterProduct.mrp) - parseFloat(masterProduct.price)) / parseFloat(masterProduct.mrp)) * 100)) || 0,
      stock: 0,
      available: false,
      status: 'approved'
    };

    db.shop_products.push(newShopProduct);
    writeDb(db);

    return res.json({ success: true, message: 'SKU added to your shop inventory successfully', shop_product: newShopProduct });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-products/configure: Merchant updates price/stock for approved SKU (Merchant only)
router.post('/shop-products/configure', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { product_id, selling_price, discount_percentage, stock, available } = req.body;
  if (!product_id) {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const db = readDb();
    const spIndex = db.shop_products.findIndex(sp => sp.shop_id === shopId && sp.product_id === product_id);
    
    if (spIndex === -1) {
      return res.status(404).json({ success: false, error: 'Product not mapped or requested yet for your shop' });
    }

    const sp = db.shop_products[spIndex];
    if (sp.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'SKU is pending Super Admin approval. You cannot configure it yet.' });
    }

    // Update values
    if (selling_price !== undefined) sp.selling_price = parseFloat(selling_price) || 0;
    if (discount_percentage !== undefined) sp.discount_percentage = parseInt(discount_percentage) || 0;
    if (stock !== undefined) sp.stock = parseInt(stock) || 0;
    if (available !== undefined) sp.available = !!available;

    db.shop_products[spIndex] = sp;
    writeDb(db);

    return res.json({ success: true, message: 'SKU configuration updated successfully', shop_product: sp });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-products/product-content: Merchant updates catalog text (highlights) and MRP for mapped SKUs
router.post('/shop-products/product-content', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { product_id, short_description, description, mrp } = req.body;
  if (!product_id) {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const db = readDb();
    const mapping = db.shop_products.find(
      (sp) => sp.shop_id === shopId && sp.product_id === product_id && sp.status === 'approved',
    );
    if (!mapping) {
      return res.status(403).json({
        success: false,
        error: 'Product is not approved in your shop inventory. Map the SKU first.',
      });
    }

    const updatePayload: Record<string, unknown> = {};
    if (short_description !== undefined) {
      updatePayload.short_description = String(short_description).trim() || null;
    }
    if (description !== undefined) {
      updatePayload.description = String(description).trim() || null;
    }
    if (mrp !== undefined) {
      const mrpVal = parseFloat(mrp);
      if (!Number.isFinite(mrpVal) || mrpVal <= 0) {
        return res.status(400).json({ success: false, error: 'MRP must be a positive number' });
      }
      updatePayload.mrp = mrpVal;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, error: 'No catalog fields provided to update' });
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product_id)
      .select('id, name, mrp, unit, short_description, description')
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, error: updateError.message });
    }

    return res.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /new-product-requests: Merchant suggests a brand new product to be added to Master Catalogue (Merchant only)
router.post('/new-product-requests', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { name, category, brand, unit, mrp, short_description, description, quantity_value, quantity_unit } = req.body;
  if (!name || !category || !mrp) {
    return res.status(400).json({ success: false, error: 'Name, Category, and MRP are required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const packFields = packUnitPayloadFromInput(quantity_value ?? unit, quantity_unit ?? unit, unit);
    if (!packFields.unit) {
      return res.status(400).json({ success: false, error: 'Valid pack size (quantity + unit type) is required' });
    }

    const db = readDb();
    const newRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      shop_id: shopId,
      name: name.trim(),
      category: category.trim(),
      brand: brand ? brand.trim() : 'Unbranded',
      unit: packFields.unit || String(unit || '').trim(),
      quantity_value: packFields.quantity_value ?? undefined,
      quantity_unit: packFields.quantity_unit ?? undefined,
      mrp: parseFloat(mrp) || 0,
      short_description: short_description ? String(short_description).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };

    db.new_product_requests.push(newRequest);
    writeDb(db);

    return res.json({ success: true, message: 'New product request submitted to Super Admin successfully', request: newRequest });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sku-requests: Super Admin lists all pending SKU creation requests (Super Admin only)
router.get('/sku-requests', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const pendingRequests = db.new_product_requests.filter(req => req.status === 'pending');
    if (pendingRequests.length === 0) {
      return res.json({ success: true, requests: [] });
    }

    // Fetch shop names
    const shopIds = pendingRequests.map(r => r.shop_id);
    const { data: shops, error: sError } = await supabase
      .from('shops')
      .select('id, shop_name')
      .in('id', shopIds);

    if (sError) {
      return res.status(500).json({ success: false, error: sError.message });
    }

    const requestsJoined = pendingRequests.map(r => {
      const s = shops?.find((sh: any) => sh.id === r.shop_id);
      return {
        id: r.id,
        shop_name: s?.shop_name || 'Unknown Shop',
        product_name: r.name,
        category: r.category,
        brand: r.brand || 'Unbranded',
        mrp: r.mrp,
        unit: resolvePackUnitLabel({
          unit: r.unit,
          quantity_value: r.quantity_value,
          quantity_unit: r.quantity_unit,
        }) || r.unit,
        quantity_value: r.quantity_value,
        quantity_unit: r.quantity_unit,
        short_description: r.short_description || '',
        description: r.description || '',
      };
    });

    return res.json({ success: true, requests: requestsJoined });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sku-requests/:id/status: Super Admin Approves / Rejects a pending SKU request (Super Admin only)
router.post('/sku-requests/:id/status', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const db = readDb();
    const reqIndex = db.new_product_requests.findIndex(r => r.id === id);
    
    if (reqIndex === -1) {
      return res.status(404).json({ success: false, error: 'SKU request not found' });
    }

    const request = db.new_product_requests[reqIndex];
    request.status = status;

    if (status === 'approved') {
      // 1. Insert product into Supabase Master Catalogue products table
      const skuCode = `SUGGEST-${Date.now().toString().slice(-6)}`;
      const displayUnit = resolvePackUnitLabel({
        unit: request.unit,
        quantity_value: request.quantity_value,
        quantity_unit: request.quantity_unit,
      }) || request.unit;

      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          shop_id: request.shop_id,
          name: `${request.name.trim()} ${displayUnit}`.trim(),
          sku: skuCode,
          primary_category: request.category,
          brand: request.brand || 'Unbranded',
          mrp: request.mrp,
          price: request.mrp,
          quantity_value: request.quantity_value ?? null,
          quantity_unit: request.quantity_unit ?? null,
          unit: displayUnit,
          short_description: request.short_description || null,
          description: request.description || null,
          available: true,
          is_veg: true
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ success: false, error: `Failed to insert product: ${insertError.message}` });
      }

      // 2. Map this approved product to the merchant shop directly with approved status so they can configure it
      db.shop_products.push({
        id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        shop_id: request.shop_id,
        product_id: product.id,
        selling_price: request.mrp,
        discount_percentage: 0,
        stock: 0,
        available: false,
        status: 'approved'
      });
    }

    writeDb(db);
    return res.json({ success: true, message: `SKU request ${status} successfully` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. Category Management CRUD Endpoints
// ==========================================

// GET /categories: Get list of all master categories (Public)
router.get('/categories', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, categories: db.categories || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /categories: Create a new category (Super Admin only)
router.post('/categories', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { name, image_url } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  try {
    const db = readDb();
    const normalized = name.trim();

    const exists = db.categories.some(c => c.name.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }

    const newCat: { id: string; name: string; image_url?: string } = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: normalized,
    };
    if (image_url && String(image_url).trim()) {
      newCat.image_url = String(image_url).trim();
    }

    db.categories.push(newCat);
    writeDb(db);

    return res.json({ success: true, message: 'Category added successfully', categories: db.categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /categories/:id: Update category name or tile image (Super Admin only)
router.put('/categories/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, image_url } = req.body;

  try {
    const db = readDb();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    if (name !== undefined && name !== null) {
      const normalized = String(name).trim();
      if (!normalized) {
        return res.status(400).json({ success: false, error: 'Category name cannot be empty' });
      }
      const duplicate = db.categories.some(
        (c) => c.id !== id && c.name.toLowerCase() === normalized.toLowerCase(),
      );
      if (duplicate) {
        return res.status(400).json({ success: false, error: 'Another category with this name already exists' });
      }
      db.categories[idx].name = normalized;
    }

    if (image_url !== undefined && image_url !== null) {
      const url = String(image_url).trim();
      if (url) {
        db.categories[idx].image_url = url;
      } else {
        delete db.categories[idx].image_url;
      }
    }

    writeDb(db);
    return res.json({
      success: true,
      message: 'Category updated successfully',
      category: db.categories[idx],
      categories: db.categories,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /categories/:id: Delete a category (Super Admin only)
router.delete('/categories/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const db = readDb();
    const exists = db.categories.some(c => c.id === id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    db.categories = db.categories.filter(c => c.id !== id);
    writeDb(db);

    return res.json({ success: true, message: 'Category deleted successfully', categories: db.categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. Shop Inventory Direct Assignment Endpoints (Super Admin)
// ==========================================

// GET /shop-inventory/:shop_id: Get inventory for a specific shop (Super Admin only)
router.get('/shop-inventory/:shop_id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  try {
    const db = readDb();
    const shopProducts = db.shop_products.filter((sp: any) => sp.shop_id === shop_id);
    
    if (shopProducts.length === 0) {
      return res.json({ success: true, shop_products: [] });
    }

    const productIds = shopProducts.map((sp: any) => sp.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const joined = shopProducts.map((sp: any) => {
      const p = products?.find((prod: any) => prod.id === sp.product_id);
      return {
        ...sp,
        product_name: p?.name || 'Unknown Product',
        sku: p?.sku || 'N/A',
        brand: p?.brand || 'N/A',
        mrp: p?.mrp || 0
      };
    });

    return res.json({ success: true, shop_products: joined });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-inventory/:shop_id/assign: Directly map a product to a shop (Super Admin only)
router.post('/shop-inventory/:shop_id/assign', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  const { product_id, selling_price, discount_percentage, stock } = req.body;

  if (!product_id || selling_price === undefined) {
    return res.status(400).json({ success: false, error: 'Product ID and Selling Price are required' });
  }

  try {
    const db = readDb();
    // Check if already mapped
    const exists = db.shop_products.some((sp: any) => sp.shop_id === shop_id && sp.product_id === product_id);
    if (exists) {
      return res.status(400).json({ success: false, error: 'Product is already assigned to this shop' });
    }

    const newShopProduct = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shop_id,
      product_id,
      selling_price: parseFloat(selling_price) || 0,
      discount_percentage: parseFloat(discount_percentage) || 0,
      stock: parseInt(stock) || 100,
      available: true,
      status: 'approved' as const
    };

    db.shop_products.push(newShopProduct);
    writeDb(db);

    return res.json({ success: true, message: 'Product assigned to shop successfully', shop_product: newShopProduct });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /shop-inventory/:id: Delete a shop product mapping (Super Admin only)
router.delete('/shop-inventory/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const exists = db.shop_products.some((sp: any) => sp.id === id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Mapping not found' });
    }

    db.shop_products = db.shop_products.filter((sp: any) => sp.id !== id);
    writeDb(db);

    return res.json({ success: true, message: 'Product unassigned from shop successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. Super Admin Coupons Management
// ==========================================

// GET /coupons: Get all coupons (Admin)
router.get('/coupons', authMiddleware, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, coupons: db.coupons || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /coupons: Create or Update coupon
router.post('/coupons', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { code, discount_type, discount_value, min_order_value, max_discount, description, target_audience, usage_limit_per_user, max_global_uses, is_active } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ success: false, error: 'Code, discount type, and discount value are required' });
  }

  try {
    const db = readDb();
    if (!db.coupons) db.coupons = [];

    const existingIndex = db.coupons.findIndex(c => c.code.toUpperCase() === code.trim().toUpperCase());
    const couponObj: any = {
      id: existingIndex >= 0 ? db.coupons[existingIndex].id : `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discount_type: discount_type as 'percentage' | 'flat',
      discount_value: parseFloat(discount_value) || 0,
      value: parseFloat(discount_value) || 0,
      min_order_value: parseFloat(min_order_value) || 0,
      min_order: parseFloat(min_order_value) || 0,
      max_discount: max_discount ? parseFloat(max_discount) : undefined,
      description: description?.trim() || `Get ${discount_value}${discount_type === 'percentage' ? '%' : '₹'} off on your order`,
      target_audience: target_audience || 'all',
      usage_limit_per_user: usage_limit_per_user ? parseInt(usage_limit_per_user) : 1,
      max_global_uses: max_global_uses ? parseInt(max_global_uses) : undefined,
      is_active: is_active !== false,
      active: is_active !== false,
      created_at: existingIndex >= 0 ? db.coupons[existingIndex].created_at : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      db.coupons[existingIndex] = couponObj;
    } else {
      db.coupons.push(couponObj);
    }

    writeDb(db);
    return res.json({ success: true, message: 'Coupon saved successfully', coupon: couponObj, coupons: db.coupons });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /coupons/:id: Delete coupon
router.delete('/coupons/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    if (!db.coupons) db.coupons = [];
    db.coupons = db.coupons.filter(c => c.id !== id && c.code !== id);
    writeDb(db);
    return res.json({ success: true, message: 'Coupon deleted successfully', coupons: db.coupons });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. Central Orders Lifecycle Management
// ==========================================

// GET /orders/all: View all orders across all stores
router.get('/orders/all', authMiddleware, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    let ordersQuery = supabase
      .from('orders')
      .select('*, order_items(*, products(*)), shops(name, city, area_name), profiles(name, mobile)')
      .order('created_at', { ascending: false });

    const { data: orders, error } = await ordersQuery;

    if (error) {
      const localOrders = (db as any).orders || [];
      return res.json({ success: true, orders: localOrders });
    }

    return res.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /orders/:id/status: Update order status
router.patch('/orders/:id/status', authMiddleware, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: `Order status updated to ${status}`, order: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
