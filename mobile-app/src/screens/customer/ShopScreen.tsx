import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';



export default function ShopScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [error, setError] = useState('');

  const { token, logout, city, area } = useAuth();
  const { items, addToCart, updateQuantity } = useCart();

  const fetchCategories = async () => {
    try {
      let url = `${API_BASE}/products/categories`;
      if (city && area) {
        url += `?city=${encodeURIComponent(city)}&area_name=${encodeURIComponent(area)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(['All', ...(data.categories || [])]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [city, area]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE}/products/all?limit=200`;
      if (category !== 'All') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (search) {
        url += `&q=${encodeURIComponent(search)}`;
      }
      if (city) {
        url += `&city=${encodeURIComponent(city)}`;
      }
      if (area) {
        url += `&area_name=${encodeURIComponent(area)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Connection error. Is the Express server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search, city, area]);

  const getCartQuantity = (productId: string) => {
    const item = items.find((it) => it.product.id === productId);
    return item ? item.quantity : 0;
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const qty = getCartQuantity(item.id);

    return (
      <View style={styles.productCard}>
        <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="contain" />
        <View style={styles.productInfo}>
          <Text style={styles.brandText}>{item.brand}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.unitText}>{item.unit}</Text>
          
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceText}>₹{item.price}</Text>
              {item.mrp > item.price && (
                <Text style={styles.mrpText}>MRP ₹{item.mrp}</Text>
              )}
            </View>

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
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MonthlyGrocery</Text>
          <Text style={styles.headerSubtitle}>Fresh groceries delivered in 4 hrs</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder='Search for "atta", "dal", "ghee"...'
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryPill, category === item && styles.categoryPillActive]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Product List */}
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
          <Text style={styles.emptyText}>No products found in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Sticky Bottom Cart Bar */}
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Cart')}
        >
          <View>
            <Text style={styles.cartBarItems}>{items.reduce((sum, i) => sum + i.quantity, 0)} Items</Text>
            <Text style={styles.cartBarTotal}>Total: ₹{items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)}</Text>
          </View>
          <Text style={styles.cartBarView}>View Cart ➔</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  logoutText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  searchBar: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#333',
  },
  categoriesWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  categoriesContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 5,
  },
  categoryPillActive: {
    backgroundColor: '#22C55E',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTextActive: {
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
    paddingBottom: 80,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
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
  mrpText: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
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
  cartBar: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cartBarItems: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartBarTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cartBarView: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
    fontSize: 14,
    color: '#666',
  },
});
