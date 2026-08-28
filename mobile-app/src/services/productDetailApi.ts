import { API_BASE } from '../config/api';
import type { Product } from '../context/CartContext';

export interface ProductDetailScreenConfig {
  delivery_window_label: string;
  highlights_section_label: string;
  add_to_cart_label: string;
  unit_price_suffix_template: string;
  not_found_message: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
}

export type ProductDetailConfigResult = {
  config: ProductDetailScreenConfig | null;
  error: boolean;
};

export type ProductDetailFetchResult = {
  product: Product | null;
  variants: Product[];
  error: boolean;
  notFound: boolean;
};

export function formatProductDetailTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchProductDetailConfigWithStatus(): Promise<ProductDetailConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/product-detail-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.product_detail) {
      return { config: null, error: true };
    }
    return { config: data.product_detail as ProductDetailScreenConfig, error: false };
  } catch {
    return { config: null, error: true };
  }
}

export function getBaseProductFamily(nameStr: string): string {
  return nameStr
    .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units)\b.*/i, '')
    .trim();
}

export function buildProductVariants(product: Product, catalog: Product[]): Product[] {
  const familyName = getBaseProductFamily(product.name);
  const related = catalog.filter((p) => {
    return (
      p.primary_category === product.primary_category &&
      (p.brand || '').toLowerCase() === (product.brand || '').toLowerCase() &&
      getBaseProductFamily(p.name).toLowerCase() === familyName.toLowerCase()
    );
  });
  return related.length > 0 ? related : [product];
}

/** Parse highlights from API description fields only — no synthetic fallbacks. */
export function parseProductHighlights(product: Product): string[] {
  const shortDesc = (product.short_description || '').trim();
  if (shortDesc) {
    const fromShort = shortDesc
      .split(/[;\n•]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (fromShort.length > 0) return fromShort;
  }

  const desc = (product.description || '').trim();
  if (!desc) return [];

  return desc
    .split(/[;\n•]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function fetchProductDetail(params: {
  productId: string;
  city?: string;
  area?: string;
}): Promise<ProductDetailFetchResult> {
  try {
    let url = `${API_BASE}/products/all?limit=100`;
    if (params.city) url += `&city=${encodeURIComponent(params.city)}`;
    if (params.area) url += `&area_name=${encodeURIComponent(params.area)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { product: null, variants: [], error: true, notFound: false };
    }

    const catalog: Product[] = data.products ?? [];
    const found = catalog.find((p) => p.id === params.productId);
    if (!found) {
      return { product: null, variants: [], error: false, notFound: true };
    }

    const variants = buildProductVariants(found, catalog);
    return { product: found, variants, error: false, notFound: false };
  } catch {
    return { product: null, variants: [], error: true, notFound: false };
  }
}
