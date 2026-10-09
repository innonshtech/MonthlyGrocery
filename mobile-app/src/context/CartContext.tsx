import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';
import { useNetwork } from './NetworkContext';

export interface Product {
  id: string;
  shop_id: string;
  sku?: string;
  name: string;
  brand: string;
  primary_category: string;
  secondary_category?: string;
  image_url: string;
  images?: string[];
  video_url?: string;
  unit: string;
  mrp: number;
  price: number;
  place?: string;
  discount_percent?: number;
  description?: string;
  short_description?: string;
  quantity_value?: number;
  quantity_unit?: string;
  available?: boolean;
  in_stock?: boolean;
  stock?: number;
  shop_name?: string;
  variants?: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppliedCoupon {
  id?: string;
  code: string;
  title?: string;
  discount_type?: string;
  discount_value?: number;
  value?: number;
  discount_amount?: number;
  min_order_amount?: number;
  max_discount?: number;
}

interface CartContextType {
  items: CartItem[];
  cartShopId: string | null;
  cartShopName: string | null;
  minOrderLimit: number;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  clearAppliedCoupon: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncActiveShop: (shopId: string | null, shopName?: string | null) => void;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOffline } = useNetwork();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartShopId, setCartShopId] = useState<string | null>(null);
  const [cartShopName, setCartShopName] = useState<string | null>(null);
  const [minOrderLimit, setMinOrderLimit] = useState(2500);
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);

  // 1. Load persisted cart, active shop, and backend config on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem('@guest_cart');
        const savedShopId = await AsyncStorage.getItem('@cart_shop_id');
        const savedShopName = await AsyncStorage.getItem('@cart_shop_name');
        if (saved) {
          const parsed = JSON.parse(saved);
          setItems(parsed);
          if (savedShopId) {
            setCartShopId(savedShopId);
          } else if (parsed.length > 0 && parsed[0]?.product?.shop_id) {
            setCartShopId(parsed[0].product.shop_id);
          }
          if (savedShopName) setCartShopName(savedShopName);
        }
      } catch (err) {
        console.error('Failed to load persisted cart:', err);
      } finally {
        setCartLoaded(true);
      }
    };
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/config`);
        const data = await res.json();
        if (res.ok && data.success && data.min_order_limit) {
          setMinOrderLimit(data.min_order_limit);
        }
      } catch (err) {
        console.warn('Backend config fetch fallback to default min order limit (3000):', err);
      }
    };
    loadCart();
    fetchConfig();
  }, []);

  // 2. Save cart whenever it changes
  useEffect(() => {
    if (!cartLoaded) return;
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('@guest_cart', JSON.stringify(items));
        if (cartShopId) {
          await AsyncStorage.setItem('@cart_shop_id', cartShopId);
        } else {
          await AsyncStorage.removeItem('@cart_shop_id');
        }
        if (cartShopName) {
          await AsyncStorage.setItem('@cart_shop_name', cartShopName);
        } else {
          await AsyncStorage.removeItem('@cart_shop_name');
        }
      } catch (err) {
        console.error('Failed to persist cart:', err);
      }
    };
    saveCart();
  }, [items, cartShopId, cartShopName, cartLoaded]);

  // Sync Active Shop: When user selects or switches to a new shop, auto-clear old cart
  const syncActiveShop = useCallback((newShopId: string | null, newShopName?: string | null) => {
    if (!newShopId) return;
    setCartShopId((prevShopId) => {
      if (prevShopId && prevShopId !== newShopId) {
        // Shop switched: auto-clear old store's items for a fresh start in new shop
        setItems([]);
        setAppliedCouponState(null);
      }
      return newShopId;
    });
    if (newShopName) setCartShopName(newShopName);
  }, []);

  const addToCart = (product: Product) => {
    if (isOffline) {
      return;
    }

    // Guard: Prevent adding out of stock products
    const isOutOfStock =
      product.available === false ||
      (product as any).in_stock === false ||
      (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0);
    if (isOutOfStock) {
      return;
    }

    const targetShopId = product.shop_id || cartShopId;

    // Single-Store Cart Protection: If incoming item is from a different store, reset cart cleanly for new store
    setItems((prev) => {
      if (prev.length > 0 && cartShopId && targetShopId && cartShopId !== targetShopId) {
        // Switch to new store cleanly
        setCartShopId(targetShopId);
        if (product.shop_name) setCartShopName(product.shop_name);
        setAppliedCouponState(null);
        return [{ product, quantity: 1 }];
      }

      if (!cartShopId && targetShopId) {
        setCartShopId(targetShopId);
        if (product.shop_name) setCartShopName(product.shop_name);
      }

      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (product.stock !== undefined && product.stock !== null && existing.quantity >= Number(product.stock)) {
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      if (next.length === 0) {
        setCartShopId(null);
        setCartShopName(null);
        setAppliedCouponState(null);
      }
      return next;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock =
            item.product.stock !== undefined && item.product.stock !== null
              ? Number(item.product.stock)
              : undefined;
          const finalQty = maxStock !== undefined && maxStock > 0 ? Math.min(quantity, maxStock) : quantity;
          return { ...item, quantity: finalQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCartShopId(null);
    setCartShopName(null);
    setAppliedCouponState(null);
  };

  const setAppliedCoupon = (coupon: AppliedCoupon | null) => {
    setAppliedCouponState(coupon);
  };

  const clearAppliedCoupon = () => {
    setAppliedCouponState(null);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartShopId,
        cartShopName,
        minOrderLimit,
        appliedCoupon,
        setAppliedCoupon,
        clearAppliedCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncActiveShop,
        totalAmount,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
