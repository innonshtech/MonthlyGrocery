import { API_BASE } from '../config/api';

export interface NearbyShop {
  id: string;
  shop_name: string;
  status: string;
  address_line?: string;
  area_name?: string;
  city?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  delivery_radius_km: number;
  is_open: boolean;
  distance_km?: number | null;
  within_radius: boolean;
  matched_by_pincode?: boolean;
  matched_by_area?: boolean;
}

export interface NearbyShopsResponse {
  success: boolean;
  count: number;
  query_radius_km?: number | null;
  customer_coords?: { latitude: number; longitude: number } | null;
  shops: NearbyShop[];
  error?: string;
}

export async function fetchNearbyShops(params: {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
  radius?: number | null;
}): Promise<NearbyShop[]> {
  try {
    const queryParts: string[] = [];
    if (params.lat != null && !isNaN(params.lat)) queryParts.push(`lat=${params.lat}`);
    if (params.lng != null && !isNaN(params.lng)) queryParts.push(`lng=${params.lng}`);
    if (params.city?.trim()) queryParts.push(`city=${encodeURIComponent(params.city.trim())}`);
    if (params.area?.trim()) queryParts.push(`area=${encodeURIComponent(params.area.trim())}`);
    if (params.pincode?.trim()) queryParts.push(`pincode=${encodeURIComponent(params.pincode.trim())}`);
    if (params.radius != null && !isNaN(params.radius)) queryParts.push(`radius=${params.radius}`);

    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await fetch(`${API_BASE}/shops/nearby${qs}`);
    if (!res.ok) return [];

    const data: NearbyShopsResponse = await res.json();
    return data.success && Array.isArray(data.shops) ? data.shops : [];
  } catch (err) {
    console.warn('Failed to fetch nearby shops:', err);
    return [];
  }
}
