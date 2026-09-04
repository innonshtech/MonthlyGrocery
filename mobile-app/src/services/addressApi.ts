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

const DEFAULT_SAVED_ADDRESSES_CONFIG: SavedAddressesScreenConfig = {
  title: 'Saved Addresses',
  select_title: 'Select Delivery Address',
  empty_title: 'No addresses saved yet',
  empty_message: 'Add an address to continue with your grocery delivery.',
  add_address_label: 'Add new address',
  deliver_button_label: 'Deliver to this address',
  default_badge_label: 'DEFAULT',
  select_alert_title: 'Select Address',
  select_alert_message: 'Please pick an address to proceed.',
  load_error_message: 'Unable to load addresses.',
  retry_label: 'Retry',
};

const DEFAULT_ADD_ADDRESS_CONFIG: AddAddressScreenConfig = {
  add_title: 'Add New Address',
  edit_title: 'Edit Address',
  flat_label: 'House / Flat / Floor No.',
  flat_placeholder: 'e.g. 402, Block B',
  street_label: 'Apartment / Road / Area',
  street_placeholder: 'e.g. Sunrise Enclave, Main Road',
  landmark_label: 'Landmark (Optional)',
  landmark_placeholder: 'e.g. Near City Park',
  pincode_label: 'Pincode',
  pincode_placeholder: '6-digit pincode',
  phone_label: 'Phone Number',
  phone_placeholder: '10-digit mobile number',
  save_as_label: 'Save address as',
  tag_home_key: 'Home',
  tag_home_label: 'Home',
  tag_work_key: 'Work',
  tag_work_label: 'Work',
  tag_other_key: 'Other',
  tag_other_label: 'Other',
  default_tag_key: 'Home',
  save_button_label: 'Save and continue',
  saving_button_label: 'Saving address...',
  login_required_title: 'Login Required',
  login_required_message: 'Please log in to save your address.',
  incomplete_title: 'Incomplete Details',
  incomplete_message: 'Please fill in flat, street and pincode.',
  save_error_title: 'Unable to Save',
  load_error_message: 'Something went wrong while saving.',
  retry_label: 'Retry',
};

export async function fetchSavedAddressesScreenConfig(): Promise<SavedAddressesScreenConfig> {
  try {
    const res = await fetch(`${API_BASE}/admin/saved-addresses-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.saved_addresses) {
      return data.saved_addresses as SavedAddressesScreenConfig;
    }
    return DEFAULT_SAVED_ADDRESSES_CONFIG;
  } catch {
    return DEFAULT_SAVED_ADDRESSES_CONFIG;
  }
}

export async function fetchAddAddressScreenConfig(): Promise<AddAddressScreenConfig> {
  try {
    const res = await fetch(`${API_BASE}/admin/add-address-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.add_address) {
      return data.add_address as AddAddressScreenConfig;
    }
    return DEFAULT_ADD_ADDRESS_CONFIG;
  } catch {
    return DEFAULT_ADD_ADDRESS_CONFIG;
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
