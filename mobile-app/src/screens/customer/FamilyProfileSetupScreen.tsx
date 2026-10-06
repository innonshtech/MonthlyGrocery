import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  fetchHouseholdBasket,
  HouseholdProfile,
  HouseholdBasketResult,
} from '../../services/aiApi';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';

const BRAND_OPTIONS = [
  'Aashirvaad',
  'Fortune',
  'Tata',
  'Amul',
  'Madhur',
  'India Gate',
  'Surf Excel',
  'Everest',
  'Dettol',
  'Dove',
];

export default function FamilyProfileSetupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { city } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(1);
  const [seniors, setSeniors] = useState(0);
  const [diet, setDiet] = useState<'veg' | 'non-veg' | 'jain'>('veg');
  const [budget, setBudget] = useState<number>(5000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Aashirvaad', 'Fortune', 'Tata']);

  const [loading, setLoading] = useState(false);
  const [basketResult, setBasketResult] = useState<HouseholdBasketResult | null>(null);

  // Load saved profile on mount if available
  useEffect(() => {
    AsyncStorage.getItem('@user_household_profile')
      .then((saved) => {
        if (saved) {
          const p = JSON.parse(saved);
          if (p.adults_count) setAdults(p.adults_count);
          if (p.children_count !== undefined) setKids(p.children_count);
          if (p.seniors_count !== undefined) setSeniors(p.seniors_count);
          if (p.dietary_preference) setDiet(p.dietary_preference);
          if (p.monthly_budget) setBudget(p.monthly_budget);
          if (p.preferred_brands) setSelectedBrands(p.preferred_brands);
        }
      })
      .catch(() => {});
  }, []);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleGenerateBasket = async () => {
    setLoading(true);
    const profile: HouseholdProfile = {
      adults_count: adults,
      children_count: kids,
      seniors_count: seniors,
      dietary_preference: diet,
      monthly_budget: budget,
      preferred_brands: selectedBrands,
    };

    // Save profile to storage
    AsyncStorage.setItem('@user_household_profile', JSON.stringify(profile)).catch(() => {});

    try {
      const result = await fetchHouseholdBasket(profile, city || undefined);
      setBasketResult(result);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not generate household plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToCart = () => {
    if (!basketResult || !basketResult.items) return;

    basketResult.items.forEach((item) => {
      const p = item.product;
      addToCart({
        id: p.id,
        shop_id: '',
        name: p.name,
        brand: p.brand,
        primary_category: item.category || 'Groceries',
        image_url: p.image_url,
        unit: p.unit,
        mrp: p.mrp,
        price: p.price,
        available: true,
        in_stock: true,
      });
    });

    showToast(`Added ${basketResult.items.length} items from Family Plan to your Cart!`, 'success');
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
          <Text style={styles.headerTitle}>Family Grocery Planner</Text>
          <Text style={styles.headerSubtitle}>AI Consumption Engine</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}>
        {!basketResult ? (
          <View>
            {/* Intro Card */}
            <View style={styles.introCard}>
              <Text style={styles.introEmoji}>👨‍👩‍👧‍👦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>Customize Your Household Profile</Text>
                <Text style={styles.introSub}>
                  Our AI calculates exact monthly consumption of Atta, Oils, Dals, and Home Essentials tailored to your family size.
                </Text>
              </View>
            </View>

            {/* Household Members Counter */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>1. Household Members</Text>

              {/* Adults */}
              <View style={styles.counterRow}>
                <View>
                  <Text style={styles.counterLabel}>Adults (18+ years)</Text>
                  <Text style={styles.counterSub}>Primary staple consumers</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setAdults(Math.max(1, adults - 1))}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{adults}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setAdults(adults + 1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Children */}
              <View style={styles.counterRow}>
                <View>
                  <Text style={styles.counterLabel}>Children (0–17 years)</Text>
                  <Text style={styles.counterSub}>Breakfast & snacks boost</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setKids(Math.max(0, kids - 1))}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{kids}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setKids(kids + 1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Seniors */}
              <View style={styles.counterRow}>
                <View>
                  <Text style={styles.counterLabel}>Senior Citizens (60+ years)</Text>
                  <Text style={styles.counterSub}>Health & wellness essentials</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setSeniors(Math.max(0, seniors - 1))}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{seniors}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setSeniors(seniors + 1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Diet Preference */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2. Dietary Preference</Text>
              <View style={styles.dietRow}>
                {[
                  { key: 'veg', label: '🟢 Vegetarian' },
                  { key: 'non-veg', label: '🔴 Non-Veg' },
                  { key: 'jain', label: '🟡 Jain (No Root Veg)' },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.dietChip, diet === d.key && styles.dietChipActive]}
                    onPress={() => setDiet(d.key as any)}
                  >
                    <Text style={[styles.dietChipText, diet === d.key && styles.dietChipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Budget */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>3. Monthly Budget Goal</Text>
              <View style={styles.budgetRow}>
                {[3500, 5000, 7500, 10000].map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.budgetChip, budget === b && styles.budgetChipActive]}
                    onPress={() => setBudget(b)}
                  >
                    <Text style={[styles.budgetChipText, budget === b && styles.budgetChipTextActive]}>
                      ₹{b.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferred Brands */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>4. Preferred Household Brands</Text>
              <View style={styles.brandsRow}>
                {BRAND_OPTIONS.map((brand) => {
                  const isChecked = selectedBrands.includes(brand);
                  return (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.brandChip, isChecked && styles.brandChipActive]}
                      onPress={() => toggleBrand(brand)}
                    >
                      <Text style={[styles.brandChipText, isChecked && styles.brandChipTextActive]}>
                        {isChecked ? '✓ ' : '+ '} {brand}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerateBasket}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateBtnText}>✨ Generate Monthly Basket</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Basket Results View */
          <View>
            {/* Basket Summary Card */}
            <View style={styles.basketHeroCard}>
              <View style={styles.basketHeroHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.basketHeroTitle}>{basketResult.basket_title}</Text>
                  <Text style={styles.basketHeroSub}>{basketResult.household_summary}</Text>
                </View>
                {basketResult.total_savings > 0 && (
                  <View style={styles.heroSavingsPill}>
                    <Text style={styles.heroSavingsPillText}>Save ₹{basketResult.total_savings.toFixed(0)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroPriceRow}>
                <Text style={styles.heroPriceLabel}>Plan Total ({basketResult.items.length} staples):</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  {basketResult.total_mrp > basketResult.total_price && (
                    <Text style={styles.heroMrpStrike}>₹{basketResult.total_mrp.toFixed(0)}</Text>
                  )}
                  <Text style={styles.heroFinalPrice}>₹{basketResult.total_price.toFixed(0)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.reconfigureBtn}
                onPress={() => setBasketResult(null)}
              >
                <Text style={styles.reconfigureBtnText}>↺ Re-adjust Family Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Items List */}
            <Text style={styles.planItemsHeading}>Recommended Family Essentials</Text>

            {basketResult.items.map((item, idx) => (
              <View key={idx} style={styles.planItemCard}>
                <View style={[styles.itemImgTile, { backgroundColor: '#F2F9F5' }]}>
                  {item.product.image_url ? (
                    <Image source={{ uri: item.product.image_url }} style={styles.itemImg} resizeMode="contain" />
                  ) : (
                    <Text style={{ fontSize: 20 }}>🛒</Text>
                  )}
                </View>

                <View style={styles.planItemInfo}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.recommended_quantity}</Text>
                  </View>
                  <Text style={styles.planItemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.planItemUnit}>{item.product.unit || 'Standard Pack'}</Text>
                </View>

                <View style={styles.planItemPriceWrap}>
                  <Text style={styles.planItemPrice}>₹{item.line_price}</Text>
                  {item.line_mrp > item.line_price && (
                    <Text style={styles.planItemMrp}>₹{item.line_mrp}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Bar for Transfer */}
      {basketResult && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
          <View>
            <Text style={styles.bottomCountText}>{basketResult.items.length} Family Staples</Text>
            <Text style={styles.bottomTotalText}>₹{basketResult.total_price.toFixed(0)}</Text>
          </View>
          <TouchableOpacity style={styles.bottomSubmitBtn} onPress={handleTransferToCart}>
            <Text style={styles.bottomSubmitBtnText}>Transfer Plan to Cart 🛒</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 17,
    color: COLORS.ink900,
  },
  headerSubtitle: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.green700,
    marginTop: -2,
  },
  content: {
    padding: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.green100,
    marginBottom: 16,
    gap: 12,
  },
  introEmoji: {
    fontSize: 32,
  },
  introTitle: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.green900,
  },
  introSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink600,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  sectionTitle: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink900,
    marginBottom: 10,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  counterLabel: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink900,
  },
  counterSub: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink500,
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
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.green800,
  },
  stepVal: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
    minWidth: 24,
    textAlign: 'center',
  },
  dietRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietChip: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  dietChipActive: {
    backgroundColor: COLORS.green100,
    borderColor: COLORS.green700,
  },
  dietChipText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink700,
  },
  dietChipTextActive: {
    color: COLORS.green900,
    fontWeight: '700',
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetChip: {
    flex: 1,
    backgroundColor: COLORS.muted,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  budgetChipActive: {
    backgroundColor: COLORS.green100,
    borderColor: COLORS.green700,
  },
  budgetChipText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  budgetChipTextActive: {
    color: COLORS.green900,
  },
  brandsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  brandChip: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  brandChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: COLORS.marigold500,
  },
  brandChipText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink700,
  },
  brandChipTextActive: {
    color: COLORS.marigold700,
    fontWeight: '700',
  },
  generateBtn: {
    backgroundColor: COLORS.green700,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  generateBtnText: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  basketHeroCard: {
    backgroundColor: COLORS.green50,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.green100,
    marginBottom: 16,
  },
  basketHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  basketHeroTitle: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.green900,
  },
  basketHeroSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink600,
    marginTop: 2,
  },
  heroSavingsPill: {
    backgroundColor: COLORS.marigold500,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  heroSavingsPillText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  heroPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.green100,
  },
  heroPriceLabel: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink700,
  },
  heroMrpStrike: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink400,
    textDecorationLine: 'line-through',
  },
  heroFinalPrice: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.green900,
  },
  reconfigureBtn: {
    alignSelf: 'center',
    marginTop: 8,
  },
  reconfigureBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.green700,
  },
  planItemsHeading: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
    marginBottom: 10,
  },
  planItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  itemImgTile: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemImg: {
    width: 40,
    height: 40,
  },
  planItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.green100,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  categoryBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: COLORS.green800,
  },
  planItemName: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: COLORS.ink900,
  },
  planItemUnit: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    color: COLORS.ink500,
  },
  planItemPriceWrap: {
    alignItems: 'flex-end',
  },
  planItemPrice: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.green900,
  },
  planItemMrp: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink400,
    textDecorationLine: 'line-through',
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
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  bottomSubmitBtnText: {
    ...FONTS.balooBold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});
