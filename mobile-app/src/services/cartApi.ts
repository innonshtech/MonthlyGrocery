import { API_BASE } from '../config/api';

export interface CartScreenConfig {
  title: string;
  cart_item_label: string;
  cart_items_template: string;
  empty_title: string;
  empty_message: string;
  start_shopping_label: string;
  reorder_last_month_label: string;
  save_basket_label: string;
  apply_coupon_label: string;
  coupon_applied_template: string;
  bill_details_title: string;
  bill_item_total_label: string;
  bill_savings_label: string;
  bill_delivery_fee_label: string;
  bill_delivery_fee_value: string;
  bill_coupon_discount_label: string;
  bill_to_pay_label: string;
  sticky_to_pay_label: string;
  proceed_to_pay_label: string;
  below_min_title_template: string;
  below_min_footnote_template: string;
  savings_banner_template: string;
  add_more_checkout_template: string;
  min_order_alert_template: string;
  empty_preview_image_1: string;
  empty_preview_image_2: string;
  load_error_message: string;
  retry_label: string;
}

export type CartScreenConfigResult = {
  config: CartScreenConfig | null;
  error: boolean;
};

export function formatCartTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchCartScreenConfigWithStatus(): Promise<CartScreenConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/cart-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.cart) {
      return { config: null, error: true };
    }
    return { config: data.cart as CartScreenConfig, error: false };
  } catch {
    return { config: null, error: true };
  }
}

export function getEmptyPreviewImages(config: CartScreenConfig | null): string[] {
  if (!config) return [];
  return [config.empty_preview_image_1, config.empty_preview_image_2]
    .map((url) => (url || '').trim())
    .filter(Boolean);
}
