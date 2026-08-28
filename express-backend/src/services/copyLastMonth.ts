import {
  fetchLocationCatalogMap,
  formatPackLabel,
  loadConsumerOrders,
} from './oneClickCart';

export interface CopyLastMonthItem {
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

export interface CopyLastMonthScreenMessages {
  changes_all_good_message: string;
  changes_both_template: string;
  changes_repriced_only_template: string;
  changes_unavailable_only_template: string;
}

export interface CopyLastMonthResult {
  has_order: boolean;
  order_id: string | null;
  month_label: string;
  delivered_date_label: string;
  item_count: number;
  available_count: number;
  repriced_count: number;
  unavailable_count: number;
  total_amount: number;
  changes_message: string;
  items: CopyLastMonthItem[];
}

function applyTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export function buildChangesMessage(
  config: CopyLastMonthScreenMessages,
  repriced: number,
  unavailable: number,
): string {
  if (repriced === 0 && unavailable === 0) {
    return config.changes_all_good_message;
  }
  if (repriced > 0 && unavailable > 0) {
    return applyTemplate(config.changes_both_template, {
      repriced,
      unavailable,
    });
  }
  if (repriced > 0) {
    return applyTemplate(config.changes_repriced_only_template, { repriced });
  }
  return applyTemplate(config.changes_unavailable_only_template, { unavailable });
}

export async function buildCopyLastMonth(
  consumerId: string,
  city?: string,
  area?: string,
  messages?: CopyLastMonthScreenMessages,
): Promise<CopyLastMonthResult> {
  const empty: CopyLastMonthResult = {
    has_order: false,
    order_id: null,
    month_label: '',
    delivered_date_label: '',
    item_count: 0,
    available_count: 0,
    repriced_count: 0,
    unavailable_count: 0,
    total_amount: 0,
    changes_message: messages?.changes_all_good_message || '',
    items: [],
  };

  const orders = await loadConsumerOrders(consumerId, new Date(0));
  if (!orders.length) return empty;

  const order = orders[0];
  const orderDate = new Date(order.created_at);
  const monthLabel = orderDate.toLocaleDateString('en-IN', { month: 'long' });
  const deliveredLabel = orderDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
  });

  const catalogMap = await fetchLocationCatalogMap(city, area);

  let repricedCount = 0;
  let unavailableCount = 0;
  const items: CopyLastMonthItem[] = [];

  for (const it of order.order_items || []) {
    const productId = it.product_id;
    if (!productId) continue;

    const catalog = catalogMap.get(productId);
    const orderPrice = parseFloat(String(it.unit_price)) || 0;
    const livePrice = catalog ? Number(catalog.price) || 0 : orderPrice;
    const liveMrp = catalog ? Number(catalog.mrp) || livePrice : orderPrice;
    const stock = catalog?.stock;
    const available =
      catalog &&
      livePrice > 0 &&
      (stock == null || Number(stock) > 0);

    if (available && orderPrice > 0 && Math.round(orderPrice) !== Math.round(livePrice)) {
      repricedCount++;
    }
    if (!available) unavailableCount++;

    const name = (it.product_name || catalog?.name || '').trim();
    if (!name) continue;

    const qty = parseInt(String(it.quantity), 10) || 1;

    items.push({
      product_id: productId,
      name,
      unit_label: catalog ? formatPackLabel(catalog) : '',
      price: livePrice,
      mrp: liveMrp,
      previous_price:
        available &&
        orderPrice > 0 &&
        Math.round(orderPrice) !== Math.round(livePrice)
          ? orderPrice
          : null,
      quantity: qty,
      available: Boolean(available),
      image_url: catalog?.image_url || it.image_url || '',
      shop_id: catalog?.shop_id || null,
      brand: catalog?.brand || '',
      primary_category: catalog?.primary_category || '',
    });
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const availableItems = items.filter((i) => i.available && i.quantity > 0);
  const availableCount = availableItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = Math.round(
    availableItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  const changesMessage = messages
    ? buildChangesMessage(messages, repricedCount, unavailableCount)
    : '';

  return {
    has_order: items.length > 0,
    order_id: order.id,
    month_label: monthLabel,
    delivered_date_label: deliveredLabel,
    item_count: itemCount,
    available_count: availableCount,
    repriced_count: repricedCount,
    unavailable_count: unavailableCount,
    total_amount: totalAmount,
    changes_message: changesMessage,
    items,
  };
}
