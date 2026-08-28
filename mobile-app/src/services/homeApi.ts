import { API_BASE } from '../config/api';

export interface HomeScreenConfig {
  delivering_label: string;
  location_prefix: string;
  choose_location_label: string;
  delivery_pill_text: string;
  search_placeholder: string;
  mmg_label: string;
  mmg_title: string;
  mmg_subtitle: string;
  categories_title: string;
  categories_see_all: string;
  deals_title: string;
  deals_see_all: string;
  loading_deals_label: string;
  empty_deals_label: string;
  reorder_title: string;
  reorder_subtitle_template: string;
  reorder_cta_label: string;
  first_basket_title: string;
  first_basket_subtitle: string;
  first_basket_cta_label: string;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  action_link?: string;
  active: boolean;
  kind?: 'image' | 'promo';
  subtitle?: string;
  body?: string;
  cta_text?: string;
}

export function formatHomeTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export function navigateFromActionLink(
  navigation: { navigate: (screen: string, params?: Record<string, string>) => void },
  actionLink?: string,
) {
  if (!actionLink?.trim()) return;
  const trimmed = actionLink.trim();
  const [screen, query] = trimmed.split('?');
  if (!screen) return;
  if (query) {
    const params: Record<string, string> = {};
    query.split('&').forEach((part) => {
      const [k, v] = part.split('=');
      if (k) params[k] = decodeURIComponent(v || '');
    });
    if (screen === 'CategoryProducts' && params.category && !params.categoryName) {
      params.categoryName = params.category;
      delete params.category;
    }
    navigation.navigate(screen, params);
  } else {
    navigation.navigate(screen);
  }
}

export async function fetchHomeConfig(): Promise<HomeScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/home`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.home) {
      return null;
    }
    return data.home as HomeScreenConfig;
  } catch {
    return null;
  }
}

export async function fetchPromotionalBanners(): Promise<PromotionalBanner[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/banners`);
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.banners)) {
      return [];
    }
    return data.banners.filter((b: PromotionalBanner) => b.active);
  } catch {
    return [];
  }
}
