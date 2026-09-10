/**
 * Product Family and Multi-Unit Variant Utilities for Merchant App
 */

export interface ProductFamily<T> {
  familyKey: string;
  brand: string;
  name: string;
  primary_category: string;
  image_url: string;
  images: string[];
  video_url: string | null;
  variants: T[];
}

export function getProductFamilyKey(p: { brand?: string; name?: string }): string {
  const brand = String(p.brand || '').trim().toLowerCase();
  const rawName = String(p.name || '')
    .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units|dozen|ltr|gm|litre|kg\b|l\b)\b.*/i, '')
    .trim()
    .toLowerCase();
  return `${brand}::${rawName}`;
}

export function getDisplayBaseName(p: { brand?: string; name?: string }): string {
  const rawName = String(p.name || '')
    .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units|dozen|ltr|gm|litre)\b.*/i, '')
    .trim();
  return rawName || p.name || 'Product';
}

export function getPackUnitLabel(p: { unit?: string; name?: string }): string {
  if (p.unit && p.unit.trim()) {
    return p.unit.trim();
  }
  const match = String(p.name || '').match(/\b\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units|dozen|ltr|gm|litre)\b/i);
  if (match) {
    return match[0].trim();
  }
  return '';
}

/**
 * Parses numeric grams/ml/units from a unit string to enable logical ascending sorting
 */
export function getUnitSortWeight(unitStr: string): number {
  if (!unitStr) return 999999;
  const match = unitStr.match(/([\d.]+)\s*(kg|g|l|ml|pcs|pack|dozen|ltr|gm|litre)/i);
  if (!match) return 999999;

  const val = parseFloat(match[1]) || 0;
  const unit = match[2].toLowerCase();

  if (unit === 'kg' || unit === 'l' || unit === 'ltr' || unit === 'litre') {
    return val * 1000;
  }
  if (unit === 'g' || unit === 'gm' || unit === 'ml') {
    return val;
  }
  if (unit === 'dozen') {
    return val * 12;
  }
  return val;
}

/**
 * Finds all sibling pack variants for a given product from a product list
 */
export function findSiblingVariants<T extends { id?: string; product_id?: string; brand?: string; name?: string; unit?: string; mrp?: any; price?: any; selling_price?: any }>(
  currentProduct: T | null | undefined,
  allProducts: T[]
): T[] {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) {
    return currentProduct ? [currentProduct] : [];
  }

  const currentKey = getProductFamilyKey(currentProduct);
  const siblings = allProducts.filter(p => getProductFamilyKey(p) === currentKey);

  if (siblings.length === 0) {
    return [currentProduct];
  }

  // Sort logically by unit weight or price
  return siblings.sort((a, b) => {
    const unitA = getPackUnitLabel(a);
    const unitB = getPackUnitLabel(b);
    const weightA = getUnitSortWeight(unitA);
    const weightB = getUnitSortWeight(unitB);

    if (weightA !== weightB && weightA !== 999999 && weightB !== 999999) {
      return weightA - weightB;
    }

    const priceA = parseFloat(a.selling_price ?? a.price ?? a.mrp ?? 0);
    const priceB = parseFloat(b.selling_price ?? b.price ?? b.mrp ?? 0);
    return priceA - priceB;
  });
}

/**
 * Groups an array of products into ProductFamily groups with sorted variants
 */
export function groupProductsIntoFamilies<T extends {
  id?: string;
  product_id?: string;
  brand?: string;
  name?: string;
  unit?: string;
  primary_category?: string;
  image_url?: string;
  images?: string[];
  video_url?: string | null;
  mrp?: any;
  price?: any;
  selling_price?: any;
}>(products: T[]): ProductFamily<T>[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const familyMap = new Map<string, T[]>();

  for (const p of products) {
    const key = getProductFamilyKey(p);
    if (!familyMap.has(key)) {
      familyMap.set(key, []);
    }
    familyMap.get(key)!.push(p);
  }

  const result: ProductFamily<T>[] = [];

  for (const [familyKey, rawVariants] of familyMap.entries()) {
    const sortedVariants = rawVariants.sort((a, b) => {
      const unitA = getPackUnitLabel(a);
      const unitB = getPackUnitLabel(b);
      const weightA = getUnitSortWeight(unitA);
      const weightB = getUnitSortWeight(unitB);

      if (weightA !== weightB && weightA !== 999999 && weightB !== 999999) {
        return weightA - weightB;
      }

      const priceA = parseFloat(a.selling_price ?? a.price ?? a.mrp ?? 0);
      const priceB = parseFloat(b.selling_price ?? b.price ?? b.mrp ?? 0);
      return priceA - priceB;
    });

    const primaryVariant = sortedVariants[0];
    const allImages: string[] = [];
    let videoUrl: string | null = null;

    sortedVariants.forEach((v) => {
      if (Array.isArray(v.images)) {
        v.images.forEach((img) => {
          if (img && !allImages.includes(img)) allImages.push(img);
        });
      } else if (v.image_url && !allImages.includes(v.image_url)) {
        allImages.push(v.image_url);
      }
      if (!videoUrl && v.video_url) {
        videoUrl = v.video_url;
      }
    });

    const primaryImageUrl = allImages[0] || primaryVariant.image_url || '';

    result.push({
      familyKey,
      brand: primaryVariant.brand || '',
      name: getDisplayBaseName(primaryVariant),
      primary_category: primaryVariant.primary_category || '',
      image_url: primaryImageUrl,
      images: allImages.length > 0 ? allImages : (primaryImageUrl ? [primaryImageUrl] : []),
      video_url: videoUrl,
      variants: sortedVariants,
    });
  }

  return result;
}
