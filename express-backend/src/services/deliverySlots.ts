import { readDb } from '../config/localDb';

export const SLOT_WINDOWS = [
  { id: 'w1', label: '8:00 AM – 12:00 PM', start_hour: 8, end_hour: 12 },
  { id: 'w2', label: '12:00 PM – 4:00 PM', start_hour: 12, end_hour: 16 },
  { id: 'w3', label: '4:00 PM – 8:00 PM', start_hour: 16, end_hour: 20 },
  { id: 'w4', label: '8:00 PM – 10:00 PM', start_hour: 20, end_hour: 22 },
  { id: 'w5', label: '6:00 AM – 8:00 AM', start_hour: 6, end_hour: 8 },
];

export const DEFAULT_SLOT_CAPACITY = 15;
export const FILLING_FAST_RATIO = 0.8;

export type SlotBadgeType = 'available' | 'recommended' | 'filling' | 'full';

export interface DeliverySlotConfig {
  shop_id: string;
  window_id: string;
  date: string;
  max_capacity: number;
  is_closed: boolean;
  is_recommended: boolean;
}

export interface SlotWindowAvailability {
  id: string;
  label: string;
  badge: string;
  badgeType: SlotBadgeType;
  disabled: boolean;
  booked_count: number;
  max_capacity: number;
  is_closed: boolean;
  is_recommended: boolean;
}

export interface DaySlots {
  id: string;
  date: string;
  label: string;
  day: string;
  windows: SlotWindowAvailability[];
}

function formatDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getDateLabel(dateStr: string, refDate = new Date()): string {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = startOfDay(refDate);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return target.toLocaleDateString('en-US', { weekday: 'short' });
}

export function buildDateRange(days = 4, refDate = new Date()): Array<{ date: string; label: string; day: string; id: string }> {
  const today = startOfDay(refDate);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const date = formatDateYmd(d);
    return {
      id: `day-${i}`,
      date,
      label: getDateLabel(date, refDate),
      day: String(d.getDate()),
    };
  });
}

function getConfig(
  configs: DeliverySlotConfig[],
  shopId: string,
  date: string,
  windowId: string
): DeliverySlotConfig {
  const existing = configs.find(
    (c) => c.shop_id === shopId && c.date === date && c.window_id === windowId
  );
  if (existing) return existing;
  return {
    shop_id: shopId,
    window_id: windowId,
    date,
    max_capacity: DEFAULT_SLOT_CAPACITY,
    is_closed: false,
    is_recommended: windowId === 'w3',
  };
}

function countBookings(orders: any[], shopId: string, date: string, windowId: string): number {
  return orders.filter((o) => {
    if (o.status === 'cancelled') return false;
    if (o.shop_id !== shopId) return false;
    if (o.delivery_slot_date === date && o.delivery_slot_window_id === windowId) return true;
    // Legacy orders without structured slot fields
    const label = SLOT_WINDOWS.find((w) => w.id === windowId)?.label;
    if (label && o.delivery_slot) {
      const dateLabel = getDateLabel(date);
      return o.delivery_slot.includes(dateLabel) && o.delivery_slot.includes(label);
    }
    return false;
  }).length;
}

function resolveBadge(
  booked: number,
  maxCapacity: number,
  isClosed: boolean,
  isRecommended: boolean
): { badge: string; badgeType: SlotBadgeType; disabled: boolean } {
  if (isClosed || booked >= maxCapacity) {
    return { badge: 'Full', badgeType: 'full', disabled: true };
  }
  if (booked >= maxCapacity * FILLING_FAST_RATIO) {
    return { badge: 'Filling fast', badgeType: 'filling', disabled: false };
  }
  if (isRecommended) {
    return { badge: 'Recommended', badgeType: 'recommended', disabled: false };
  }
  return { badge: 'Available', badgeType: 'available', disabled: false };
}

export function buildSlotsForShop(
  shopId: string,
  days = 4,
  refDate = new Date()
): { shop_id: string; days: DaySlots[]; windows: typeof SLOT_WINDOWS } {
  const db = readDb() as any;
  const configs: DeliverySlotConfig[] = db.delivery_slot_configs || [];
  const orders: any[] = db.orders || [];
  const dateRange = buildDateRange(days, refDate);

  const daySlots: DaySlots[] = dateRange.map((day) => {
    const windows: SlotWindowAvailability[] = SLOT_WINDOWS.map((window) => {
      const cfg = getConfig(configs, shopId, day.date, window.id);
      const booked = countBookings(orders, shopId, day.date, window.id);
      const badgeInfo = resolveBadge(booked, cfg.max_capacity, cfg.is_closed, cfg.is_recommended);

      return {
        id: window.id,
        label: window.label,
        badge: badgeInfo.badge,
        badgeType: badgeInfo.badgeType,
        disabled: badgeInfo.disabled,
        booked_count: booked,
        max_capacity: cfg.max_capacity,
        is_closed: cfg.is_closed,
        is_recommended: cfg.is_recommended,
      };
    });

    return {
      id: day.id,
      date: day.date,
      label: day.label,
      day: day.day,
      windows,
    };
  });

  return { shop_id: shopId, days: daySlots, windows: SLOT_WINDOWS };
}

export function validateSlotSelection(
  shopId: string,
  date: string,
  windowId: string
): { valid: boolean; error?: string } {
  const slots = buildSlotsForShop(shopId, 14);
  const day = slots.days.find((d) => d.date === date);
  if (!day) {
    return { valid: false, error: 'Invalid delivery date selected.' };
  }
  const window = day.windows.find((w) => w.id === windowId);
  if (!window) {
    return { valid: false, error: 'Invalid delivery window selected.' };
  }
  if (window.disabled) {
    return { valid: false, error: 'This delivery slot is full. Please choose another window.' };
  }
  return { valid: true };
}

export function upsertSlotConfig(
  shopId: string,
  date: string,
  windowId: string,
  updates: Partial<Pick<DeliverySlotConfig, 'max_capacity' | 'is_closed' | 'is_recommended'>>
): DeliverySlotConfig {
  const db = readDb() as any;
  if (!db.delivery_slot_configs) db.delivery_slot_configs = [];

  const idx = db.delivery_slot_configs.findIndex(
    (c: DeliverySlotConfig) =>
      c.shop_id === shopId && c.date === date && c.window_id === windowId
  );

  const base = getConfig(db.delivery_slot_configs, shopId, date, windowId);
  const merged: DeliverySlotConfig = {
    ...base,
    ...updates,
    shop_id: shopId,
    date,
    window_id: windowId,
    max_capacity: updates.max_capacity ?? base.max_capacity,
    is_closed: updates.is_closed ?? base.is_closed,
    is_recommended: updates.is_recommended ?? base.is_recommended,
  };

  if (idx >= 0) {
    db.delivery_slot_configs[idx] = merged;
  } else {
    db.delivery_slot_configs.push(merged);
  }

  const { writeDb } = require('../config/localDb');
  writeDb(db);
  return merged;
}
