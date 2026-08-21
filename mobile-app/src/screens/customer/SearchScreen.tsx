import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const POPULAR_SEARCH_CHIPS = [
  'Aashirvaad',
  'multigrain atta',
  'Fortune',
  'Organic atta',
  'Basmati rice',
  'Toor dal'
];

export default function SearchScreen({ navigation }: any) {
  const { city, area } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const [query, setQuery] = useState('atta');
  const [selectedChip, setSelectedChip] = useState('Aashirvaad');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/search?q=${encodeURIComponent(query || '')}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, city, area]);

  const handleChipPress = (chip: string) => {
    setSelectedChip(chip);
    setQuery(chip);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP SEARCH HEADER WITH BACK ARROW
         ========================================================================= */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <AppIcon name="search" size={18} color={COLORS.ink300} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for atta, rice, oil..."
            placeholderTextColor={COLORS.ink300}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* =========================================================================
         2. POPULAR IN ATTA & RICE / TRENDING CHIPS
         ========================================================================= */}
      <View style={styles.chipsSection}>
        <Text style={styles.chipsLabel}>POPULAR IN ATTA & RICE</Text>
        <FlatList
          horizontal
          data={POPULAR_SEARCH_CHIPS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          renderItem={({ item }) => {
            const isSelected = selectedChip.toLowerCase() === item.toLowerCase();
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected
                ]}
                onPress={() => handleChipPress(item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* =========================================================================
         3. SEARCH RESULTS LIST
         ========================================================================= */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          Results for "{query || 'all'}"
        </Text>

        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => {
            const mrpVal = parseFloat(item.mrp as any) || Math.round(Number(item.price) * 1.18);
            const cartItem = items.find((i) => i.product?.id === item.id);
            const count = cartItem ? cartItem.quantity : 0;

            return (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                activeOpacity={0.8}
              >
                {/* Thumb */}
                <View style={styles.rowThumb}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.thumbImg} resizeMode="contain" />
                  ) : (
                    <AppIcon name="shopping-bag" size={26} color={COLORS.green700} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.rowUnit}>{item.unit || '5 kg'}</Text>
                  <View style={styles.priceLine}>
                    <Text style={styles.rowPrice}>₹{item.price}</Text>
                    <Text style={styles.rowMrp}>₹{mrpVal}</Text>
                  </View>
                </View>

                {/* ADD Button or Stepper */}
                {count > 0 ? (
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.id, count - 1)}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepCountText}>{count}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm paper #FAF9F5
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 34,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface, // #FFFFFF
    borderWidth: 1.5,
    borderColor: COLORS.line, // #EAE9E2
    borderRadius: RADIUS.md, // 12px
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink900,
    padding: 0,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.ink300,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  chipsSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 14,
  },
  resultsList: {
    paddingBottom: 28,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.line,
  },
  rowThumb: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm, // 8px
    backgroundColor: COLORS.green50, // #F2F9F5
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  thumbImg: {
    width: 48,
    height: 48,
  },
  rowInfo: {
    flex: 1,
    paddingRight: 12,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  rowUnit: {
    fontSize: 12,
    color: COLORS.ink500,
    marginBottom: 4,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rowPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  rowMrp: {
    fontSize: 12,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  addBtnText: {
    color: COLORS.green700,
    fontSize: 13,
    fontWeight: '800',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.sm,
    height: 32,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 24,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
});
