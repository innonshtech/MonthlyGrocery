import { readDb } from '../config/localDb';

export type ShopResolutionInput = {
  shopId?: string | null;
  city?: string | null;
  areaName?: string | null;
  pincode?: string | null;
};

function normalize(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function findServiceableLocation(input: ShopResolutionInput) {
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
  const firstLocationShop = db.serviceable_locations?.find((loc: any) => loc.shop_id && loc.is_serviceable !== false)?.shop_id;
  if (firstLocationShop) return firstLocationShop;

  const firstShop = db.shops?.find((s: any) => s.status !== 'inactive')?.id || db.shops?.[0]?.id;
  if (firstShop) return firstShop;

  return 'e183b9e2-463d-4d9c-80b2-d2d2b05b7591';
}

export function resolveShopIdForLocationOrThrow(input: ShopResolutionInput): string {
  const shopId = resolveShopIdForLocation(input);
  if (!shopId) {
    throw new Error('No store is assigned to serve this delivery area');
  }
  return shopId;
}
