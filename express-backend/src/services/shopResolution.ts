import { readDb, writeDb } from '../config/localDb';
import { supabase } from '../config/supabase';
import { calculateHaversineDistanceKm } from './geocodingService';

export type ShopResolutionInput = {
  shopId?: string | null;
  city?: string | null;
  areaName?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function normalize(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

/**
 * Finds the serviceable locality record matching the customer's pincode, city, or area.
 */
export function findServiceableLocation(input: ShopResolutionInput) {
  const db = readDb();
  const locations = db.serviceable_locations || [];
  const city = normalize(input.city);
  const areaName = normalize(input.areaName);
  const pincode = String(input.pincode || '').replace(/\D/g, '').slice(0, 6);

  // 1. Strict Priority: Exact Pincode match (One designated store center per pincode)
  if (pincode && pincode.length === 6) {
    const byPincode = locations.find(
      (loc) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false && Boolean(loc.shop_id),
    );
    if (byPincode) return byPincode;
  }

  // 2. City + Area Name exact match
  if (city && areaName) {
    const exact = locations.find(
      (loc) =>
        normalize(loc.city) === city &&
        normalize(loc.area_name) === areaName &&
        loc.is_serviceable !== false &&
        Boolean(loc.shop_id),
    );
    if (exact) return exact;
  }

  // 3. Area Name match
  if (areaName) {
    const byArea = locations.find(
      (loc) => normalize(loc.area_name) === areaName && loc.is_serviceable !== false && Boolean(loc.shop_id),
    );
    if (byArea) return byArea;
  }

  // 4. Any serviceable record matching pincode even if shop_id is not yet assigned
  if (pincode && pincode.length === 6) {
    const byPincodeAny = locations.find(
      (loc) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false,
    );
    if (byPincodeAny) return byPincodeAny;
  }

  return null;
}

/**
 * Resolve the merchant shop center that fulfills all customer orders for a pincode / area.
 * STRICT RULE: In MonthlyGrocery, each pincode/area has ONE dedicated center store.
 */
export function resolveShopIdForLocation(input: ShopResolutionInput): string | null {
  const db = readDb() as any;
  const pincode = String(input.pincode || '').replace(/\D/g, '').slice(0, 6);

  // 1. PRIMARY STRICT RULE: Match by Pincode in serviceable_locations (Center Store for that Pincode)
  if (pincode && pincode.length === 6) {
    const locByPin = (db.serviceable_locations || []).find(
      (loc: any) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false && loc.shop_id,
    );
    if (locByPin?.shop_id) {
      return locByPin.shop_id;
    }

    // Also check if any shop territory is directly assigned to this pincode
    const territoryByPin = (db.shop_territories || []).find(
      (t: any) => String(t.pincode || '').trim() === pincode && t.shop_id,
    );
    if (territoryByPin?.shop_id) {
      return territoryByPin.shop_id;
    }
  }

  // 2. SECONDARY RULE: Match by Area & City in serviceable_locations
  const location = findServiceableLocation(input);
  if (location?.shop_id) {
    return location.shop_id;
  }

  // 3. TERTIARY RULE: If an explicit shopId is provided (e.g. browsing a specific merchant's catalog)
  if (input.shopId) {
    return input.shopId;
  }

  // 4. FOURTH RULE: Match by City in shop_territories
  const city = normalize(input.city);
  if (city && db.shop_territories && Array.isArray(db.shop_territories)) {
    const matchedTerritory = db.shop_territories.find((t: any) => normalize(t.city) === city && t.shop_id);
    if (matchedTerritory?.shop_id) {
      return matchedTerritory.shop_id;
    }
  }

  // 5. FIFTH RULE (Fallback for new unmapped locations): Nearest center store using GPS Proximity
  if (input.latitude != null && input.longitude != null && !isNaN(input.latitude) && !isNaN(input.longitude)) {
    const shopTerritories = db.shop_territories || [];
    let closestShopId: string | null = null;
    let minDistance = Infinity;

    for (const territory of shopTerritories) {
      if (territory.latitude != null && territory.longitude != null && territory.shop_id) {
        const dist = calculateHaversineDistanceKm(
          input.latitude,
          input.longitude,
          parseFloat(territory.latitude),
          parseFloat(territory.longitude),
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestShopId = territory.shop_id;
        }
      }
    }

    if (closestShopId) return closestShopId;
  }

  // 6. DEFAULT FALLBACK: First active approved shop
  const firstLocationShop = db.serviceable_locations?.find((loc: any) => loc.shop_id && loc.is_serviceable !== false)?.shop_id;
  if (firstLocationShop) return firstLocationShop;

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
    throw new Error('No store is assigned to serve this delivery area / pincode');
  }
  return shopId;
}
