import { API_BASE } from '../config/api';

export interface SearchScreenConfig {
  search_placeholder: string;
  popular_searches_label: string;
  products_section_label: string;
  empty_title_template: string;
  empty_subtitle: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
}

export function formatSearchTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export type SearchConfigResult = { search: SearchScreenConfig | null; error: boolean };

export async function fetchSearchConfigWithStatus(): Promise<SearchConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/search-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.search) {
      return { search: null, error: true };
    }
    return { search: data.search as SearchScreenConfig, error: false };
  } catch {
    return { search: null, error: true };
  }
}

export async function fetchPopularCategoryNames(limit = 8): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/products/categories`);
    const data = await res.json();
    if (!res.ok || !data.success) return [];
    const full = data.categoriesFull || [];
    if (full.length > 0) {
      return full.slice(0, limit).map((c: { name: string }) => c.name);
    }
    if (Array.isArray(data.categories)) {
      return data.categories.slice(0, limit);
    }
    return [];
  } catch {
    return [];
  }
}
