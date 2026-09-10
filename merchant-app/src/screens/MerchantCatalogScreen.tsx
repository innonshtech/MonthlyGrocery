import React, { useState, useCallback, useEffect } from 'react';
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
  StatusBar,
  RefreshControl,
  Linking,
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';
import { PACK_UNIT_OPTIONS, formatPackUnit } from '../config/packUnits';
import SafeProductImage from '../components/SafeProductImage';
import ProductMediaModal, { ProductMediaItem } from '../components/ProductMediaModal';
import { groupProductsIntoFamilies, ProductFamily, findSiblingVariants, getPackUnitLabel, getDisplayBaseName } from '../utils/productFamily';

interface MasterProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  primary_category: string;
  image_url: string;
  images?: string[];
  video_url?: string | null;
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

export interface MySkuRequest {
  id: string;
  shop_id?: string;
  product_name: string;
  category: string;
  brand?: string;
  mrp: number;
  unit?: string;
  quantity_value?: number;
  quantity_unit?: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const DEFAULT_PLATFORM_CATEGORIES = [
  'Atta & Rice',
  'Oils & Ghee',
  'Dals & Pulses',
  'Spices & Masala',
  'Dry Fruits',
  'Snacks',
  'Beverages',
  'Biscuits',
  'Cleaning',
  'Personal Care',
  'Home & Kitchen',
  'Baby Care',
];

export default function MerchantCatalogScreen() {
  const [catalogTab, setCatalogTab] = useState<'master' | 'my_suggestions'>('master');
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [mySkuRequests, setMySkuRequests] = useState<MySkuRequest[]>([]);
  const [selectedMasterVariantMap, setSelectedMasterVariantMap] = useState<{ [familyKey: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [suggestCategories, setSuggestCategories] = useState<string[]>(DEFAULT_PLATFORM_CATEGORIES);
  
  // Media Inspection Modal
  const [previewProduct, setPreviewProduct] = useState<ProductMediaItem | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Modal states for configuration
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configModalActiveImage, setConfigModalActiveImage] = useState('');
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

  const syncCategories = useCallback((products: MasterProduct[], remoteCats: string[] = []) => {
    const liveProductCategories = Array.from(
      new Set(products.map((p) => p.primary_category).filter(Boolean)),
    ).sort();

    const allCats = Array.from(
      new Set([
        ...DEFAULT_PLATFORM_CATEGORIES,
        ...remoteCats,
        ...liveProductCategories,
      ]),
    ).sort();

    setSuggestCategories(allCats);
    setCategories(['All', ...(liveProductCategories.length > 0 ? liveProductCategories : allCats)]);

    if (activeCategory !== 'All' && !liveProductCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [masterRes, shopRes, catRes, reqsRes] = await Promise.all([
        fetch(`${API_BASE}/products/master`),
        fetch(`${API_BASE}/admin/shop-products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/products/categories`).catch(() => null),
        fetch(`${API_BASE}/admin/my-sku-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      const masterData = await masterRes.json();
      const shopData = await shopRes.json();

      let remoteCategories: string[] = [];
      if (catRes && catRes.ok) {
        try {
          const catData = await catRes.json();
          if (catData?.categories && Array.isArray(catData.categories)) {
            remoteCategories = catData.categories;
          }
        } catch {}
      }

      if (reqsRes && reqsRes.ok) {
        try {
          const reqsData = await reqsRes.json();
          if (reqsData?.success && Array.isArray(reqsData.requests)) {
            setMySkuRequests(reqsData.requests);
          }
        } catch {}
      }

      if (!masterRes.ok || !masterData.success) {
        setMasterProducts([]);
        setShopProducts([]);
        syncCategories([], remoteCategories);
        setError(masterData.error || 'Failed to load master catalog');
        return;
      }

      if (!shopRes.ok || !shopData.success) {
        setMasterProducts(masterData.products || []);
        syncCategories(masterData.products || [], remoteCategories);
        setShopProducts([]);
        setError(shopData.error || 'Failed to load your store mappings');
        return;
      }

      const products = masterData.products || [];
      setMasterProducts(products);
      setShopProducts(shopData.shop_products || []);
      syncCategories(products, remoteCategories);
    } catch (err) {
      setMasterProducts([]);
      setShopProducts([]);
      syncCategories([]);
      setError('Connection error. Is the backend running on port 8001?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, syncCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        Alert.alert('Added', 'SKU added to your store. Configure price and stock in Inventory.');
        fetchData(true);
      } else {
        Alert.alert('Request Failed', data.error || 'Unable to request product.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error while submitting request.');
    }
  };

  const handleOpenConfigModal = (prod: MasterProduct, existingMapping?: ShopProduct) => {
    setSelectedProduct(prod);
    const pImages = Array.isArray(prod.images) && prod.images.length > 0
      ? prod.images
      : (prod.image_url ? [prod.image_url] : []);
    setConfigModalActiveImage(pImages[0] || prod.image_url || '');
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
        fetchData(true);
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

  const masterFamilies = React.useMemo(() => {
    return groupProductsIntoFamilies(masterProducts);
  }, [masterProducts]);

  const filteredMasterFamilies = React.useMemo(() => {
    let out = masterFamilies;
    if (activeCategory !== 'All') {
      out = out.filter(f => f.primary_category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.variants.some((v: any) =>
          (v.sku && v.sku.toLowerCase().includes(q)) ||
          (v.name && v.name.toLowerCase().includes(q))
        )
      );
    }
    return out;
  }, [masterFamilies, search, activeCategory]);

  const renderSuggestedItem = ({ item }: { item: MySkuRequest }) => {
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';
    const isPending = !isApproved && !isRejected;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.thumbTouchable}
            activeOpacity={0.8}
            onPress={() => {
              if (item.image_url) {
                setPreviewProduct({
                  name: item.product_name,
                  primary_category: item.category,
                  unit: item.unit,
                  images: [item.image_url],
                  image_url: item.image_url,
                  mrp: item.mrp,
                });
                setPreviewModalVisible(true);
              }
            }}
          >
            <SafeProductImage
              uri={item.image_url}
              style={styles.productThumb}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.productTitle} numberOfLines={2}>{item.product_name}</Text>
            <Text style={styles.categorySub}>{item.category} • {item.brand || 'Unbranded'}</Text>
            <Text style={styles.mrpText}>
              {item.unit ? `${item.unit} · ` : ''}Base MRP: ₹{item.mrp}
            </Text>
            {item.short_description ? (
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                {item.short_description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.approvedRow, { alignItems: 'center' }]}>
            {isApproved && (
              <View style={[styles.approvedBadge, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0', borderWidth: 1 }]}>
                <Text style={[styles.approvedText, { color: '#16A34A', fontWeight: '700' }]}>✓ Approved & Live</Text>
              </View>
            )}
            {isPending && (
              <View style={[styles.pendingBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
                <Text style={[styles.pendingText, { color: '#D97706', fontWeight: '700' }]}>⏳ Pending Approval</Text>
              </View>
            )}
            {isRejected && (
              <View style={[styles.rejectedBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA', borderWidth: 1 }]}>
                <Text style={[styles.rejectedText, { color: '#DC2626', fontWeight: '700' }]}>✕ Rejected</Text>
              </View>
            )}
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMasterFamilyCard = ({ item }: { item: ProductFamily<MasterProduct> }) => {
    const activeVariantId = selectedMasterVariantMap[item.familyKey] || item.variants[0]?.id;
    const activeVariant = item.variants.find((v) => v.id === activeVariantId) || item.variants[0];

    if (!activeVariant) return null;

    const mapping = shopProducts.find((sp) => sp.product_id === activeVariant.id);
    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.image_url ? [item.image_url] : []);
    const hasMultipleAngles = images.length > 1;
    const hasVideo = Boolean(item.video_url);
    const activeUnitLabel = getPackUnitLabel(activeVariant) || activeVariant.unit || '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.thumbTouchable}
            activeOpacity={0.8}
            onPress={() => {
              setPreviewProduct({
                name: `${item.name}${activeUnitLabel ? ` (${activeUnitLabel})` : ''}`,
                sku: activeVariant.sku,
                unit: activeVariant.unit,
                primary_category: item.primary_category,
                images,
                image_url: item.image_url,
                video_url: item.video_url,
                selling_price: mapping ? mapping.selling_price : parseFloat(activeVariant.price) || 0,
                mrp: parseFloat(activeVariant.mrp) || 0,
              });
              setPreviewModalVisible(true);
            }}
          >
            <SafeProductImage
              uri={item.image_url || images[0]}
              style={styles.productThumb}
              resizeMode="contain"
            />
            {hasMultipleAngles && (
              <View style={styles.cardAngleBadge}>
                <Text style={styles.cardAngleBadgeText}>+{images.length - 1}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.productTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.categorySub}>{item.primary_category} • {item.brand || 'Unbranded'}</Text>
            <Text style={styles.activeSkuCode}>
              Active SKU: {activeVariant.sku || 'N/A'} {activeUnitLabel ? `(${activeUnitLabel})` : ''}
            </Text>

            {/* Media Indicators */}
            {(hasMultipleAngles || hasVideo) && (
              <View style={styles.mediaTagRow}>
                {hasMultipleAngles && (
                  <TouchableOpacity
                    style={styles.photoCountPill}
                    onPress={() => {
                      setPreviewProduct({
                        name: `${item.name}${activeUnitLabel ? ` (${activeUnitLabel})` : ''}`,
                        sku: activeVariant.sku,
                        unit: activeVariant.unit,
                        primary_category: item.primary_category,
                        images,
                        image_url: item.image_url,
                        video_url: item.video_url,
                        selling_price: mapping ? mapping.selling_price : parseFloat(activeVariant.price) || 0,
                        mrp: parseFloat(activeVariant.mrp) || 0,
                      });
                      setPreviewModalVisible(true);
                    }}
                  >
                    <Text style={styles.photoCountText}>📷 {images.length} angles</Text>
                  </TouchableOpacity>
                )}
                {hasVideo && (
                  <TouchableOpacity
                    style={styles.videoPill}
                    onPress={() => {
                      if (item.video_url) {
                        Linking.openURL(item.video_url).catch(() => {
                          Alert.alert('Error', 'Unable to open video preview URL.');
                        });
                      }
                    }}
                  >
                    <Text style={styles.videoPillText}>▶️ Video</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Interactive Pack Unit Selector */}
        <View style={styles.packSelectorContainer}>
          <View style={styles.packSelectorHeader}>
            <Text style={styles.packSelectorTitle}>AVAILABLE PACK SIZES ({item.variants.length}):</Text>
            <Text style={styles.packSelectorHint}>Tap to switch & configure</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packPillScroll}
          >
            {item.variants.map((v: MasterProduct) => {
              const isSelected = v.id === activeVariant.id;
              const vMapping = shopProducts.find((sp) => sp.product_id === v.id);
              const inStore = Boolean(vMapping);
              const unitLabel = getPackUnitLabel(v) || v.unit || 'Pack';

              return (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.packPill,
                    isSelected && styles.packPillSelected,
                    inStore && styles.packPillInStore,
                  ]}
                  onPress={() => {
                    setSelectedMasterVariantMap((prev) => ({
                      ...prev,
                      [item.familyKey]: v.id,
                    }));
                  }}
                >
                  <View style={styles.packPillTop}>
                    <Text
                      style={[
                        styles.packPillUnit,
                        isSelected && styles.packPillUnitSelected,
                        inStore && styles.packPillUnitInStore,
                      ]}
                    >
                      {unitLabel}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        inStore ? (vMapping?.available ? styles.statusDotLive : styles.statusDotInactive) : styles.statusDotNotAdded,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.packPillPrice,
                      isSelected && styles.packPillPriceSelected,
                    ]}
                  >
                    {inStore && vMapping ? `₹${vMapping.selling_price}` : `₹${v.price || v.mrp}`}
                  </Text>
                  <Text
                    style={[
                      styles.packPillStock,
                      isSelected && styles.packPillStockSelected,
                      inStore && styles.packPillStockInStore,
                    ]}
                  >
                    {inStore ? (vMapping?.available ? '✓ In Shop' : '✕ Inactive') : '+ Not in Shop'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Unit Price Row */}
        <View style={styles.activeVariantInfoRow}>
          <View style={styles.priceRow}>
            <Text style={styles.mrpText}>
              Base MRP: ₹{activeVariant.mrp} | Default Selling: ₹{activeVariant.price}
            </Text>
          </View>
        </View>

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          {mapping ? (
            <View style={styles.approvedRow}>
              <View style={mapping.available ? styles.approvedBadge : styles.rejectedBadge}>
                <Text style={mapping.available ? styles.approvedText : styles.rejectedText}>
                  {mapping.available ? `✓ Live in Shop (₹${mapping.selling_price})` : '✕ Inactive in Shop'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => handleOpenConfigModal(activeVariant, mapping)}
              >
                <Text style={styles.configBtnText}>⚙️ Configure {activeUnitLabel || 'Unit'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.approvedRow}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>⚠️ {activeUnitLabel || 'Unit'} Not Added</Text>
              </View>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => handleOpenConfigModal(activeVariant)}
              >
                <Text style={styles.configBtnText}>+ Add {activeUnitLabel || 'Unit'} to Shop</Text>
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
          <Text style={styles.title}>Merchant Catalog</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {loading ? 'Loading live catalog…' : `${masterFamilies.length} Products (${masterProducts.length} Pack Sizes) · ${shopProducts.length} in store · ${mySkuRequests.length} suggested`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.suggestBtn} onPress={() => setSuggestModalVisible(true)}>
            <Text style={styles.suggestBtnText}>+ Suggest SKU</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchData(true)}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segment Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, catalogTab === 'master' && styles.segmentBtnActive]}
          onPress={() => setCatalogTab('master')}
        >
          <Text style={[styles.segmentText, catalogTab === 'master' && styles.segmentTextActive]}>
            Master Catalog ({masterFamilies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, catalogTab === 'my_suggestions' && styles.segmentBtnActive]}
          onPress={() => setCatalogTab('my_suggestions')}
        >
          <Text style={[styles.segmentText, catalogTab === 'my_suggestions' && styles.segmentTextActive]}>
            My Suggestions {mySkuRequests.length > 0 ? `(${mySkuRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {catalogTab === 'master' ? (
        <>
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
          {categories.length > 1 ? (
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
          ) : null}

          {/* Product List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.loadingText}>Loading master products...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredMasterFamilies}
              keyExtractor={(item) => item.familyKey}
              renderItem={renderMasterFamilyCard}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#22C55E']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No SKUs found</Text>
                  <Text style={styles.emptySubtitle}>
                    {search.trim() || activeCategory !== 'All'
                      ? 'Try changing your search or category filter.'
                      : 'The master catalog is empty. Ask Super Admin to add products, or suggest a new SKU.'}
                  </Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        /* My Suggested SKUs Tab */
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Loading your SKU suggestions...</Text>
          </View>
        ) : (
          <FlatList
            data={mySkuRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestedItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#22C55E']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📦</Text>
                <Text style={styles.emptyTitle}>No SKU Suggestions Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Have a product you want to sell that isn&apos;t in the Master Catalog? Suggest it to Super Admin!
                </Text>
                <TouchableOpacity
                  style={[styles.suggestBtn, { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10 }]}
                  onPress={() => setSuggestModalVisible(true)}
                >
                  <Text style={[styles.suggestBtnText, { fontSize: 14 }]}>+ Suggest New SKU</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      )}

      {/* SKU Configuration Modal */}
      <Modal visible={configModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={styles.modalTitle}>Configure SKU for Shop</Text>
                <TouchableOpacity onPress={() => setConfigModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedProduct && (
                <>
                  {/* Sibling Pack Variant Switcher inside Modal */}
                  {(() => {
                    const modalSiblings = findSiblingVariants(selectedProduct, masterProducts);
                    if (modalSiblings.length <= 1) return null;

                    return (
                      <View style={styles.modalSiblingContainer}>
                        <View style={styles.modalSiblingHeaderRow}>
                          <Text style={styles.modalSiblingTitle}>📦 Pack Sizes in this Brand Family ({modalSiblings.length})</Text>
                          <Text style={styles.modalSiblingSubtitle}>Tap any pack size to configure</Text>
                        </View>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.modalSiblingScroll}
                        >
                          {modalSiblings.map((sib) => {
                            const isSelected = sib.id === selectedProduct.id;
                            const sibMapping = shopProducts.find((sp) => sp.product_id === sib.id);
                            const inStore = Boolean(sibMapping);
                            const sibUnit = getPackUnitLabel(sib) || sib.unit || 'Pack';

                            return (
                              <TouchableOpacity
                                key={sib.id}
                                style={[
                                  styles.modalSiblingChip,
                                  isSelected && styles.modalSiblingChipActive,
                                  !isSelected && inStore && styles.modalSiblingChipInStore,
                                ]}
                                onPress={() => {
                                  if (sib.id !== selectedProduct.id) {
                                    handleOpenConfigModal(sib, sibMapping);
                                  }
                                }}
                              >
                                <View style={styles.modalSiblingChipHeader}>
                                  <Text
                                    style={[
                                      styles.modalSiblingChipUnit,
                                      isSelected && styles.modalSiblingChipUnitActive,
                                    ]}
                                  >
                                    {sibUnit}
                                  </Text>
                                  {isSelected ? (
                                    <View style={styles.modalActiveBadge}>
                                      <Text style={styles.modalActiveBadgeText}>Active</Text>
                                    </View>
                                  ) : inStore ? (
                                    <View style={styles.modalInStoreBadge}>
                                      <Text style={styles.modalInStoreBadgeText}>In Shop</Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text
                                  style={[
                                    styles.modalSiblingChipPrice,
                                    isSelected && styles.modalSiblingChipPriceActive,
                                  ]}
                                >
                                  {inStore && sibMapping ? `₹${sibMapping.selling_price}` : `MRP ₹${sib.mrp}`}
                                </Text>
                                <Text
                                  style={[
                                    styles.modalSiblingChipSub,
                                    isSelected && styles.modalSiblingChipSubActive,
                                  ]}
                                >
                                  {inStore ? (sibMapping?.available ? '✓ Live' : '✕ Inactive') : '+ Add to Shop'}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    );
                  })()}

                  <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                  
                  {/* Photo Gallery Preview */}
                  {(() => {
                    const pImages = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                      ? selectedProduct.images
                      : (selectedProduct.image_url ? [selectedProduct.image_url] : []);
                    const activePreview = configModalActiveImage || pImages[0] || selectedProduct.image_url || '';

                    return (
                      <View style={styles.modalGalleryContainer}>
                        <View style={styles.modalMainPreviewBox}>
                          <SafeProductImage
                            uri={activePreview}
                            style={styles.modalMainPreviewImage}
                            resizeMode="contain"
                          />
                          {pImages.length > 1 && (
                            <View style={styles.modalAngleBadge}>
                              <Text style={styles.modalAngleBadgeText}>{pImages.length} photo angles</Text>
                            </View>
                          )}
                        </View>

                        {/* Thumbnails */}
                        {pImages.length > 1 && (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.modalThumbStrip}
                          >
                            {pImages.map((imgUri, idx) => {
                              const isSelected = activePreview === imgUri;
                              const isPng = imgUri.toLowerCase().endsWith('.png') || imgUri.includes('.png?');
                              const isSvg = imgUri.toLowerCase().endsWith('.svg') || imgUri.includes('.svg?');

                              return (
                                <TouchableOpacity
                                  key={idx}
                                  style={[styles.modalThumbChip, isSelected && styles.modalThumbChipSelected]}
                                  onPress={() => setConfigModalActiveImage(imgUri)}
                                >
                                  <SafeProductImage
                                    uri={imgUri}
                                    style={styles.modalThumbImage}
                                    resizeMode="contain"
                                  />
                                  <View style={[styles.modalThumbTag, isSelected && styles.modalThumbTagSelected]}>
                                    <Text style={[styles.modalThumbTagText, isSelected && styles.modalThumbTagTextSelected]}>
                                      {isPng ? 'PNG' : isSvg ? 'SVG' : `#${idx + 1}`}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}

                        {/* Video button */}
                        {selectedProduct.video_url ? (
                          <TouchableOpacity
                            style={styles.modalVideoBtn}
                            onPress={() => {
                              if (selectedProduct.video_url) {
                                Linking.openURL(selectedProduct.video_url).catch(() => {
                                  Alert.alert('Error', 'Unable to open video preview URL.');
                                });
                              }
                            }}
                          >
                            <Text style={styles.modalVideoBtnText}>▶️ Watch Product Video Demo</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })()}
                </>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Suggest SKU Modal */}
      <Modal visible={suggestModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.suggestModalCard]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Suggest New SKU</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Request adding product to Master Catalogue</Text>

            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newSkuName}
              onChangeText={setNewSkuName}
              placeholder="e.g. Britannia Marie Gold Biscuits"
            />

            <Text style={styles.inputLabel}>Category *</Text>
            {suggestCategories.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                  {suggestCategories.map((cat) => {
                    const active = newSkuCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.unitPill, active && styles.unitPillActive]}
                        onPress={() => setNewSkuCategory(cat)}
                      >
                        <Text style={[styles.unitPillText, active && styles.unitPillTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : null}
            <TextInput
              style={styles.modalInput}
              value={newSkuCategory}
              onChangeText={setNewSkuCategory}
              placeholder="Select from above or type custom category (e.g. Atta & Rice)"
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Media Inspection Full Modal */}
      <ProductMediaModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        product={previewProduct}
      />
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
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
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbTouchable: {
    position: 'relative',
    marginRight: 12,
  },
  cardAngleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  cardAngleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  thumbPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 10,
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
  activeSkuCode: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  mrpText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeVariantInfoRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  packSelectorContainer: {
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  packSelectorTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  packSelectorHint: {
    fontSize: 9,
    color: '#94A3B8',
  },
  packPillScroll: {
    gap: 8,
  },
  packPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minWidth: 88,
  },
  packPillSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  packPillInStore: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  packPillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  packPillUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  packPillUnitSelected: {
    color: '#15803D',
  },
  packPillUnitInStore: {
    color: '#16A34A',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotLive: {
    backgroundColor: '#22C55E',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
  },
  statusDotNotAdded: {
    backgroundColor: '#94A3B8',
  },
  packPillPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 1,
  },
  packPillPriceSelected: {
    color: '#16A34A',
  },
  packPillStock: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  packPillStockSelected: {
    color: '#15803D',
    fontWeight: '600',
  },
  packPillStockInStore: {
    color: '#16A34A',
  },
  mediaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  photoCountPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoCountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  videoPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16A34A',
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
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
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
  suggestModalCard: {
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 2,
  },
  modalGalleryContainer: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalMainPreviewBox: {
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  modalMainPreviewImage: {
    width: '90%',
    height: '90%',
  },
  modalAngleBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modalAngleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  modalThumbStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalThumbChip: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    position: 'relative',
  },
  modalThumbChipSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  modalThumbImage: {
    width: '100%',
    height: '100%',
  },
  modalThumbTag: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  modalThumbTagSelected: {
    backgroundColor: '#22C55E',
  },
  modalThumbTagText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748B',
  },
  modalThumbTagTextSelected: {
    color: '#FFFFFF',
  },
  modalVideoBtn: {
    marginTop: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalVideoBtnText: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 12,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardUnitBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardUnitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardSiblingRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  cardSiblingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  cardSiblingList: {
    gap: 6,
  },
  cardSiblingChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSiblingChipCurrent: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  cardSiblingChipInStore: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardSiblingChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  cardSiblingChipTextCurrent: {
    color: '#15803D',
    fontWeight: '700',
  },
  cardSiblingChipTextInStore: {
    color: '#16A34A',
    fontWeight: '600',
  },
  modalSiblingContainer: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSiblingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSiblingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSiblingSubtitle: {
    fontSize: 10,
    color: '#64748B',
  },
  modalSiblingScroll: {
    gap: 8,
  },
  modalSiblingChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 95,
  },
  modalSiblingChipActive: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  modalSiblingChipInStore: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  modalSiblingChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 3,
  },
  modalSiblingChipUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSiblingChipUnitActive: {
    color: '#15803D',
  },
  modalActiveBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalInStoreBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalInStoreBadgeText: {
    color: '#16A34A',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalSiblingChipPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalSiblingChipPriceActive: {
    color: '#16A34A',
  },
  modalSiblingChipSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  modalSiblingChipSubActive: {
    color: '#15803D',
    fontWeight: '600',
  },
});
