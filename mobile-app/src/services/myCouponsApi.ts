import { API_BASE } from '../config/api';
import {
  CouponItem,
  fetchLiveCoupons,
  formatOffersTemplate,
} from './offersCouponsApi';

export interface MyCouponsScreenConfig {
  title: string;
  banner_title: string;
  banner_subtitle: string;
  section_label: string;
  expires_template: string;
  list_copy_label: string;
  empty_message: string;
  copy_alert_title: string;
  copy_alert_message_template: string;
  copy_alert_go_cart_label: string;
  copy_alert_ok_label: string;
  load_error_message: string;
  retry_label: string;
  audience_new_guideline: string;
  audience_loyal_guideline: string;
  audience_all_guideline: string;
  usage_limit_template: string;
}

export type { CouponItem };

export async function fetchMyCouponsScreenConfig(): Promise<MyCouponsScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/my-coupons-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.my_coupons) {
      return data.my_coupons as MyCouponsScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildMyCouponGuideline(
  config: MyCouponsScreenConfig,
  coupon: CouponItem,
): string {
  const audience = coupon.target_audience || 'all';
  let text =
    audience === 'new'
      ? config.audience_new_guideline
      : audience === 'loyal'
        ? config.audience_loyal_guideline
        : config.audience_all_guideline;

  if (coupon.usage_limit_per_user) {
    const limitText = formatOffersTemplate(config.usage_limit_template, {
      limit: coupon.usage_limit_per_user,
    });
    text = `${text} ${limitText}`;
  }
  return text.trim();
}

export { fetchLiveCoupons, formatOffersTemplate };
