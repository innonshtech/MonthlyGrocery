export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface StructuredAddressDetails {
  flat?: string;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // 2 decimal places
}

/**
 * Validates whether a customer coordinate falls within a shop's delivery radius in kilometers.
 */
export function isLocationWithinShopRadius(
  customerLat?: number | null,
  customerLng?: number | null,
  shopLat?: number | null,
  shopLng?: number | null,
  radiusKm: number = 5.0
): { withinRadius: boolean; distanceKm: number | null } {
  if (
    customerLat == null ||
    customerLng == null ||
    shopLat == null ||
    shopLng == null ||
    isNaN(customerLat) ||
    isNaN(customerLng) ||
    isNaN(shopLat) ||
    isNaN(shopLng)
  ) {
    return { withinRadius: true, distanceKm: null };
  }

  const distanceKm = calculateHaversineDistanceKm(
    customerLat,
    customerLng,
    shopLat,
    shopLng
  );

  return {
    withinRadius: distanceKm <= radiusKm,
    distanceKm,
  };
}

/**
 * Reverse Geocoding with Google Maps API readiness & fallback support.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<StructuredAddressDetails> {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const top = data.results[0];
        let area = '';
        let city = '';
        let district = '';
        let state = '';
        let pincode = '';
        let street = '';

        for (const comp of top.address_components || []) {
          const types: string[] = comp.types || [];
          if (types.includes('postal_code')) pincode = comp.long_name;
          if (types.includes('administrative_area_level_1')) state = comp.long_name;
          if (types.includes('administrative_area_level_2')) district = comp.long_name;
          if (types.includes('locality')) city = comp.long_name;
          if (!city && types.includes('administrative_area_level_3')) city = comp.long_name;
          if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
            if (!area) area = comp.long_name;
          }
          if (types.includes('route')) street = comp.long_name;
        }

        return {
          latitude: lat,
          longitude: lng,
          area: area || city,
          city: city || district,
          district,
          state,
          pincode,
          street,
          formatted_address: top.formatted_address,
        };
      }
    } catch (err) {
      console.warn('Google Maps reverse geocoding request error, falling back:', err);
    }
  }

  // Fallback: OpenStreetMap Nominatim for development/testing without API key
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'MonthlyGroceryApp/1.0',
      },
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      const addr = data.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || '';
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const district = addr.county || addr.state_district || '';
      const state = addr.state || '';
      const pincode = addr.postcode || '';

      return {
        latitude: lat,
        longitude: lng,
        area: area || city,
        city: city || district,
        district,
        state,
        pincode,
        formatted_address: data.display_name || '',
      };
    }
  } catch (err) {
    console.warn('Fallback reverse geocode error:', err);
  }

  return {
    latitude: lat,
    longitude: lng,
  };
}

/**
 * Forward Geocoding: Converts an address, landmark, area, or pincode string into GPS coordinates.
 */
export async function forwardGeocodeAddress(query: string): Promise<StructuredAddressDetails | null> {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return null;

  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${googleApiKey}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;
      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const top = data.results[0];
        const lat = top.geometry?.location?.lat;
        const lng = top.geometry?.location?.lng;
        if (lat != null && lng != null) {
          let area = '';
          let city = '';
          let district = '';
          let state = '';
          let pincode = '';
          for (const comp of top.address_components || []) {
            const types: string[] = comp.types || [];
            if (types.includes('postal_code')) pincode = comp.long_name;
            if (types.includes('administrative_area_level_1')) state = comp.long_name;
            if (types.includes('administrative_area_level_2')) district = comp.long_name;
            if (types.includes('locality')) city = comp.long_name;
            if (!city && types.includes('administrative_area_level_3')) city = comp.long_name;
            if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
              if (!area) area = comp.long_name;
            }
          }
          return {
            latitude: lat,
            longitude: lng,
            area: area || city,
            city: city || district,
            district,
            state,
            pincode,
            formatted_address: top.formatted_address,
          };
        }
      }
    } catch (err) {
      console.warn('Google Maps forward geocoding request error:', err);
    }
  }

  // OpenStreetMap Nominatim fallback
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=in&limit=1&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'MonthlyGroceryApp/1.0',
      },
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data) && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lng = parseFloat(top.lon);
        const addr = top.address || {};
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const district = addr.county || addr.state_district || '';
        const state = addr.state || '';
        const pincode = addr.postcode || '';

        return {
          latitude: lat,
          longitude: lng,
          area: area || city,
          city: city || district,
          district,
          state,
          pincode,
          formatted_address: top.display_name || '',
        };
      }
    }
  } catch (err) {
    console.warn('Fallback forward geocode error:', err);
  }

  return null;
}

