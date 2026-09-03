import { readDb } from '../config/localDb';
import { supabase } from '../config/supabase';
import { enrichProductPackFields } from '../utils/packUnit';
import { resolveShopIdForLocation } from './shopResolution';

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
    available: sp.available !== false,
    is_veg: p.is_veg,
    featured: p.featured,
    todays_deal: p.todays_deal,
    best_seller: p.best_seller,
    you_save: mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0,
  });
}

function mergeSupabaseProduct(shopId: string, p: Record<string, any>): Record<string, any> {
  const mrp = parseFloat(p.mrp) || 0;
  const price = parseFloat(p.price) || 0;

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
    discount_percent: mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0,
    stock: p.stock != null ? Number(p.stock) : 0,
    available: p.available !== false,
    is_veg: p.is_veg,
    featured: p.featured,
    todays_deal: p.todays_deal,
    best_seller: p.best_seller,
    you_save: mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0,
  });
}

/** Supabase master rows tagged to this shop (used when merchant has no local inventory rows yet). */
async function fetchSupabaseShopCatalog(
  shopId: string,
  query: CatalogQuery = {},
): Promise<Record<string, any>[]> {
  const limitVal = query.limit ?? 100;

  let supaQuery = supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('available', true);

  if (query.category) {
    supaQuery = supaQuery.eq('primary_category', query.category);
  }
  if (query.secondary) {
    supaQuery = supaQuery.eq('secondary_category', query.secondary);
  }
  if (query.q) {
    supaQuery = supaQuery.or(
      `name.ilike.%${query.q}%,brand.ilike.%${query.q}%,primary_category.ilike.%${query.q}%`,
    );
  }

  const { data: masterProducts, error } = await supaQuery.limit(limitVal);
  if (error) {
    throw new Error(error.message);
  }

  return (masterProducts || []).map((p: any) => mergeSupabaseProduct(shopId, p));
}

/** Load approved shop_products merged with master catalog for one shop. */
export async function fetchProductsForShop(
  shopId: string,
  query: CatalogQuery = {},
): Promise<Record<string, any>[]> {
  const db = readDb();
  const limitVal = query.limit ?? 100;

  const approvedShopProds =
    (db.shop_products || []).filter(
      (sp: any) => sp.shop_id === shopId && sp.status === 'approved',
    ) || [];

  if (approvedShopProds.length > 0) {
    const productIds = approvedShopProds.map((sp: any) => sp.product_id);

    let supaQuery = supabase.from('products').select('*').in('id', productIds);

    if (query.category) {
      supaQuery = supaQuery.eq('primary_category', query.category);
    }
    if (query.secondary) {
      supaQuery = supaQuery.eq('secondary_category', query.secondary);
    }
    if (query.q) {
      supaQuery = supaQuery.or(
        `name.ilike.%${query.q}%,brand.ilike.%${query.q}%,primary_category.ilike.%${query.q}%`,
      );
    }

    const { data: masterProducts, error } = await supaQuery.limit(limitVal);
    if (error) {
      throw new Error(error.message);
    }

    const out: Record<string, any>[] = [];
    for (const sp of approvedShopProds) {
      const p = (masterProducts || []).find((prod: any) => prod.id === sp.product_id);
      if (!p) continue;
      out.push(mergeShopProduct(shopId, sp, p));
    }

    return out;
  }

  return fetchSupabaseShopCatalog(shopId, query);
}

/** Resolve area → shop, then return that shop's catalog. */
export async function fetchProductsForLocation(input: {
  city?: string;
  areaName?: string;
  pincode?: string;
} & CatalogQuery): Promise<CatalogResult> {
  const shopId = resolveShopIdForLocation({
    city: input.city,
    areaName: input.areaName,
    pincode: input.pincode,
  });

  if (!shopId) {
    return { shopId: null, shopName: null, products: [] };
  }

  const products = await fetchProductsForShop(shopId, input);
  const shopName = await fetchShopName(shopId);

  return { shopId, shopName, products };
}
