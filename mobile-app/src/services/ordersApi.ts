import { API_BASE } from '../config/api';
import { Product } from '../context/CartContext';

export interface OrdersScreenConfig {
  title: string;
  guest_title: string;
  guest_subtitle: string;
  guest_cta_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  past_orders_section_label: string;
  active_arriving_template: string;
  track_button_label: string;
  items_count_template: string;
  reorder_button_label: string;
  delivered_status_template: string;
  delivery_otp_label: string;
  status_out_for_delivery: string;
  status_confirmed: string;
  status_packed: string;
  load_error_message: string;
  retry_label: string;
  reorder_success_title: string;
  reorder_success_message_template: string;
  reorder_keep_browsing_label: string;
  reorder_view_cart_label: string;
  reorder_error_message: string;
  error_alert_title: string;
  default_product_name: string;
}

export interface OrderDetailScreenConfig {
  title: string;
  items_section_template: string;
  items_not_delivered_template: string;
  qty_template: string;
  delivery_details_section_label: string;
  delivered_to_label: string;
  delivery_window_label: string;
  paid_via_label: string;
  paid_via_template: string;
  bill_details_title: string;
  bill_item_total_label: string;
  bill_coupon_template: string;
  bill_savings_label: string;
  bill_delivery_fee_label: string;
  bill_delivery_fee_value: string;
  bill_total_paid_label: string;
  reorder_button_label: string;
  invoice_label: string;
  get_help_label: string;
  status_timeline_section_label: string;
  active_arriving_template: string;
  status_out_for_delivery: string;
  status_confirmed: string;
  status_packed: string;
  timeline_confirmed: string;
  timeline_packed: string;
  timeline_dispatched: string;
  timeline_out_for_delivery: string;
  timeline_delivered: string;
  timeline_pending_time: string;
  timeline_expected_template: string;
  delivery_otp_label: string;
  delivery_otp_subtitle: string;
  delivery_partner_label: string;
  delivered_status_label: string;
  delivered_on_template: string;
  cancelled_status_label: string;
  cancelled_on_template: string;
  cancelled_by_you_label: string;
  cancelled_by_support_label: string;
  reorder_cancelled_button_label: string;
  cancelled_help_label: string;
  cancel_order_label: string;
  cancel_order_confirm_title: string;
  cancel_order_confirm_message: string;
  cancel_order_confirm_yes: string;
  cancel_order_confirm_no: string;
  cancel_order_error_message: string;
  refund_initiated_template: string;
  refund_eta_message: string;
  load_error_message: string;
  retry_label: string;
  reorder_success_title: string;
  reorder_success_message_template: string;
  reorder_keep_browsing_label: string;
  reorder_view_cart_label: string;
  reorder_error_message: string;
  error_alert_title: string;
  default_product_name: string;
}

export interface OrderItem {
  product_id?: string;
  product_name?: string;
  name?: string;
  unit_price?: number;
  price?: number;
  quantity?: number;
  unit?: string;
  image_url?: string;
  shop_id?: string;
  brand?: string;
  primary_category?: string;
  mrp?: number;
}

export interface OrderStatusStep {
  key: string;
  at?: string | null;
  time_label?: string | null;
  completed: boolean;
  active?: boolean;
}

export interface ConsumerOrder {
  id: string;
  display_id?: string;
  status: string;
  total_amount: number;
  discount_amount?: number;
  product_savings?: number;
  total_savings?: number;
  coupon_code?: string;
  shipping_address?: string;
  deliver_to_label?: string;
  delivery_slot?: string | null;
  delivery_otp?: string | null;
  payment_method?: string;
  payment_method_label?: string;
  delivery_partner_name?: string;
  refund_message?: string;
  cancelled_by?: string | null;
  cancelled_at?: string;
  created_at: string;
  order_items?: OrderItem[];
  item_count?: number;
  status_timeline?: OrderStatusStep[];
  is_active?: boolean;
  is_cancelled?: boolean;
  is_delivered?: boolean;
  can_cancel?: boolean;
}

export function formatOrdersTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export function getOrderDisplayId(order: ConsumerOrder): string {
  if (order.display_id) {
    const d = String(order.display_id).replace(/^#/, '');
    return d.startsWith('MG') ? `#${d}` : `#MG${d}`;
  }
  const raw = String(order.id || '');
  if (!raw) return '';
  if (raw.startsWith('MG')) return `#${raw}`;
  const compact = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!compact) return '';
  return `#MG${compact.slice(-5)}`;
}

export async function fetchOrdersScreenConfig(): Promise<OrdersScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/orders-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.orders) return data.orders as OrdersScreenConfig;
    return null;
  } catch {
    return null;
  }
}

export async function fetchOrderDetailScreenConfig(): Promise<OrderDetailScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/order-detail-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.order_detail) return data.order_detail as OrderDetailScreenConfig;
    return null;
  } catch {
    return null;
  }
}

export async function fetchMyOrders(token: string): Promise<{ orders: ConsumerOrder[]; error: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.orders)) {
      return { orders: data.orders as ConsumerOrder[], error: false };
    }
    return { orders: [], error: true };
  } catch {
    return { orders: [], error: true };
  }
}

export async function fetchOrderById(token: string, orderId: string): Promise<ConsumerOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.order) return data.order as ConsumerOrder;
    return null;
  } catch {
    return null;
  }
}

export function isActiveOrderStatus(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return ['pending', 'confirmed', 'packed', 'packing', 'dispatched', 'out_for_delivery'].includes(s);
}

export function isPackedStageStatus(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return ['packed', 'packing', 'dispatched', 'out_for_delivery'].includes(s);
}

export function canConsumerCancelOrder(order: ConsumerOrder): boolean {
  if (order.can_cancel !== undefined) return order.can_cancel;
  return ['pending', 'confirmed'].includes((order.status || '').toLowerCase());
}

export function getTimelineStepLabel(
  key: string,
  config: OrderDetailScreenConfig,
): string {
  const labels: Record<string, string> = {
    confirmed: config.timeline_confirmed,
    packed: config.timeline_packed,
    delivered: config.timeline_delivered,
  };
  return labels[key] || key;
}

export async function cancelOrder(token: string, orderId: string): Promise<{
  order: ConsumerOrder | null;
  error: string | null;
}> {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (res.ok && data.success && data.order) {
      return { order: data.order as ConsumerOrder, error: null };
    }
    return { order: null, error: data.error || 'Could not cancel order' };
  } catch {
    return { order: null, error: 'Could not cancel order' };
  }
}

export function getTimelineStepTimeLabel(
  step: OrderStatusStep,
  config: OrderDetailScreenConfig,
  deliverySlot?: string | null,
): string {
  if (step.completed && step.time_label) return step.time_label;
  if (step.key === 'delivered' && !step.completed && deliverySlot) {
    return formatOrdersTemplate(config.timeline_expected_template, { time: deliverySlot });
  }
  if (!step.completed) return config.timeline_pending_time;
  return step.time_label || config.timeline_pending_time;
}

export function addOrderItemsToCart(
  order: ConsumerOrder,
  addToCart: (product: Product) => void,
  defaultProductName?: string,
): number {
  let addedCount = 0;
  const fallbackName = defaultProductName || '';
  for (const item of order.order_items || []) {
    const priceVal = parseFloat(String(item.unit_price ?? item.price)) || 0;
    const qty = parseInt(String(item.quantity), 10) || 1;
    const name = item.product_name || item.name || fallbackName;
    if (!name) continue;
    const product: Product = {
      id: item.product_id || `order-item-${addedCount}`,
      shop_id: item.shop_id || '',
      name,
      brand: item.brand || '',
      primary_category: item.primary_category || '',
      image_url: item.image_url || '',
      unit: item.unit || '1 unit',
      mrp: parseFloat(String(item.mrp)) || priceVal,
      price: priceVal,
    };
    for (let i = 0; i < qty; i++) {
      addToCart(product);
      addedCount += 1;
    }
  }
  return addedCount;
}
