import { readDb, writeDb } from '../config/localDb';
import { supabase } from '../config/supabase';

export type ShopResolutionInput = {
  shopId?: string | null;
  city?: string | null;
  areaName?: string | null;
  pincode?: string | null;
};

function normalize(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

export function findServiceableLocation(input: ShopResolutionInput) {
  const db = readDb();
  const locations = db.serviceable_locations || [];
  const city = normalize(input.city);
  const areaName = normalize(input.areaName);
  const pincode = String(input.pincode || '').trim();

  if (city && areaName) {
    const exact = locations.find(
      (loc) =>
        normalize(loc.city) === city &&
        normalize(loc.area_name) === areaName &&
        loc.is_serviceable !== false,
    );
    if (exact) return exact;
  }

  if (pincode) {
    const byPincode = locations.find(
      (loc) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false,
    );
    if (byPincode) return byPincode;
  }

  if (areaName) {
    const byArea = locations.find(
      (loc) => normalize(loc.area_name) === areaName && loc.is_serviceable !== false,
    );
    if (byArea) return byArea;
  }

  return null;
}

/** Resolve the merchant shop that should fulfill an order for a delivery area. */
export function resolveShopIdForLocation(input: ShopResolutionInput): string | null {
  const location = findServiceableLocation(input);
  const locationShopId = location?.shop_id || null;

  if (locationShopId) return locationShopId;
  if (input.shopId) return input.shopId;

  const db = readDb() as any;

  // 1. Check shop_territories matching city
  const city = normalize(input.city);
  if (city && db.shop_territories && Array.isArray(db.shop_territories)) {
    const matchedTerritory = db.shop_territories.find((t: any) => normalize(t.city) === city);
    if (matchedTerritory?.shop_id) return matchedTerritory.shop_id;
  }

  // 2. Check first serviceable location with an assigned shop_id
  const firstLocationShop = db.serviceable_locations?.find((loc: any) => loc.shop_id && loc.is_serviceable !== false)?.shop_id;
  if (firstLocationShop) return firstLocationShop;

  // 3. Check first mapped shop_product's shop_id
  const firstShopProduct = db.shop_products?.find((sp: any) => sp.shop_id)?.shop_id;
  if (firstShopProduct) return firstShopProduct;

  const firstShop = db.shops?.find((s: any) => s.status !== 'inactive')?.id || db.shops?.[0]?.id;
  if (firstShop) return firstShop;

  return null;
}

/** Asynchronously resolve shop id, querying Supabase for approved shops if local lookup is inconclusive. */
export async function resolveShopIdForLocationAsync(input: ShopResolutionInput): Promise<string | null> {
  const syncResolved = resolveShopIdForLocation(input);
  if (syncResolved) return syncResolved;

  try {
    const { data: shops } = await supabase
      .from('shops')
      .select('id, shop_name, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    if (shops && shops.length > 0) {
      const approvedShopId = shops[0].id;
      // Auto-heal local serviceable location if exists
      const db = readDb() as any;
      let modified = false;
      if (db.serviceable_locations && db.serviceable_locations.length > 0) {
        for (const loc of db.serviceable_locations) {
          if (!loc.shop_id) {
            loc.shop_id = approvedShopId;
            modified = true;
          }
        }
      }
      if (modified) {
        writeDb(db);
      }
      return approvedShopId;
    }
  } catch (err) {
    console.error('Error resolving shop from Supabase:', err);
  }

  return null;
}

export function resolveShopIdForLocationOrThrow(input: ShopResolutionInput): string {
  const shopId = resolveShopIdForLocation(input);
  if (!shopId) {
    throw new Error('No store is assigned to serve this delivery area');
  }
  return shopId;
}
