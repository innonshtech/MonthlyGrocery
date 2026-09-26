import { readDb } from '../config/localDb';
import { supabase } from '../config/supabase';
import { enrichProductPackFields } from '../utils/packUnit';
import { resolveShopIdForLocation, resolveShopIdForLocationAsync } from './shopResolution';

export type CatalogQuery = {
  category?: string;
  secondary?: string;
  q?: string;
  limit?: number;
};

export type CatalogResult = {
  shopId: string | null;
  shopName: string | null;
  products: Record<string, any>[];
};

async function fetchShopName(shopId: string): Promise<string | null> {
  const { data } = await supabase
    .from('shops')
    .select('shop_name')
    .eq('id', shopId)
    .maybeSingle();
  return data?.shop_name || null;
}

function mergeShopProduct(
  shopId: string,
  sp: Record<string, any>,
  p: Record<string, any>,
): Record<string, any> {
  const mrp = parseFloat(p.mrp) || 0;
  const price = parseFloat(sp.selling_price) || 0;
  const discountPercent =
    sp.discount_percentage && sp.discount_percentage > 0
      ? sp.discount_percentage
      : mrp > price && mrp > 0
        ? Math.round(((mrp - price) / mrp) * 100)
        : 0;

  const isStockEmpty = sp.stock !== undefined && sp.stock !== null && Number(sp.stock) <= 0;

  return enrichProductPackFields({
    id: p.id,
    shop_id: shopId,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    company: p.company,
    primary_category: p.primary_category,
    secondary_category: p.secondary_category,
    description: p.description,
    short_description: p.short_description,
    place: p.place,
    image_url: p.image_url,
    quantity_value: p.quantity_value,
    quantity_unit: p.quantity_unit,
    unit: p.unit,
    mrp,
    price,
    discount_percent: discountPercent,
    stock: sp.stock != null ? Number(sp.stock) : 0,
    available: !isStockEmpty,
    in_stock: !isStockEmpty,
    is_veg: p.is_veg,
    featured: p.featured,
    todays_deal: p.todays_deal,
    best_seller: p.best_seller,
    you_save: mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0,
  });
}

import { searchProductsWithIntelligence } from '../utils/intelligentSearch';

/** Load master catalog products for a shop, applying strict merchant inventory whitelist. Only products explicitly enabled by the merchant are shown to customers. */
export async function fetchProductsForShop(
  shopId: string,
  query: CatalogQuery = {},
): Promise<Record<string, any>[]> {
  const db = readDb();
  const limitVal = query.limit ?? 100;

  // 1. Get all shop_products explicitly configured / enabled for this specific shop
  const shopOverrides =
    (db.shop_products || []).filter(
      (sp: any) => sp.shop_id === shopId && sp.status === 'approved' && sp.available !== false,
    ) || [];

  // If merchant has not added/enabled any products, their store is empty (no unauthorized master items leak)
  if (shopOverrides.length === 0) {
    return [];
  }

  const overrideMap = new Map<string, any>();
  for (const sp of shopOverrides) {
    overrideMap.set(sp.product_id, sp);
  }

  // 2. Fetch master products for only the enabled product IDs
  let supaQuery = supabase
    .from('products')
    .select('*');

  if (query.category) {
    supaQuery = supaQuery.eq('primary_category', query.category);
  }
  if (query.secondary) {
    supaQuery = supaQuery.eq('secondary_category', query.secondary);
  }

  const { data: masterProducts, error } = await supaQuery.limit(Math.max(limitVal, 300));
  if (error) {
    throw new Error(error.message);
  }

  const out: Record<string, any>[] = [];
  for (const p of masterProducts || []) {
    const sp = overrideMap.get(p.id);
    // Strict Merchant Inventory: Only show if this merchant has explicitly added and enabled it
    if (!sp || sp.available === false) {
      continue;
    }
    out.push(mergeShopProduct(shopId, sp, p));
  }

  if (query.q && query.q.trim()) {
    const ranked = searchProductsWithIntelligence(out, query.q.trim(), query.category, query.secondary);
    return ranked.slice(0, limitVal);
  }

  return out.slice(0, limitVal);
}

/** Resolve area/shopId → shop, then return that shop's catalog. */
export async function fetchProductsForLocation(input: {
  shopId?: string;
  city?: string;
  areaName?: string;
  pincode?: string;
} & CatalogQuery): Promise<CatalogResult> {
  let shopId: string | null = input.shopId || null;

  if (!shopId) {
    shopId = resolveShopIdForLocation({
      shopId: input.shopId,
      city: input.city,
      areaName: input.areaName,
      pincode: input.pincode,
    });
  }

  if (!shopId) {
    shopId = await resolveShopIdForLocationAsync({
      shopId: input.shopId,
      city: input.city,
      areaName: input.areaName,
      pincode: input.pincode,
    });
  }

  if (!shopId) {
    return { shopId: null, shopName: null, products: [] };
  }

  const products = await fetchProductsForShop(shopId, input);
  const shopName = await fetchShopName(shopId);

  return { shopId, shopName, products };
}
