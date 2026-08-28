import { API_BASE } from '../config/api';

export interface MonthlyGroceryHubScreenConfig {
  title: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_savings_template: string;
  card_one_click_title: string;
  card_one_click_subtitle: string;
  card_copy_title: string;
  card_copy_subtitle_template: string;
  card_copy_empty_subtitle: string;
  card_saved_title: string;
  card_saved_subtitle_template: string;
  card_saved_empty_subtitle: string;
  card_build_title: string;
  card_build_soon_badge: string;
  card_build_subtitle: string;
  load_error_message: string;
  retry_label: string;
  metrics_error_message: string;
  no_last_order_title: string;
  no_last_order_message: string;
}

export interface MonthlyHubSummary {
  saved_this_month: number;
  last_order_item_count: number;
  last_order_month: string;
  has_last_order: boolean;
}

export function formatHubTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchMonthlyGroceryHubScreenConfig(): Promise<MonthlyGroceryHubScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/monthly-grocery-hub-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.monthly_grocery_hub) {
      return data.monthly_grocery_hub as MonthlyGroceryHubScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchMonthlyHubSummary(token: string): Promise<MonthlyHubSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/monthly-hub-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.summary) {
      return data.summary as MonthlyHubSummary;
    }
    return null;
  } catch {
    return null;
  }
}
