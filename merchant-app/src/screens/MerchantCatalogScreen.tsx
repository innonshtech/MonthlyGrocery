import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Switch,
  Alert,
  Image,
  ScrollView,
  StatusBar
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

interface MasterProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  primary_category: string;
  image_url: string;
  mrp: string;
  price: string;
}

interface ShopProduct {
  id: string;
  shop_id: string;
  product_id: string;
  selling_price: number;
  discount_percentage: number;
  stock: number;
  available: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export default function MerchantCatalogScreen() {
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('All');
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

  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Modal states for configuration
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [localPrice, setLocalPrice] = useState('');
  const [localDiscount, setLocalDiscount] = useState('');
  const [localStock, setLocalStock] = useState('');
  const [localAvailable, setLocalAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  const { token } = useMerchantAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch master catalogue
      const masterRes = await fetch(`${API_BASE}/products/master`);
      const masterData = await masterRes.json();
      
      // 2. Fetch merchant shop mappings
      const shopRes = await fetch(`${API_BASE}/admin/shop-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const shopData = await shopRes.json();

      if (masterRes.ok && shopRes.ok && masterData.success && shopData.success) {
        setMasterProducts(masterData.products || []);
        setShopProducts(shopData.shop_products || []);
      } else {
        Alert.alert('Error', 'Failed to retrieve catalog lists.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Unable to fetch catalogue from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSKU = async (productId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/shop-products/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Requested', 'SKU request submitted! Awaiting Super Admin approval.');
        fetchData();
      } else {
        Alert.alert('Request Failed', data.error || 'Unable to request product.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error while submitting request.');
    }
  };

  const handleOpenConfigModal = (prod: MasterProduct, existingMapping: ShopProduct) => {
    setSelectedProduct(prod);
    setLocalPrice(String(existingMapping.selling_price || prod.price));
    setLocalDiscount(String(existingMapping.discount_percentage || 0));
    setLocalStock(String(existingMapping.stock || 0));
    setLocalAvailable(existingMapping.available);
    setConfigModalVisible(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shop-products/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          selling_price: parseFloat(localPrice) || 0,
          discount_percentage: parseInt(localDiscount) || 0,
          stock: parseInt(localStock) || 0,
          available: localAvailable
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', 'SKU configuration updated successfully!');
        setConfigModalVisible(false);
        fetchData();
      } else {
        Alert.alert('Error', data.error || 'Failed to update SKU configuration.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error while saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const filteredMasterProducts = masterProducts.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.primary_category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const renderProductItem = ({ item }: { item: MasterProduct }) => {
    const mapping = shopProducts.find((sp) => sp.product_id === item.id);
    const status = mapping ? mapping.status : 'not_requested';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productThumb} resizeMode="contain" />
          ) : (
            <View style={styles.thumbPlaceholder}><Text>🛒</Text></View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.productTitle} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.categorySub}>{item.primary_category} • {item.brand || 'Unbranded'}</Text>
            <Text style={styles.mrpText}>Base MRP: ₹{item.mrp} | Default: ₹{item.price}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {status === 'not_requested' && (
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => handleRequestSKU(item.id)}
            >
              <Text style={styles.requestBtnText}>+ Request for My Shop</Text>
            </TouchableOpacity>
          )}

          {status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>⏳ Pending Approval</Text>
            </View>
          )}

          {status === 'approved' && mapping && (
            <View style={styles.approvedRow}>
              <View style={styles.approvedBadge}>
                <Text style={styles.approvedText}>✓ Active in Store (₹{mapping.selling_price})</Text>
              </View>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => handleOpenConfigModal(item, mapping)}
              >
                <Text style={styles.configBtnText}>⚙️ Configure</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'rejected' && (
            <View style={styles.rejectedBadge}>
              <Text style={styles.rejectedText}>✕ Request Rejected</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Master SKU Catalog</Text>
          <Text style={styles.subtitle}>Browse central products & request items for your store</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search by product name, brand or SKU..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, activeCategory === cat && styles.activeCategoryPill]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryPillText, activeCategory === cat && styles.activeCategoryPillText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading master products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMasterProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No SKUs found</Text>
              <Text style={styles.emptySubtitle}>Try changing your search query or category filter</Text>
            </View>
          }
        />
      )}

      {/* SKU Configuration Modal */}
      <Modal visible={configModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure SKU for Shop</Text>
            {selectedProduct && (
              <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
            )}

            <Text style={styles.inputLabel}>My Selling Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={localPrice}
              onChangeText={setLocalPrice}
              placeholder="e.g. 199.00"
            />

            <Text style={styles.inputLabel}>Discount Percentage (%)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={localDiscount}
              onChangeText={setLocalDiscount}
              placeholder="e.g. 10"
            />

            <Text style={styles.inputLabel}>Available Stock Units</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={localStock}
              onChangeText={setLocalStock}
              placeholder="e.g. 50"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>In-Stock & Visible</Text>
              <Switch
                value={localAvailable}
                onValueChange={setLocalAvailable}
                trackColor={{ false: '#767577', true: '#86EFAC' }}
                thumbColor={localAvailable ? '#22C55E' : '#f4f3f4'}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfigModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveConfig}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save SKU Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
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
  searchBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryScrollContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeCategoryPill: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeCategoryPillText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  categorySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mrpText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  requestBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  requestBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  pendingText: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 12,
  },
  approvedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approvedText: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 11,
  },
  configBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 11,
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectedText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalProductName: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
