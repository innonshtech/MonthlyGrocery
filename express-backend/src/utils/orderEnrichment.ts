const STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  packing: 2,
  dispatched: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
};

export const MERCHANT_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export function normalizeMerchantOrderStatus(status?: string): string {
  const value = (status || 'pending').toLowerCase();
  if (value === 'packing' || value === 'dispatched') return 'packed';
  return value;
}

export function resolveMerchantOrderStatus(status?: string): string | null {
  const normalized = normalizeMerchantOrderStatus(status);
  return (MERCHANT_ORDER_STATUSES as readonly string[]).includes(normalized) ? normalized : null;
}

export function getNextMerchantOrderStatus(current?: string): string | null {
  const flow: Record<string, string> = {
    pending: 'confirmed',
    confirmed: 'packed',
    packed: 'out_for_delivery',
    out_for_delivery: 'delivered',
  };
  return flow[normalizeMerchantOrderStatus(current)] || null;
}

const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed']);

export function canConsumerCancelOrder(status?: string): boolean {
  return CANCELLABLE_STATUSES.has((status || '').toLowerCase());
}

export function buildDefaultRefundMessage(order: Record<string, any>): string {
  if (order.refund_message) return String(order.refund_message);
  const method = String(order.payment_method || 'COD').toUpperCase();
  if (method === 'COD') return 'No payment was collected for this order.';
  if (method === 'UPI') return 'Back to your UPI app in 3–5 business days';
  if (method === 'CARD') return 'Back to your card in 3–5 business days';
  return 'Refund timeline depends on your payment method.';
}

export function getOrderStatusRank(status?: string): number {
  return STATUS_RANK[(status || 'confirmed').toLowerCase()] ?? 0;
}

export function formatDisplayOrderId(order: { id?: string; display_id?: string }): string {
  if (order.display_id) {
    const d = String(order.display_id).replace(/^#/, '');
    return d.startsWith('MG') ? `#${d}` : `#MG${d}`;
  }
  const raw = String(order.id || '');
  if (raw.startsWith('MG')) return `#${raw}`;
  const compact = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!compact) return '#MG00000';
  return `#MG${compact.slice(-5)}`;
}

export function resolveStoredDisplayId(order: { id?: string; display_id?: string }): string | undefined {
  if (order.display_id) {
    return String(order.display_id).replace(/^#/, '');
  }
  const raw = String(order.id || '');
  if (raw.startsWith('MG')) return raw;
  const compact = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!compact) return undefined;
  return `MG${compact.slice(-5)}`;
}

export function sanitizeOrderAddress(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .replace(/,\s*undefined/gi, '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim()
    .replace(/^,\s*|,\s*$/g, '');
}

export function resolveDeliverToLabel(order: Record<string, any>): string | null {
  const label = sanitizeOrderAddress(order.deliver_to_label);
  if (label) return label;
  const address = sanitizeOrderAddress(order.shipping_address || order.delivery_address);
  return address || null;
}

export function formatOrderTimeLabel(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

export function formatOrderDateLabel(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatOrderDateTimeLabel(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function buildStatusTimeline(order: Record<string, any>) {
  const rank = getOrderStatusRank(order.status);
  const steps = [
    { key: 'confirmed', at: order.confirmed_at || order.created_at, minRank: 1 },
    { key: 'packed', at: order.packed_at, minRank: 2 },
    { key: 'out_for_delivery', at: order.out_for_delivery_at || order.dispatched_at, minRank: 3 },
    { key: 'delivered', at: order.delivered_at, minRank: 4 },
  ];

  return steps.map((step) => ({
    key: step.key,
    at: step.at || null,
    time_label: formatOrderTimeLabel(step.at),
    completed: rank >= step.minRank,
    active:
      rank >= step.minRank &&
      (step.key === 'confirmed' && rank === 1 ||
        step.key === 'packed' && rank === 2 ||
        step.key === 'out_for_delivery' && rank === 3 ||
        step.key === 'delivered' && rank === 4),
  }));
}

export function countOrderItems(order: Record<string, any>): number {
  return (order.order_items || []).reduce(
    (sum: number, item: any) => sum + (parseInt(String(item.quantity), 10) || 1),
    0,
  );
}

export function enrichConsumerOrder(order: Record<string, any>) {
  const rank = getOrderStatusRank(order.status);
  const itemCount = countOrderItems(order);
  const productSavings = Number(order.product_savings) || 0;
  const discountAmount = Number(order.discount_amount) || 0;

  return {
    ...order,
    display_id: resolveStoredDisplayId(order),
    shipping_address: sanitizeOrderAddress(order.shipping_address || order.delivery_address),
    deliver_to_label: resolveDeliverToLabel(order),
    item_count: itemCount,
    status_timeline: buildStatusTimeline(order),
    is_active: rank >= 1 && rank < 4,
    is_cancelled: order.status === 'cancelled',
    is_delivered: order.status === 'delivered',
    can_cancel: canConsumerCancelOrder(order.status),
    cancelled_by: order.cancelled_by || null,
    refund_message:
      order.status === 'cancelled'
        ? buildDefaultRefundMessage(order)
        : order.refund_message || null,
    total_savings:
      Number(order.total_savings) || productSavings + discountAmount,
    payment_method_label:
      order.payment_method_label ||
      (order.payment_method === 'COD'
        ? 'Cash on Delivery'
        : order.payment_method === 'UPI'
          ? 'UPI'
          : order.payment_method === 'CARD'
            ? 'Card'
            : order.payment_method || 'Cash on Delivery'),
  };
}

export const STATUS_TIMESTAMP_FIELDS: Record<string, string> = {
  confirmed: 'confirmed_at',
  packed: 'packed_at',
  packing: 'packed_at',
  dispatched: 'dispatched_at',
  out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
};

export function applyStatusTimestamps(order: Record<string, any>, status: string) {
  const normalized = status.toLowerCase();
  const field = STATUS_TIMESTAMP_FIELDS[normalized];
  const now = new Date().toISOString();

  if (field && !order[field]) {
    order[field] = now;
  }

  if (!order.confirmed_at && normalized !== 'cancelled') {
    order.confirmed_at = order.created_at || now;
  }

  if (normalized === 'out_for_delivery' && !order.dispatched_at) {
    order.dispatched_at = now;
  }

  if (normalized === 'cancelled') {
    order.cancelled_at = order.cancelled_at || now;
  }

  return order;
}
