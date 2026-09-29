export type LocationParams = {
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
  shop_id?: string | null;
};

export function normalizePincode(value?: string | null): string {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

const DUMMY_PINCODES = new Set([
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
  '012345',
  '543210',
]);

export function isValidIndianPincode(value?: string | null): boolean {
  const pin = normalizePincode(value);
  if (pin.length !== 6) return false;
  if (pin.startsWith('0')) return false; // India Post zones are 1 to 9
  if (DUMMY_PINCODES.has(pin)) return false;
  return /^[1-9][0-9]{5}$/.test(pin);
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
  if (pin && isValidIndianPincode(pin)) {
    parts.push(`pincode=${encodeURIComponent(pin)}`);
  }
  if (params.shop_id?.trim()) {
    parts.push(`shop_id=${encodeURIComponent(params.shop_id.trim())}`);
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
  if (pin && isValidIndianPincode(pin)) params.set('pincode', pin);
  return params;
}

export function validateAddressPincode(
  addressPincode: string,
  _areaPincode?: string | null,
): { valid: boolean; message?: string } {
  const pin = normalizePincode(addressPincode);
  if (!pin || pin.length === 0) {
    return { valid: false, message: 'PIN code is required.' };
  }
  if (pin.length !== 6) {
    return { valid: false, message: 'PIN code must be exactly 6 digits.' };
  }
  if (pin.startsWith('0')) {
    return { valid: false, message: 'Indian PIN codes cannot start with 0.' };
  }
  if (DUMMY_PINCODES.has(pin)) {
    return { valid: false, message: 'Please enter a valid 6-digit postal PIN code.' };
  }
  if (!isValidIndianPincode(pin)) {
    return { valid: false, message: 'Please enter a valid 6-digit Indian PIN code.' };
  }
  return { valid: true };
}
