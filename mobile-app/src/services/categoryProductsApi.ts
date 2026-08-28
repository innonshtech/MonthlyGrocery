import { API_BASE } from '../config/api';
import type { Product } from '../context/CartContext';

export interface CategoryProductsScreenConfig {
  search_placeholder_template: string;
  items_count_template: string;
  sort_label: string;
  sub_category_all_label: string;
  empty_message: string;
  deals_title: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
  view_cart_label: string;
  cart_item_label: string;
  cart_items_template: string;
  add_button_label: string;
  filter_sheet_title: string;
  filter_sort_section_label: string;
  filter_sort_relevance: string;
  filter_sort_price_low: string;
  filter_sort_price_high: string;
  filter_sort_discount: string;
  filter_pack_section_label: string;
  filter_clear_label: string;
  filter_apply_label: string;
}

export type CategoryProductsConfigResult = {
  config: CategoryProductsScreenConfig | null;
  error: boolean;
};

export function formatCategoryProductsTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchCategoryProductsConfigWithStatus(): Promise<CategoryProductsConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/category-products-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.category_products) {
      return { config: null, error: true };
    }
    return { config: data.category_products as CategoryProductsScreenConfig, error: false };
  } catch {
    return { config: null, error: true };
  }
}

export type FetchCategoryProductsParams = {
  dealsOnly?: boolean;
  categoryName?: string;
  categoryId?: string;
  city?: string;
  area?: string;
};

export type CategoryProductsFetchResult = {
  products: Product[];
  error: boolean;
};

export interface SidebarTab {
  key: string;
  label: string;
  image_url?: string;
}

/** Left rail: "All" + unique secondary_category from merchant catalog (Figma B4). */
export function buildSidebarTabs(
  products: Product[],
  allLabel: string,
  parentImageUrl?: string,
): SidebarTab[] {
  const tabs: SidebarTab[] = [
    { key: allLabel, label: allLabel, image_url: parentImageUrl },
  ];

  const seen = new Set<string>();
  for (const p of products) {
    const sub = (p.secondary_category || '').trim();
    if (!sub || seen.has(sub)) continue;
    seen.add(sub);

    const thumb = products.find(
      (item) => (item.secondary_category || '').trim() === sub && item.image_url,
    )?.image_url;

    tabs.push({ key: sub, label: sub, image_url: thumb });
  }

  return tabs.slice(0, 8);
}

export async function fetchBrowseCategoryImage(
  categoryId?: string,
  categoryName?: string,
): Promise<string | undefined> {
  try {
    const res = await fetch(`${API_BASE}/products/categories`);
    const data = await res.json();
    if (!res.ok || !data.success) return undefined;

    const full = data.categoriesFull || [];
    const match = full.find(
      (c: { id: string; name: string; image_url?: string }) =>
        (categoryId && c.id === categoryId) ||
        (categoryName && c.name.toLowerCase() === categoryName.toLowerCase()),
    );
    return match?.image_url;
  } catch {
    return undefined;
  }
}

export async function fetchCategoryProducts(
  params: FetchCategoryProductsParams,
): Promise<CategoryProductsFetchResult> {
  try {
    let url = `${API_BASE}/products/all?limit=50`;
    if (params.dealsOnly) {
      url += '&deals=true';
    } else {
      const q = params.categoryName || params.categoryId;
      if (q && q !== 'all') url += `&category=${encodeURIComponent(q)}`;
    }
    if (params.city) url += `&city=${encodeURIComponent(params.city)}`;
    if (params.area) url += `&area_name=${encodeURIComponent(params.area)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { products: [], error: true };
    }
    return { products: data.products ?? [], error: false };
  } catch {
    return { products: [], error: true };
  }
}
