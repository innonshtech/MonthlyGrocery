/** Shared coupon discount math — supports API types: fixed, flat, percentage */
export function calculateCouponDiscount(
  appliedCoupon: {
    discount_type?: string;
    discount_value?: number;
    value?: number;
    discount_amount?: number;
    max_discount?: number;
  } | null | undefined,
  itemTotalPrice: number,
): number {
  if (!appliedCoupon) return 0;

  const discountValue =
    Number(appliedCoupon.discount_value ?? appliedCoupon.value ?? appliedCoupon.discount_amount) || 0;
  const maxDiscount = Number(appliedCoupon.max_discount) || 0;
  const discountType = String(appliedCoupon.discount_type || '').toLowerCase();

  if (discountType === 'percentage') {
    const pctOff = Math.round((itemTotalPrice * discountValue) / 100);
    return maxDiscount > 0 ? Math.min(pctOff, maxDiscount) : pctOff;
  }

  // fixed | flat
  return discountValue;
}

export function isPercentageCoupon(coupon: { discount_type?: string }): boolean {
  return String(coupon.discount_type || '').toLowerCase() === 'percentage';
}
