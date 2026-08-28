import { API_BASE } from '../config/api';

export interface AccountScreenConfig {
  title: string;
  edit_label: string;
  savings_header: string;
  savings_since_template: string;
  menu_saved_addresses: string;
  menu_my_coupons: string;
  menu_help_support: string;
  menu_about_terms: string;
  logout_label: string;
  guest_title: string;
  guest_subtitle: string;
  guest_login_label: string;
  guest_delivery_area_label: string;
  guest_delivery_area_template: string;
  guest_no_area_label: string;
  about_alert_title: string;
  about_alert_message: string;
  logout_sheet_title: string;
  logout_sheet_subtitle: string;
  logout_cancel_label: string;
  logout_confirm_label: string;
  load_error_message: string;
  retry_label: string;
  metrics_error_message: string;
}

export interface AccountSummary {
  total_saved: number;
  joined_month: string;
  available_coupons_count: number;
  order_count: number;
}

export function formatAccountTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export function formatDisplayPhone(mobile?: string | null): string {
  if (!mobile?.trim()) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return mobile.trim();
}

export async function fetchAccountScreenConfig(): Promise<AccountScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/account-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.account) {
      return data.account as AccountScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAccountSummary(
  token: string,
): Promise<{ summary: AccountSummary | null; error: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/auth/account-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.summary) {
      return { summary: data.summary as AccountSummary, error: false };
    }
    return { summary: null, error: true };
  } catch {
    return { summary: null, error: true };
  }
}
