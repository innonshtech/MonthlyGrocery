import { API_BASE } from '../config/api';

export interface CityArea {
  id: string;
  name: string;
  pincode: string;
  serviceable: boolean;
}

export async function fetchAreasForCity(cityName: string): Promise<CityArea[]> {
  if (!cityName?.trim()) return [];

  try {
    const [locationsRes, citiesRes, areasRes] = await Promise.all([
      fetch(`${API_BASE}/admin/locations`),
      fetch(`${API_BASE}/admin/cities`),
      fetch(`${API_BASE}/admin/areas`),
    ]);

    const locationsData = await locationsRes.json();
    const citiesData = await citiesRes.json();
    const areasData = await areasRes.json();

    if (!citiesRes.ok || !citiesData.success || !Array.isArray(citiesData.cities)) {
      return [];
    }
    if (!areasRes.ok || !areasData.success || !Array.isArray(areasData.areas)) {
      return [];
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
      }
    >();
    if (locationsRes.ok && locationsData.success && Array.isArray(locationsData.locations)) {
      locationsData.locations
        .filter(
          (loc: { city?: string }) => loc.city?.trim().toLowerCase() === cityKey,
        )
        .forEach((loc: {
          id?: string;
          area_name: string;
          pincode?: string;
          is_serviceable?: boolean;
        }) => {
          locationByArea.set(loc.area_name.trim().toLowerCase(), loc);
        });
    }

    const masterAreas = areasData.areas.filter(
      (area: { city_id: string }) => area.city_id === city.id,
    );

    const merged: CityArea[] = masterAreas.map((area: { id: string; name: string }) => {
      const loc = locationByArea.get(area.name.trim().toLowerCase());
      return {
        id: area.id,
        name: area.name,
        pincode: loc?.pincode?.trim() || '',
        serviceable: loc ? loc.is_serviceable !== false : true,
      };
    });

    // Include legacy location-only zones not yet in master areas table
    locationByArea.forEach((loc, areaKey) => {
      if (!merged.some((a) => a.name.trim().toLowerCase() === areaKey)) {
        merged.push({
          id: loc.id || areaKey.replace(/\s+/g, '-'),
          name: loc.area_name,
          pincode: loc.pincode?.trim() || '',
          serviceable: loc.is_serviceable !== false,
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
