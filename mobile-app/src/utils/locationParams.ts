export type LocationParams = {
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
};

export function normalizePincode(value?: string | null): string {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

export function isValidIndianPincode(value?: string | null): boolean {
  return /^\d{6}$/.test(normalizePincode(value));
}

export function appendLocationParams(baseUrl: string, params: LocationParams): string {
  const parts: string[] = [];
  if (params.city?.trim()) {
    parts.push(`city=${encodeURIComponent(params.city.trim())}`);
  }
  if (params.area?.trim()) {
    parts.push(`area_name=${encodeURIComponent(params.area.trim())}`);
  }
  const pin = normalizePincode(params.pincode);
  if (pin) {
    parts.push(`pincode=${encodeURIComponent(pin)}`);
  }
  if (!parts.length) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${parts.join('&')}`;
}

export function appendLocationSearchParams(
  params: URLSearchParams,
  location: LocationParams,
): URLSearchParams {
  if (location.city?.trim()) params.set('city', location.city.trim());
  if (location.area?.trim()) params.set('area_name', location.area.trim());
  const pin = normalizePincode(location.pincode);
  if (pin) params.set('pincode', pin);
  return params;
}

export function validateAddressPincode(
  addressPincode: string,
  areaPincode?: string | null,
): { valid: boolean; message?: string } {
  const pin = normalizePincode(addressPincode);
  if (!isValidIndianPincode(pin)) {
    return { valid: false, message: 'Please enter a valid 6-digit pincode.' };
  }
  return { valid: true };
}
