import React, { useState, useEffect, useCallback } from 'react';
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
  StatusBar,
  RefreshControl,
  Linking,
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';
import SafeProductImage from '../components/SafeProductImage';
import ProductMediaModal, { ProductMediaItem } from '../components/ProductMediaModal';
import { groupProductsIntoFamilies, ProductFamily, findSiblingVariants, getPackUnitLabel, getDisplayBaseName } from '../utils/productFamily';

export default function MerchantInventoryScreen() {
  const { token } = useMerchantAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariantMap, setSelectedVariantMap] = useState<{ [familyKey: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [shopName, setShopName] = useState('');

  // Media Inspection Modal
  const [previewProduct, setPreviewProduct] = useState<ProductMediaItem | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [modalActiveImage, setModalActiveImage] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editShortDescription, setEditShortDescription] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>(['All']);

  const fetchInventory = useCallback(async (isRefresh = false) => {
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
      const res = await fetch(`${API_BASE}/admin/shop-products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const approvedProducts = (data.shop_products || []).filter(
          (sp: any) => sp.status === 'approved',
        );
        setProducts(approvedProducts);
        setShopName(data.shop_name || '');
      } else {
        setProducts([]);
        setError(data.error || 'Failed to fetch inventory');
      }
    } catch (err) {
      setProducts([]);
      setError('Connection error. Is the server running on port 8001?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    const productCategories = Array.from(
      new Set(products.map((p) => p.primary_category).filter(Boolean)),
    ).sort();
    const nextCategories = ['All', ...productCategories];
    setCategories(nextCategories);
    if (activeCategory !== 'All' && !productCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [products, activeCategory]);

  const productFamilies = React.useMemo(() => {
    return groupProductsIntoFamilies(products);
  }, [products]);

  const filteredFamilies = React.useMemo(() => {
    let out = productFamilies;

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
  }, [productFamilies, search, activeCategory]);

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
          selling_price: targetProd?.selling_price ?? 0,
          discount_percentage: targetProd?.discount_percentage ?? 0,
          stock: targetProd?.stock ?? 0,
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
    const itemImages = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.image_url ? [item.image_url] : []);
    setModalActiveImage(itemImages[0] || item.image_url || '');
    setEditPrice(String(item.selling_price || ''));
    setEditMrp(String(item.mrp || ''));
    setEditStock(String(item.stock || '0'));
    setEditShortDescription(item.short_description || '');
    setEditDescription(item.description || '');
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
      const contentRes = await fetch(`${API_BASE}/admin/shop-products/product-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: editingProduct.product_id,
          short_description: editShortDescription,
          description: editDescription,
          mrp: mrpVal,
        })
      });
      const contentData = await contentRes.json();
      if (!contentRes.ok || !contentData.success) {
        Alert.alert('Error', contentData.error || 'Failed to update product highlights');
        setSaving(false);
        return;
      }

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
            ? {
                ...p,
                selling_price: priceVal,
                discount_percentage: calculatedDiscount,
                stock: stockVal,
                mrp: mrpVal,
                short_description: editShortDescription,
                description: editDescription,
              }
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

  const renderFamilyCard = ({ item }: { item: ProductFamily<any> }) => {
    const activeVariantId = selectedVariantMap[item.familyKey] || item.variants[0]?.product_id;
    const activeVariant = item.variants.find((v) => v.product_id === activeVariantId) || item.variants[0];

    if (!activeVariant) return null;

    const isInactive = !activeVariant.available;
    const isOutOfStock = isInactive || activeVariant.stock <= 0;
    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.image_url ? [item.image_url] : []);
    const hasMultipleAngles = images.length > 1;
    const hasVideo = Boolean(item.video_url);
    const activeUnitLabel = getPackUnitLabel(activeVariant) || activeVariant.unit || '';

    return (
      <View style={[styles.productCard, isInactive && styles.productCardInactive, !isInactive && isOutOfStock && styles.productCardOOS]}>
        {/* Card Top Row: Media + Product Family Info */}
        <View style={styles.cardTopRow}>
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
                selling_price: activeVariant.selling_price,
                mrp: activeVariant.mrp,
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

          <View style={styles.productDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            </View>
            <Text style={styles.skuText}>
              {item.primary_category} • {item.brand || 'Unbranded'}
            </Text>
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
                        selling_price: activeVariant.selling_price,
                        mrp: activeVariant.mrp,
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

        {/* Interactive Pack Unit Selector Strip */}
        <View style={styles.packSelectorContainer}>
          <View style={styles.packSelectorHeader}>
            <Text style={styles.packSelectorTitle}>PACK SIZES ({item.variants.length}):</Text>
            <Text style={styles.packSelectorHint}>Tap to view/manage unit</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packPillScroll}
          >
            {item.variants.map((v: any) => {
              const isSelected = v.product_id === activeVariant.product_id;
              const vInactive = !v.available;
              const unitLabel = getPackUnitLabel(v) || v.unit || 'Pack';

              return (
                <TouchableOpacity
                  key={v.product_id || v.id}
                  style={[
                    styles.packPill,
                    isSelected && styles.packPillSelected,
                    vInactive && styles.packPillInactive,
                  ]}
                  onPress={() => {
                    setSelectedVariantMap((prev) => ({
                      ...prev,
                      [item.familyKey]: v.product_id,
                    }));
                  }}
                >
                  <View style={styles.packPillTop}>
                    <Text
                      style={[
                        styles.packPillUnit,
                        isSelected && styles.packPillUnitSelected,
                        vInactive && styles.packPillUnitInactive,
                      ]}
                    >
                      {unitLabel}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        v.available ? (v.stock > 0 ? styles.statusDotLive : styles.statusDotOOS) : styles.statusDotInactive,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.packPillPrice,
                      isSelected && styles.packPillPriceSelected,
                      vInactive && styles.packPillPriceInactive,
                    ]}
                  >
                    ₹{v.selling_price}
                  </Text>
                  <Text
                    style={[
                      styles.packPillStock,
                      isSelected && styles.packPillStockSelected,
                      vInactive && styles.packPillStockInactive,
                    ]}
                  >
                    {vInactive ? 'Inactive' : (v.stock <= 0 ? 'Out of Stock' : `${v.stock} in stock`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Unit Price & Stock Row */}
        <View style={styles.activeVariantInfoRow}>
          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>₹{activeVariant.selling_price}</Text>
            {activeVariant.mrp && activeVariant.mrp > activeVariant.selling_price && (
              <Text style={styles.mrpText}>MRP ₹{activeVariant.mrp}</Text>
            )}
            {activeVariant.discount_percentage > 0 && (
              <View style={styles.discountPill}>
                <Text style={styles.discountText}>{activeVariant.discount_percentage}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.stockBadge}>
            <Text style={styles.stockLabel}>STOCK:</Text>
            <Text style={[styles.stockValue, activeVariant.stock < 10 && styles.lowStock]}>
              {activeVariant.stock} units
            </Text>
          </View>
        </View>

        {/* Selected Unit Controls Row: In Stock Switch & Edit Button */}
        <View style={styles.cardControlsRow}>
          <View style={styles.switchWrapper}>
            <Text style={[styles.switchLabel, !activeVariant.available && styles.switchLabelInactive]}>
              {activeVariant.available ? (activeVariant.stock > 0 ? `${activeUnitLabel || 'Unit'}: Live & In Stock` : `${activeUnitLabel || 'Unit'}: In Stock (0 units)`) : `${activeUnitLabel || 'Unit'}: Inactive / Hidden`}
            </Text>
            <Switch
              value={activeVariant.available}
              onValueChange={() => handleToggleAvailable(activeVariant.product_id, activeVariant.available)}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={activeVariant.available ? '#22C55E' : '#94A3B8'}
            />
          </View>

          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => handleOpenEditModal(activeVariant)}
          >
            <Text style={styles.editBtnText}>✏️ Edit {activeUnitLabel || 'SKU'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Store Inventory</Text>
          <Text style={styles.headerSubtitle}>
            {shopName
              ? `${shopName} · ${productFamilies.length} Product${productFamilies.length === 1 ? '' : 's'} (${products.length} Pack Sizes)`
              : 'Manage item prices, stock & visibility'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchInventory(true)}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by SKU name, brand or code..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories Filter Tabs — only categories present in this store's inventory */}
      {categories.length > 1 ? (
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
      ) : null}

      {/* Product List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading store inventory...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchInventory()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredFamilies.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>📦</Text>
          <Text style={styles.emptyTitle}>
            {search.trim() ? 'No matching products' : 'No inventory yet'}
          </Text>
          <Text style={styles.emptySub}>
            {search.trim()
              ? 'No products match your search query.'
              : 'Go to the Catalog tab and add SKUs to your store. Only products you add will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFamilies}
          keyExtractor={(item) => item.familyKey}
          renderItem={renderFamilyCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} colors={['#22C55E']} />
          }
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
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Sibling Pack Variant Switcher inside Modal */}
                {(() => {
                  const modalSiblings = findSiblingVariants(editingProduct, products);
                  if (modalSiblings.length <= 1) return null;

                  return (
                    <View style={styles.modalSiblingContainer}>
                      <View style={styles.modalSiblingHeaderRow}>
                        <Text style={styles.modalSiblingTitle}>📦 Pack Variants ({modalSiblings.length})</Text>
                        <Text style={styles.modalSiblingSubtitle}>Tap any pack size to switch & edit</Text>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.modalSiblingScroll}
                      >
                        {modalSiblings.map((sib) => {
                          const isSelected = sib.product_id === editingProduct.product_id;
                          const sibOOS = !sib.available || sib.stock <= 0;
                          const sibUnit = getPackUnitLabel(sib) || sib.unit || 'Pack';

                          return (
                            <TouchableOpacity
                              key={sib.product_id || sib.id}
                              style={[
                                styles.modalSiblingChip,
                                isSelected && styles.modalSiblingChipActive,
                                !isSelected && sibOOS && styles.modalSiblingChipOOS,
                              ]}
                              onPress={() => {
                                if (sib.product_id !== editingProduct.product_id) {
                                  handleOpenEditModal(sib);
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
                                {isSelected && (
                                  <View style={styles.modalActiveBadge}>
                                    <Text style={styles.modalActiveBadgeText}>Active</Text>
                                  </View>
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.modalSiblingChipPrice,
                                  isSelected && styles.modalSiblingChipPriceActive,
                                ]}
                              >
                                ₹{sib.selling_price}
                              </Text>
                              <Text
                                style={[
                                  styles.modalSiblingChipStock,
                                  isSelected && styles.modalSiblingChipStockActive,
                                  sibOOS && styles.modalSiblingChipStockOOS,
                                ]}
                              >
                                {sibOOS ? 'Out of Stock' : `${sib.stock} units`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })()}

                <Text style={styles.modalProductName}>{editingProduct.name}</Text>
                <Text style={styles.modalProductSku}>SKU: {editingProduct.sku || 'N/A'}</Text>
                {editingProduct.unit ? (
                  <Text style={styles.readOnlyUnit}>Pack unit: {editingProduct.unit} (catalog level)</Text>
                ) : null}

                {/* Product Photo Gallery & Video Section */}
                {(() => {
                  const modalImages = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
                    ? editingProduct.images
                    : (editingProduct.image_url ? [editingProduct.image_url] : []);
                  const currentPreview = modalActiveImage || modalImages[0] || editingProduct.image_url || '';

                  return (
                    <View style={styles.modalGalleryContainer}>
                      <View style={styles.modalMainPreviewBox}>
                        <SafeProductImage
                          uri={currentPreview}
                          style={styles.modalMainPreviewImage}
                          resizeMode="contain"
                        />
                        {modalImages.length > 1 && (
                          <View style={styles.modalAngleBadge}>
                            <Text style={styles.modalAngleBadgeText}>{modalImages.length} photo angles</Text>
                          </View>
                        )}
                      </View>

                      {/* Thumbnails selector if multiple photos */}
                      {modalImages.length > 1 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.modalThumbStrip}
                        >
                          {modalImages.map((imgUri: string, idx: number) => {
                            const isSelected = currentPreview === imgUri;
                            const isPng = imgUri.toLowerCase().endsWith('.png') || imgUri.includes('.png?');
                            const isSvg = imgUri.toLowerCase().endsWith('.svg') || imgUri.includes('.svg?');

                            return (
                              <TouchableOpacity
                                key={idx}
                                style={[styles.modalThumbChip, isSelected && styles.modalThumbChipSelected]}
                                onPress={() => setModalActiveImage(imgUri)}
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

                      {/* Video button if video_url present */}
                      {editingProduct.video_url ? (
                        <TouchableOpacity
                          style={styles.modalVideoBtn}
                          onPress={() => {
                            if (editingProduct.video_url) {
                              Linking.openURL(editingProduct.video_url).catch(() => {
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

                {/* Short Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SHORT DESCRIPTION</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editShortDescription}
                    onChangeText={setEditShortDescription}
                    placeholder="One-line summary for customers"
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>HIGHLIGHTS (SEMICOLON-SEPARATED)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    multiline
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="e.g. Stone ground; 100% whole wheat"
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
  placeholderThumb: {
    width: 58,
    height: 58,
    borderRadius: 10,
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
    maxHeight: '85%',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  modalProductSku: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  readOnlyUnit: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  modalGalleryContainer: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalMainPreviewBox: {
    height: 150,
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
    top: 8,
    right: 8,
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
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
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
  productCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  activeSkuCode: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
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
  packPillInactive: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
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
  packPillUnitInactive: {
    color: '#DC2626',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotLive: {
    backgroundColor: '#22C55E',
  },
  statusDotOOS: {
    backgroundColor: '#F59E0B',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
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
  packPillPriceInactive: {
    color: '#94A3B8',
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
  packPillStockInactive: {
    color: '#DC2626',
  },
  activeVariantInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchLabelInactive: {
    color: '#DC2626',
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
  modalSiblingChipOOS: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
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
  modalSiblingChipPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalSiblingChipPriceActive: {
    color: '#16A34A',
  },
  modalSiblingChipStock: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  modalSiblingChipStockActive: {
    color: '#15803D',
    fontWeight: '600',
  },
  modalSiblingChipStockOOS: {
    color: '#DC2626',
  },
});
