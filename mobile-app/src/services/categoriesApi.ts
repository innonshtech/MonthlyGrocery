import { API_BASE } from '../config/api';

export interface CategoriesScreenConfig {
  title: string;
  search_placeholder: string;
  section_grocery_label: string;
  section_snacks_label: string;
  section_household_label: string;
  section_default_label: string;
  empty_message: string;
  load_error_message: string;
  retry_label: string;
}

export type CategoriesConfigResult = {
  categories: CategoriesScreenConfig | null;
  error: boolean;
};

export async function fetchCategoriesConfigWithStatus(): Promise<CategoriesConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/categories-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.categories) {
      return { categories: null, error: true };
    }
    return { categories: data.categories as CategoriesScreenConfig, error: false };
  } catch {
    return { categories: null, error: true };
  }
}

export interface CategoryItem {
  id: string;
  name: string;
  image_url: string;
}

export type CategoriesListResult = {
  items: CategoryItem[];
  error: boolean;
};

export async function fetchCategoryList(): Promise<CategoriesListResult> {
  try {
    const res = await fetch(`${API_BASE}/products/categories`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { items: [], error: true };
    }

    const full = data.categoriesFull || [];
    const rawCategories: string[] = Array.isArray(data.categories) ? data.categories : [];
    const itemMap = new Map<string, CategoryItem>();

    for (const item of full) {
      if (item && item.name) {
        itemMap.set(item.name.toLowerCase(), {
          id: item.id || `cat-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: item.name,
          image_url: (item.image_url || '').trim(),
        });
      }
    }

    for (const name of rawCategories) {
      if (name && !itemMap.has(name.toLowerCase())) {
        itemMap.set(name.toLowerCase(), {
          id: `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name,
          image_url: '',
        });
      }
    }

    return { items: Array.from(itemMap.values()), error: false };
  } catch {
    return { items: [], error: true };
  }
}
