import type { Product } from '../context/CartContext';

export const PACK_UNIT_OPTIONS = [
  { code: 'g', label: 'Gram (g)' },
  { code: 'kg', label: 'Kilogram (kg)' },
  { code: 'ml', label: 'Millilitre (ml)' },
  { code: 'L', label: 'Litre (L)' },
  { code: 'pcs', label: 'Pieces (pcs)' },
  { code: 'pack', label: 'Pack' },
  { code: 'dozen', label: 'Dozen' },
] as const;

export function normalizePackUnitCode(unit: string): string {
  const u = unit.trim();
  if (!u) return '';
  const lower = u.toLowerCase();
  if (lower === 'l' || lower === 'ltr' || lower === 'litre' || lower === 'liter') return 'L';
  if (lower === 'kg' || lower === 'kgs') return 'kg';
  if (lower === 'g' || lower === 'gm' || lower === 'gram') return 'g';
  if (lower === 'ml') return 'ml';
  if (lower === 'pcs' || lower === 'pc' || lower === 'piece') return 'pcs';
  if (lower === 'pack' || lower === 'packs') return 'pack';
  if (lower === 'dozen' || lower === 'dz') return 'dozen';
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

type PackLabelSource = Pick<Product, 'unit'> & {
  quantity_value?: number | string | null;
  quantity_unit?: string | null;
};

export function getProductPackLabel(product: PackLabelSource): string {
  const qu = product.quantity_unit;
  const qv = product.quantity_value;
  if (qu?.trim() && qv != null && parseFloat(String(qv)) > 0) {
    return formatPackUnit(qv, qu);
  }

  const legacy = (product.unit || '').trim();
  if (!legacy) return '';

  const match = legacy.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (match) {
    return formatPackUnit(match[1], match[2]);
  }
  return legacy;
}
