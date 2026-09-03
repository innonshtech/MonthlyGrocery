import { supabase } from '../config/supabase';
import { enrichConsumerOrder } from '../utils/orderEnrichment';
import { fetchProductsForLocation } from './shopCatalog';

export interface OneClickCartItem {
  product_id: string;
  name: string;
  unit_label: string;
  price: number;
  mrp: number;
  previous_price: number | null;
  quantity: number;
  available: boolean;
  image_url: string;
  shop_id: string | null;
  brand: string;
  primary_category: string;
}

export interface OneClickCartGroup {
  section_label: string;
  items: OneClickCartItem[];
}

export interface OneClickCartResult {
  has_history: boolean;
  source_months: number;
  item_count: number;
  total_amount: number;
  groups: OneClickCartGroup[];
}

type SectionOverrides = Record<string, string>;

function resolveSectionLabel(category: string, overrides: SectionOverrides): string {
  if (overrides[category]) return overrides[category];
  return category.trim().toUpperCase();
}

export function formatPackLabel(product: Record<string, any>): string {
  const qu = product.quantity_unit;
  const qv = product.quantity_value;
  if (qu && qv != null && parseFloat(String(qv)) > 0) {
    const code = String(qu).trim();
    const display = code === 'L' ? 'L' : code.toLowerCase();
    return `${qv} ${display}`;
  }
  return (product.unit || '').trim();
}

export async function fetchLocationCatalogMap(
  city?: string,
  area?: string,
  pincode?: string,
): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  if (!city?.trim() || !area?.trim()) return map;

  const catalog = await fetchProductsForLocation({
    city: city.trim(),
    areaName: area.trim(),
    pincode: pincode?.trim(),
    limit: 500,
  });

  for (const product of catalog.products) {
    map.set(product.id, product);
  }

  return map;
}

export async function loadConsumerOrders(consumerId: string, since: Date): Promise<any[]> {
  const { readDb } = require('../config/localDb');
  const db = readDb();

  const localOrders = (db.orders || [])
    .filter(
      (o: any) =>
        o.consumer_id === consumerId &&
        (o.status || '').toLowerCase() !== 'cancelled' &&
        new Date(o.created_at) >= since,
    )
    .map((o: any) => enrichConsumerOrder(o));

  const { data: supaData } = await supabase
    .from('orders')
    .select(
      'id, status, created_at, order_items(product_id, quantity, unit_price, products(name))',
    )
    .eq('consumer_id', consumerId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  const merged = new Map<string, any>();
  for (const o of localOrders) merged.set(o.id, o);
  for (const o of supaData || []) {
    if ((o.status || '').toLowerCase() === 'cancelled') continue;
    if (!merged.has(o.id)) {
      merged.set(
        o.id,
        enrichConsumerOrder({
          ...o,
          order_items: (o.order_items || []).map((oi: any) => ({
            product_id: oi.product_id,
            product_name: oi.products?.name || '',
            quantity: oi.quantity,
            unit_price: oi.unit_price,
          })),
        }),
      );
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function buildOneClickCart(
  consumerId: string,
  city?: string,
  area?: string,
  sectionOverrides: SectionOverrides = {},
  sourceMonths = 3,
  pincode?: string,
): Promise<OneClickCartResult> {
  const since = new Date();
  since.setMonth(since.getMonth() - sourceMonths);

  const orders = await loadConsumerOrders(consumerId, since);
  if (!orders.length) {
    return {
      has_history: false,
      source_months: sourceMonths,
      item_count: 0,
      total_amount: 0,
      groups: [],
    };
  }

  const monthKeys = new Set<string>();
  const productStats = new Map<
    string,
    { totalQty: number; lastUnitPrice: number }
  >();

  for (const order of orders) {
    const d = new Date(order.created_at);
    monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
    for (const item of order.order_items || []) {
      const pid = item.product_id;
      if (!pid) continue;
      const qty = parseInt(String(item.quantity), 10) || 1;
      const unitPrice = parseFloat(String(item.unit_price)) || 0;
      const prev = productStats.get(pid);
      if (prev) {
        prev.totalQty += qty;
        if (unitPrice > 0) prev.lastUnitPrice = unitPrice;
      } else {
        productStats.set(pid, { totalQty: qty, lastUnitPrice: unitPrice });
      }
    }
  }

  const monthsCount = Math.max(1, monthKeys.size);
  const catalogMap = await fetchLocationCatalogMap(city, area, pincode);

  const lastNames = new Map<string, string>();
  for (const order of orders) {
    for (const item of order.order_items || []) {
      const pid = item.product_id;
      const pn = (item.product_name || item.name || '').trim();
      if (pid && pn) lastNames.set(pid, pn);
    }
  }

  const grouped = new Map<string, OneClickCartItem[]>();

  for (const [productId, stat] of productStats.entries()) {
    const catalog = catalogMap.get(productId);
    const suggestedQty = Math.max(1, Math.round(stat.totalQty / monthsCount));
    const livePrice = catalog ? Number(catalog.price) || 0 : stat.lastUnitPrice;
    const liveMrp = catalog ? Number(catalog.mrp) || livePrice : stat.lastUnitPrice;
    const stock = catalog?.stock;
    const available =
      catalog &&
      livePrice > 0 &&
      (stock == null || Number(stock) > 0);

    const name = catalog?.name?.trim() || lastNames.get(productId) || '';
    if (!name) continue;

    const category = catalog?.primary_category || 'Essentials';
    const sectionLabel = resolveSectionLabel(category, sectionOverrides);

    const item: OneClickCartItem = {
      product_id: productId,
      name,
      unit_label: formatPackLabel(catalog),
      price: livePrice,
      mrp: liveMrp,
      previous_price:
        stat.lastUnitPrice > 0 && Math.round(stat.lastUnitPrice) !== Math.round(livePrice)
          ? stat.lastUnitPrice
          : null,
      quantity: suggestedQty,
      available: Boolean(available),
      image_url: catalog?.image_url || '',
      shop_id: catalog?.shop_id || null,
      brand: catalog?.brand || '',
      primary_category: category,
    };

    if (!grouped.has(sectionLabel)) grouped.set(sectionLabel, []);
    grouped.get(sectionLabel)!.push(item);
  }

  const groups: OneClickCartGroup[] = Array.from(grouped.entries())
    .map(([section_label, items]) => ({
      section_label,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.section_label.localeCompare(b.section_label));

  const availableItems = groups.flatMap((g) => g.items).filter((i) => i.available);
  const itemCount = availableItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = availableItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    has_history: groups.length > 0,
    source_months: sourceMonths,
    item_count: itemCount,
    total_amount: Math.round(totalAmount),
    groups,
  };
}
