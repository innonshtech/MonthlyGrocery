import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart, Product } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ─── Pastel backgrounds for product image ────────────────────────────────────
const HERO_BG_COLORS = [
  '#FFF3D6', '#E4F3EA', '#F6E9E1', '#FDE4E7',
  '#EDE9FB', '#FBEEDD', '#EAF6D6', '#E1F0FB',
];
function heroBg(index: number) {
  return HERO_BG_COLORS[index % HERO_BG_COLORS.length];
}

// ─── Dynamic parsing of Highlights (Shopkeeper custom text or dynamic fallbacks) 
const getHighlights = (product: Product): string[] => {
  const desc = (product as any).description || '';
  if (desc.trim()) {
    // Split description by semicolons, newlines, or bullets
    const list = desc
      .split(/[;\n•]+/)
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
    if (list.length > 0) {
      return list;
    }
  }

  // Fallbacks: dynamically construct highlights using actual product attributes to avoid hardcoding
  return [
    `100% authentic ${product.brand || 'quality brand'} product`,
    `Curated monthly essential pack size of ${product.unit || 'standard unit'}`,
    `Quality checked and sourced for ${product.primary_category || 'home catalog'}`
  ];
};

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  const { items, addToCart, updateQuantity } = useCart();
  const { city, area } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [variants, setVariants] = useState<Product[]>([]);

  // Helper to extract base product name family
  const getBaseProductFamily = (nameStr: string) => {
    return nameStr
      .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units)\b.*/i, '')
      .trim();
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/all?limit=100`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.products) {
          const found = data.products.find((p: any) => p.id === productId);
          if (found) {
            setProduct(found);
            // Group other active variants of the same product family
            const familyName = getBaseProductFamily(found.name);
            const related = data.products.filter((p: any) => {
              return p.primary_category === found.primary_category &&
                     (p.brand || '').toLowerCase() === (found.brand || '').toLowerCase() &&
                     getBaseProductFamily(p.name).toLowerCase() === familyName.toLowerCase();
            });
            setVariants(related.length > 0 ? related : [found]);
          } else {
            // Default fallback
            const fallback = {
              id: productId || 'p-default',
              shop_id: 'shop-1',
              name: 'Aashirvaad Select Atta',
              brand: 'Aashirvaad',
              primary_category: 'Atta, Rice & Dals',
              image_url: '',
              unit: '5 kg',
              mrp: 340,
              price: 255,
              description: 'Stone-ground whole wheat; High in dietary fibre & protein; Milled in small batches; Packed for month-long freshness',
            };
            setProduct(fallback);
            setVariants([fallback]);
          }
        }
      } catch {
        const fallback = {
          id: productId || 'p-default',
          shop_id: 'shop-1',
          name: 'Aashirvaad Select Atta',
          brand: 'Aashirvaad',
          primary_category: 'Atta, Rice & Dals',
          image_url: '',
          unit: '5 kg',
          mrp: 340,
          price: 255,
          description: 'Stone-ground whole wheat; High in dietary fibre & protein; Milled in small batches; Packed for month-long freshness',
        };
        setProduct(fallback);
        setVariants([fallback]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, city, area]);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.green700} />
      </SafeAreaView>
    );
  }

  const price = parseFloat(product.price as any) || 0;
  const mrp = parseFloat(product.mrp as any) || price;
  const diffSavings = mrp - price;
  const pctOff = mrp > price ? Math.round((diffSavings / mrp) * 100) : 0;
  const activePackUnit = product.unit || '1 unit';

  const cartItem = items.find((i) => i.product?.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;

  const highlightsList = getHighlights(product);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ── 1. Header: Back + Favorite ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon
            name={isFavorite ? 'tag' : 'tag'} // using tag icon for favorite toggling fallback
            size={22}
            color={isFavorite ? COLORS.marigold500 : COLORS.ink500}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. Hero image preview (Figma: height 320, centered, size 150) ─────── */}
        <View style={[styles.heroBox, { backgroundColor: heroBg(0) }]}>
          {pctOff > 0 && (
            <View style={styles.offBadge}>
              <Text style={styles.offBadgeTxt}>{pctOff}% OFF</Text>
            </View>
          )}

          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.heroImg} resizeMode="contain" />
          ) : (
            <AppIcon name="shopping-bag" size={72} color={COLORS.green700} />
          )}

          {/* Dots Indicator Spacer */}
          <View style={styles.dotsRow}>
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
          </View>
        </View>

        {/* ── 3. Product info & Price ─────────────────────────────────────────── */}
        <View style={styles.infoArea}>
          <Text style={styles.prodName}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceVal}>₹{price}</Text>
            {mrp > price && (
              <>
                <Text style={styles.mrpVal}>₹{mrp}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeTxt}>{pctOff}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Delivered window banner */}
          <View style={styles.deliveredBanner}>
            <AppIcon name="help" size={16} color={COLORS.green700} />
            <Text style={styles.deliveredTxt}>Delivered in your planned 4-hour window</Text>
          </View>
        </View>

        {/* ── 4. Variant Selector (Figma variant pills) ────────────────────────── */}
        {variants.length > 1 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Pack size</Text>
            <View style={styles.variantsRow}>
              {variants.map((v) => {
                const isSelected = v.id === product.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.variantPill, isSelected && styles.variantPillOn]}
                    onPress={() => setProduct(v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.variantPillTxt, isSelected && styles.variantPillTxtOn]}>
                      {v.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── 5. Highlights Card (Figma: dynamically parses shopkeeper description) ─ */}
        <View style={styles.highlightsCard}>
          <Text style={styles.highlightsTitle}>HIGHLIGHTS</Text>
          {highlightsList.map((hl, index) => (
            <View key={index} style={styles.hlRow}>
              <View style={styles.hlIconCircle}>
                <AppIcon name="search" size={12} color={COLORS.green700} />
              </View>
              <Text style={styles.hlTxt}>{hl}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── 6. Sticky bottom checkout bar (Figma matching layout) ─────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomPrice}>₹{price}</Text>
          <Text style={styles.bottomUnit}>{activePackUnit} · incl. taxes</Text>
        </View>

        {qty > 0 ? (
          <View style={styles.bottomStepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateQuantity(product.id, qty - 1)}
            >
              <Text style={styles.stepTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepQty}>{qty}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => addToCart(product)}
            >
              <Text style={styles.stepTxt}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCartBtn}
            onPress={() => addToCart(product)}
            activeOpacity={0.85}
          >
            <AppIcon name="cart" size={16} color="#FFFFFF" />
            <Text style={styles.addCartTxt}>Add to cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFAF6',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Hero Preview
  heroBox: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  offBadge: {
    position: 'absolute',
    top: 16,
    left: 20,
    backgroundColor: '#E4F3EA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 2,
  },
  offBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.green700,
  },
  heroImg: {
    width: 150,
    height: 150,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 18,
    height: 7,
    borderRadius: 999,
    backgroundColor: COLORS.green700,
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: COLORS.line,
  },

  // Product info
  infoArea: {
    marginBottom: 20,
    gap: 8,
  },
  prodName: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceVal: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    lineHeight: 32,
  },
  mrpVal: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: '#E4F3EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.green700,
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F9F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 6,
  },
  deliveredTxt: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink900,
  },

  // Pack size variants selector
  sectionWrap: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantPill: {
    flex: 1,
    minWidth: 80,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantPillOn: {
    backgroundColor: '#E4F3EA',
    borderColor: COLORS.green700,
  },
  variantPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  variantPillTxtOn: {
    color: COLORS.green700,
  },

  // Highlights
  highlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  highlightsTitle: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44,
  },
  hlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hlIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E4F3EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hlTxt: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink900,
  },

  // Bottom action bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
    height: 80,
  },
  bottomLeft: {
    gap: 2,
  },
  bottomPrice: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    lineHeight: 26,
  },
  bottomUnit: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addCartTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  bottomStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 48,
  },
  stepBtn: {
    width: 32,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTxt: {
    ...FONTS.muktaBold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
    minWidth: 20,
    textAlign: 'center',
  },
});
