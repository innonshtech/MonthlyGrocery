import { API_BASE } from '../config/api';
import { appendLocationSearchParams } from '../utils/locationParams';

export interface CopyLastMonthScreenConfig {
  title: string;
  insight_title_template: string;
  insight_subtitle_template: string;
  changes_all_good_message: string;
  changes_both_template: string;
  changes_repriced_only_template: string;
  changes_unavailable_only_template: string;
  available_count_template: string;
  add_to_cart_label: string;
  add_success_title: string;
  add_success_message_template: string;
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
  view_similar_label: string;
  was_price_template: string;
}

export interface CopyLastMonthItem {
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

export interface CopyLastMonthBasket {
  has_order: boolean;
  order_id: string | null;
  month_label: string;
  delivered_date_label: string;
  item_count: number;
  available_count: number;
  repriced_count: number;
  unavailable_count: number;
  total_amount: number;
  changes_message: string;
  items: CopyLastMonthItem[];
}

export function formatCopyTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export async function fetchCopyLastMonthScreenConfig(): Promise<CopyLastMonthScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/copy-last-month-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.copy_last_month) {
      return data.copy_last_month as CopyLastMonthScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchCopyLastMonthBasket(
  token: string,
  city?: string | null,
  area?: string | null,
  pincode?: string | null,
): Promise<{ basket: CopyLastMonthBasket | null; error: boolean }> {
  try {
    const params = new URLSearchParams();
    appendLocationSearchParams(params, { city, area, pincode });
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/orders/copy-last-month${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.basket) {
      return { basket: data.basket as CopyLastMonthBasket, error: false };
    }
    return { basket: null, error: true };
  } catch {
    return { basket: null, error: true };
  }
}
