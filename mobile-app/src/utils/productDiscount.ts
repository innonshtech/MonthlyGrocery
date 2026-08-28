import { Product } from '../context/CartContext';

type PricedProduct = Product & {
  discount_percent?: number;
};

/** Merchant-set discount from shop_products.discount_percentage (API: discount_percent). */
export function getProductDiscountPercent(item: PricedProduct): number {
  const merchantPct = Number(item.discount_percent);
  if (Number.isFinite(merchantPct) && merchantPct > 0) {
    return Math.round(merchantPct);
  }
  return 0;
}

export const HOME_DEAL_BG_COLORS = [
  '#FFF3D6', '#E4F3EA', '#F6E9E1', '#FDE4E7',
  '#EDE9FB', '#FBEEDD', '#EAF6D6', '#E1F0FB',
];

export function homeDealBg(index: number): string {
  return HOME_DEAL_BG_COLORS[index % HOME_DEAL_BG_COLORS.length];
}
