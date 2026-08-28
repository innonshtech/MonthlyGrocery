import { API_BASE } from '../config/api';

export interface OneClickCartScreenConfig {
  title: string;
  generating_title: string;
  generating_subtitle: string;
  insight_title_template: string;
  insight_subtitle_template: string;
  items_count_template: string;
  add_all_label: string;
  add_all_success_title: string;
  add_all_success_message_template: string;
  keep_browsing_label: string;
  view_cart_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  no_location_title: string;
  no_location_message: string;
  load_error_message: string;
  retry_label: string;
  unavailable_label: string;
  source_months: number;
  section_label_overrides: Record<string, string>;
}

export interface OneClickCartItem {
  product_id: string;
  name: string;
  unit_label: string;
  price: number;
  mrp: number;
  previous_price: number | null;
  quantity: number;
  available: boolean;
  image_url: string;
  shop_id: string | null;
  brand: string;
  primary_category: string;
}

export interface OneClickCartGroup {
  section_label: string;
  items: OneClickCartItem[];
}

export interface OneClickCartBasket {
  has_history: boolean;
  source_months: number;
  item_count: number;
  total_amount: number;
  groups: OneClickCartGroup[];
}

export function formatOneClickTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchOneClickCartScreenConfig(): Promise<OneClickCartScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/one-click-cart-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.one_click_cart) {
      return data.one_click_cart as OneClickCartScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchOneClickCartBasket(
  token: string,
  city?: string,
  area?: string,
): Promise<{ basket: OneClickCartBasket | null; error: boolean }> {
  try {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (area) params.set('area_name', area);
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/orders/one-click-cart${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.basket) {
      return { basket: data.basket as OneClickCartBasket, error: false };
    }
    return { basket: null, error: true };
  } catch {
    return { basket: null, error: true };
  }
}

export const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;
