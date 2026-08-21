import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function CopyLastMonthScreen({ navigation }: any) {
  const { token, city, area } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [reconciledItems, setReconciledItems] = useState<any[]>([]);
  const [repricedCount, setRepricedCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  useEffect(() => {
    const fetchAndReconcile = async () => {
      setLoading(true);
      try {
        // 1. Fetch user's latest past order
        const ordersRes = await fetch(`${API_BASE}/orders/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersRes.json();

        // 2. Fetch live store catalog for active prices and availability
        let catalogUrl = `${API_BASE}/products/all?limit=100`;
        if (city) catalogUrl += `&city=${encodeURIComponent(city)}`;
        if (area) catalogUrl += `&area_name=${encodeURIComponent(area)}`;
        const catRes = await fetch(catalogUrl);
        const catData = await catRes.json();
        const activeProducts: Product[] = catData.success ? catData.products : [];
        const prodMap = new Map<string, Product>();
        activeProducts.forEach(p => prodMap.set(p.id, p));

        if (ordersData.success && ordersData.orders?.length > 0) {
          const prev = ordersData.orders[0];
          setLastOrder(prev);

          let repriced = 0;
          let outOfStock = 0;

          const merged = (prev.order_items || []).map((it: any) => {
            const liveProd = prodMap.get(it.product_id);
            const livePrice = liveProd ? parseFloat(liveProd.price as any) : it.unit_price;
            const liveMrp = liveProd ? parseFloat(liveProd.mrp as any) : Math.round(livePrice * 1.2);
            const available = liveProd ? ((liveProd as any).stock !== undefined ? (liveProd as any).stock > 0 : true) : true;

            if (livePrice !== it.unit_price) repriced++;
            if (!available) outOfStock++;

            return {
              id: it.product_id || it.id,
              name: it.product_name || liveProd?.name || 'Grocery Item',
              unit: it.unit || liveProd?.unit || '1 unit',
              price: livePrice,
              mrp: liveMrp,
              qty: parseInt(it.quantity) || 1,
              available,
            };
          });

          setReconciledItems(merged);
          setRepricedCount(repriced);
          setOutOfStockCount(outOfStock);
        } else {
          // If no orders yet, populate with first 4 live database items
          const initialItems = activeProducts.slice(0, 4).map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit || '1 unit',
            price: parseFloat(p.price as any) || 0,
            mrp: parseFloat(p.mrp as any) || Math.round(Number(p.price) * 1.2),
            qty: 1,
            available: true,
          }));

          setLastOrder({
            id: 'RECENT',
            created_at: new Date().toISOString(),
          });
          setReconciledItems(initialItems);
          setRepricedCount(0);
          setOutOfStockCount(0);
        }
      } catch (err) {
        console.error('Error in copy last month:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndReconcile();
  }, [token, city, area]);

  const handleUpdateQty = (itemId: string, delta: number) => {
    setReconciledItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, qty: Math.max(0, it.qty + delta) }
          : it
      )
    );
  };

  const availableItems = reconciledItems.filter((i) => i.available && i.qty > 0);
  const totalItemCount = availableItems.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = availableItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleAddToCart = () => {
    for (const it of availableItems) {
      for (let i = 0; i < it.qty; i++) {
        addToCart({
          id: it.id,
          name: `${it.name} (${it.unit})`,
          price: it.price,
          mrp: it.mrp,
          unit: it.unit,
          shop_id: 'shop-1',
          brand: 'Essentials',
          primary_category: 'Staples',
          image_url: '',
        } as any);
      }
    }

    Alert.alert(
      'Previous Basket Copied!',
      `Added ${totalItemCount} live items directly to your active cart.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'View Cart ›', onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Copy last month</Text>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Info Box */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Your basket from {lastOrder?.created_at ? new Date(lastOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Previous Order'}
            </Text>
            <Text style={styles.infoSub}>
              {reconciledItems.length} items · verified with today's live store rates
            </Text>
          </View>

          {/* Amber Notice Banner */}
          <View style={styles.amberBanner}>
            <Text style={styles.amberText}>
              ⚠️ {repricedCount > 0 ? `${repricedCount} items updated with today's prices` : 'All items verified'} · {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'all in stock'}
            </Text>
          </View>

          {/* Product Items List */}
          <View style={styles.listCard}>
            {reconciledItems.map((item, idx) => {
              const isLast = idx === reconciledItems.length - 1;

              return (
                <View
                  key={item.id}
                  style={[styles.itemRow, !isLast && styles.itemRowBorder]}
                >
                  <View style={styles.bagIconBox}>
                    <AppIcon name="shopping-bag" size={22} color={item.available ? COLORS.green700 : COLORS.ink300} />
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, !item.available && styles.itemNameMuted]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.available ? (
                      <Text style={styles.itemPriceText}>
                        {item.unit} · ₹{item.price}
                      </Text>
                    ) : (
                      <View style={styles.unavailableRow}>
                        <Text style={styles.unavailableTag}>Unavailable</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                          <Text style={styles.viewSimilarLink}>View similar ›</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {item.available && (
                    <View style={styles.stepperCapsule}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleUpdateQty(item.id, -1)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.stepperCount}>{item.qty}</Text>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleUpdateQty(item.id, 1)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Bar */}
      {!loading && (
        <View style={styles.bottomStickyBar}>
          <View>
            <Text style={styles.bottomItemsCountText}>{totalItemCount} items</Text>
            <Text style={styles.bottomPriceText}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          </View>

          <TouchableOpacity
            style={styles.addCartBtn}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <Text style={styles.addCartBtnText}>Add to cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginLeft: 8,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 3,
  },
  infoSub: {
    fontSize: 12.5,
    color: COLORS.ink500,
  },
  amberBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  amberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  bagIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 3,
  },
  itemNameMuted: {
    color: COLORS.ink500,
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  unavailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  unavailableTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewSimilarLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.green700,
  },
  stepperCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    height: 32,
    paddingHorizontal: 6,
  },
  stepperBtn: {
    width: 22,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepperCount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  bottomStickyBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  bottomItemsCountText: {
    fontSize: 12,
    color: COLORS.ink500,
    fontWeight: '600',
  },
  bottomPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  addCartBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
