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
  ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

export default function MerchantInventoryScreen() {
  const { token } = useAuth();
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

  const categories = ['All', 'Atta & Rice', 'Cooking Essentials', 'Dairy Staples', 'Dry Fruits', 'Biscuits & Snacks', 'Household', 'Personal Care'];

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/products/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Failed to fetch inventory');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter items when products list, search, or activeCategory changes
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
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ available: !currentAvailable })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local list
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, available: !currentAvailable } : p));
      } else {
        Alert.alert('Error', data.error || 'Failed to toggle availability');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error');
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setEditPrice(String(product.price));
    setEditMrp(String(product.mrp));
    setEditStock(String(product.stock));
    setEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!editingProduct) return;

    const priceNum = parseFloat(editPrice);
    const mrpNum = parseFloat(editMrp);
    const stockNum = parseInt(editStock);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid selling price greater than 0');
      return;
    }
    if (isNaN(mrpNum) || mrpNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid MRP greater than 0');
      return;
    }
    if (priceNum > mrpNum) {
      Alert.alert('Validation Error', 'Selling price cannot exceed the Maximum Retail Price (MRP)');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Validation Error', 'Stock cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price: priceNum,
          mrp: mrpNum,
          stock: stockNum
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local list
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, price: priceNum, mrp: mrpNum, stock: stockNum } : p));
        setEditModalVisible(false);
        setEditingProduct(null);
        Alert.alert('Success', 'Inventory changes saved successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to update details');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error during update');
    } finally {
      setSaving(false);
    }
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const discount = item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
    
    return (
      <View style={styles.productCard}>
        <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="contain" />
        <View style={styles.metaContainer}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku}</Text>
          
          <View style={styles.pricingRow}>
            <Text style={styles.priceLabel}>Price: ₹{item.price}</Text>
            {discount > 0 && <Text style={styles.mrpLabel}>MRP: ₹{item.mrp}</Text>}
          </View>
          
          <Text style={[styles.stockLabel, item.stock <= 5 && styles.lowStockLabel]}>
            Stock Count: {item.stock} {item.stock <= 5 ? '(LOW)' : ''}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{item.available ? 'LIVE' : 'OFFLINE'}</Text>
            <Switch
              value={item.available}
              onValueChange={() => handleToggleAvailable(item.id, item.available)}
              trackColor={{ false: '#767577', true: '#86EFAC' }}
              thumbColor={item.available ? '#22C55E' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <Text style={styles.editBtnText}>Edit SKU</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products by title or SKU..."
          value={search}
          onChangeText={setSearch}
        />
        
        {/* Horizontal Categories Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Grid View */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchInventory}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No products found matching filters.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Edit Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Catalogue Item</Text>
            {editingProduct && (
              <Text style={styles.modalProductName} numberOfLines={1}>
                {editingProduct.name}
              </Text>
            )}

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Maximum Retail Price (MRP)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editMrp}
                onChangeText={setEditMrp}
                placeholder="0.00"
              />

              <Text style={styles.inputLabel}>Selling Price (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder="0.00"
              />

              <Text style={styles.inputLabel}>Stock Level</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editStock}
                onChangeText={setEditStock}
                placeholder="0"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  searchHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#0B1220',
  },
  categoriesScroll: {
    marginTop: 12,
    flexDirection: 'row',
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#22C55E',
  },
  categoryPillText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 15,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 64,
    height: 64,
    marginRight: 15,
  },
  metaContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  productSku: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
    marginRight: 8,
  },
  mrpLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  stockLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 4,
  },
  lowStockLabel: {
    color: '#EF4444',
  },
  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    marginRight: 6,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#22C55E15',
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  modalProductName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
  },
  modalForm: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F4F6',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#0B1220',
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    marginLeft: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
