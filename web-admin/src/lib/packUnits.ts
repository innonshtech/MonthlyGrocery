export const PACK_UNIT_OPTIONS = [
  { code: 'g', label: 'Gram (g)' },
  { code: 'kg', label: 'Kilogram (kg)' },
  { code: 'ml', label: 'Millilitre (ml)' },
  { code: 'L', label: 'Litre (L)' },
  { code: 'pcs', label: 'Pieces (pcs)' },
  { code: 'pack', label: 'Pack' },
  { code: 'dozen', label: 'Dozen' },
] as const;

export type PackUnitCode = (typeof PACK_UNIT_OPTIONS)[number]['code'];

export function normalizePackUnitCode(unit: string): string {
  const u = unit.trim();
  if (!u) return '';
  const lower = u.toLowerCase();
  if (lower === 'l' || lower === 'ltr') return 'L';
  if (lower === 'kg' || lower === 'kgs') return 'kg';
  if (lower === 'g' || lower === 'gm') return 'g';
  if (lower === 'ml') return 'ml';
  if (lower === 'pcs' || lower === 'pc') return 'pcs';
  if (lower === 'pack') return 'pack';
  if (lower === 'dozen') return 'dozen';
  return u;
}

export function formatPackUnit(
  value: number | string | null | undefined,
  unit: string | null | undefined,
): string {
  if (!unit?.trim()) return '';
  const code = normalizePackUnitCode(unit);
  const num = parseFloat(String(value));
  const displayCode = code === 'L' ? 'L' : code.toLowerCase();
  if (Number.isFinite(num) && num > 0) {
    return `${num} ${displayCode}`;
  }
  return displayCode;
}

export function resolvePackUnitLabel(product: {
  unit?: string | null;
  quantity_value?: number | string | null;
  quantity_unit?: string | null;
}): string {
  const qu = product.quantity_unit;
  const qv = product.quantity_value;
  if (qu?.trim() && qv != null && parseFloat(String(qv)) > 0) {
    return formatPackUnit(qv, qu);
  }
  const legacy = (product.unit || '').trim();
  if (!legacy) return '';
  const match = legacy.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (match) return formatPackUnit(match[1], match[2]);
  return legacy;
}

export function packUnitPayloadFromInput(
  quantityValue: string | number,
  quantityUnit: string,
): { quantity_value: number; quantity_unit: string; unit: string } {
  const num = parseFloat(String(quantityValue));
  const code = normalizePackUnitCode(quantityUnit);
  return {
    quantity_value: num,
    quantity_unit: code,
    unit: formatPackUnit(num, code),
  };
}

/**
 * Computes a standardized numeric score for a pack variant to sort sizes logically:
 * e.g., 250g (250) < 500g (500) < 1kg (1000) < 5kg (5000) < 10kg (10000) < 25kg (25000)
 */
export function getNormalizedVariantScore(product: {
  unit?: string | null;
  quantity_value?: number | string | null;
  quantity_unit?: string | null;
  mrp?: number | string | null;
  price?: number | string | null;
}): number {
  let qv = product.quantity_value != null ? parseFloat(String(product.quantity_value)) : NaN;
  let qu = product.quantity_unit ? normalizePackUnitCode(product.quantity_unit) : '';

  if ((isNaN(qv) || qv <= 0) && product.unit) {
    const match = String(product.unit).trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      qv = parseFloat(match[1]);
      qu = normalizePackUnitCode(match[2]);
    }
  }

  if (!isNaN(qv) && qv > 0) {
    const lower = qu.toLowerCase();
    if (lower === 'kg') return qv * 1000;
    if (lower === 'g' || lower === 'gm') return qv;
    if (lower === 'l' || lower === 'ltr') return qv * 1000;
    if (lower === 'ml') return qv;
    if (lower === 'dozen') return qv * 12;
    if (lower === 'pcs' || lower === 'pc') return qv;
    return qv;
  }

  const mrp = parseFloat(String(product.mrp || product.price || 0));
  return isNaN(mrp) ? 0 : mrp;
}

/**
 * Sorts pack size variants in logical ascending sequence (smaller units first, larger units after).
 * e.g., 500 g -> 1 kg -> 5 kg -> 10 kg -> 25 kg
 */
export function sortPackVariants<T extends {
  unit?: string | null;
  quantity_value?: number | string | null;
  quantity_unit?: string | null;
  mrp?: number | string | null;
  price?: number | string | null;
  created_at?: string | null;
}>(variants: T[]): T[] {
  return [...variants].sort((a, b) => {
    const scoreA = getNormalizedVariantScore(a);
    const scoreB = getNormalizedVariantScore(b);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    const mrpA = parseFloat(String(a.mrp || a.price || 0)) || 0;
    const mrpB = parseFloat(String(b.mrp || b.price || 0)) || 0;
    if (mrpA !== mrpB) {
      return mrpA - mrpB;
    }
    if (a.created_at && b.created_at) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return 0;
  });
}

