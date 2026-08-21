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

interface CategoryGroup {
  category: string;
  items: Array<{
    id: string;
    name: string;
    unit: string;
    price: number;
    mrp: number;
    qty: number;
    image_url?: string;
  }>;
}

export default function OneClickCartScreen({ navigation }: any) {
  const { city, area } = useAuth();
  const { addToCart } = useCart();
  const [generating, setGenerating] = useState(true);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);

  // Dynamically fetch live products from database and assemble the smart basket
  useEffect(() => {
    const buildSmartBasket = async () => {
      setGenerating(true);
      try {
        let url = `${API_BASE}/products/all?limit=50`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success && data.products?.length > 0) {
          const prods: Product[] = data.products;

          // Group by category dynamically from database
          const staplesCategory = prods.filter(p =>
            ['Atta & Rice', 'Dals & Pulses', 'Cooking Essentials'].includes(p.primary_category)
          );
          const oilsBeveragesCategory = prods.filter(p =>
            ['Oils & Ghee', 'Beverages', 'Dairy Staples'].includes(p.primary_category)
          );
          const othersCategory = prods.filter(p =>
            !['Atta & Rice', 'Dals & Pulses', 'Cooking Essentials', 'Oils & Ghee', 'Beverages', 'Dairy Staples'].includes(p.primary_category)
          );

          const dynamicGroups: CategoryGroup[] = [];

          if (staplesCategory.length > 0) {
            dynamicGroups.push({
              category: 'STAPLES',
              items: staplesCategory.slice(0, 4).map(p => ({
                id: p.id,
                name: p.name,
                unit: p.unit || '1 unit',
                price: parseFloat(p.price as any) || 0,
                mrp: parseFloat(p.mrp as any) || Math.round(Number(p.price) * 1.2),
                qty: p.name.toLowerCase().includes('oil') || p.name.toLowerCase().includes('atta') ? 2 : 1,
                image_url: p.image_url,
              }))
            });
          }

          if (oilsBeveragesCategory.length > 0) {
            dynamicGroups.push({
              category: 'TEA, OILS & DAIRY',
              items: oilsBeveragesCategory.slice(0, 3).map(p => ({
                id: p.id,
                name: p.name,
                unit: p.unit || '1 unit',
                price: parseFloat(p.price as any) || 0,
                mrp: parseFloat(p.mrp as any) || Math.round(Number(p.price) * 1.2),
                qty: 1,
                image_url: p.image_url,
              }))
            });
          }

          if (othersCategory.length > 0) {
            dynamicGroups.push({
              category: 'PANTRY & HOME',
              items: othersCategory.slice(0, 3).map(p => ({
                id: p.id,
                name: p.name,
                unit: p.unit || '1 unit',
                price: parseFloat(p.price as any) || 0,
                mrp: parseFloat(p.mrp as any) || Math.round(Number(p.price) * 1.2),
                qty: 1,
                image_url: p.image_url,
              }))
            });
          }

          setGroups(dynamicGroups);
        } else {
          setGroups([]);
        }
      } catch (err) {
        console.error('Error generating smart basket:', err);
        setGroups([]);
      } finally {
        setTimeout(() => {
          setGenerating(false);
        }, 1000);
      }
    };

    buildSmartBasket();
  }, [city, area]);

  const handleUpdateQty = (itemId: string, delta: number) => {
    setGroups((prevGroups) =>
      prevGroups.map((grp) => ({
        ...grp,
        items: grp.items.map((it) =>
          it.id === itemId
            ? { ...it, qty: Math.max(0, it.qty + delta) }
            : it
        ).filter((it) => it.qty > 0)
      })).filter((grp) => grp.items.length > 0)
    );
  };

  const allItems = groups.flatMap((g) => g.items);
  const totalItemCount = allItems.reduce((sum, it) => sum + it.qty, 0);
  const totalBasketPrice = allItems.reduce((sum, it) => sum + it.price * it.qty, 0);

  const handleAddAllToCart = () => {
    for (const it of allItems) {
      for (let i = 0; i < it.qty; i++) {
        addToCart({
          id: it.id,
          name: it.name,
          price: it.price,
          mrp: it.mrp,
          unit: it.unit,
          shop_id: 'shop-1',
          brand: 'Essentials',
          primary_category: 'Staples',
          image_url: it.image_url || '',
        } as any);
      }
    }

    Alert.alert(
      'Monthly Basket Added!',
      `Added ${totalItemCount} items to your active cart.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'View Cart ›', onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your monthly basket</Text>
      </View>

      {/* =========================================================================
         STATE 1: GENERATING STATE (D2 GENERATING SCREEN IN FIGMA)
         ========================================================================= */}
      {generating ? (
        <View style={styles.generatingWrap}>
          {/* Progress Ring */}
          <View style={styles.progressRingCircle}>
            <View style={styles.progressRingInner}>
              <ActivityIndicator size="large" color={COLORS.green700} />
            </View>
            <View style={styles.goldAccentDot} />
          </View>

          <Text style={styles.generatingHeading}>Building your basket</Text>
          <Text style={styles.generatingSub}>
            Analyzing live store inventory and household staples...
          </Text>

          {/* Skeleton Cards */}
          <View style={styles.skeletonCard} />
          <View style={[styles.skeletonCard, { width: '85%' }]} />
          <View style={[styles.skeletonCard, { width: '92%' }]} />
        </View>
      ) : (
        /* =========================================================================
           STATE 2: GENERATED MONTHLY BASKET REVIEW (D2 SCREEN IN FIGMA)
           ========================================================================= */
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Mint Callout Box */}
            <View style={styles.mintCallout}>
              <Text style={styles.calloutSparkle}>✦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.calloutTitle}>Live Store Catalog Basket</Text>
                <Text style={styles.calloutSub}>
                  Auto-assembled from {allItems.length} active database staples with verified prices
                </Text>
              </View>
            </View>

            {/* Categorized Product List */}
            {groups.map((group) => (
              <View key={group.category} style={styles.groupSection}>
                <Text style={styles.groupHeaderLabel}>{group.category}</Text>

                <View style={styles.groupCard}>
                  {group.items.map((item, idx) => {
                    const isLast = idx === group.items.length - 1;

                    return (
                      <View
                        key={item.id}
                        style={[styles.productRow, !isLast && styles.productRowBorder]}
                      >
                        <View style={styles.bagIconBox}>
                          <AppIcon name="shopping-bag" size={22} color={COLORS.green700} />
                        </View>

                        <View style={styles.productDetailsCol}>
                          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.productPackPrice}>
                            {item.unit} · ₹{item.price}{' '}
                            {item.mrp > item.price && (
                              <Text style={styles.strikethroughMrp}>₹{item.mrp}</Text>
                            )}
                          </Text>
                        </View>

                        {/* Dark Green Stepper Capsule */}
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
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={styles.bottomStickyBar}>
            <View>
              <Text style={styles.bottomItemsCountText}>{totalItemCount} items</Text>
              <Text style={styles.bottomPriceText}>₹{totalBasketPrice.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity
              style={styles.addAllCartBtn}
              onPress={handleAddAllToCart}
              activeOpacity={0.85}
            >
              <Text style={styles.addAllCartBtnText}>Add all to cart</Text>
            </TouchableOpacity>
          </View>
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
  /* Generating State */
  generatingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressRingCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: COLORS.green600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  progressRingInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldAccentDot: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.marigold500,
  },
  generatingHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 8,
  },
  generatingSub: {
    fontSize: 13.5,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 36,
  },
  skeletonCard: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  /* Generated Review State */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
  },
  mintCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  calloutSparkle: {
    fontSize: 16,
    color: COLORS.green700,
    fontWeight: 'bold',
    marginTop: 1,
  },
  calloutTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.green700,
    marginBottom: 2,
  },
  calloutSub: {
    fontSize: 12,
    color: COLORS.ink700,
    lineHeight: 16,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productRowBorder: {
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
  productDetailsCol: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 3,
  },
  productPackPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  strikethroughMrp: {
    fontSize: 11,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
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
  addAllCartBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAllCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
