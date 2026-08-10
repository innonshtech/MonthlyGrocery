import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(null);

const empty = { items: [], city: "", mrp_total: 0, subtotal: 0, savings: 0, savings_percent: 0, delivery_fee: 0, platform_fee: 0, total: 0, min_order: 2500 };
const CITY_KEY = "mg_city";
const GUEST_CART_KEY = "mg_guest_cart_v1";

function readGuestItems() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(i => i && i.product_id && Number(i.quantity) > 0) : [];
  } catch (_e) { return []; }
}

function writeGuestItems(items) {
  try {
    const clean = (items || []).filter(i => i && i.product_id && Number(i.quantity) > 0);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(clean));
  } catch (_e) { /* storage unavailable, ignore */ }
}

function clearGuestItems() {
  try { localStorage.removeItem(GUEST_CART_KEY); } catch (_e) { /* ignore */ }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(empty);
  const [city, setCityState] = useState(() => {
    try { return localStorage.getItem(CITY_KEY) || ""; } catch (_e) { return ""; }
  });
  const mergedRef = useRef(false);

  const isConsumer = !!user && user !== false && user.role === "consumer";
  const isGuest = user === false; // AuthProvider sets false when unauthenticated

  const hydrateGuest = useCallback(async () => {
    const items = readGuestItems();
    if (items.length === 0) { setCart({ ...empty, city }); return; }
    try {
      const { data } = await api.post("/cart/hydrate", { items, city: city || "" });
      setCart(data);
    } catch (_e) {
      setCart({ ...empty, city });
    }
  }, [city]);

  const refresh = useCallback(async () => {
    if (isConsumer) {
      try {
        const params = city ? `?city=${encodeURIComponent(city)}` : "";
        const { data } = await api.get(`/cart/${params}`);
        setCart(data);
        if (data.city && data.city !== city) {
          setCityState(data.city);
          try { localStorage.setItem(CITY_KEY, data.city); } catch (_e) { /* ignore */ }
        }
      } catch (_e) { setCart(empty); }
    } else if (isGuest) {
      await hydrateGuest();
    } else {
      // still initialising
      setCart(empty);
    }
  }, [isConsumer, isGuest, city, hydrateGuest]);

  // Merge guest cart into user cart once, right after login.
  useEffect(() => {
    if (!isConsumer) return;
    if (mergedRef.current) return;
    const guestItems = readGuestItems();
    if (guestItems.length === 0) { mergedRef.current = true; refresh(); return; }
    (async () => {
      try {
        const { data } = await api.post("/cart/merge", { items: guestItems, city: city || "" });
        setCart(data);
        clearGuestItems();
      } catch (_e) {
        clearGuestItems();
        await refresh();
      } finally {
        mergedRef.current = true;
      }
    })();
  }, [isConsumer, city, refresh]);

  // Reset merge flag when user logs out
  useEffect(() => { if (isGuest) mergedRef.current = false; }, [isGuest]);

  useEffect(() => { refresh(); }, [refresh]);

  const setCity = async (nextCity) => {
    const value = (nextCity || "").trim();
    try { localStorage.setItem(CITY_KEY, value); } catch (_e) { /* ignore */ }
    setCityState(value);
    if (isConsumer && value) {
      try {
        const { data } = await api.post("/cart/set-city", { city: value });
        setCart(data);
      } catch (_e) { /* ignore */ }
    } else if (isGuest) {
      const items = readGuestItems();
      try {
        const { data } = await api.post("/cart/hydrate", { items, city: value });
        setCart(data);
      } catch (_e) { /* ignore */ }
    }
  };

  const addToCart = async (product_id, quantity = 1) => {
    if (isConsumer) {
      const { data } = await api.post("/cart/add", { product_id, quantity, city: city || undefined });
      setCart(data);
      return data;
    }
    // Guest path — mutate localStorage & re-hydrate
    const items = readGuestItems();
    const idx = items.findIndex(i => i.product_id === product_id);
    if (idx >= 0) items[idx].quantity = Number(items[idx].quantity) + Number(quantity);
    else items.push({ product_id, quantity: Number(quantity) });
    writeGuestItems(items);
    const { data } = await api.post("/cart/hydrate", { items, city: city || "" });
    setCart(data);
    return data;
  };

  const updateQty = async (product_id, quantity) => {
    if (isConsumer) {
      const { data } = await api.post("/cart/update", { product_id, quantity, city: city || undefined });
      setCart(data);
      return data;
    }
    let items = readGuestItems().filter(i => i.product_id !== product_id);
    if (Number(quantity) > 0) items.push({ product_id, quantity: Number(quantity) });
    writeGuestItems(items);
    const { data } = await api.post("/cart/hydrate", { items, city: city || "" });
    setCart(data);
    return data;
  };

  const clear = async () => {
    if (isConsumer) {
      const { data } = await api.post("/cart/clear");
      setCart(data);
      return data;
    }
    clearGuestItems();
    setCart({ ...empty, city });
    return empty;
  };

  return (
    <CartContext.Provider value={{ cart, city, setCity, refresh, addToCart, updateQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
