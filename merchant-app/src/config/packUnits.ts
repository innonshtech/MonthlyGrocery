export const PACK_UNIT_OPTIONS = [
  { code: 'g', label: 'Gram (g)' },
  { code: 'kg', label: 'Kilogram (kg)' },
  { code: 'ml', label: 'Millilitre (ml)' },
  { code: 'L', label: 'Litre (L)' },
  { code: 'pcs', label: 'Pieces (pcs)' },
  { code: 'pack', label: 'Pack' },
  { code: 'dozen', label: 'Dozen' },
] as const;

export function formatPackUnit(value: string | number, unit: string): string {
  const num = parseFloat(String(value));
  const display = unit === 'L' ? 'L' : unit.toLowerCase();
  if (Number.isFinite(num) && num > 0) return `${num} ${display}`;
  return display;
}
