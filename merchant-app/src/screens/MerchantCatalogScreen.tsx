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
import { PACK_UNIT_OPTIONS, formatPackUnit } from '../config/packUnits';

interface MasterProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  primary_category: string;
  image_url: string;
  mrp: string;
  price: string;
  unit?: string;
  short_description?: string;
  description?: string;
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
  const [localShortDescription, setLocalShortDescription] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // States for Suggesting New Product to Super Admin
  const [suggestModalVisible, setSuggestModalVisible] = useState(false);
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuCategory, setNewSkuCategory] = useState('');
  const [newSkuBrand, setNewSkuBrand] = useState('');
  const [newSkuQuantityValue, setNewSkuQuantityValue] = useState('');
  const [newSkuQuantityUnit, setNewSkuQuantityUnit] = useState('kg');
  const [newSkuMrp, setNewSkuMrp] = useState('');
  const [newSkuShortDescription, setNewSkuShortDescription] = useState('');
  const [newSkuDescription, setNewSkuDescription] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

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

  const handleOpenConfigModal = (prod: MasterProduct, existingMapping?: ShopProduct) => {
    setSelectedProduct(prod);
    const initialPrice = existingMapping ? existingMapping.selling_price : parseFloat(prod.price) || 0;
    setLocalPrice(String(initialPrice));
    
    if (existingMapping) {
      setLocalDiscount(String(existingMapping.discount_percentage));
    } else {
      const mrp = parseFloat(prod.mrp) || 0;
      if (mrp > initialPrice && mrp > 0) {
        const pct = Math.round(((mrp - initialPrice) / mrp) * 100);
        setLocalDiscount(String(pct));
      } else {
        setLocalDiscount('0');
      }
    }
    
    setLocalStock(String(existingMapping ? existingMapping.stock : 0));
    setLocalAvailable(existingMapping ? existingMapping.available : false);
    setLocalShortDescription(prod.short_description || '');
    setLocalDescription(prod.description || '');
    setConfigModalVisible(true);
  };

  const handlePriceChange = (val: string) => {
    setLocalPrice(val);
    if (!selectedProduct) return;
    const mrp = parseFloat(selectedProduct.mrp) || 0;
    const price = parseFloat(val) || 0;
    if (mrp > price && mrp > 0) {
      const pct = Math.round(((mrp - price) / mrp) * 100);
      setLocalDiscount(String(pct));
    } else {
      setLocalDiscount('0');
    }
  };

  const handleDiscountChange = (val: string) => {
    setLocalDiscount(val);
    if (!selectedProduct) return;
    const mrp = parseFloat(selectedProduct.mrp) || 0;
    const pct = parseFloat(val) || 0;
    if (mrp > 0) {
      const price = mrp - (mrp * (pct / 100));
      setLocalPrice(String(price.toFixed(2)));
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const mapping = shopProducts.find((sp) => sp.product_id === selectedProduct.id);
      
      // If product not mapped yet, map it first (auto-approved in backend)
      if (!mapping) {
        const reqRes = await fetch(`${API_BASE}/admin/shop-products/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: selectedProduct.id })
        });
        const reqData = await reqRes.json();
        if (!reqRes.ok || !reqData.success) {
          Alert.alert('Error', reqData.error || 'Failed to initialize SKU in inventory.');
          setSaving(false);
          return;
        }
      }

      // Update catalog highlights / MRP (master product fields)
      const contentRes = await fetch(`${API_BASE}/admin/shop-products/product-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          short_description: localShortDescription,
          description: localDescription,
        })
      });
      const contentData = await contentRes.json();
      if (!contentRes.ok || !contentData.success) {
        Alert.alert('Error', contentData.error || 'Failed to update product highlights.');
        setSaving(false);
        return;
      }

      // Configure shop price / stock
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

  const handleSuggestProduct = async () => {
    if (!newSkuName.trim() || !newSkuCategory.trim() || !newSkuQuantityValue.trim() || !newSkuMrp.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Category, Quantity, MRP).');
      return;
    }
    setSubmittingSuggestion(true);
    try {
      const res = await fetch(`${API_BASE}/admin/new-product-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSkuName,
          category: newSkuCategory,
          brand: newSkuBrand,
          unit: formatPackUnit(newSkuQuantityValue, newSkuQuantityUnit),
          quantity_value: parseFloat(newSkuQuantityValue) || 0,
          quantity_unit: newSkuQuantityUnit,
          mrp: parseFloat(newSkuMrp) || 0,
          short_description: newSkuShortDescription,
          description: newSkuDescription,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', 'New product request submitted to Super Admin! Awaiting catalog addition.');
        setSuggestModalVisible(false);
        setNewSkuName('');
        setNewSkuCategory('');
        setNewSkuBrand('');
        setNewSkuQuantityValue('');
        setNewSkuQuantityUnit('kg');
        setNewSkuMrp('');
        setNewSkuShortDescription('');
        setNewSkuDescription('');
      } else {
        Alert.alert('Error', data.error || 'Failed to submit request.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error while submitting request.');
    } finally {
      setSubmittingSuggestion(false);
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
            <Text style={styles.mrpText}>
              {item.unit ? `${item.unit} · ` : ''}Base MRP: ₹{item.mrp} | Default: ₹{item.price}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {mapping ? (
            <View style={styles.approvedRow}>
              <View style={mapping.available ? styles.approvedBadge : styles.rejectedBadge}>
                <Text style={mapping.available ? styles.approvedText : styles.rejectedText}>
                  {mapping.available ? `✓ Live (₹${mapping.selling_price})` : '✕ Inactive'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => handleOpenConfigModal(item, mapping)}
              >
                <Text style={styles.configBtnText}>⚙️ Configure</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.approvedRow}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>⚠️ Not in Store</Text>
              </View>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => handleOpenConfigModal(item)}
              >
                <Text style={styles.configBtnText}>⚙️ Configure</Text>
              </TouchableOpacity>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Master Catalog</Text>
          <Text style={styles.subtitle} numberOfLines={1}>Configure inventory or suggest new SKU</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.suggestBtn} onPress={() => setSuggestModalVisible(true)}>
            <Text style={styles.suggestBtnText}>+ Suggest SKU</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>
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
              onChangeText={handlePriceChange}
              placeholder="e.g. 199.00"
            />

            <Text style={styles.inputLabel}>Discount Percentage (%)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={localDiscount}
              onChangeText={handleDiscountChange}
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

            {selectedProduct?.unit ? (
              <Text style={styles.readOnlyUnit}>Pack unit: {selectedProduct.unit} (set at catalog level)</Text>
            ) : null}

            <Text style={styles.inputLabel}>Short description</Text>
            <TextInput
              style={styles.modalInput}
              value={localShortDescription}
              onChangeText={setLocalShortDescription}
              placeholder="One-line summary for customers"
            />

            <Text style={styles.inputLabel}>Highlights (semicolon-separated)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 72, textAlignVertical: 'top' }]}
              multiline
              value={localDescription}
              onChangeText={setLocalDescription}
              placeholder="e.g. Stone ground; 100% whole wheat; Milled in small batches"
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

      {/* Suggest SKU Modal */}
      <Modal visible={suggestModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Suggest New SKU</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Request adding product to Master Catalogue</Text>

            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkuName}
              onChangeText={setNewSkuName}
              placeholder="e.g. Britannia Marie Gold Biscuits"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkuCategory}
              onChangeText={setNewSkuCategory}
              placeholder="e.g. Packaged Foods"
            />

            <Text style={styles.inputLabel}>Brand</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkuBrand}
              onChangeText={setNewSkuBrand}
              placeholder="e.g. Britannia"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={newSkuQuantityValue}
                  onChangeText={setNewSkuQuantityValue}
                  placeholder="e.g. 5"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>MRP (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={newSkuMrp}
                  onChangeText={setNewSkuMrp}
                  placeholder="e.g. 40"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Unit type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PACK_UNIT_OPTIONS.map((opt) => {
                  const active = newSkuQuantityUnit === opt.code;
                  return (
                    <TouchableOpacity
                      key={opt.code}
                      style={[styles.unitPill, active && styles.unitPillActive]}
                      onPress={() => setNewSkuQuantityUnit(opt.code)}
                    >
                      <Text style={[styles.unitPillText, active && styles.unitPillTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {newSkuQuantityValue ? (
              <Text style={{ fontSize: 12, color: '#16A34A', marginBottom: 12, fontWeight: '600' }}>
                Pack: {formatPackUnit(newSkuQuantityValue, newSkuQuantityUnit)}
              </Text>
            ) : null}

            <Text style={styles.inputLabel}>Short description</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkuShortDescription}
              onChangeText={setNewSkuShortDescription}
              placeholder="e.g. Chakki-fresh whole wheat atta"
            />

            <Text style={styles.inputLabel}>Highlights (semicolon-separated)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 72, textAlignVertical: 'top' }]}
              multiline
              value={newSkuDescription}
              onChangeText={setNewSkuDescription}
              placeholder="e.g. Stone ground; Zero maida; Soft rotis"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSuggestModalVisible(false)}
                disabled={submittingSuggestion}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSuggestProduct}
                disabled={submittingSuggestion}
              >
                {submittingSuggestion ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Submit Request</Text>
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
  suggestBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  readOnlyUnit: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
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
  unitPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  unitPillTextActive: {
    color: '#FFFFFF',
  },
});
