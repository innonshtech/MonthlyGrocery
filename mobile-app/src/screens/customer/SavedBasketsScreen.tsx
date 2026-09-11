import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import AppLoader from '../../components/AppLoader';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  CheckoutBackIcon,
  BasketSaveIcon,
} from '../../components/CheckoutFigmaIcons';
import { SvgXml } from 'react-native-svg';
import {
  basketFromCartItems,
  buildBasketSummary,
  loadSavedBaskets,
  mergeReconciledIntoBasket,
  persistSavedBaskets,
  SavedBasket,
} from '../../utils/savedBasketsStorage';
import {
  fetchSavedBasketsScreenConfig,
  formatInr,
  formatSavedBasketsTemplate,
  reconcileBasketItems,
  SavedBasketsScreenConfig,
} from '../../services/savedBasketsApi';

const BAG_ICON_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 6H21" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function SavedBasketsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { token, city, area } = useAuth();
  const { items: cartItems, addToCart } = useCart();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<SavedBasketsScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [baskets, setBaskets] = useState<SavedBasket[]>([]);
  const [loadingBaskets, setLoadingBaskets] = useState(true);
  const [addingBasketId, setAddingBasketId] = useState<string | null>(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [basketNameInput, setBasketNameInput] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedBasketName, setSavedBasketName] = useState('');

  const previewCount = screenConfig?.preview_name_count ?? 4;

  const loadScreen = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchSavedBasketsScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const refreshBaskets = useCallback(async (count = previewCount) => {
    setLoadingBaskets(true);
    let list = await loadSavedBaskets(count);
    await persistSavedBaskets(list);

    if (token && city && area && list.length > 0) {
      const enriched: SavedBasket[] = [];
      for (const basket of list) {
        const { items: reconciled, error } = await reconcileBasketItems(
          token,
          basket.items.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.price,
            name: it.name,
            image_url: it.image_url,
            shop_id: it.shop_id,
            brand: it.brand,
            primary_category: it.primary_category,
            unit_label: it.unit_label,
            mrp: it.mrp,
          })),
          city,
          area,
        );
        enriched.push(
          error || !reconciled.length
            ? basket
            : mergeReconciledIntoBasket(basket, reconciled),
        );
      }
      list = enriched;
      await persistSavedBaskets(list);
    }

    setBaskets(list);
    setLoadingBaskets(false);
  }, [token, city, area, previewCount]);

  useFocusEffect(
    useCallback(() => {
      loadScreen().then((config) => {
        const count = config?.preview_name_count ?? 4;
        refreshBaskets(count);

        if (route.params?.openSave && config) {
          setBasketNameInput(
            formatSavedBasketsTemplate(config.default_basket_name_template, {
              month: new Date().toLocaleDateString('en-IN', { month: 'long' }),
            }),
          );
          setShowSaveModal(true);
          navigation.setParams({ openSave: undefined });
        }
      });
    }, [loadScreen, refreshBaskets, route.params?.openSave, navigation]),
  );

  const defaultBasketName = screenConfig
    ? formatSavedBasketsTemplate(screenConfig.default_basket_name_template, {
        month: new Date().toLocaleDateString('en-IN', { month: 'long' }),
      })
    : '';

  const openNewBasketSheet = () => {
    if (!cartItems.length) {
      if (screenConfig) {
        showToast({
          type: 'info',
          title: screenConfig.empty_cart_title,
          message: screenConfig.empty_cart_message,
        });
      }
      return;
    }
    setBasketNameInput(defaultBasketName);
    setShowSaveModal(true);
  };

  const cartItemCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartTotal = Math.round(
    cartItems.reduce(
      (sum, ci) => sum + (Number(ci.product.price) || 0) * ci.quantity,
      0,
    ),
  );

  const handleSaveBasket = async () => {
    if (!screenConfig || !basketNameInput.trim()) return;

    const newBasket = basketFromCartItems(
      basketNameInput.trim(),
      cartItems,
      screenConfig.preview_name_count,
    );

    if (!newBasket) {
      showToast({
        type: 'info',
        title: screenConfig.empty_cart_title,
        message: screenConfig.empty_cart_message,
      });
      return;
    }

    const updated = [newBasket, ...baskets];
    await persistSavedBaskets(updated);
    setBaskets(updated);
    setSavedBasketName(newBasket.name);
    setShowSaveModal(false);
    setShowSuccessModal(true);
  };

  const handleAddBasketToCart = async (basket: SavedBasket) => {
    if (!screenConfig || !token) return;

    if (!city || !area) {
      showToast({
        type: 'error',
        title: screenConfig.no_location_title,
        message: screenConfig.no_location_message,
      });
      return;
    }

    setAddingBasketId(basket.id);

    const { items: reconciled, error } = await reconcileBasketItems(
      token,
      basket.items.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.price,
        name: it.name,
        image_url: it.image_url,
        shop_id: it.shop_id,
        brand: it.brand,
        primary_category: it.primary_category,
        unit_label: it.unit_label,
        mrp: it.mrp,
      })),
      city,
      area,
    );

    setAddingBasketId(null);

    if (error) {
      showToast({
        type: 'error',
        message: screenConfig.load_error_message,
      });
      return;
    }

    const available = reconciled.filter((it) => it.available && it.quantity > 0);
    const skipped = reconciled.length - available.length;

    if (!available.length) {
      showToast({
        type: 'error',
        message: screenConfig.unavailable_skip_message,
      });
      return;
    }

    for (const it of available) {
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
      title: screenConfig.add_success_title || 'Basket added',
      message: `${formatSavedBasketsTemplate(screenConfig.add_success_message_template, {
        name: basket.name,
      })}${skipped > 0 ? ` · ${screenConfig.unavailable_skip_message}` : ''}`,
      actionLabel: screenConfig.view_cart_label || 'View Cart',
      onAction: () => navigation.navigate('Cart'),
    });
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading baskets..." />
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => loadScreen()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
        <TouchableOpacity onPress={openNewBasketSheet} style={styles.newBtn} hitSlop={8}>
          <Text style={styles.newBtnText}>{screenConfig.new_basket_label}</Text>
        </TouchableOpacity>
      </View>

      {loadingBaskets ? (
        <View style={styles.centered}>
          <AppLoader message="Loading baskets..." />
        </View>
      ) : baskets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{screenConfig.empty_title}</Text>
          <Text style={styles.emptySub}>{screenConfig.empty_message}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.primaryBtnText}>{screenConfig.empty_cta_label}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {baskets.map((basket) => (
            <BasketCard
              key={basket.id}
              basket={basket}
              screenConfig={screenConfig}
              adding={addingBasketId === basket.id}
              onAdd={() => handleAddBasketToCart(basket)}
            />
          ))}
        </ScrollView>
      )}

      {/* Save basket sheet */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSaveModal(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{screenConfig.save_sheet_title}</Text>
            <Text style={styles.sheetSub}>{screenConfig.save_sheet_subtitle}</Text>

            <Text style={styles.fieldLabel}>{screenConfig.basket_name_label}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.sheetInput}
                value={basketNameInput}
                onChangeText={setBasketNameInput}
                placeholder={defaultBasketName}
                placeholderTextColor={COLORS.ink300}
              />
              {basketNameInput.trim().length > 0 ? (
                <Text style={styles.inputCheck}>✓</Text>
              ) : null}
            </View>

            <View style={styles.willSaveRow}>
              <BasketSaveIcon size={16} />
              <Text style={styles.willSaveText}>
                {formatSavedBasketsTemplate(screenConfig.items_will_save_template, {
                  count: cartItemCount,
                  amount: formatInr(cartTotal),
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, styles.sheetPrimaryBtn]}
              onPress={handleSaveBasket}
              activeOpacity={0.85}
              disabled={!basketNameInput.trim() || cartItemCount === 0}
            >
              <Text style={styles.primaryBtnText}>{screenConfig.save_basket_button_label}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success sheet */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSuccessModal(false)} />
          <View style={[styles.sheet, styles.successSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.successIcon}>
              <Text style={styles.successTick}>✓</Text>
            </View>
            <Text style={styles.sheetTitle}>{screenConfig.success_title}</Text>
            <Text style={styles.successMessage}>
              {formatSavedBasketsTemplate(screenConfig.success_message_template, {
                name: savedBasketName,
              })}
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.sheetPrimaryBtn]}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{screenConfig.view_saved_baskets_label}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSuccessModal(false)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{screenConfig.done_label}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BasketCard({
  basket,
  screenConfig,
  adding,
  onAdd,
}: {
  basket: SavedBasket;
  screenConfig: SavedBasketsScreenConfig;
  adding: boolean;
  onAdd: () => void;
}) {
  const previewItems = basket.items.slice(0, 4);
  const summary = buildBasketSummary(basket, screenConfig.items_summary_template);
  const slots = [0, 1, 2, 3];

  return (
    <View style={styles.basketCard}>
      <View style={styles.cardTopRow}>
        <Text style={styles.basketName} numberOfLines={1}>{basket.name}</Text>
        <Text style={styles.basketPrice}>{formatInr(basket.total_amount)}</Text>
      </View>

      <View style={styles.thumbRow}>
        {slots.map((idx) => {
          const item = previewItems[idx];
          return (
            <View key={`slot-${basket.id}-${idx}`} style={styles.thumb}>
              {item?.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.thumbImg}
                  resizeMode="contain"
                />
              ) : (
                <SvgXml xml={BAG_ICON_XML} width={20} height={20} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.cardBottomRow}>
        <Text style={styles.summaryText} numberOfLines={1}>{summary}</Text>
        <TouchableOpacity
          style={styles.outlinedBtn}
          onPress={onAdd}
          disabled={adding}
          activeOpacity={0.85}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#1E7A46" />
          ) : (
            <Text style={styles.outlinedBtnText}>{screenConfig.add_to_cart_label || 'Add to cart'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF7' },
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
    flex: 1,
  },
  newBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  newBtnText: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: '#1E7A46',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
    gap: 12,
  },
  basketCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  basketName: {
    ...FONTS.balooBold,
    fontSize: 15.5,
    color: '#17251E',
    flex: 1,
    paddingRight: 8,
  },
  basketPrice: {
    ...FONTS.balooBold,
    fontSize: 17,
    color: '#17251E',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#EAF5EE',
  },
  thumbImg: {
    width: 36,
    height: 36,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryText: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    color: '#6B7772',
    flex: 1,
  },
  outlinedBtn: {
    borderWidth: 1.5,
    borderColor: '#1E7A46',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 32,
    minWidth: 92,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlinedBtnText: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: '#1E7A46',
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
    fontSize: 13,
    color: '#6B7772',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#1E7A46',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  successSheet: {
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: '#17251E',
    marginBottom: 4,
  },
  sheetSub: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    color: '#6B7772',
    marginBottom: 16,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    color: '#6B7772',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E7A46',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  sheetInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14.5,
    color: '#17251E',
  },
  inputCheck: {
    fontSize: 16,
    color: '#1E7A46',
  },
  willSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF5EE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  willSaveText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#1E7A46',
    flex: 1,
  },
  sheetPrimaryBtn: {
    width: '100%',
    marginBottom: 8,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTick: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  successMessage: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    color: '#6B7772',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  doneBtn: {
    paddingVertical: 10,
    marginTop: 4,
  },
  doneBtnText: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: '#6B7772',
  },
});

