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
