import { API_BASE } from '../config/api';

export interface ServiceableCity {
  id: string;
  name: string;
  region: string;
}

export async function fetchServiceableCities(): Promise<ServiceableCity[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/cities`);
    const citiesData = await res.json();

    if (!res.ok || !citiesData.success || !Array.isArray(citiesData.cities)) {
      return [];
    }

    return citiesData.cities
      .map((city: { id: string; name: string; region?: string }) => {
        const raw = city.name?.trim() || '';
        const capitalized = raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
        return {
          id: city.id,
          name: capitalized,
          region: city.region?.trim() || '',
        };
      })
      .sort((a: ServiceableCity, b: ServiceableCity) =>
        a.name.localeCompare(b.name),
      );
  } catch {
    return [];
  }
}
