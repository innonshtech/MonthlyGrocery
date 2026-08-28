import { API_BASE } from '../config/api';

export interface SavedBasketsScreenConfig {
  title: string;
  new_basket_label: string;
  items_summary_template: string;
  add_to_cart_label: string;
  add_success_title: string;
  add_success_message_template: string;
  keep_browsing_label: string;
  view_cart_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  save_sheet_title: string;
  save_sheet_subtitle: string;
  basket_name_label: string;
  default_basket_name_template: string;
  items_will_save_template: string;
  save_basket_button_label: string;
  success_title: string;
  success_message_template: string;
  view_saved_baskets_label: string;
  done_label: string;
  empty_cart_title: string;
  empty_cart_message: string;
  no_location_title: string;
  no_location_message: string;
  unavailable_skip_message: string;
  load_error_message: string;
  retry_label: string;
  preview_name_count: number;
}

export interface ReconciledBasketItem {
  product_id: string;
  name: string;
  unit_label: string;
  price: number;
  mrp: number;
  quantity: number;
  available: boolean;
  image_url: string;
  shop_id: string | null;
  brand: string;
  primary_category: string;
}

export function formatSavedBasketsTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export async function fetchSavedBasketsScreenConfig(): Promise<SavedBasketsScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/saved-baskets-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.saved_baskets) {
      return data.saved_baskets as SavedBasketsScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function reconcileBasketItems(
  token: string,
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
    name?: string;
    image_url?: string;
    shop_id?: string;
    brand?: string;
    primary_category?: string;
    unit_label?: string;
    mrp?: number;
  }>,
  city?: string,
  area?: string,
): Promise<{ items: ReconciledBasketItem[]; error: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/orders/reconcile-basket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        area_name: area,
        items,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.items)) {
      return { items: data.items as ReconciledBasketItem[], error: false };
    }
    return { items: [], error: true };
  } catch {
    return { items: [], error: true };
  }
}
