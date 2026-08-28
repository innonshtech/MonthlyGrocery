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

export interface SavedAddressesScreenConfig {
  title: string;
  select_title: string;
  empty_title: string;
  empty_message: string;
  add_address_label: string;
  deliver_button_label: string;
  default_badge_label: string;
  select_alert_title: string;
  select_alert_message: string;
  load_error_message: string;
  retry_label: string;
}

export interface AddAddressScreenConfig {
  add_title: string;
  edit_title: string;
  flat_label: string;
  flat_placeholder: string;
  street_label: string;
  street_placeholder: string;
  landmark_label: string;
  landmark_placeholder: string;
  pincode_label: string;
  pincode_placeholder: string;
  phone_label: string;
  phone_placeholder: string;
  save_as_label: string;
  tag_home_key: string;
  tag_home_label: string;
  tag_work_key: string;
  tag_work_label: string;
  tag_other_key: string;
  tag_other_label: string;
  default_tag_key: string;
  save_button_label: string;
  saving_button_label: string;
  login_required_title: string;
  login_required_message: string;
  incomplete_title: string;
  incomplete_message: string;
  save_error_title: string;
  load_error_message: string;
  retry_label: string;
}

export function buildShippingAddress(address: AddressItem | null | undefined): string {
  if (!address) return '';
  return [address.flat, address.street, address.landmark, address.pincode]
    .filter((p) => p && String(p).trim())
    .join(', ');
}

export function buildDeliverToLabel(address: AddressItem | null | undefined): string {
  if (!address) return '';
  const tag = (address.tag || 'Home').trim();
  const street = (address.street || '').trim();
  if (!street) return tag;
  const area = street.split(',')[0]?.trim() || street;
  return `${tag} · ${area}`;
}

export async function fetchSavedAddressesScreenConfig(): Promise<SavedAddressesScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/saved-addresses-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.saved_addresses) {
      return data.saved_addresses as SavedAddressesScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAddAddressScreenConfig(): Promise<AddAddressScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/add-address-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.add_address) {
      return data.add_address as AddAddressScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
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
