import { Router } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import {
  buildSlotsForShop,
  upsertSlotConfig,
} from '../services/deliverySlots';
import { resolveShopIdForLocation } from '../services/shopResolution';

const router = Router();

async function getMerchantShopId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  return data?.id || null;
}

// GET / — Public availability for customer app
router.get('/', async (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days || '4'), 10) || 4, 14);
    const resolvedShopId = resolveShopIdForLocation({
      shopId: req.query.shop_id as string | undefined,
      city: req.query.city as string | undefined,
      areaName: (req.query.area || req.query.area_name) as string | undefined,
      pincode: req.query.pincode as string | undefined,
    });

    let shopId = resolvedShopId || (req.query.shop_id as string);
    if (!shopId) {
      const { data: firstShop } = await supabase
        .from('shops')
        .select('id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      shopId = firstShop?.id || 'default-shop';
    }

    const payload = buildSlotsForShop(shopId, days);
    return res.json({ success: true, ...payload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to load delivery slots' });
  }
});

// GET /merchant — Merchant view (same data, scoped to their shop)
router.get('/merchant', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }
    const days = Math.min(parseInt(String(req.query.days || '4'), 10) || 4, 14);
    const payload = buildSlotsForShop(shopId, days);
    return res.json({ success: true, ...payload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to load merchant slots' });
  }
});

// PUT /merchant — Update capacity / closed / recommended for a slot
router.put('/merchant', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { date, window_id, max_capacity, is_closed, is_recommended } = req.body;

  if (!date || !window_id) {
    return res.status(400).json({ success: false, error: 'date and window_id are required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const updates: Record<string, unknown> = {};
    if (max_capacity !== undefined) {
      const cap = parseInt(String(max_capacity), 10);
      if (!Number.isFinite(cap) || cap < 1 || cap > 500) {
        return res.status(400).json({ success: false, error: 'max_capacity must be between 1 and 500' });
      }
      updates.max_capacity = cap;
    }
    if (is_closed !== undefined) updates.is_closed = Boolean(is_closed);
    if (is_recommended !== undefined) updates.is_recommended = Boolean(is_recommended);

    const config = upsertSlotConfig(shopId, date, window_id, updates);
    const payload = buildSlotsForShop(shopId, 4);
    return res.json({ success: true, config, ...payload });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to update slot' });
  }
});

export default router;
