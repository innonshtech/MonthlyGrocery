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
  load_error_message: string;
  retry_label: string;
  location_required_deals_label: string;
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
  navigation: { navigate: (screen: string, params?: Record<string, any>) => void },
  actionLink?: string,
) {
  if (!actionLink?.trim()) {
    // Default fallback: if actionLink is empty, take customer to Deals
    navigation.navigate('CategoryProducts', {
      dealsOnly: true,
      categoryName: 'Deals of the month',
    });
    return;
  }

  const trimmed = actionLink.trim();

  // 1. External Web URLs (http:// or https://)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const { Linking } = require('react-native');
    Linking.canOpenURL(trimmed)
      .then((supported: boolean) => {
        if (supported) Linking.openURL(trimmed);
      })
      .catch(() => {});
    return;
  }

  // 2. Short alias for Deals
  const lower = trimmed.toLowerCase();
  if (
    lower === 'deals' ||
    lower === '/deals' ||
    lower === 'deals_only' ||
    lower === 'dealsofthemonth' ||
    lower === 'todays_deals'
  ) {
    navigation.navigate('CategoryProducts', {
      dealsOnly: true,
      categoryName: 'Deals of the month',
    });
    return;
  }

  // 3. Short alias for Categories
  if (lower === 'categories' || lower === '/categories' || lower === 'category') {
    navigation.navigate('Shop', { screen: 'Categories' });
    return;
  }

  // 4. Category with name pattern: "category:Atta & Rice" or "/category/Atta & Rice"
  if (lower.startsWith('category:') || lower.startsWith('/category/')) {
    const catName = trimmed.replace(/^category:|\/category\//i, '').trim();
    navigation.navigate('CategoryProducts', {
      categoryName: decodeURIComponent(catName),
    });
    return;
  }

  // 5. Product with ID pattern: "product:xyz" or "/product/xyz"
  if (lower.startsWith('product:') || lower.startsWith('/product/')) {
    const pid = trimmed.replace(/^product:|\/product\//i, '').trim();
    navigation.navigate('ProductDetail', {
      productId: pid,
    });
    return;
  }

  // 6. Generic query parsing: e.g. "CategoryProducts?categoryName=Oils%20%26%20Ghee" or "Search?q=sugar"
  const [screen, query] = trimmed.split('?');
  if (!screen) return;

  const params: Record<string, any> = {};
  if (query) {
    query.split('&').forEach((part) => {
      const [k, v] = part.split('=');
      if (k) {
        const decoded = decodeURIComponent(v || '');
        if (decoded === 'true') params[k] = true;
        else if (decoded === 'false') params[k] = false;
        else params[k] = decoded;
      }
    });
  }

  if (screen.toLowerCase() === 'categoryproducts' || screen === 'CategoryProducts') {
    if (params.category && !params.categoryName) {
      params.categoryName = params.category;
      delete params.category;
    }
    if (params.deals || params.dealsOnly) {
      params.dealsOnly = true;
    }
    navigation.navigate('CategoryProducts', params);
  } else if (screen.toLowerCase() === 'productdetail' || screen === 'ProductDetail') {
    if (params.id && !params.productId) {
      params.productId = params.id;
    }
    navigation.navigate('ProductDetail', params);
  } else {
    navigation.navigate(screen, params);
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

export type HomeConfigResult = { home: HomeScreenConfig | null; error: boolean };

export async function fetchHomeConfigWithStatus(): Promise<HomeConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/home`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.home) {
      return { home: null, error: true };
    }
    return { home: data.home as HomeScreenConfig, error: false };
  } catch {
    return { home: null, error: true };
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
