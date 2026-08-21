import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

export default function MerchantInventoryScreen() {
  const { token } = useMerchantAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>(['All']);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/products/categories`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(['All', ...(data.categories || [])]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/shop-products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const approvedProducts = (data.shop_products || []).filter((sp: any) => sp.status === 'approved');
        setProducts(approvedProducts);
      } else {
        setError(data.error || 'Failed to fetch inventory');
      }
    } catch (err) {
      setError('Connection error. Is the server running on port 8001?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  useEffect(() => {
    let out = [...products];

    if (activeCategory !== 'All') {
      out = out.filter(p => p.primary_category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    setFilteredProducts(out);
  }, [products, search, activeCategory]);

  const handleToggleAvailable = async (productId: string, currentAvailable: boolean) => {
    const nextAvailable = !currentAvailable;
    
    // Optimistic UI update
    setProducts(prev => prev.map(p => 
      p.product_id === productId ? { ...p, available: nextAvailable } : p
    ));

    try {
      const targetProd = products.find(p => p.product_id === productId);
      const res = await fetch(`${API_BASE}/admin/shop-products/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          selling_price: targetProd ? targetProd.selling_price : 0,
          discount_percentage: targetProd ? targetProd.discount_percentage : 0,
          stock: targetProd ? targetProd.stock : 100,
          available: nextAvailable
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        setProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, available: currentAvailable } : p
        ));
        Alert.alert('Error', data.error || 'Failed to update item availability status');
      }
    } catch (err) {
      // Rollback
      setProducts(prev => prev.map(p => 
        p.product_id === productId ? { ...p, available: currentAvailable } : p
      ));
      Alert.alert('Error', 'Connection error while saving status');
    }
  };

  const handleOpenEditModal = (item: any) => {
    setEditingProduct(item);
    setEditPrice(String(item.selling_price || ''));
    setEditMrp(String(item.mrp || ''));
    setEditStock(String(item.stock || '0'));
    setEditModalVisible(true);
  };

  const handleSaveProductConfig = async () => {
    if (!editingProduct) return;
    
    const priceVal = parseFloat(editPrice);
    const stockVal = parseInt(editStock, 10);
    const mrpVal = parseFloat(editMrp) || priceVal;

    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid positive selling price.');
      return;
    }

    if (isNaN(stockVal) || stockVal < 0) {
      Alert.alert('Invalid Stock', 'Please enter a valid stock number (0 or more).');
      return;
    }

    const calculatedDiscount = mrpVal > priceVal 
      ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) 
      : 0;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shop-products/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: editingProduct.product_id,
          selling_price: priceVal,
          discount_percentage: calculatedDiscount,
          stock: stockVal,
          available: editingProduct.available
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(prev => prev.map(p => 
          p.product_id === editingProduct.product_id 
            ? { ...p, selling_price: priceVal, discount_percentage: calculatedDiscount, stock: stockVal }
            : p
        ));
        setEditModalVisible(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to update product details');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error while saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const renderInventoryItem = ({ item }: { item: any }) => {
    const isOutOfStock = !item.available || item.stock <= 0;
    
    return (
      <View style={[styles.productCard, isOutOfStock && styles.productCardOOS]}>
        <View style={styles.cardTopRow}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productThumb} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderThumb}><Text style={{ fontSize: 20 }}>📦</Text></View>
          )}

          <View style={styles.productDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            </View>
            <Text style={styles.skuText}>SKU: {item.sku || 'N/A'} • {item.primary_category}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.sellingPrice}>₹{item.selling_price}</Text>
              {item.mrp && item.mrp > item.selling_price && (
                <Text style={styles.mrpText}>MRP ₹{item.mrp}</Text>
              )}
              {item.discount_percentage > 0 && (
                <View style={styles.discountPill}>
                  <Text style={styles.discountText}>{item.discount_percentage}% OFF</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stock & Quick Controls Row */}
        <View style={styles.cardControlsRow}>
          <View style={styles.stockBadge}>
            <Text style={styles.stockLabel}>STOCK:</Text>
            <Text style={[styles.stockValue, item.stock < 10 && styles.lowStock]}>
              {item.stock} units
            </Text>
          </View>

          <View style={styles.controlsRight}>
            <View style={styles.switchWrapper}>
              <Text style={styles.switchLabel}>{item.available ? 'In Stock' : 'Out of Stock'}</Text>
              <Switch
                value={item.available}
                onValueChange={() => handleToggleAvailable(item.product_id, item.available)}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={item.available ? '#22C55E' : '#94A3B8'}
              />
            </View>

            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => handleOpenEditModal(item)}
            >
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
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
        <View>
          <Text style={styles.headerTitle}>Store Inventory</Text>
          <Text style={styles.headerSubtitle}>Manage item prices, available stock & visibility</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchInventory}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by SKU name or code..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories Filter Tabs */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, isSelected && styles.catChipSelected]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading store inventory...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchInventory}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>📦</Text>
          <Text style={styles.emptyTitle}>No SKUs Available</Text>
          <Text style={styles.emptySub}>
            {search.trim() ? 'No products match your search query.' : 'Browse the Master Catalog tab to add SKUs to your shop.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderInventoryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Quick Edit Price & Stock Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure SKU Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {editingProduct && (
              <ScrollView>
                <Text style={styles.modalProductName}>{editingProduct.name}</Text>
                <Text style={styles.modalProductSku}>SKU: {editingProduct.sku || 'N/A'}</Text>

                {/* Selling Price input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SELLING PRICE (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                    placeholder="Enter store selling price"
                  />
                </View>

                {/* MRP Reference */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MRP REFERENCE (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
                    keyboardType="numeric"
                    value={editMrp}
                    onChangeText={setEditMrp}
                    placeholder="Maximum Retail Price"
                  />
                </View>

                {/* Stock Quantity */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>AVAILABLE STOCK UNITS</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={editStock}
                    onChangeText={setEditStock}
                    placeholder="e.g. 50"
                  />
                </View>

                {/* Save button */}
                <TouchableOpacity 
                  style={[styles.modalSaveBtn, saving && styles.btnDisabled]}
                  onPress={handleSaveProductConfig}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save SKU Changes ✓</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  categoriesWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardOOS: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  skuText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  mrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  cardControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  lowStock: {
    color: '#EF4444',
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  editBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalProductName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  modalProductSku: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalSaveBtn: {
    backgroundColor: '#22C55E',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
