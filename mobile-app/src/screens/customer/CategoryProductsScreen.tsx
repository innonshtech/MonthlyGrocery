import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';

export default function CategoryProductsScreen({ route, navigation }: any) {
  const { categoryName } = route.params || { categoryName: 'Atta & Rice' };
  const { items, addToCart, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'priceLowHigh' | 'priceHighLow'>('default');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `${API_BASE}/products/all?category=${encodeURIComponent(categoryName)}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products);
      } else {
        setError(data.error || 'Failed to load catalog products');
      }
    } catch (err) {
      setError('Connection error. Is the Express server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryName]);

  const getCartQuantity = (productId: string) => {
    const item = items.find((it) => it.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getSortedProducts = () => {
    const list = [...products];
    if (sortBy === 'priceLowHigh') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'priceHighLow') {
      return list.sort((a, b) => b.price - a.price);
    }
    return list;
  };

  const sortedList = getSortedProducts();

  const renderProductItem = ({ item }: { item: Product }) => {
    const qty = getCartQuantity(item.id);

    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          style={styles.imageBtn}
        >
          <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.productInfo}>
          <Text style={styles.brandText}>{item.brand}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.unitText}>{item.unit}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.price}</Text>
            {qty > 0 ? (
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateQuantity(item.id, qty - 1)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepQty}>{qty}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateQuantity(item.id, qty + 1)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => addToCart(item)}
              >
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
      </View>

      {/* Sort Bar */}
      {products.length > 0 && (
        <View style={styles.sortBar}>
          <Text style={styles.sortLabel}>Sort By Price:</Text>
          <TouchableOpacity 
            style={[styles.sortPill, sortBy === 'default' && styles.sortPillActive]}
            onPress={() => setSortBy('default')}
          >
            <Text style={[styles.sortText, sortBy === 'default' && styles.sortTextActive]}>Popular</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortPill, sortBy === 'priceLowHigh' && styles.sortPillActive]}
            onPress={() => setSortBy('priceLowHigh')}
          >
            <Text style={[styles.sortText, sortBy === 'priceLowHigh' && styles.sortTextActive]}>Low to High</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortPill, sortBy === 'priceHighLow' && styles.sortPillActive]}
            onPress={() => setSortBy('priceHighLow')}
          >
            <Text style={[styles.sortText, sortBy === 'priceHighLow' && styles.sortTextActive]}>High to Low</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No products available in this category yet.</Text>
          <Text style={styles.emptyDesc}>We are adding new SKUs daily to this location cluster.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedList}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  backBtn: {
    marginRight: 15,
  },
  backText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginRight: 8,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 3,
  },
  sortPillActive: {
    backgroundColor: '#22C55E',
  },
  sortText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '48%',
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  imageBtn: {
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 110,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  brandText: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1220',
    marginVertical: 4,
    height: 38,
  },
  unitText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  addBtnText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  stepBtn: {
    paddingHorizontal: 8,
  },
  stepBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepQty: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 15,
    backgroundColor: '#22C55E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
});
