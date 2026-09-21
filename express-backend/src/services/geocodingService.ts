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
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${googleApiKey}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        let area = '';
        let subArea = '';
        let city = '';
        let district = '';
        let state = 'Maharashtra';
        let pincode = '';
        let street = '';

        let primaryArea = '';
        let secondaryArea = '';

        // Extract components across all results to get maximum precision
        for (const r of data.results) {
          for (const comp of r.address_components || []) {
            const types: string[] = comp.types || [];
            if (!pincode && types.includes('postal_code')) pincode = comp.long_name;
            if (!state && types.includes('administrative_area_level_1')) state = comp.long_name;
            if (!district && types.includes('administrative_area_level_2')) district = comp.long_name;
            if (!city && types.includes('locality')) city = comp.long_name;
            if (!city && types.includes('administrative_area_level_3')) city = comp.long_name;
            if (!primaryArea && types.includes('sublocality_level_1')) {
              primaryArea = comp.long_name;
            }
            if (!secondaryArea && (types.includes('sublocality_level_2') || types.includes('sublocality') || types.includes('neighborhood'))) {
              secondaryArea = comp.long_name;
            }
            if (!street && types.includes('route')) street = comp.long_name;
          }
        }

        area = primaryArea || secondaryArea;
        subArea = secondaryArea !== primaryArea ? secondaryArea : '';

        // Preferred clean result types in exact priority order:
        // 1. 'route' (Road name + locality e.g. "Aundh - Ravet BRTS Rd, Ravet, Pimpri-Chinchwad, Maharashtra 412101, India")
        // 2. 'sublocality_level_2' (Colony/Sector name e.g. "Sai Colony, Thergaon, Pimpri-Chinchwad, Maharashtra 411033, India")
        // 3. 'sublocality_level_1' (Primary locality e.g. "Thergaon, Pimpri-Chinchwad, Maharashtra 411033, India")
        // 4. 'neighborhood' / 'sublocality'
        // We avoid 'street_address' and 'subpremise' because they contain arbitrary private house/plot numbers (like 40/63)
        let chosenResult = data.results.find((r: any) => {
          const types: string[] = r.types || [];
          return types.includes('route') && !types.includes('establishment') && !types.includes('plus_code');
        });

        if (!chosenResult) {
          chosenResult = data.results.find((r: any) => {
            const types: string[] = r.types || [];
            return types.includes('sublocality_level_2') && !types.includes('establishment') && !types.includes('plus_code');
          });
        }

        if (!chosenResult) {
          chosenResult = data.results.find((r: any) => {
            const types: string[] = r.types || [];
            return types.includes('sublocality_level_1') && !types.includes('establishment') && !types.includes('plus_code');
          });
        }

        if (!chosenResult) {
          chosenResult = data.results.find((r: any) => {
            const types: string[] = r.types || [];
            return (types.includes('neighborhood') || types.includes('sublocality')) && !types.includes('establishment') && !types.includes('plus_code');
          });
        }

        if (!chosenResult) {
          chosenResult = data.results.find((r: any) => {
            const types: string[] = r.types || [];
            return !types.includes('plus_code') && !types.includes('establishment');
          }) || data.results[0];
        }

        let cleanFormattedAddress = chosenResult?.formatted_address || '';

        // Strip any Plus Code prefix like "JQ7G+M28, " or "8Q7H+XYZ, "
        cleanFormattedAddress = cleanFormattedAddress.replace(/^[A-Z0-9]{4}\+[A-Z0-9]{2,4}(,\s*)?/i, '').trim();

        // Strip any leading house/plot numbers like "40/63, ", "6/1, ", "Plot 5, ", "Shop 4, ", "No. 12, "
        cleanFormattedAddress = cleanFormattedAddress
          .replace(/^([0-9]+[\/\-0-9A-Za-z]*|plot\s*[0-9]+|flat\s*[0-9]+|shop\s*[0-9]+|gala\s*[0-9]+|s\.?\s*no\.?\s*[0-9\/]+|cts\s*[0-9]+)\s*,\s*/i, '')
          .trim();

        // If the formatted address doesn't look complete or is missing, construct from components
        if (!cleanFormattedAddress || cleanFormattedAddress.length < 10) {
          const parts = [street, subArea, area, city || 'Pimpri-Chinchwad', state, pincode, 'India'].filter(Boolean);
          cleanFormattedAddress = parts.join(', ');
        }

        // Clean up any double commas or leading commas
        cleanFormattedAddress = cleanFormattedAddress.replace(/^,\s*/, '').replace(/,\s*,/g, ', ').trim();

        return {
          latitude: lat,
          longitude: lng,
          area: area || subArea || city,
          city: city || district || 'Pimpri-Chinchwad',
          district: district || 'Pune',
          state: state || 'Maharashtra',
          pincode: pincode || '',
          street: street || subArea || area,
          formatted_address: cleanFormattedAddress,
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
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&language=en&key=${googleApiKey}`;
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

/**
 * Google Distance Matrix API: Calculates actual driving road distance & duration.
 * Falls back to straight-line Haversine distance when API key is not present or quota is exceeded.
 */
export async function calculateDrivingDistanceMatrix(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{
  distance_km: number;
  duration_mins: number | null;
  duration_text: string | null;
  source: 'google_distance_matrix' | 'haversine_fallback';
}> {
  const straightLineKm = calculateHaversineDistanceKm(originLat, originLng, destLat, destLng);
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${googleApiKey}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (data.status === 'OK' && Array.isArray(data.rows) && data.rows.length > 0) {
        const elements = data.rows[0].elements;
        if (Array.isArray(elements) && elements.length > 0 && elements[0].status === 'OK') {
          const meters = elements[0].distance?.value || 0;
          const seconds = elements[0].duration?.value || 0;
          const roadKm = Math.round((meters / 1000) * 100) / 100;
          const mins = Math.round(seconds / 60);

          return {
            distance_km: roadKm,
            duration_mins: mins,
            duration_text: elements[0].duration?.text || `${mins} mins`,
            source: 'google_distance_matrix',
          };
        }
      }
    } catch (err) {
      console.warn('Google Distance Matrix error, falling back to Haversine:', err);
    }
  }

  return {
    distance_km: straightLineKm,
    duration_mins: Math.round((straightLineKm / 25) * 60), // estimated 25 km/h driving speed
    duration_text: `${Math.round((straightLineKm / 25) * 60)} mins (est.)`,
    source: 'haversine_fallback',
  };
}

/**
 * Known city coordinates for bounding autocomplete searches
 */
const KNOWN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  pune: { lat: 18.5204, lng: 73.8567 },
  'pimpri-chinchwad': { lat: 18.6298, lng: 73.7997 },
  pimprichinchwad: { lat: 18.6298, lng: 73.7997 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  navi_mumbai: { lat: 19.0330, lng: 73.0297 },
  thane: { lat: 19.2183, lng: 72.9781 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  kolhapur: { lat: 16.7050, lng: 74.2433 },
  chhatrapati_sambhajinagar: { lat: 19.8762, lng: 75.3433 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
};

/**
 * Google Places Autocomplete: Returns address & landmark suggestions as user types,
 * strictly scoped to the specified city if provided.
 */
export async function autocompletePlaces(
  input: string,
  city?: string
): Promise<Array<{ description: string; place_id: string; main_text: string; secondary_text: string }>> {
  const cleanInput = String(input || '').trim();
  if (!cleanInput) return [];

  const results: Array<{ description: string; place_id: string; main_text: string; secondary_text: string }> = [];
  const seenPlaceIds = new Set<string>();
  const normalizedCity = String(city || '').trim().toLowerCase();

  // 1. Local Database Match: Look up localities from local DB for the user's city
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    const locations: any[] = db.serviceable_locations || [];
    const searchLower = cleanInput.toLowerCase();

    for (const loc of locations) {
      const locCityLower = String(loc.city || '').toLowerCase();
      const locAreaLower = String(loc.area_name || '').toLowerCase();
      const locPin = String(loc.pincode || '');

      // Check city match if city is provided
      const cityMatches = !normalizedCity ||
        locCityLower.includes(normalizedCity) ||
        normalizedCity.includes(locCityLower) ||
        (normalizedCity === 'pune' && (locCityLower.includes('pimpri') || locCityLower.includes('chinchwad')));

      if (cityMatches && (locAreaLower.includes(searchLower) || locPin.startsWith(searchLower))) {
        const placeId = `local_${loc.id || loc.area_name}_${loc.pincode}`;
        if (!seenPlaceIds.has(placeId)) {
          seenPlaceIds.add(placeId);
          results.push({
            description: `${loc.area_name}, ${loc.city || city}${loc.pincode ? ` - ${loc.pincode}` : ''}`,
            place_id: placeId,
            main_text: loc.area_name,
            secondary_text: `${loc.city || city}${loc.pincode ? `, ${loc.pincode}` : ''}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Local DB autocomplete error:', err);
  }

  // 2. Google Places API Match with City Coordinate Bias / Restriction
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const coords = normalizedCity ? KNOWN_CITY_COORDS[normalizedCity] || KNOWN_CITY_COORDS[normalizedCity.replace(/[\s-]/g, '_')] : undefined;
      const q = city ? `${cleanInput}, ${city}` : cleanInput;
      
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:in&key=${googleApiKey}`;
      
      // If city coordinates are known, add strict location bias/radius so Google doesn't return other states (like Rajasthan for "ra")
      if (coords) {
        url += `&location=${coords.lat},${coords.lng}&radius=35000&strictbounds=true`;
      }

      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (data.status === 'OK' && Array.isArray(data.predictions)) {
        for (const p of data.predictions) {
          if (seenPlaceIds.has(p.place_id)) continue;

          const desc = String(p.description || '').toLowerCase();
          const secondary = String(p.structured_formatting?.secondary_text || '').toLowerCase();

          // If city was specified, filter out suggestions that do NOT belong to this city/region
          if (normalizedCity) {
            const isRelevant =
              desc.includes(normalizedCity) ||
              secondary.includes(normalizedCity) ||
              (normalizedCity === 'pune' && (desc.includes('pimpri') || desc.includes('chinchwad') || secondary.includes('pimpri') || secondary.includes('chinchwad') || desc.includes('haveli')));

            // Discard results from other states like "Rajasthan", "Ranchi", "Raipur"
            if (!isRelevant) {
              continue;
            }
          }

          seenPlaceIds.add(p.place_id);
          results.push({
            description: p.description,
            place_id: p.place_id,
            main_text: p.structured_formatting?.main_text || p.description,
            secondary_text: p.structured_formatting?.secondary_text || '',
          });
        }
      }
    } catch (err) {
      console.warn('Google Places Autocomplete error:', err);
    }
  }

  return results;
}

/**
 * Check Google Maps API Key status and configuration.
 */
export async function getGoogleMapsApiStatus(): Promise<{
  configured: boolean;
  status: 'active' | 'missing' | 'error';
  message: string;
}> {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleApiKey || googleApiKey.trim() === '' || googleApiKey.includes('YourGoogleMapsApiKeyHere')) {
    return {
      configured: false,
      status: 'missing',
      message: 'GOOGLE_MAPS_API_KEY is not set in express-backend/.env. Running on OpenStreetMap & Haversine fallback.',
    };
  }

  try {
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Pune&key=${googleApiKey}`;
    const res = await fetch(testUrl);
    const data = (await res.json()) as any;

    if (data.status === 'OK') {
      return {
        configured: true,
        status: 'active',
        message: 'Google Maps API Key is active and verified!',
      };
    } else {
      return {
        configured: true,
        status: 'error',
        message: `Google Maps API returned status: ${data.status} - ${data.error_message || 'Check API key permissions'}`,
      };
    }
  } catch (err: any) {
    return {
      configured: true,
      status: 'error',
      message: `Failed to connect to Google Maps API: ${err?.message || 'Network error'}`,
    };
  }
}

