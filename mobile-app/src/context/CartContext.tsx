import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  brand: string;
  primary_category: string;
  image_url: string;
  unit: string;
  mrp: number;
  price: number;
  place?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  minOrderLimit: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [minOrderLimit, setMinOrderLimit] = useState(2500);
  const [cartLoaded, setCartLoaded] = useState(false);

  // 1. Load persisted cart and backend config on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem('@guest_cart');
        if (saved) {
          setItems(JSON.parse(saved));
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
        console.error('Failed to fetch config from backend:', err);
      }
    };
    loadCart();
    fetchConfig();
  }, []);

  // 2. Save cart whenever it changes (only after loading is complete)
  useEffect(() => {
    if (!cartLoaded) return;
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('@guest_cart', JSON.stringify(items));
      } catch (err) {
        console.error('Failed to persist cart:', err);
      }
    };
    saveCart();
  }, [items, cartLoaded]);

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, minOrderLimit, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, itemCount }}>
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
