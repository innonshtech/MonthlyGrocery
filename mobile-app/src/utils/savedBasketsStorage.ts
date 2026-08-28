import AsyncStorage from '@react-native-async-storage/async-storage';

export const SAVED_BASKETS_KEY = '@saved_baskets';

export interface SavedBasketItem {
  product_id: string;
  name: string;
  price: number;
  mrp: number;
  quantity: number;
  unit_label: string;
  image_url: string;
  shop_id: string;
  brand: string;
  primary_category: string;
}

export interface SavedBasket {
  id: string;
  name: string;
  created_at: string;
  items: SavedBasketItem[];
  item_count: number;
  total_amount: number;
  summary_preview: string;
}

function buildPreview(names: string[], maxNames: number): string {
  const cleaned = names
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, maxNames)
    .map((n) => {
      const short = n.split(/[,(]/)[0].trim();
      const words = short.split(/\s+/);
      return words.slice(-1)[0]?.toLowerCase() || short.toLowerCase();
    });
  return cleaned.join(', ');
}

function isLegacyDummyProductId(productId: string): boolean {
  return /^p-\d+$/i.test(productId);
}

export function normalizeSavedBasket(raw: any, previewCount = 4): SavedBasket | null {
  if (!raw?.id || !raw?.name) return null;

  const items: SavedBasketItem[] = (raw.items || [])
    .map((it: any) => {
      const productId = String(it.product_id || it.id || '').trim();
      const name = String(it.name || it.product_name || '').trim();
      if (!productId || !name || isLegacyDummyProductId(productId)) return null;

      const price = Number(it.price ?? it.unit_price) || 0;
      const quantity = parseInt(String(it.quantity ?? it.qty), 10) || 1;

      return {
        product_id: productId,
        name,
        price,
        mrp: Number(it.mrp) || price,
        quantity,
        unit_label: String(it.unit_label || it.unit || '').trim(),
        image_url: String(it.image_url || '').trim(),
        shop_id: String(it.shop_id || '').trim(),
        brand: String(it.brand || '').trim(),
        primary_category: String(it.primary_category || '').trim(),
      };
    })
    .filter(Boolean) as SavedBasketItem[];

  if (!items.length) return null;

  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total_amount = Math.round(
    items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  return {
    id: String(raw.id),
    name: String(raw.name).trim(),
    created_at: raw.created_at || new Date().toISOString(),
    items,
    item_count,
    total_amount: Number(raw.total_amount ?? raw.price) || total_amount,
    summary_preview: raw.summary_preview || buildPreview(items.map((i) => i.name), previewCount),
  };
}

export function mergeReconciledIntoBasket(
  basket: SavedBasket,
  reconciled: Array<{
    product_id: string;
    name: string;
    unit_label: string;
    price: number;
    mrp: number;
    quantity: number;
    image_url: string;
    shop_id: string | null;
    brand: string;
    primary_category: string;
  }>,
): SavedBasket {
  const byId = new Map(reconciled.map((r) => [r.product_id, r]));

  const items = basket.items.map((it) => {
    const live = byId.get(it.product_id);
    if (!live) return it;
    return {
      ...it,
      name: live.name || it.name,
      price: live.price,
      mrp: live.mrp,
      quantity: live.quantity || it.quantity,
      unit_label: live.unit_label || it.unit_label,
      image_url: live.image_url || it.image_url,
      shop_id: live.shop_id || it.shop_id,
      brand: live.brand || it.brand,
      primary_category: live.primary_category || it.primary_category,
    };
  });

  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total_amount = Math.round(
    items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  return {
    ...basket,
    items,
    item_count,
    total_amount,
  };
}

export function buildBasketSummary(
  basket: SavedBasket,
  template: string,
): string {
  return template
    .replace(/\{count\}/g, String(basket.item_count))
    .replace(/\{preview\}/g, basket.summary_preview);
}

export async function loadSavedBaskets(previewCount = 4): Promise<SavedBasket[]> {
  try {
    const saved = await AsyncStorage.getItem(SAVED_BASKETS_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((b) => normalizeSavedBasket(b, previewCount))
      .filter(Boolean) as SavedBasket[];
  } catch {
    return [];
  }
}

export async function persistSavedBaskets(baskets: SavedBasket[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_BASKETS_KEY, JSON.stringify(baskets));
}

export function basketFromOrderItems(
  name: string,
  orderItems: Array<{
    id?: string;
    product_id?: string;
    name?: string;
    price?: number;
    unit_price?: number;
    qty?: number;
    quantity?: number;
    unit?: string;
    image_url?: string;
    shop_id?: string;
    brand?: string;
    primary_category?: string;
    mrp?: number;
  }>,
  previewCount = 4,
): SavedBasket | null {
  const cartLike = orderItems
    .map((oi) => {
      const productId = String(oi.product_id || oi.id || '').trim();
      const itemName = String(oi.name || '').trim();
      if (!productId || !itemName) return null;
      const price = Number(oi.unit_price ?? oi.price) || 0;
      return {
        product: {
          id: productId,
          name: itemName,
          price,
          mrp: Number(oi.mrp) || price,
          unit: String(oi.unit || '').trim(),
          image_url: String(oi.image_url || '').trim(),
          shop_id: String(oi.shop_id || '').trim(),
          brand: String(oi.brand || '').trim(),
          primary_category: String(oi.primary_category || '').trim(),
        },
        quantity: parseInt(String(oi.quantity ?? oi.qty), 10) || 1,
      };
    })
    .filter(Boolean) as Array<{ product: any; quantity: number }>;

  return basketFromCartItems(name, cartLike, previewCount);
}

export function basketFromCartItems(
  name: string,
  cartItems: Array<{ product: any; quantity: number }>,
  previewCount = 4,
): SavedBasket | null {
  const items: SavedBasketItem[] = cartItems
    .map((ci) => {
      const p = ci.product;
      if (!p?.id || !p?.name) return null;
      const price = Number(p.price) || 0;
      return {
        product_id: String(p.id),
        name: String(p.name).trim(),
        price,
        mrp: Number(p.mrp) || price,
        quantity: ci.quantity || 1,
        unit_label: String(p.unit || '').trim(),
        image_url: String(p.image_url || '').trim(),
        shop_id: String(p.shop_id || '').trim(),
        brand: String(p.brand || '').trim(),
        primary_category: String(p.primary_category || '').trim(),
      };
    })
    .filter(Boolean) as SavedBasketItem[];

  if (!items.length) return null;

  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total_amount = Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));

  return {
    id: `sb-${Date.now()}`,
    name: name.trim(),
    created_at: new Date().toISOString(),
    items,
    item_count,
    total_amount,
    summary_preview: buildPreview(items.map((i) => i.name), previewCount),
  };
}
