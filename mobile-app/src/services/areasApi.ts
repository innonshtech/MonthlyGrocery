import { API_BASE } from '../config/api';

export interface CityArea {
  id: string;
  name: string;
  pincode: string;
  serviceable: boolean;
  shop_id?: string | null;
  shop_name?: string | null;
  shop_count?: number;
}

export async function fetchAreasForCity(cityName: string): Promise<CityArea[]> {
  if (!cityName?.trim()) return [];

  try {
    const [locationsRes, citiesRes, areasRes, shopsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/locations`),
      fetch(`${API_BASE}/admin/cities`),
      fetch(`${API_BASE}/admin/areas`),
      fetch(`${API_BASE}/shops/nearby?city=${encodeURIComponent(cityName)}`),
    ]);

    const locationsData = await locationsRes.json();
    const citiesData = await citiesRes.json();
    const areasData = await areasRes.json();
    const shopsData = await shopsRes.json().catch(() => ({ shops: [] }));

    if (!citiesRes.ok || !citiesData.success || !Array.isArray(citiesData.cities)) {
      return [];
    }
    if (!areasRes.ok || !areasData.success || !Array.isArray(areasData.areas)) {
      return [];
    }

    const availableShops: any[] = Array.isArray(shopsData.shops) ? shopsData.shops : [];
    const shopMap = new Map<string, string>();
    for (const s of availableShops) {
      if (s.id && s.shop_name) {
        shopMap.set(s.id, s.shop_name);
      }
    }

    const cityKey = cityName.trim().toLowerCase();
    const city = citiesData.cities.find(
      (c: { name: string }) => c.name.trim().toLowerCase() === cityKey,
    );
    if (!city) return [];

    const locationByArea = new Map<
      string,
      {
        id?: string;
        area_name: string;
        pincode?: string;
        is_serviceable?: boolean;
        shop_id?: string | null;
      }
    >();
    const allLocationsByArea = new Map<
      string,
      {
        id?: string;
        area_name: string;
        pincode?: string;
        is_serviceable?: boolean;
        shop_id?: string | null;
      }
    >();

    if (locationsRes.ok && locationsData.success && Array.isArray(locationsData.locations)) {
      locationsData.locations.forEach((loc: {
        id?: string;
        area_name: string;
        city?: string;
        pincode?: string;
        is_serviceable?: boolean;
        shop_id?: string | null;
      }) => {
        if (!loc?.area_name) return;
        const norm = loc.area_name.trim().toLowerCase();
        allLocationsByArea.set(norm, loc);
        if (loc.city?.trim().toLowerCase() === cityKey) {
          locationByArea.set(norm, loc);
        }
      });
    }

    const masterAreas = areasData.areas.filter(
      (area: { city_id: string }) => area.city_id === city.id,
    );

    const merged: CityArea[] = masterAreas.map((area: { id: string; name: string; pincode?: string }) => {
      const norm = area.name.trim().toLowerCase();
      const loc = locationByArea.get(norm) || allLocationsByArea.get(norm);
      const pin = loc?.pincode?.trim() || area.pincode?.trim() || '';

      // Count all shops delivering to this area/pincode
      const matchingShops = availableShops.filter(
        (s) =>
          (pin && s.pincode && s.pincode === pin) ||
          (s.area_name && s.area_name.toLowerCase() === norm) ||
          (Array.isArray(s.assigned_areas) && s.assigned_areas.some((a: string) => a.toLowerCase() === norm)) ||
          (loc?.shop_id && s.id === loc.shop_id)
      );

      const hasShopCoverage = matchingShops.length > 0 || Boolean(loc?.shop_id);
      const isServiceable = loc
        ? (loc.is_serviceable !== false && hasShopCoverage)
        : hasShopCoverage;

      const shopId = loc?.shop_id || (matchingShops.length > 0 ? matchingShops[0].id : null);
      const shopName = shopId ? (shopMap.get(shopId) || 'Local Kirana Store') : null;

      return {
        id: area.id,
        name: area.name,
        pincode: pin,
        serviceable: isServiceable,
        shop_id: shopId,
        shop_name: shopName,
        shop_count: Math.max(isServiceable ? 1 : 0, matchingShops.length),
      };
    });

    // Include legacy location-only zones not yet in master areas table
    locationByArea.forEach((loc, areaKey) => {
      if (!merged.some((a) => a.name.trim().toLowerCase() === areaKey)) {
        const isServiceable = loc.is_serviceable !== false && Boolean(loc.shop_id);
        const shopId = loc.shop_id || null;
        const shopName = shopId ? (shopMap.get(shopId) || 'Local Kirana Store') : null;
        merged.push({
          id: loc.id || areaKey.replace(/\s+/g, '-'),
          name: loc.area_name,
          pincode: loc.pincode?.trim() || '',
          serviceable: isServiceable,
          shop_id: shopId,
          shop_name: shopName,
          shop_count: isServiceable ? 1 : 0,
        });
      }
    });

    return merged.sort((a, b) => {
      if (a.serviceable !== b.serviceable) return a.serviceable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function submitAreaNotifyRequest(
  city: string,
  areaName: string,
  phone?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/area-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city,
        area_name: areaName,
        phone: phone || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to save request' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
