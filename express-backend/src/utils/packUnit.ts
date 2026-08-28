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

const VALID_UNITS = new Set<string>(PACK_UNIT_OPTIONS.map((o) => o.code));

export function normalizePackUnitCode(unit: string): string {
  const u = unit.trim();
  if (!u) return '';
  const lower = u.toLowerCase();
  if (lower === 'l' || lower === 'ltr' || lower === 'litre' || lower === 'liter') return 'L';
  if (lower === 'kg' || lower === 'kgs' || lower === 'kilogram') return 'kg';
  if (lower === 'g' || lower === 'gm' || lower === 'gram' || lower === 'grams') return 'g';
  if (lower === 'ml' || lower === 'millilitre' || lower === 'milliliter') return 'ml';
  if (lower === 'pcs' || lower === 'pc' || lower === 'piece' || lower === 'pieces') return 'pcs';
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
  if (match) {
    return formatPackUnit(match[1], match[2]);
  }
  return legacy;
}

export function packUnitPayloadFromInput(
  quantityValue: number | string | null | undefined,
  quantityUnit: string | null | undefined,
  fallbackUnit?: string,
): {
  quantity_value: number | null;
  quantity_unit: string | null;
  unit: string;
} {
  const num = parseFloat(String(quantityValue));
  const code = quantityUnit?.trim() ? normalizePackUnitCode(quantityUnit) : '';

  if (code && VALID_UNITS.has(code) && Number.isFinite(num) && num > 0) {
    return {
      quantity_value: num,
      quantity_unit: code,
      unit: formatPackUnit(num, code),
    };
  }

  const legacy = (fallbackUnit || '').trim();
  if (legacy) {
    const match = legacy.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      const parsed = packUnitPayloadFromInput(match[1], match[2]);
      if (parsed.quantity_unit) return parsed;
    }
  }

  return {
    quantity_value: null,
    quantity_unit: null,
    unit: legacy || '',
  };
}

export function enrichProductPackFields<T extends Record<string, unknown>>(product: T): T & {
  unit: string;
  quantity_value?: number | null;
  quantity_unit?: string | null;
} {
  const label = resolvePackUnitLabel(product as {
    unit?: string;
    quantity_value?: number | string;
    quantity_unit?: string;
  });
  return {
    ...product,
    unit: label || String(product.unit || ''),
  };
}
