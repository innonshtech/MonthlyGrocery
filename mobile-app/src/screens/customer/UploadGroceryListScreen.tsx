import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  parseGroceryTextList,
  scanGroceryImage,
  MatchedProductItem,
  ExtractedGroceryItem,
  ParseListResponse,
} from '../../services/aiApi';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';

export default function UploadGroceryListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { city } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string>('image/jpeg');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseListResponse | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Quick sample chips for instant testing
  const addQuickChip = (chipText: string) => {
    setInputText((prev) => (prev ? `${prev}\n${chipText}` : chipText));
  };

  const handlePickImage = (source: 'camera' | 'gallery') => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      maxWidth: 1600,
      maxHeight: 1600,
    };

    const launcher = source === 'camera' ? launchCamera : launchImageLibrary;

    launcher(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Image Error', response.errorMessage || 'Failed to select image');
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setSelectedImageUri(asset.uri);
        setSelectedImageMime(asset.type || 'image/jpeg');
      }
    });
  };

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      Alert.alert('Empty List', 'Please enter or paste your grocery items first.');
      return;
    }

    setLoading(true);
    try {
      const data = await parseGroceryTextList(inputText, city || undefined);
      initializeResults(data);
    } catch (err: any) {
      Alert.alert('Parsing Error', err?.message || 'Could not process grocery list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedImageUri) {
      Alert.alert('No Image', 'Please capture or select a photo of your handwritten grocery list.');
      return;
    }

    setLoading(true);
    try {
      const data = await scanGroceryImage(selectedImageUri, selectedImageMime, city || undefined);
      initializeResults(data);
    } catch (err: any) {
      Alert.alert('Scan Error', err?.message || 'Could not scan paper list. Please ensure good lighting and try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeResults = (data: ParseListResponse) => {
    setResult(data);
    const selected: Record<string, boolean> = {};
    const qtys: Record<string, number> = {};

    data.matched_items.forEach((item, idx) => {
      if (item.matched_product) {
        const id = item.matched_product.id;
        selected[id] = true; // Pre-select all confident matches
        qtys[id] = Math.max(1, Math.round(item.requested_item.quantity || 1));
      }
    });

    setSelectedItemIds(selected);
    setItemQuantities(qtys);
  };

  const toggleSelect = (productId: string) => {
    setSelectedItemIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const updateQty = (productId: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSwapAlternative = (itemIndex: number, altProduct: any) => {
    if (!result) return;
    const updated = { ...result };
    const currentItem = updated.matched_items[itemIndex];
    if (!currentItem) return;

    const oldId = currentItem.matched_product?.id;
    const oldQty = oldId ? itemQuantities[oldId] || 1 : 1;

    // Swap to new alternative
    currentItem.matched_product = {
      id: altProduct.id,
      name: altProduct.name,
      brand: altProduct.brand,
      unit: altProduct.unit,
      mrp: altProduct.mrp,
      price: altProduct.price,
      image_url: altProduct.image_url,
      stock: 50,
    };

    setResult(updated);

    // Update selection and qty
    setSelectedItemIds((prev) => {
      const next = { ...prev };
      if (oldId) delete next[oldId];
      next[altProduct.id] = true;
      return next;
    });

    setItemQuantities((prev) => {
      const next = { ...prev };
      if (oldId) delete next[oldId];
      next[altProduct.id] = oldQty;
      return next;
    });
  };

  // Calculate live totals based on user selection & quantities
  let activeTotal = 0;
  let activeMrp = 0;
  let activeCount = 0;

  if (result) {
    result.matched_items.forEach((item) => {
      if (item.matched_product && selectedItemIds[item.matched_product.id]) {
        const id = item.matched_product.id;
        const q = itemQuantities[id] || 1;
        activeTotal += item.matched_product.price * q;
        activeMrp += (item.matched_product.mrp || item.matched_product.price) * q;
        activeCount += 1;
      }
    });
  }

  const activeSavings = Math.max(0, activeMrp - activeTotal);

  const handleAddAllToCart = () => {
    if (!result || activeCount === 0) return;

    let addedCount = 0;
    result.matched_items.forEach((item) => {
      if (item.matched_product && selectedItemIds[item.matched_product.id]) {
        const p = item.matched_product;
        const q = itemQuantities[p.id] || 1;

        // Add to cart with quantity
        for (let i = 0; i < q; i++) {
          addToCart({
            id: p.id,
            shop_id: '',
            name: p.name,
            brand: p.brand,
            primary_category: 'Groceries',
            image_url: p.image_url,
            unit: p.unit,
            mrp: p.mrp,
            price: p.price,
            stock: p.stock,
            available: true,
            in_stock: true,
          });
        }
        addedCount++;
      }
    });

    showToast(`Added ${addedCount} items to your Cart!`, 'success');
    navigation.navigate('Cart');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <CheckoutBackIcon color={COLORS.ink900} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Upload Grocery List</Text>
          <Text style={styles.headerSubtitle}>AI List-to-Cart Assistant</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {/* Tabs */}
        {!result && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'text' && styles.tabBtnActive]}
              onPress={() => setActiveTab('text')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'text' && styles.tabBtnTextActive]}>
                📝 Paste / Type List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'image' && styles.tabBtnActive]}
              onPress={() => setActiveTab('image')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'image' && styles.tabBtnTextActive]}>
                📷 Scan Paper Slip
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
        {/* State 1: Loading Spinner */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.green700} />
            <Text style={styles.loadingTitle}>AI is Analyzing Your Grocery List...</Text>
            <Text style={styles.loadingSub}>
              Detecting products, brands, quantities and matching with live stock in your area.
            </Text>
          </View>
        )}

        {/* State 2: Input Mode */}
        {!loading && !result && activeTab === 'text' && (
          <View>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Enter or Paste Items (English / Hindi / Hinglish):</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={7}
                placeholder={`Example:\n• 10kg Aashirvaad Atta\n• 5L Fortune Sunflower Oil\n• 2kg Sugar\n• 1 packet Tata Namak\n• 1kg Moong Dal`}
                placeholderTextColor={COLORS.ink300}
                value={inputText}
                onChangeText={setInputText}
                textAlignVertical="top"
              />
            </View>

            {/* Quick Chips */}
            <Text style={styles.chipsSectionTitle}>Quick Add Suggestions:</Text>
            <View style={styles.chipsRow}>
              {['10kg Atta', '5L Oil', '2kg Sugar', '1kg Tata Salt', '1kg Toor Dal', '2kg Surf Excel'].map((chip) => (
                <TouchableOpacity key={chip} style={styles.chip} onPress={() => addQuickChip(chip)}>
                  <Text style={styles.chipText}>+ {chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleProcessText}>
              <Text style={styles.primaryActionBtnText}>✨ Build Monthly Cart with AI</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !result && activeTab === 'image' && (
          <View>
            <View style={styles.imageUploadCard}>
              {selectedImageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.changeImageBtn} onPress={() => setSelectedImageUri(null)}>
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceHolder}>
                  <Text style={styles.imagePickerIcon}>📋</Text>
                  <Text style={styles.imagePickerTitle}>Photograph your Paper Grocery List</Text>
                  <Text style={styles.imagePickerSub}>
                    AI will read handwritten notes and match items with local store prices.
                  </Text>
                  <View style={styles.imageBtnRow}>
                    <TouchableOpacity
                      style={styles.mediaSelectBtn}
                      onPress={() => handlePickImage('camera')}
                    >
                      <Text style={styles.mediaSelectBtnText}>📸 Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.mediaSelectBtn, styles.mediaSelectBtnAlt]}
                      onPress={() => handlePickImage('gallery')}
                    >
                      <Text style={[styles.mediaSelectBtnText, styles.mediaSelectBtnTextAlt]}>
                        🖼️ Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {selectedImageUri && (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleProcessImage}>
                <Text style={styles.primaryActionBtnText}>🔍 Scan Paper Slip with Vision AI</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* State 3: Results & Review Screen */}
        {!loading && result && (
          <View>
            {/* Savings Banner */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryTitle}>AI Cart Generated</Text>
                  <Text style={styles.summarySub}>
                    {result.matched_items.length} items matched from your list
                  </Text>
                </View>
                {activeSavings > 0 && (
                  <View style={styles.savingsPill}>
                    <Text style={styles.savingsPillText}>Save ₹{activeSavings.toFixed(0)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Estimated Total:</Text>
                <View style={styles.priceValues}>
                  {activeMrp > activeTotal && (
                    <Text style={styles.mrpStrike}>₹{activeMrp.toFixed(0)}</Text>
                  )}
                  <Text style={styles.finalPrice}>₹{activeTotal.toFixed(0)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setResult(null);
                  setSelectedImageUri(null);
                }}
              >
                <Text style={styles.resetBtnText}>↺ Scan / Paste Another List</Text>
              </TouchableOpacity>
            </View>

            {/* Matched Items Section */}
            <Text style={styles.sectionHeader}>Matched Products ({activeCount} Selected)</Text>

            {result.matched_items.map((item, index) => {
              const product = item.matched_product;
              if (!product) return null;
              const isSelected = !!selectedItemIds[product.id];
              const qty = itemQuantities[product.id] || 1;

              return (
                <View key={`${product.id}-${index}`} style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                  <TouchableOpacity style={styles.checkWrap} onPress={() => toggleSelect(product.id)}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>

                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} style={styles.productThumb} />
                  ) : (
                    <View style={styles.productThumbPlaceholder}>
                      <Text style={{ fontSize: 16 }}>🛒</Text>
                    </View>
                  )}

                  <View style={styles.itemInfo}>
                    <View style={styles.itemRequestedTag}>
                      <Text style={styles.itemRequestedText}>
                        Requested: {item.requested_item.item_name} ({item.requested_item.quantity} {item.requested_item.unit})
                      </Text>
                    </View>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productUnit}>{product.unit || 'Standard Pack'}</Text>

                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>₹{product.price * qty}</Text>
                      {product.mrp > product.price && (
                        <Text style={styles.itemMrp}>₹{product.mrp * qty}</Text>
                      )}
                    </View>

                    {/* Alternatives if user wants to swap */}
                    {item.alternatives && item.alternatives.length > 0 && (
                      <View style={styles.altWrap}>
                        <Text style={styles.altLabel}>Swap Brand:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {item.alternatives.map((alt) => (
                            <TouchableOpacity
                              key={alt.id}
                              style={styles.altChip}
                              onPress={() => handleSwapAlternative(index, alt)}
                            >
                              <Text style={styles.altChipText}>
                                {alt.brand || alt.name.slice(0, 14)} (₹{alt.price})
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQty(product.id, -1)}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepCount}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQty(product.id, 1)}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Unmatched Items Note */}
            {result.unmatched_items && result.unmatched_items.length > 0 && (
              <View style={styles.unmatchedCard}>
                <Text style={styles.unmatchedTitle}>Items not found in store stock ({result.unmatched_items.length}):</Text>
                {result.unmatched_items.map((u, i) => (
                  <Text key={i} style={styles.unmatchedItem}>
                    • {u.item_name} ({u.quantity} {u.unit})
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

        {/* Floating Bottom Transfer to Cart Bar */}
        {result && activeCount > 0 && (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <View>
              <Text style={styles.bottomCountText}>{activeCount} Items Selected</Text>
              <Text style={styles.bottomTotalText}>₹{activeTotal.toFixed(0)}</Text>
            </View>
            <TouchableOpacity style={styles.bottomSubmitBtn} onPress={handleAddAllToCart}>
              <Text style={styles.bottomSubmitBtnText}>Transfer to Cart 🛒</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  headerSubtitle: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.green700,
    marginTop: -2,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.muted,
  },
  tabBtnActive: {
    backgroundColor: COLORS.green100,
    borderWidth: 1,
    borderColor: COLORS.green700,
  },
  tabBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.ink600,
  },
  tabBtnTextActive: {
    color: COLORS.green700,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  inputLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
    marginBottom: 8,
  },
  textInput: {
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: COLORS.ink900,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.sm,
    padding: 12,
    minHeight: 140,
  },
  chipsSectionTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.ink600,
    marginTop: 14,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.green600,
  },
  chipText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.green800,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.green700,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    shadowColor: COLORS.green700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  imageUploadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerPlaceHolder: {
    alignItems: 'center',
  },
  imagePickerIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  imagePickerTitle: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.ink900,
    textAlign: 'center',
  },
  imagePickerSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  imageBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaSelectBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  mediaSelectBtnAlt: {
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  mediaSelectBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  mediaSelectBtnTextAlt: {
    color: COLORS.ink900,
  },
  imagePreviewWrap: {
    width: '100%',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: RADIUS.sm,
    resizeMode: 'contain',
  },
  changeImageBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.muted,
  },
  changeImageText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  loadingTitle: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.ink900,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.green50,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.green100,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.green900,
  },
  summarySub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink600,
  },
  savingsPill: {
    backgroundColor: COLORS.marigold500,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  savingsPillText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.green100,
  },
  priceLabel: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink700,
  },
  priceValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  mrpStrike: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink400,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.green900,
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: 8,
  },
  resetBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.green700,
  },
  sectionHeader: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  itemCardSelected: {
    borderColor: COLORS.green600,
    backgroundColor: '#FAFCFA',
  },
  checkWrap: {
    paddingRight: 10,
    paddingTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.ink300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.xs,
    marginRight: 10,
    resizeMode: 'contain',
  },
  productThumbPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.muted,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 6,
  },
  itemRequestedTag: {
    backgroundColor: COLORS.muted,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  itemRequestedText: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.ink600,
  },
  productTitle: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  productUnit: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  itemPrice: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.green900,
  },
  itemMrp: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink400,
    textDecorationLine: 'line-through',
  },
  altWrap: {
    marginTop: 6,
  },
  altLabel: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink500,
    marginBottom: 2,
  },
  altChip: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  altChipText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    color: COLORS.ink700,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green800,
  },
  stepCount: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink900,
    minWidth: 16,
    textAlign: 'center',
  },
  unmatchedCard: {
    backgroundColor: '#FFF8F6',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE4E2',
    marginTop: 10,
  },
  unmatchedTitle: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.error,
    marginBottom: 4,
  },
  unmatchedItem: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink700,
    marginLeft: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bottomCountText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
  },
  bottomTotalText: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.green900,
  },
  bottomSubmitBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  bottomSubmitBtnText: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
