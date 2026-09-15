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
 * Finds the serviceable locality record matching the customer's area, pincode, or city.
 * Hierarchical Rule: Specific Area match takes precedence over generic pincode hub.
 */
export function findServiceableLocation(input: ShopResolutionInput) {
  const db = readDb();
  const locations = db.serviceable_locations || [];
  const city = normalize(input.city);
  const areaName = normalize(input.areaName);
  const pincode = String(input.pincode || '').replace(/\D/g, '').slice(0, 6);

  // 1. Highest Priority: Exact City + Area Name match with assigned shop
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

  // 2. Area Name + Pincode match with assigned shop
  if (areaName && pincode) {
    const areaPinMatch = locations.find(
      (loc) =>
        normalize(loc.area_name) === areaName &&
        String(loc.pincode || '').trim() === pincode &&
        loc.is_serviceable !== false &&
        Boolean(loc.shop_id),
    );
    if (areaPinMatch) return areaPinMatch;
  }

  // 3. Area Name match with assigned shop
  if (areaName) {
    const byArea = locations.find(
      (loc) => normalize(loc.area_name) === areaName && loc.is_serviceable !== false && Boolean(loc.shop_id),
    );
    if (byArea) return byArea;
  }

  // 4. Pincode match with assigned shop
  if (pincode && pincode.length === 6) {
    const byPincode = locations.find(
      (loc) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false && Boolean(loc.shop_id),
    );
    if (byPincode) return byPincode;
  }

  // 5. Any serviceable record matching pincode even if shop_id is not yet assigned
  if (pincode && pincode.length === 6) {
    const byPincodeAny = locations.find(
      (loc) => String(loc.pincode || '').trim() === pincode && loc.is_serviceable !== false,
    );
    if (byPincodeAny) return byPincodeAny;
  }

  return null;
}

/**
 * Strictly check if a given pincode, coordinates, or area is serviceable by any active kirana store.
 * Supports:
 * 1. Customer's explicit store selection (if store delivers to the area/pincode or within radius).
 * 2. Granular Area-Level assigned shopkeeper (allowing different shops in different areas of the same pincode).
 * 3. Pincode hub default assigned shopkeeper.
 * 4. GPS delivery radius proximity.
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

  // 1. Explicit Customer Store Selection Priority
  if (input.shopId) {
    const shopTerritory = territories.find((t: any) => t.shop_id === input.shopId && t.is_open !== false);
    // Also verify if assigned in serviceable locations
    const assignedInLocation = locations.find(
      (loc: any) => loc.shop_id === input.shopId && loc.is_serviceable !== false
    );
    if (shopTerritory || assignedInLocation) {
      let dist: number | null = null;
      if (input.latitude != null && input.longitude != null && shopTerritory?.latitude && shopTerritory?.longitude) {
        dist = calculateHaversineDistanceKm(
          input.latitude,
          input.longitude,
          parseFloat(shopTerritory.latitude),
          parseFloat(shopTerritory.longitude),
        );
      }
      return { isServiceable: true, shopId: input.shopId, distanceKm: dist };
    }
  }

  // 2. Granular Area + City match in serviceable_locations (Area-level override)
  if (city && areaName) {
    const locByAreaCity = locations.find(
      (loc: any) =>
        normalize(loc.city) === city &&
        normalize(loc.area_name) === areaName &&
        loc.is_serviceable !== false &&
        loc.shop_id,
    );
    if (locByAreaCity?.shop_id) {
      return { isServiceable: true, shopId: locByAreaCity.shop_id, distanceKm: null };
    }
  }

  // 3. Area Name + Pincode match in serviceable_locations
  if (areaName && pincode) {
    const locByAreaPin = locations.find(
      (loc: any) =>
        normalize(loc.area_name) === areaName &&
        String(loc.pincode || '').trim() === pincode &&
        loc.is_serviceable !== false &&
        loc.shop_id,
    );
    if (locByAreaPin?.shop_id) {
      return { isServiceable: true, shopId: locByAreaPin.shop_id, distanceKm: null };
    }
  }

  // 4. Area Name only match
  if (areaName) {
    const locByArea = locations.find(
      (loc: any) => normalize(loc.area_name) === areaName && loc.is_serviceable !== false && loc.shop_id,
    );
    if (locByArea?.shop_id) {
      return { isServiceable: true, shopId: locByArea.shop_id, distanceKm: null };
    }
  }

  // 5. Pincode Match (Pincode hub level)
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

  // 6. GPS Proximity (Customer coordinates vs Shop coordinates & delivery radius)
  if (input.latitude != null && input.longitude != null && !isNaN(input.latitude) && !isNaN(input.longitude)) {
    let nearestShopId: string | null = null;
    let minDistance: number = Infinity;

    for (const territory of territories) {
      if (territory.latitude != null && territory.longitude != null && territory.shop_id && territory.is_open !== false) {
        const dist = calculateHaversineDistanceKm(
          input.latitude,
          input.longitude,
          parseFloat(territory.latitude),
          parseFloat(territory.longitude),
        );
        const radius = territory.delivery_radius_km != null ? parseFloat(territory.delivery_radius_km) : 5.0;
        if (dist <= radius && dist < minDistance) {
          minDistance = dist;
          nearestShopId = territory.shop_id;
        }
      }
    }

    if (nearestShopId) {
      return { isServiceable: true, shopId: nearestShopId, distanceKm: minDistance };
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
