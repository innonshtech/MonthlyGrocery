import { readDb, writeDb, ShopProduct } from '../config/localDb';
import { supabase } from '../config/supabase';

export interface OrderInventoryItem {
  product_id?: string;
  id?: string;
  quantity: number | string;
  name?: string;
  product_name?: string;
}

/**
 * Deducts stock from the merchant's store inventory when a customer places an order.
 * Updates localDb shop_products and Supabase database.
 */
export async function deductShopInventory(
  shopId: string,
  items: OrderInventoryItem[],
): Promise<{ success: boolean; updatedProducts: Array<{ product_id: string; remaining_stock: number }> }> {
  if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
    return { success: true, updatedProducts: [] };
  }

  const db = readDb();
  if (!db.shop_products) db.shop_products = [];

  const updatedProducts: Array<{ product_id: string; remaining_stock: number }> = [];

  for (const it of items) {
    const productId = it.product_id || it.id;
    const qty = parseInt(String(it.quantity), 10) || 1;
    if (!productId || qty <= 0) continue;

    // 1. Update localDb shop_products
    const spIndex = db.shop_products.findIndex(
      (sp: ShopProduct) => sp.shop_id === shopId && sp.product_id === productId,
    );

    let remainingStock = 0;

    if (spIndex !== -1) {
      const currentStock = db.shop_products[spIndex].stock || 0;
      remainingStock = Math.max(0, currentStock - qty);
      db.shop_products[spIndex].stock = remainingStock;
      if (remainingStock <= 0) {
        db.shop_products[spIndex].available = false; // Auto out-of-stock
      }
      updatedProducts.push({ product_id: productId, remaining_stock: remainingStock });
    } else {
      // If shop_product doesn't have an explicit entry yet, create one with 0 stock
      const newSp: ShopProduct = {
        id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        shop_id: shopId,
        product_id: productId,
        selling_price: 0,
        discount_percentage: 0,
        stock: 0,
        available: false,
        status: 'approved',
      };
      db.shop_products.push(newSp);
    }

    // 2. Sync with Supabase shop_products table if table exists
    try {
      await supabase
        .from('shop_products')
        .update({
          stock: remainingStock,
          available: remainingStock > 0,
          updated_at: new Date().toISOString(),
        })
        .eq('shop_id', shopId)
        .eq('product_id', productId);
    } catch {
      // ignore if table does not exist or remote schema differs
    }
  }

  writeDb(db);
  return { success: true, updatedProducts };
}

/**
 * Restores stock back to the merchant's store inventory when an order is cancelled or rejected.
 */
export async function restoreShopInventory(
  shopId: string,
  items: OrderInventoryItem[],
): Promise<{ success: boolean; restoredProducts: Array<{ product_id: string; new_stock: number }> }> {
  if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
    return { success: true, restoredProducts: [] };
  }

  const db = readDb();
  if (!db.shop_products) db.shop_products = [];

  const restoredProducts: Array<{ product_id: string; new_stock: number }> = [];

  for (const it of items) {
    const productId = it.product_id || it.id;
    const qty = parseInt(String(it.quantity), 10) || 1;
    if (!productId || qty <= 0) continue;

    const spIndex = db.shop_products.findIndex(
      (sp: ShopProduct) => sp.shop_id === shopId && sp.product_id === productId,
    );

    let newStock = qty;

    if (spIndex !== -1) {
      const currentStock = db.shop_products[spIndex].stock || 0;
      newStock = currentStock + qty;
      db.shop_products[spIndex].stock = newStock;
      if (newStock > 0) {
        db.shop_products[spIndex].available = true; // Re-enable availability
      }
      restoredProducts.push({ product_id: productId, new_stock: newStock });
    }

    // Sync with Supabase
    try {
      await supabase
        .from('shop_products')
        .update({
          stock: newStock,
          available: true,
          updated_at: new Date().toISOString(),
        })
        .eq('shop_id', shopId)
        .eq('product_id', productId);
    } catch {
      // ignore
    }
  }

  writeDb(db);
  return { success: true, restoredProducts };
}
