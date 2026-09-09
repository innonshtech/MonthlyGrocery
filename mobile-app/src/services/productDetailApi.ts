import { API_BASE } from '../config/api';
import type { Product } from '../context/CartContext';
import { appendLocationParams } from '../utils/locationParams';

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

export const DEFAULT_PRODUCT_DETAIL_CONFIG: ProductDetailScreenConfig = {
  delivery_window_label: 'Delivered in your planned 4-hour window',
  highlights_section_label: 'HIGHLIGHTS',
  add_to_cart_label: 'Add to Cart',
  unit_price_suffix_template: '{unit} · incl. taxes',
  not_found_message: 'Product not found',
  location_required_message: 'Please set your delivery location first',
  choose_location_label: 'Select Location',
  load_error_message: 'Failed to load product details',
  retry_label: 'Retry',
};

export type ProductDetailConfigResult = {
  config: ProductDetailScreenConfig;
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
  return (template || '{unit} · incl. taxes').replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function fetchProductDetailConfigWithStatus(): Promise<ProductDetailConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/admin/product-detail-screen`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.product_detail) {
      return { config: DEFAULT_PRODUCT_DETAIL_CONFIG, error: false };
    }
    return {
      config: { ...DEFAULT_PRODUCT_DETAIL_CONFIG, ...(data.product_detail as Partial<ProductDetailScreenConfig>) },
      error: false,
    };
  } catch {
    return { config: DEFAULT_PRODUCT_DETAIL_CONFIG, error: false };
  }
}

export function getBaseProductFamily(nameStr: string): string {
  return String(nameStr || '')
    .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units|dozen)\b.*/i, '')
    .trim();
}

export function buildProductVariants(product: Product, catalog: Product[]): Product[] {
  const familyName = getBaseProductFamily(product.name).toLowerCase();
  const brand = (product.brand || '').trim().toLowerCase();

  const related = catalog.filter((p) => {
    const pFamily = getBaseProductFamily(p.name).toLowerCase();
    const pBrand = (p.brand || '').trim().toLowerCase();

    if (familyName && pFamily === familyName) {
      if (!brand || !pBrand || brand === pBrand) {
        return true;
      }
    }
    return false;
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
  pincode?: string;
}): Promise<ProductDetailFetchResult> {
  try {
    const url = appendLocationParams(`${API_BASE}/products/all?limit=200`, {
      city: params.city,
      area: params.area,
      pincode: params.pincode,
    });

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.products)) {
      return { product: null, variants: [], error: true, notFound: false };
    }

    const catalog: Product[] = data.products;
    const target = catalog.find((p) => p.id === params.productId);
    if (!target) {
      return { product: null, variants: [], error: false, notFound: true };
    }

    const variants = buildProductVariants(target, catalog);
    return { product: target, variants, error: false, notFound: false };
  } catch {
    return { product: null, variants: [], error: true, notFound: false };
  }
}
