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
import { useCart } from '../../context/CartContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  CheckoutBackIcon,
  SlotInfoIcon,
  BasketSaveIcon,
} from '../../components/CheckoutFigmaIcons';
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

const SCREEN_BG = '#FBFAF6';

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
  const { token, city, area } = useAuth();
  const { addToCart } = useCart();

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

    const { basket, error } = await fetchOneClickCartBasket(token, city, area);

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

    Alert.alert(
      screenConfig.add_all_success_title,
      formatOneClickTemplate(screenConfig.add_all_success_message_template, {
        count: totalItemCount,
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
          <ActivityIndicator size="large" color={COLORS.green700} />
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
          <View style={styles.progressRing}>
            <ActivityIndicator size="large" color={COLORS.green700} />
            <View style={styles.goldDot} />
          </View>
          <Text style={styles.generatingTitle}>{screenConfig.generating_title}</Text>
          <Text style={styles.generatingSub}>{screenConfig.generating_subtitle}</Text>
          <View style={styles.skeletonStack}>
            <View style={styles.skeletonCard} />
            <View style={[styles.skeletonCard, { width: '92%' }]} />
            <View style={[styles.skeletonCard, { width: '88%' }]} />
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
            <View style={styles.insightCard}>
              <SlotInfoIcon size={20} />
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
              <BasketSaveIcon size={18} />
              <Text style={styles.addAllBtnText}>{screenConfig.add_all_label}</Text>
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
      <View style={[styles.thumb, !item.image_url && styles.thumbEmpty]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumbImg} resizeMode="contain" />
        ) : null}
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
  generatingWrap: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 48,
    alignItems: 'center',
  },
  progressRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: COLORS.green600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  goldDot: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.marigold500,
  },
  generatingTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.ink900,
    marginBottom: 8,
  },
  generatingSub: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  skeletonStack: { width: '100%', gap: 12 },
  skeletonCard: {
    width: '100%',
    height: 62,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.muted,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    borderRadius: RADIUS.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
    minHeight: 61,
    marginBottom: 16,
  },
  insightText: { flex: 1 },
  insightTitle: {
    ...FONTS.balooBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.green700,
    marginBottom: 2,
  },
  insightSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink700,
  },
  groupSection: { marginBottom: 16 },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 2,
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 68,
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
  thumbImg: { width: 38, height: 38 },
  productText: { flex: 1, paddingRight: 8 },
  productName: {
    ...FONTS.balooBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.ink900,
    marginBottom: 2,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  productPrice: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink700,
  },
  wasPrice: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink300,
  },
  unavailableText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.error,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    height: 30,
    paddingHorizontal: 4,
    minWidth: 63,
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
    fontWeight: '700',
    lineHeight: 18,
  },
  stepperCount: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    minWidth: 14,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  bottomCount: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 14,
  },
  bottomPrice: {
    ...FONTS.balooBold,
    fontSize: 20,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: RADIUS.pill,
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
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  retryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
