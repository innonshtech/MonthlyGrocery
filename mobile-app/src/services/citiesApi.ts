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

    return citiesData.cities
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
