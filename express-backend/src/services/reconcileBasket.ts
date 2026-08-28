import { fetchLocationCatalogMap, formatPackLabel } from './oneClickCart';

export interface ReconcileBasketInputItem {
  product_id: string;
  quantity: number;
  unit_price?: number;
  name?: string;
  image_url?: string;
  shop_id?: string;
  brand?: string;
  primary_category?: string;
  unit_label?: string;
  mrp?: number;
}

export interface ReconciledBasketItem {
  product_id: string;
  name: string;
  unit_label: string;
  price: number;
  mrp: number;
  quantity: number;
  available: boolean;
  image_url: string;
  shop_id: string | null;
  brand: string;
  primary_category: string;
}

export async function reconcileBasketItems(
  items: ReconcileBasketInputItem[],
  city?: string,
  area?: string,
): Promise<ReconciledBasketItem[]> {
  const catalogMap = await fetchLocationCatalogMap(city, area);
  const results: ReconciledBasketItem[] = [];

  for (const it of items) {
    const productId = it.product_id;
    if (!productId) continue;

    const catalog = catalogMap.get(productId);
    const storedPrice = parseFloat(String(it.unit_price ?? 0)) || 0;
    const livePrice = catalog ? Number(catalog.price) || 0 : storedPrice;
    const liveMrp = catalog ? Number(catalog.mrp) || livePrice : Number(it.mrp) || storedPrice;
    const stock = catalog?.stock;
    const available =
      catalog &&
      livePrice > 0 &&
      (stock == null || Number(stock) > 0);

    const name = (catalog?.name || it.name || '').trim();
    if (!name) continue;

    const qty = parseInt(String(it.quantity), 10) || 1;

    results.push({
      product_id: productId,
      name,
      unit_label: catalog ? formatPackLabel(catalog) : (it.unit_label || '').trim(),
      price: livePrice,
      mrp: liveMrp,
      quantity: qty,
      available: Boolean(available),
      image_url: catalog?.image_url || it.image_url || '',
      shop_id: catalog?.shop_id || it.shop_id || null,
      brand: catalog?.brand || it.brand || '',
      primary_category: catalog?.primary_category || it.primary_category || '',
    });
  }

  return results;
}

export function buildItemsPreview(names: string[], maxNames = 4): string {
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
