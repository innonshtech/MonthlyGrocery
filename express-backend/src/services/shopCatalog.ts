import { readDb } from '../config/localDb';
import { supabase } from '../config/supabase';
import { enrichProductPackFields } from '../utils/packUnit';
import { resolveShopIdForLocation, resolveShopIdForLocationAsync } from './shopResolution';

export type CatalogQuery = {
  category?: string;
  secondary?: string;
  q?: string;
  limit?: number;
  city?: string;
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
  sp: Record<string, any> | undefined,
  p: Record<string, any>,
  cp?: Record<string, any> | undefined,
): Record<string, any> {
  const baseMrp = cp && cp.mrp && parseFloat(cp.mrp) > 0 ? parseFloat(cp.mrp) : (parseFloat(p.mrp) || 0);
  const basePrice = cp && cp.price && parseFloat(cp.price) > 0 ? parseFloat(cp.price) : (parseFloat(p.price) || baseMrp);

  const mrp = baseMrp;
  const price =
    sp && sp.selling_price && parseFloat(sp.selling_price) > 0
      ? parseFloat(sp.selling_price)
      : basePrice;

  const discountPercent =
    sp && sp.discount_percentage && sp.discount_percentage > 0
      ? sp.discount_percentage
      : p.discount_percent || (mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0);

  const stock = sp && sp.stock != null ? Number(sp.stock) : 0;
  const isStockEmpty = stock <= 0;
  const isAvailable = Boolean(sp && sp.available === true && !isStockEmpty && (!cp || cp.is_live !== false));
  const media = parseProductMedia(p);

  return enrichProductPackFields({
    id: p.id,
    shop_id: shopId,
    family_key: p.family_key,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    company: p.company,
    primary_category: p.primary_category,
    secondary_category: p.secondary_category,
    description: media.clean_description || p.description,
    short_description: p.short_description,
    place: p.place,
    image_url: media.primary_image_url || p.image_url,
    images: media.images,
    video_url: media.video_url,
    quantity_value: p.quantity_value,
    quantity_unit: p.quantity_unit,
    unit: p.unit,
    mrp,
    price,
    discount_percent: discountPercent,
    stock,
    available: isAvailable,
    in_stock: isAvailable,
    is_veg: p.is_veg,
    featured: p.featured,
    todays_deal: p.todays_deal,
    best_seller: p.best_seller,
    you_save: mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0,
  });
}

import { searchProductsWithIntelligence } from '../utils/intelligentSearch';
import { parseProductMedia } from '../utils/productMedia';

/** Load master catalog products for a shop with merchant-specific overrides applied. */
export async function fetchProductsForShop(
  shopId: string,
  query: CatalogQuery = {},
): Promise<Record<string, any>[]> {
  const db = readDb();
  const limitVal = query.limit ?? 100;

  // 1. Get all shop_products overrides explicitly configured for this specific shop
  const shopOverrides =
    (db.shop_products || []).filter(
      (sp: any) => sp.shop_id === shopId,
    ) || [];

  const overrideMap = new Map<string, any>();
  for (const sp of shopOverrides) {
    overrideMap.set(sp.product_id, sp);
  }

  // 1b. Fetch city price overrides if city name is specified in query
  const cityPriceMap = new Map<string, any>();
  if (query.city && String(query.city).trim()) {
    try {
      const cleanCity = String(query.city).trim();
      const { data: cityPrices } = await supabase
        .from('product_city_prices')
        .select('*')
        .ilike('city_name', cleanCity);
      if (cityPrices) {
        for (const cp of cityPrices) {
          cityPriceMap.set(cp.product_id, cp);
        }
      }
    } catch {}
  }

  // 2. Fetch master products from Supabase
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
    const cp = cityPriceMap.get(p.id);

    // If city pricing override marks item not live for this city, omit it
    if (cp && cp.is_live === false) {
      continue;
    }

    // Only include products that the merchant has explicitly activated / enabled for their shop
    if (!sp || sp.available !== true) {
      continue;
    }
    out.push(mergeShopProduct(shopId, sp, p, cp));
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
