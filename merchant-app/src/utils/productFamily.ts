/**
 * Product Family and Multi-Unit Variant Utilities for Merchant App
 */

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
