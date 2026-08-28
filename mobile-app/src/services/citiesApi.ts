import { API_BASE } from '../config/api';

export interface ServiceableCity {
  id: string;
  name: string;
  region: string;
}

export async function fetchServiceableCities(): Promise<ServiceableCity[]> {
  try {
    const [citiesRes, locationsRes, areasRes] = await Promise.all([
      fetch(`${API_BASE}/admin/cities`),
      fetch(`${API_BASE}/admin/locations`),
      fetch(`${API_BASE}/admin/areas`),
    ]);
    const citiesData = await citiesRes.json();
    const locationsData = await locationsRes.json();
    const areasData = await areasRes.json();

    if (!citiesRes.ok || !citiesData.success || !Array.isArray(citiesData.cities)) {
      return [];
    }

    const serviceableNames = new Set<string>();
    if (locationsRes.ok && locationsData.success && Array.isArray(locationsData.locations)) {
      locationsData.locations
        .filter((loc: { is_serviceable?: boolean; city?: string }) => loc.is_serviceable)
        .forEach((loc: { city: string }) =>
          serviceableNames.add(loc.city.trim().toLowerCase()),
        );
    }

    const citiesWithRegisteredAreas = new Set<string>();
    if (areasRes.ok && areasData.success && Array.isArray(areasData.areas)) {
      areasData.areas.forEach((area: { city_id: string }) => {
        const city = citiesData.cities.find(
          (c: { id: string }) => c.id === area.city_id,
        );
        if (city?.name) {
          citiesWithRegisteredAreas.add(city.name.trim().toLowerCase());
        }
      });
    }

    return citiesData.cities
      .filter((city: { name: string }) => {
        const key = city.name.trim().toLowerCase();
        return serviceableNames.has(key) || citiesWithRegisteredAreas.has(key);
      })
      .map((city: { id: string; name: string; region?: string }) => ({
        id: city.id,
        name: city.name,
        region: city.region?.trim() || '',
      }))
      .sort((a: ServiceableCity, b: ServiceableCity) =>
        a.name.localeCompare(b.name),
      );
  } catch {
    return [];
  }
}
