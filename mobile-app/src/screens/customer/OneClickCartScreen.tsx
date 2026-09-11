import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { useCart } from '../../context/CartContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { useToast } from '../../context/ToastContext';
import {
  CheckoutBackIcon,
  SlotInfoIcon,
  BasketSaveIcon,
} from '../../components/CheckoutFigmaIcons';
import { SvgXml } from 'react-native-svg';
import {
  fetchOneClickCartBasket,
  fetchOneClickCartScreenConfig,
  formatInr,
  formatOneClickTemplate,
  OneClickCartBasket,
  OneClickCartGroup,
  OneClickCartItem,
  OneClickCartScreenConfig,
} from '../../services/oneClickCartApi';

const SPARKLE_GOLD_XML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#F59E0B"/></svg>`;

const BAG_ICON_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 6H21" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

type LocalGroup = OneClickCartGroup;

function Stepper({
  qty,
  onMinus,
  onPlus,
}: {
  qty: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepperBtn} onPress={onMinus} hitSlop={8}>
        <Text style={styles.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperCount}>{qty}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={onPlus} hitSlop={8}>
        <Text style={styles.stepperBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OneClickCartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token, city, area, pincode } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<OneClickCartScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [generating, setGenerating] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [basketMeta, setBasketMeta] = useState<Pick<
    OneClickCartBasket,
    'has_history' | 'source_months' | 'item_count' | 'total_amount'
  > | null>(null);
  const [groups, setGroups] = useState<LocalGroup[]>([]);

  const loadScreen = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchOneClickCartScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadBasket = useCallback(async (config: OneClickCartScreenConfig) => {
    if (!token) {
      setLoadError(true);
      setGenerating(false);
      return;
    }

    setGenerating(true);
    setLoadError(false);

    const { basket, error } = await fetchOneClickCartBasket(token, city, area, pincode ?? undefined);

    if (error || !basket) {
      setLoadError(true);
      setBasketMeta(null);
      setGroups([]);
    } else {
      setBasketMeta({
        has_history: basket.has_history,
        source_months: basket.source_months,
        item_count: basket.item_count,
        total_amount: basket.total_amount,
      });
      setGroups(basket.groups);
    }

    setGenerating(false);
  }, [token, city, area]);

  useFocusEffect(
    useCallback(() => {
      loadScreen().then((config) => {
        if (config) loadBasket(config);
      });
    }, [loadScreen, loadBasket]),
  );

  const handleRetry = () => {
    if (screenConfig) loadBasket(screenConfig);
    else loadScreen().then((c) => c && loadBasket(c));
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setGroups((prev) =>
      prev
        .map((grp) => ({
          ...grp,
          items: grp.items
            .map((it) =>
              it.product_id === productId
                ? { ...it, quantity: Math.max(0, it.quantity + delta) }
                : it,
            )
            .filter((it) => it.quantity > 0),
        }))
        .filter((grp) => grp.items.length > 0),
    );
  };

  const availableItems = groups
    .flatMap((g) => g.items)
    .filter((i) => i.available && i.quantity > 0);

  const totalItemCount = availableItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalBasketPrice = availableItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0,
  );

  const handleAddAllToCart = () => {
    if (!screenConfig || availableItems.length === 0) return;

    for (const it of availableItems) {
      for (let i = 0; i < it.quantity; i++) {
        addToCart({
          id: it.product_id,
          name: it.name,
          price: it.price,
          mrp: it.mrp,
          unit: it.unit_label,
          shop_id: it.shop_id || '',
          brand: it.brand,
          primary_category: it.primary_category,
          image_url: it.image_url,
        } as any);
      }
    }

    showToast({
      type: 'cart',
      title: screenConfig.add_all_success_title || 'Monthly basket added',
      message: formatOneClickTemplate(screenConfig.add_all_success_message_template, {
        count: totalItemCount,
      }),
      actionLabel: screenConfig.view_cart_label || 'View Cart',
      onAction: () => navigation.navigate('Cart'),
    });
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Building basket..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <CheckoutBackIcon size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load screen configuration.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadScreen()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const insightTitle = formatOneClickTemplate(screenConfig.insight_title_template, {
    months: basketMeta?.source_months ?? screenConfig.source_months,
  });

  const insightCount = groups
    .flatMap((g) => g.items)
    .filter((i) => i.available).length;

  const insightSubtitle = formatOneClickTemplate(screenConfig.insight_subtitle_template, {
    count: insightCount,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      {generating ? (
        <View style={styles.generatingWrap}>
          {/* Circular Progress Ring matching Figma node 156-345 */}
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <SvgXml xml={SPARKLE_GOLD_XML} width={28} height={28} />
            </View>
          </View>
          <Text style={styles.generatingTitle}>Building your basket</Text>
          <Text style={styles.generatingSub}>
            Looking at what your home buys every month..
          </Text>
          <View style={styles.skeletonStack}>
            {[1, 2, 3].map((k) => (
              <View key={`skel-${k}`} style={styles.skeletonCard}>
                <View style={styles.skelThumb} />
                <View style={styles.skelLines}>
                  <View style={styles.skelLine1} />
                  <View style={styles.skelLine2} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{screenConfig.load_error_message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>{screenConfig.retry_label}</Text>
          </TouchableOpacity>
        </View>
      ) : !city || !area ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{screenConfig.no_location_title}</Text>
          <Text style={styles.emptySub}>{screenConfig.no_location_message}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.navigate('CitySelection')}
          >
            <Text style={styles.retryBtnText}>{screenConfig.empty_cta_label}</Text>
          </TouchableOpacity>
        </View>
      ) : !basketMeta?.has_history || groups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{screenConfig.empty_title}</Text>
          <Text style={styles.emptySub}>{screenConfig.empty_message}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.retryBtnText}>{screenConfig.empty_cta_label}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Insight Card (Figma node 149-278) */}
            <View style={styles.insightCard}>
              <View style={styles.insightIconCircle}>
                <SvgXml xml={SPARKLE_GOLD_XML} width={18} height={18} />
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>{insightTitle}</Text>
                <Text style={styles.insightSub}>{insightSubtitle}</Text>
              </View>
            </View>

            {groups.map((group) => (
              <View key={group.section_label} style={styles.groupSection}>
                <Text style={styles.sectionLabel}>{group.section_label}</Text>
                <View style={styles.groupCard}>
                  {group.items.map((item, idx) => (
                    <ProductRow
                      key={item.product_id}
                      item={item}
                      index={idx}
                      isLast={idx === group.items.length - 1}
                      unavailableLabel={screenConfig.unavailable_label}
                      onMinus={() => handleUpdateQty(item.product_id, -1)}
                      onPlus={() => handleUpdateQty(item.product_id, 1)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View>
              <Text style={styles.bottomCount}>
                {formatOneClickTemplate(screenConfig.items_count_template, {
                  count: totalItemCount,
                })}
              </Text>
              <Text style={styles.bottomPrice}>{formatInr(totalBasketPrice)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addAllBtn,
                totalItemCount === 0 && styles.addAllBtnDisabled,
              ]}
              onPress={handleAddAllToCart}
              disabled={totalItemCount === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.addAllBtnText}>{screenConfig.add_all_label || 'Add all to cart'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ProductRow({
  item,
  index,
  isLast,
  unavailableLabel,
  onMinus,
  onPlus,
}: {
  item: OneClickCartItem;
  index: number;
  isLast: boolean;
  unavailableLabel: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const priceLine = item.unit_label
    ? `${item.unit_label} · ${formatInr(item.price)}`
    : formatInr(item.price);

  return (
    <View style={[styles.productRow, !isLast && styles.productRowBorder]}>
      <View style={styles.thumb}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumbImg} resizeMode="contain" />
        ) : (
          <SvgXml xml={BAG_ICON_XML} width={22} height={22} />
        )}
      </View>
      <View style={styles.productText}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        {item.available ? (
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{priceLine}</Text>
            {item.previous_price ? (
              <Text style={styles.wasPrice}>
                was {formatInr(item.previous_price)}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.unavailableText}>{unavailableLabel}</Text>
        )}
      </View>
      {item.available ? (
        <Stepper qty={item.quantity} onMinus={onMinus} onPlus={onPlus} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF7' },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: '#17251E',
  },
  generatingWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#EAF5EE',
    borderTopColor: '#1E7A46',
    borderRightColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ringInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: '#17251E',
    marginBottom: 6,
  },
  generatingSub: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    color: '#6B7772',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 36,
  },
  skeletonStack: { width: '100%', gap: 12 },
  skeletonCard: {
    width: '100%',
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  skelThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  skelLines: { flex: 1, gap: 6 },
  skelLine1: { width: '75%', height: 10, borderRadius: 5, backgroundColor: '#F3F4F6' },
  skelLine2: { width: '45%', height: 8, borderRadius: 4, backgroundColor: '#F3F4F6' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 0,
  },
  insightIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightText: { flex: 1 },
  insightTitle: {
    ...FONTS.balooBold,
    fontSize: 14.5,
    color: '#17251E',
    marginBottom: 1,
  },
  insightSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#6B7772',
  },
  groupSection: { marginBottom: 16 },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    color: '#8E9E94',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbImg: { width: 36, height: 36 },
  productText: { flex: 1, paddingRight: 8 },
  productName: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#17251E',
    marginBottom: 2,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  productPrice: {
    ...FONTS.muktaMedium,
    fontSize: 12.5,
    color: '#6B7772',
  },
  wasPrice: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  unavailableText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#DC2626',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E7A46',
    borderRadius: 16,
    height: 32,
    paddingHorizontal: 6,
    minWidth: 70,
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 20,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 18,
    ...FONTS.muktaBold,
  },
  stepperCount: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
  },
  bottomCount: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#6B7772',
    marginBottom: 1,
  },
  bottomPrice: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: '#17251E',
  },
  addAllBtn: {
    backgroundColor: '#1E7A46',
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllBtnDisabled: { opacity: 0.45 },
  addAllBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: '#17251E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    color: '#6B7772',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1E7A46',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
