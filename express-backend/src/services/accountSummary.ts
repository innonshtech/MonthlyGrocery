import { supabase } from '../config/supabase';
import { enrichConsumerOrder } from '../utils/orderEnrichment';
import { filterCouponsForUser } from '../routes/coupons';

export interface AccountSummaryResult {
  total_saved: number;
  joined_month: string;
  available_coupons_count: number;
  order_count: number;
}

export async function buildAccountSummary(consumerId: string): Promise<AccountSummaryResult> {
  const { readDb } = require('../config/localDb');
  const db = readDb() as any;

  const localOrders = (db.orders || [])
    .filter((o: any) => o.consumer_id === consumerId)
    .map((o: any) => enrichConsumerOrder(o));

  let supaOrders: any[] = [];
  const { data: supaData } = await supabase
    .from('orders')
    .select('id, total_amount, discount_amount, status, created_at, total_savings, coupon_code')
    .eq('consumer_id', consumerId)
    .order('created_at', { ascending: false });

  if (supaData?.length) {
    supaOrders = supaData.map((o: any) => enrichConsumerOrder(o));
  }

  const mergedMap = new Map<string, any>();
  for (const o of localOrders) mergedMap.set(o.id, o);
  for (const o of supaOrders) {
    if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
  }

  const orders = Array.from(mergedMap.values())
    .filter((o) => (o.status || '').toLowerCase() !== 'cancelled')
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const totalSaved = orders.reduce(
    (sum, o) => sum + (Number(o.total_savings) || 0),
    0,
  );

  const firstOrder = orders[0];
  const joinedMonth = firstOrder
    ? new Date(firstOrder.created_at).toLocaleDateString('en-IN', { month: 'long' })
    : '';

  const availableCoupons = filterCouponsForUser(consumerId, db.orders || []);

  return {
    total_saved: Math.round(totalSaved),
    joined_month: joinedMonth,
    available_coupons_count: availableCoupons.length,
    order_count: orders.length,
  };
}
