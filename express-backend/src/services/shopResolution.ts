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
/**
 * Strictly check if a given pincode, coordinates, or area is serviceable by any active kirana store.
 */
export function checkLocationServiceability(input: ShopResolutionInput): {
  isServiceable: boolean;
  shopId: string | null;
  distanceKm: number | null;
  message?: string;
} {
  const db = readDb() as any;
  const pincode = String(input.pincode || '').replace(/\D/g, '').slice(0, 6);
  const city = normalize(input.city);
  const areaName = normalize(input.areaName);
  const locations = db.serviceable_locations || [];
  const territories = db.shop_territories || [];

  // 1. Check exact pincode match in serviceable_locations
  if (pincode && pincode.length === 6) {
    const locByPin = locations.find(
      (loc: any) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false && loc.shop_id,
    );
    if (locByPin?.shop_id) {
      return { isServiceable: true, shopId: locByPin.shop_id, distanceKm: null };
    }

    const territoryByPin = territories.find(
      (t: any) => String(t.pincode || '').trim() === pincode && t.shop_id && t.is_open !== false,
    );
    if (territoryByPin?.shop_id) {
      return { isServiceable: true, shopId: territoryByPin.shop_id, distanceKm: null };
    }
  }

  // 2. Check Area + City match in serviceable_locations
  if (city && areaName) {
    const locByArea = locations.find(
      (loc: any) =>
        normalize(loc.city) === city &&
        normalize(loc.area_name) === areaName &&
        loc.is_serviceable !== false &&
        loc.shop_id,
    );
    if (locByArea?.shop_id) {
      return { isServiceable: true, shopId: locByArea.shop_id, distanceKm: null };
    }
  }

  // 3. Check GPS Proximity (Customer coordinates vs Shop coordinates & delivery radius)
  if (input.latitude != null && input.longitude != null && !isNaN(input.latitude) && !isNaN(input.longitude)) {
    for (const territory of territories) {
      if (territory.latitude != null && territory.longitude != null && territory.shop_id && territory.is_open !== false) {
        const dist = calculateHaversineDistanceKm(
          input.latitude,
          input.longitude,
          parseFloat(territory.latitude),
          parseFloat(territory.longitude),
        );
        const radius = territory.delivery_radius_km != null ? parseFloat(territory.delivery_radius_km) : 5.0;
        if (dist <= radius) {
          return { isServiceable: true, shopId: territory.shop_id, distanceKm: dist };
        }
      }
    }
  }

  // If explicit shop was selected and is open
  if (input.shopId) {
    const shopTerritory = territories.find((t: any) => t.shop_id === input.shopId && t.is_open !== false);
    if (shopTerritory) {
      return { isServiceable: true, shopId: input.shopId, distanceKm: null };
    }
  }

  // If none matched -> LOCATION IS UNSERVICEABLE
  const targetLabel = pincode ? `pincode ${pincode}` : (areaName ? `${input.areaName}, ${input.city}` : 'this location');
  return {
    isServiceable: false,
    shopId: null,
    distanceKm: null,
    message: `Service Unavailable: Delivery is currently not available for ${targetLabel}.`,
  };
}

/**
 * Resolve the merchant shop center that fulfills all customer orders for a pincode / area.
 * Returns null if the pincode or area is unserviceable!
 */
export function resolveShopIdForLocation(input: ShopResolutionInput): string | null {
  const serviceCheck = checkLocationServiceability(input);
  if (serviceCheck.isServiceable && serviceCheck.shopId) {
    return serviceCheck.shopId;
  }
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
