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
import {
  CheckoutBackIcon,
  SlotInfoIcon,
  BasketSaveIcon,
} from '../../components/CheckoutFigmaIcons';
import { HubCopyIcon } from '../../components/monthlyGrocery/MonthlyGroceryHubIcons';
import {
  fetchCopyLastMonthBasket,
  fetchCopyLastMonthScreenConfig,
  formatCopyTemplate,
  formatInr,
  CopyLastMonthBasket,
  CopyLastMonthItem,
  CopyLastMonthScreenConfig,
} from '../../services/copyLastMonthApi';

const SCREEN_BG = '#FBFAF6';

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

export default function CopyLastMonthScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token, city, area, pincode } = useAuth();
  const { addToCart } = useCart();

  const [screenConfig, setScreenConfig] = useState<CopyLastMonthScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [basketMeta, setBasketMeta] = useState<Omit<
    CopyLastMonthBasket,
    'items'
  > | null>(null);
  const [items, setItems] = useState<CopyLastMonthItem[]>([]);

  const loadScreen = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchCopyLastMonthScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadBasket = useCallback(async () => {
    if (!token) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    const { basket, error } = await fetchCopyLastMonthBasket(token, city, area, pincode);

    if (error || !basket) {
      setLoadError(true);
      setBasketMeta(null);
      setItems([]);
    } else {
      setBasketMeta({
        has_order: basket.has_order,
        order_id: basket.order_id,
        month_label: basket.month_label,
        delivered_date_label: basket.delivered_date_label,
        item_count: basket.item_count,
        available_count: basket.available_count,
        repriced_count: basket.repriced_count,
        unavailable_count: basket.unavailable_count,
        total_amount: basket.total_amount,
        changes_message: basket.changes_message,
      });
      setItems(basket.items);
    }

    setLoading(false);
  }, [token, city, area]);

  useFocusEffect(
    useCallback(() => {
      loadScreen().then(() => loadBasket());
    }, [loadScreen, loadBasket]),
  );

  const handleRetry = () => loadBasket();

  const handleUpdateQty = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) =>
          it.product_id === productId
            ? { ...it, quantity: Math.max(0, it.quantity + delta) }
            : it,
        )
        .filter((it) => it.quantity > 0),
    );
  };

  const availableItems = items.filter((i) => i.available && i.quantity > 0);
  const totalAvailableCount = availableItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalPrice = availableItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const handleAddToCart = () => {
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

    Alert.alert(
      screenConfig.add_success_title,
      formatCopyTemplate(screenConfig.add_success_message_template, {
        count: totalAvailableCount,
      }),
      [
        { text: screenConfig.keep_browsing_label, style: 'cancel' },
        {
          text: screenConfig.view_cart_label,
          onPress: () => navigation.navigate('Cart'),
        },
      ],
    );
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading last month items..." />
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

  const insightTitle = basketMeta
    ? formatCopyTemplate(screenConfig.insight_title_template, {
        month: basketMeta.month_label,
      })
    : '';

  const insightSubtitle = basketMeta
    ? formatCopyTemplate(screenConfig.insight_subtitle_template, {
        count: basketMeta.item_count,
        date: basketMeta.delivered_date_label,
      })
    : '';

  const availableLabel = formatCopyTemplate(screenConfig.available_count_template, {
    count: totalAvailableCount,
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

      {loading ? (
        <View style={styles.centered}>
          <AppLoader message="Loading last month items..." />
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
      ) : !basketMeta?.has_order || items.length === 0 ? (
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
            <View style={styles.insightCard}>
              <View style={styles.insightIconWrap}>
                <HubCopyIcon size={20} />
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>{insightTitle}</Text>
                <Text style={styles.insightSub}>{insightSubtitle}</Text>
              </View>
            </View>

            {basketMeta?.changes_message ? (
              <View style={styles.changesBanner}>
                <SlotInfoIcon size={16} />
                <Text style={styles.changesText}>{basketMeta.changes_message}</Text>
              </View>
            ) : null}

            <View style={styles.listCard}>
              {items.map((item, idx) => (
                <ProductRow
                  key={item.product_id}
                  item={item}
                  index={idx}
                  isLast={idx === items.length - 1}
                  screenConfig={screenConfig}
                  onViewSimilar={() => navigation.navigate('Search')}
                  onMinus={() => handleUpdateQty(item.product_id, -1)}
                  onPlus={() => handleUpdateQty(item.product_id, 1)}
                />
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View>
              <Text style={styles.bottomCount}>{availableLabel}</Text>
              <Text style={styles.bottomPrice}>{formatInr(totalPrice)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addCartBtn,
                totalAvailableCount === 0 && styles.addCartBtnDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={totalAvailableCount === 0}
              activeOpacity={0.85}
            >
              <BasketSaveIcon size={18} />
              <Text style={styles.addCartBtnText}>{screenConfig.add_to_cart_label}</Text>
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
  screenConfig,
  onViewSimilar,
  onMinus,
  onPlus,
}: {
  item: CopyLastMonthItem;
  index: number;
  isLast: boolean;
  screenConfig: CopyLastMonthScreenConfig;
  onViewSimilar: () => void;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const priceLine = item.unit_label
    ? `${item.unit_label} · ${formatInr(item.price)}`
    : formatInr(item.price);

  const wasPrice = item.previous_price
    ? formatCopyTemplate(screenConfig.was_price_template, {
        amount: Math.round(item.previous_price).toLocaleString('en-IN'),
      })
    : null;

  return (
    <View style={[styles.productRow, !isLast && styles.productRowBorder]}>
      <View style={[styles.thumb, !item.image_url && styles.thumbEmpty]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumbImg} resizeMode="contain" />
        ) : null}
      </View>
      <View style={styles.productText}>
        <Text
          style={[styles.productName, !item.available && styles.productNameMuted]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.available ? (
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{priceLine}</Text>
            {wasPrice ? <Text style={styles.wasPrice}>{wasPrice}</Text> : null}
          </View>
        ) : (
          <View style={styles.unavailableRow}>
            <Text style={styles.unavailableText}>{screenConfig.unavailable_label}</Text>
            <TouchableOpacity onPress={onViewSimilar}>
              <Text style={styles.viewSimilar}>{screenConfig.view_similar_label}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {item.available ? (
        <Stepper qty={item.quantity} onMinus={onMinus} onPlus={onPlus} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
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
    height: 48,
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
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  insightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  insightText: { flex: 1 },
  insightTitle: {
    ...FONTS.balooBold,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  insightSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    marginTop: 1,
  },
  changesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  changesText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.marigold700,
    flex: 1,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbEmpty: {
    backgroundColor: COLORS.muted,
  },
  thumbImg: {
    width: 28,
    height: 28,
  },
  productText: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  productNameMuted: {
    color: COLORS.ink500,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  productPrice: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink700,
  },
  wasPrice: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink500,
  },
  unavailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  unavailableText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.error,
  },
  viewSimilar: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.green700,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    height: 30,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 28,
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
    paddingHorizontal: 6,
    minWidth: 20,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 12,
  },
  bottomCount: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 14,
    color: COLORS.ink500,
  },
  bottomPrice: {
    ...FONTS.balooBold,
    fontSize: 22,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  addCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    height: 48,
    borderRadius: RADIUS.pill,
    maxWidth: 294,
  },
  addCartBtnDisabled: {
    opacity: 0.5,
  },
  addCartBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  emptyTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink700,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    height: 44,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
