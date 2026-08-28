import { API_BASE } from '../config/api';

export interface OffersCouponsScreenConfig {
  title: string;
  manual_code_placeholder: string;
  manual_apply_label: string;
  available_section_label: string;
  expires_template: string;
  list_apply_label: string;
  empty_message: string;
  load_error_message: string;
  retry_label: string;
  min_order_alert_title: string;
  min_order_alert_template: string;
  invalid_coupon_alert_title: string;
  apply_failed_fallback: string;
  connection_error_title: string;
  connection_error_message: string;
  unlock_offer_template: string;
  audience_new_guideline: string;
  audience_loyal_guideline: string;
  audience_all_guideline: string;
  usage_limit_template: string;
}

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount: number;
  max_discount: number;
  expires_at: string;
  badge?: string;
  description?: string;
  target_audience?: 'all' | 'new' | 'loyal';
  usage_limit_per_user?: number;
}

export type OffersCouponsScreenConfigResult = {
  config: OffersCouponsScreenConfig | null;
  error: boolean;
};

export function formatOffersTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchOffersCouponsScreenConfigWithStatus(): Promise<OffersCouponsScreenConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/offers-coupons-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.offers_coupons) {
      return { config: null, error: true };
    }
    return { config: data.offers_coupons as OffersCouponsScreenConfig, error: false };
  } catch {
    return { config: null, error: true };
  }
}

export async function fetchLiveCoupons(token?: string | null): Promise<CouponItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/coupons`, { headers });
    const data = await res.json();
    if (res.ok && data.success && data.coupons) {
      return data.coupons as CouponItem[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function applyCouponCode(
  code: string,
  cartAmount: number,
  token?: string | null,
): Promise<{
  success: boolean;
  coupon?: CouponItem & { discount_amount?: number };
  error?: string;
}> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/coupons/apply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code: code.trim(), cart_amount: cartAmount }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        coupon: {
          ...data.coupon,
          discount_amount: data.discount_amount,
        },
      };
    }
    return { success: false, error: data.error || 'Failed to apply coupon.' };
  } catch {
    return { success: false, error: 'Connection error while applying coupon.' };
  }
}
