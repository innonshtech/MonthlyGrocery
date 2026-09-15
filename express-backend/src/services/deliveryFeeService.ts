import { readDb } from '../config/localDb';
import { calculateHaversineDistanceKm } from './geocodingService';
import { resolveShopIdForLocation } from './shopResolution';

export interface DeliveryFeeCalculationInput {
  shopId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  areaName?: string | null;
  pincode?: string | null;
  subtotal?: number | null;
}

export interface DeliveryFeeResult {
  shop_id: string | null;
  shop_name: string | null;
  distance_km: number | null;
  free_delivery_radius_km: number;
  extra_delivery_fee_per_km: number;
  max_delivery_radius_km: number;
  is_serviceable: boolean;
  is_free: boolean;
  delivery_fee: number;
  extra_distance_km: number;
  delivery_fee_label: string;
  free_delivery_message: string;
  store_coords?: { latitude: number; longitude: number } | null;
}

/**
 * Calculates distance-based delivery fee for an order.
 * - Distance <= free_delivery_radius_km (default 5 km): Delivery fee = 0 (FREE)
 * - Distance > free_delivery_radius_km: Extra KM * extra_delivery_fee_per_km (default ₹10/km)
 */
export function calculateDeliveryFee(input: DeliveryFeeCalculationInput): DeliveryFeeResult {
  const db = readDb() as any;
  const territories = db.shop_territories || [];
  const locations = db.serviceable_locations || [];

  let resolvedShopId = input.shopId || null;
  if (!resolvedShopId) {
    resolvedShopId = resolveShopIdForLocation({
      city: input.city,
      areaName: input.areaName,
      pincode: input.pincode,
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }

  // Default values
  const DEFAULT_FREE_RADIUS = 5.0;
  const DEFAULT_EXTRA_FEE_PER_KM = 10.0;
  const DEFAULT_MAX_RADIUS = 15.0;

  if (!resolvedShopId) {
    return {
      shop_id: null,
      shop_name: null,
      distance_km: null,
      free_delivery_radius_km: DEFAULT_FREE_RADIUS,
      extra_delivery_fee_per_km: DEFAULT_EXTRA_FEE_PER_KM,
      max_delivery_radius_km: DEFAULT_MAX_RADIUS,
      is_serviceable: false,
      is_free: true,
      delivery_fee: 0,
      extra_distance_km: 0,
      delivery_fee_label: 'Free Delivery',
      free_delivery_message: `Delivery is FREE within ${DEFAULT_FREE_RADIUS} km!`,
    };
  }

  const territory = territories.find((t: any) => t.shop_id === resolvedShopId);
  const freeRadius = territory?.free_delivery_radius_km != null && !isNaN(parseFloat(territory.free_delivery_radius_km))
    ? parseFloat(territory.free_delivery_radius_km)
    : DEFAULT_FREE_RADIUS;
  const extraFeePerKm = territory?.extra_delivery_fee_per_km != null && !isNaN(parseFloat(territory.extra_delivery_fee_per_km))
    ? parseFloat(territory.extra_delivery_fee_per_km)
    : DEFAULT_EXTRA_FEE_PER_KM;
  const maxRadius = territory?.delivery_radius_km != null && !isNaN(parseFloat(territory.delivery_radius_km))
    ? parseFloat(territory.delivery_radius_km)
    : DEFAULT_MAX_RADIUS;

  let distanceKm: number | null = null;
  const storeLat = territory?.latitude != null ? parseFloat(territory.latitude) : null;
  const storeLng = territory?.longitude != null ? parseFloat(territory.longitude) : null;

  if (
    input.latitude != null &&
    input.longitude != null &&
    !isNaN(input.latitude) &&
    !isNaN(input.longitude) &&
    storeLat != null &&
    storeLng != null &&
    !isNaN(storeLat) &&
    !isNaN(storeLng)
  ) {
    distanceKm = calculateHaversineDistanceKm(input.latitude, input.longitude, storeLat, storeLng);
  }

  // If coordinates are not provided, check if the customer's area is assigned to this shop in serviceable_locations
  if (distanceKm == null) {
    return {
      shop_id: resolvedShopId,
      shop_name: territory?.shop_name || 'Assigned Kirana Store',
      distance_km: null,
      free_delivery_radius_km: freeRadius,
      extra_delivery_fee_per_km: extraFeePerKm,
      max_delivery_radius_km: maxRadius,
      is_serviceable: true,
      is_free: true,
      delivery_fee: 0,
      extra_distance_km: 0,
      delivery_fee_label: 'Free Delivery (Local Area)',
      free_delivery_message: `Delivery is FREE within ${freeRadius} km of your local Kirana store!`,
      store_coords: storeLat != null && storeLng != null ? { latitude: storeLat, longitude: storeLng } : null,
    };
  }

  // If distance exceeds maximum operational radius
  if (distanceKm > maxRadius) {
    return {
      shop_id: resolvedShopId,
      shop_name: territory?.shop_name || 'Kirana Store',
      distance_km: distanceKm,
      free_delivery_radius_km: freeRadius,
      extra_delivery_fee_per_km: extraFeePerKm,
      max_delivery_radius_km: maxRadius,
      is_serviceable: false,
      is_free: false,
      delivery_fee: 0,
      extra_distance_km: 0,
      delivery_fee_label: 'Out of Delivery Range',
      free_delivery_message: `Store delivers up to ${maxRadius} km (Current distance: ${distanceKm.toFixed(1)} km).`,
      store_coords: storeLat != null && storeLng != null ? { latitude: storeLat, longitude: storeLng } : null,
    };
  }

  // Distance <= Free Radius
  if (distanceKm <= freeRadius) {
    return {
      shop_id: resolvedShopId,
      shop_name: territory?.shop_name || 'Kirana Store',
      distance_km: distanceKm,
      free_delivery_radius_km: freeRadius,
      extra_delivery_fee_per_km: extraFeePerKm,
      max_delivery_radius_km: maxRadius,
      is_serviceable: true,
      is_free: true,
      delivery_fee: 0,
      extra_distance_km: 0,
      delivery_fee_label: `FREE (${distanceKm.toFixed(1)} km - within ${freeRadius} km)`,
      free_delivery_message: `Delivery is FREE within ${freeRadius} km!`,
      store_coords: storeLat != null && storeLng != null ? { latitude: storeLat, longitude: storeLng } : null,
    };
  }

  // Distance > Free Radius -> calculate extra charge
  const extraKm = Math.round((distanceKm - freeRadius) * 10) / 10;
  const deliveryFee = Math.round(extraKm * extraFeePerKm);

  return {
    shop_id: resolvedShopId,
    shop_name: territory?.shop_name || 'Kirana Store',
    distance_km: distanceKm,
    free_delivery_radius_km: freeRadius,
    extra_delivery_fee_per_km: extraFeePerKm,
    max_delivery_radius_km: maxRadius,
    is_serviceable: true,
    is_free: false,
    delivery_fee: deliveryFee,
    extra_distance_km: extraKm,
    delivery_fee_label: `₹${deliveryFee} (${distanceKm.toFixed(1)} km: ${freeRadius} km free + ${extraKm} km @ ₹${extraFeePerKm}/km)`,
    free_delivery_message: `First ${freeRadius} km is FREE. ₹${extraFeePerKm}/km applied for extra ${extraKm} km.`,
    store_coords: storeLat != null && storeLng != null ? { latitude: storeLat, longitude: storeLng } : null,
  };
}
