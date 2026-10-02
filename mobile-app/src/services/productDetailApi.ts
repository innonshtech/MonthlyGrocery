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

/** Flatten grouped catalog rows (each may contain nested `variants`). */
export function flattenCatalogProducts(catalog: Product[]): Product[] {
  const byId = new Map<string, Product>();
  for (const p of catalog) {
    const nested = (p as any).variants;
    if (Array.isArray(nested) && nested.length > 0) {
      for (const v of nested) {
        if (v?.id) byId.set(String(v.id), v as Product);
      }
    } else if (p?.id) {
      byId.set(String(p.id), p);
    }
  }
  return Array.from(byId.values());
}

export function buildProductVariants(product: Product, catalog: Product[]): Product[] {
  const flatCatalog = flattenCatalogProducts(catalog);
  const familyName = getBaseProductFamily(product.name).toLowerCase();
  const brand = (product.brand || '').trim().toLowerCase();
  const familyKey = String((product as any).family_key || '').trim().toLowerCase();

  const related = flatCatalog.filter((p) => {
    const pFamilyKey = String((p as any).family_key || '').trim().toLowerCase();
    if (familyKey && pFamilyKey && familyKey === pFamilyKey) {
      return true;
    }
    const pFamily = getBaseProductFamily(p.name).toLowerCase();
    const pBrand = (p.brand || '').trim().toLowerCase();

    if (familyName && pFamily === familyName) {
      if (!brand || !pBrand || brand === pBrand) {
        return true;
      }
    }
    return false;
  });

  const unique = Array.from(new Map(related.map((p) => [String(p.id), p])).values());
  return unique.length > 0 ? unique : [product];
}

/** Parse highlights from API description fields only — no synthetic fallbacks. */
export function parseProductHighlights(product: Product): string[] {
  const shortDesc = (product.short_description || '').trim();
  if (shortDesc) {
    const fromShort = shortDesc
      .split(/[;\n•]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && !item.includes('PRODUCT_MEDIA'));
    if (fromShort.length > 0) return fromShort;
  }

  let desc = (product.description || '').trim();
  if (!desc) return [];

  // Remove any embedded PRODUCT_MEDIA metadata tags
  desc = desc
    .replace(/<!--\s*PRODUCT_MEDIA:[\s\S]*?-->/g, '')
    .replace(/<!--\s*PRODUCT_MEDIA_JSON:[\s\S]*?-->/g, '')
    .trim();

  return desc
    .split(/[;\n•]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !item.includes('PRODUCT_MEDIA'));
}

export async function fetchProductDetail(params: {
  productId: string;
  city?: string;
  area?: string;
  pincode?: string;
  shopId?: string;
  initialProduct?: Product | null;
}): Promise<ProductDetailFetchResult> {
  try {
    const detailUrl = appendLocationParams(`${API_BASE}/products/detail/${params.productId}`, {
      city: params.city,
      area: params.area,
      pincode: params.pincode,
      shop_id: params.shopId,
    });

    try {
      const res = await fetch(detailUrl);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.product) {
          const variants: Product[] = Array.isArray(data.variants) && data.variants.length > 0
            ? data.variants
            : [data.product as Product];
          return {
            product: data.product as Product,
            variants,
            error: false,
            notFound: false,
          };
        }
      } else if (res.status === 404 && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.not_found) {
          if (params.initialProduct) {
            return {
              product: params.initialProduct,
              variants: params.initialProduct.variants?.length ? params.initialProduct.variants : [params.initialProduct],
              error: false,
              notFound: false,
            };
          }
          return { product: null, variants: [], error: false, notFound: true };
        }
      }
    } catch {
      // Endpoint not supported on older backend, safely fall through to full catalog search
    }

    // Fallback: legacy full-catalog scan (older backends)
    const url = appendLocationParams(`${API_BASE}/products/all?limit=500`, {
      city: params.city,
      area: params.area,
      pincode: params.pincode,
      shop_id: params.shopId,
    });
    const legacyRes = await fetch(url);
    const legacyData = await legacyRes.json();
    if (!legacyRes.ok || !legacyData.success || !Array.isArray(legacyData.products)) {
      if (params.initialProduct) {
        return {
          product: params.initialProduct,
          variants: params.initialProduct.variants?.length ? params.initialProduct.variants : [params.initialProduct],
          error: false,
          notFound: false,
        };
      }
      return { product: null, variants: [], error: true, notFound: false };
    }

    const catalog: Product[] = legacyData.products;
    let target: Product | null = null;
    let variants: Product[] = [];

    for (const p of catalog) {
      if (p.id === params.productId) {
        target = p;
        if (Array.isArray((p as any).variants) && (p as any).variants.length > 0) {
          variants = (p as any).variants;
        }
        break;
      }
      if (Array.isArray((p as any).variants)) {
        const found = (p as any).variants.find((v: any) => v.id === params.productId);
        if (found) {
          target = found;
          variants = (p as any).variants;
          break;
        }
      }
    }

    if (!target) {
      if (params.initialProduct) {
        return {
          product: params.initialProduct,
          variants: params.initialProduct.variants?.length ? params.initialProduct.variants : [params.initialProduct],
          error: false,
          notFound: false,
        };
      }
      return { product: null, variants: [], error: false, notFound: true };
    }

    if (variants.length <= 1) {
      variants = buildProductVariants(target, catalog);
    }

    return { product: target, variants, error: false, notFound: false };
  } catch {
    return { product: null, variants: [], error: true, notFound: false };
  }
}
