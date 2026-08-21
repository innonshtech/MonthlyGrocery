import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const INITIAL_SAVED_BASKETS = [
  {
    id: 'sb-1',
    name: 'Monthly Staples',
    price: 1840,
    itemCount: 12,
    sub: '12 items · Atta, Rice, Oil, Dal...',
    iconCount: 4,
    items: [
      { id: 'p-1', name: 'Aashirvaad Select Atta (5 kg)', price: 255, qty: 2, unit: '5 kg' },
      { id: 'p-3', name: 'India Gate Basmati Rice (5 kg)', price: 525, qty: 1, unit: '5 kg' },
      { id: 'p-2', name: 'Fortune Sunflower Oil (1 L)', price: 135, qty: 3, unit: '1 L' },
      { id: 'p-4', name: 'Tata Sampann Toor Dal (1 kg)', price: 142, qty: 2, unit: '1 kg' },
    ]
  },
  {
    id: 'sb-2',
    name: 'Cleaning & Home',
    price: 720,
    itemCount: 6,
    sub: '6 items · Detergent, Handwash...',
    iconCount: 3,
    items: [
      { id: 'p-13', name: 'Surf Excel Liquid (2 L)', price: 380, qty: 1, unit: '2 L' },
      { id: 'p-14', name: 'Dettol Handwash (1.5 L)', price: 245, qty: 1, unit: '1.5 L' },
      { id: 'p-15', name: 'Harpic Cleaner (1 L)', price: 95, qty: 1, unit: '1 L' },
    ]
  },
  {
    id: 'sb-3',
    name: 'Weekend Snacks',
    price: 430,
    itemCount: 4,
    sub: '4 items · Biscuits, Namkeen...',
    iconCount: 3,
    items: [
      { id: 'p-11', name: 'Parle-G Gold Biscuits (1 kg)', price: 120, qty: 1, unit: '1 kg' },
      { id: 'p-12', name: "Haldiram's Bhujia (400 g)", price: 105, qty: 2, unit: '400 g' },
      { id: 'p-6', name: 'Tata Tea Gold (500 g)', price: 285, qty: 1, unit: '500 g' },
    ]
  }
];

export default function SavedBasketsScreen({ navigation }: any) {
  const { items: cartItems, addToCart } = useCart();
  const [baskets, setBaskets] = useState(INITIAL_SAVED_BASKETS);

  // Modal 1: Save Basket Sheet (D4 bottom middle)
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [basketNameInput, setBasketNameInput] = useState('Monthly basket • August');

  // Modal 2: Basket Saved Confirmation Sheet (D4 bottom right)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedBasketName, setSavedBasketName] = useState('');

  const handleSaveBasket = () => {
    if (!basketNameInput.trim()) return;

    const newBasket = {
      id: `sb-${Date.now()}`,
      name: basketNameInput.trim(),
      price: cartItems.reduce((sum, i) => sum + (parseFloat(i.product.price as any) || 0) * i.quantity, 0) || 1650,
      itemCount: cartItems.length || 14,
      sub: `${cartItems.length || 14} items · Staples, Groceries...`,
      iconCount: 4,
      items: cartItems.map((ci) => ({
        id: ci.product.id,
        name: ci.product.name,
        price: ci.product.price,
        qty: ci.quantity,
        unit: ci.product.unit || '1 unit',
      }))
    };

    setBaskets([newBasket, ...baskets]);
    setSavedBasketName(newBasket.name);
    setShowSaveModal(false);
    setShowSuccessModal(true);
  };

  const handleAddBasketToCart = (basket: any) => {
    for (const item of basket.items) {
      const qty = item.qty || 1;
      for (let i = 0; i < qty; i++) {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          mrp: Math.round(item.price * 1.2),
          unit: item.unit || '1 unit',
          shop_id: 'shop-1',
          brand: 'Essentials',
          primary_category: 'Staples',
          image_url: '',
        } as any);
      }
    }

    Alert.alert(
      'Basket Added!',
      `Added all items from "${basket.name}" directly to your active cart.`,
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
        <Text style={styles.headerTitle}>Saved baskets</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           1. SAVED BASKET CARDS LIST (D4 TOP RIGHT IN FIGMA)
           ========================================================================= */}
        {baskets.map((basket) => (
          <View key={basket.id} style={styles.basketCard}>
            {/* Top row: Title + Price */}
            <View style={styles.cardTopRow}>
              <Text style={styles.basketTitle}>{basket.name}</Text>
              <Text style={styles.basketPrice}>₹{basket.price}</Text>
            </View>

            {/* Row of green bag mini icons */}
            <View style={styles.iconsRow}>
              {Array.from({ length: basket.iconCount || 3 }).map((_, idx) => (
                <View key={idx} style={styles.miniBagBox}>
                  <AppIcon name="shopping-bag" size={18} color={COLORS.green700} />
                </View>
              ))}
            </View>

            {/* Bottom Row: Subtitle + Outlined "Add to cart" CTA */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.basketSubText}>{basket.sub}</Text>

              <TouchableOpacity
                style={styles.outlinedAddBtn}
                onPress={() => handleAddBasketToCart(basket)}
                activeOpacity={0.85}
              >
                <Text style={styles.outlinedAddBtnText}>Add to cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Action button to open save modal */}
        <TouchableOpacity
          style={styles.saveNewTriggerBtn}
          onPress={() => setShowSaveModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.saveNewTriggerText}>+ Save current cart as a basket</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* =========================================================================
         2. MODAL SHEET: SAVE AS A BASKET (D4 BOTTOM MIDDLE IN FIGMA)
         ========================================================================= */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowSaveModal(false)}
            activeOpacity={1}
          />

          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Save as a basket</Text>
            <Text style={styles.sheetSub}>
              Reorder these items next month in one tap.
            </Text>

            {/* Input Field with Green Checkmark */}
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.sheetInput}
                value={basketNameInput}
                onChangeText={setBasketNameInput}
                placeholder="Name your basket"
                placeholderTextColor={COLORS.ink300}
              />
              <Text style={styles.inputCheckIcon}>✓</Text>
            </View>

            <Text style={styles.itemsWillBeSavedText}>
              ✓ {cartItems.length || 14} items will be saved
            </Text>

            {/* Save basket CTA */}
            <TouchableOpacity
              style={styles.primarySheetBtn}
              onPress={handleSaveBasket}
              activeOpacity={0.85}
            >
              <Text style={styles.primarySheetBtnText}>Save basket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =========================================================================
         3. MODAL SHEET: BASKET SAVED CONFIRMATION (D4 BOTTOM RIGHT IN FIGMA)
         ========================================================================= */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowSuccessModal(false)}
            activeOpacity={1}
          />

          <View style={[styles.sheetContainer, { alignItems: 'center', paddingTop: 24 }]}>
            {/* Green Tick Circle */}
            <View style={styles.successTickCircle}>
              <Text style={styles.successTickIcon}>✓</Text>
            </View>

            <Text style={styles.savedConfirmHeading}>Saved to your baskets</Text>
            <Text style={styles.savedConfirmSub}>
              "{savedBasketName || 'Monthly basket • August'}" is ready to reorder anytime.
            </Text>

            {/* View saved baskets CTA */}
            <TouchableOpacity
              style={[styles.primarySheetBtn, { width: '100%', marginBottom: 12 }]}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.primarySheetBtnText}>View saved baskets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  /* Basket Cards */
  basketCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md, // 12px
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  basketTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  basketPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  miniBagBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  basketSubText: {
    fontSize: 12,
    color: COLORS.ink500,
    flex: 1,
    paddingRight: 10,
  },
  outlinedAddBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  outlinedAddBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.green700,
  },
  saveNewTriggerBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveNewTriggerText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.green700,
  },
  /* Modal Sheets */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    color: COLORS.ink500,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  sheetInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  inputCheckIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.green700,
  },
  itemsWillBeSavedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.green700,
    marginBottom: 20,
  },
  primarySheetBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primarySheetBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  /* Success Modal */
  successTickCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTickIcon: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  savedConfirmHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 6,
    textAlign: 'center',
  },
  savedConfirmSub: {
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  doneBtn: {
    paddingVertical: 8,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink500,
  },
});
