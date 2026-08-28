import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

export interface AddressItem {
  id: string;
  tag: string;
  flat: string;
  street: string;
  landmark?: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

export function buildShippingAddress(address: AddressItem | null | undefined): string {
  if (!address) return 'Pune, Maharashtra';
  return [address.flat, address.street, address.landmark, address.pincode]
    .filter((p) => p && String(p).trim())
    .join(', ');
}

export function buildDeliverToLabel(address: AddressItem | null | undefined): string {
  if (!address) return 'Your delivery address';
  const tag = address.tag || 'Home';
  const area =
    address.street?.split(',')[1]?.trim() ||
    address.street?.split(',')[0]?.trim() ||
    address.street ||
    'Pune';
  return `${tag} · ${area}`;
}

export async function fetchUserAddresses(token: string): Promise<AddressItem[]> {
  const res = await fetch(`${API_BASE}/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load addresses');
  }
  return data.addresses || [];
}

export async function saveUserAddress(
  token: string,
  payload: Partial<AddressItem> & { id?: string },
): Promise<{ address: AddressItem; addresses: AddressItem[] }> {
  const res = await fetch(`${API_BASE}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save address');
  }
  return { address: data.address, addresses: data.addresses || [] };
}

export async function cacheAddressesLocally(addresses: AddressItem[]) {
  try {
    await AsyncStorage.setItem('@user_addresses', JSON.stringify(addresses));
  } catch {
    /* ignore cache errors */
  }
}
