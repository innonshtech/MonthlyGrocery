export interface PincodeValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

const DUMMY_PINCODES = new Set([
  '123456',
  '654321',
  '012345',
  '543210',
  '987654',
  '234567',
  '345678',
  '456789',
  '567890',
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
  '121212',
  '101010',
  '123123',
  '654654',
  '999000',
  '100000',
  '200000',
  '300000',
  '400000',
  '500000',
  '600000',
  '700000',
  '800000',
  '900000',
]);

/**
 * Validates Indian Postal PIN code according to India Post regulations:
 * 1. Must be exactly 6 numeric digits
 * 2. Cannot start with 0 (Postal zones are 1 to 9)
 * 3. Blocks sequential & dummy numbers (123456, 111111, etc.)
 */
export function validateIndianPincode(pincode: string | undefined | null): PincodeValidationResult {
  if (!pincode || typeof pincode !== 'string') {
    return { isValid: false, error: 'Pincode is required' };
  }

  const clean = pincode.replace(/\D/g, '').trim();

  if (clean.length !== 6) {
    return { isValid: false, error: 'Pincode must be exactly 6 digits' };
  }

  if (clean.startsWith('0')) {
    return { isValid: false, error: 'Indian Postal PIN codes cannot start with 0' };
  }

  if (DUMMY_PINCODES.has(clean)) {
    return { isValid: false, error: `"${clean}" is a dummy/test PIN code. Please enter a valid Indian postal PIN (e.g. 411038)` };
  }

  // Check all identical digits (e.g. 111111)
  if (/^(\d)\1{5}$/.test(clean)) {
    return { isValid: false, error: 'Invalid PIN code: Repeated digits are not allowed' };
  }

  // Check sequential digits (e.g. 123456, 234567, 765432)
  const isSequentialAsc = '0123456789'.includes(clean);
  const isSequentialDesc = '9876543210'.includes(clean);
  if (isSequentialAsc || isSequentialDesc) {
    return { isValid: false, error: 'Invalid PIN code: Sequential numbers are not allowed' };
  }

  return { isValid: true, formatted: clean };
}
