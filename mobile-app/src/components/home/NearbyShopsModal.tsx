import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useAuth, SelectedStoreInfo } from '../../context/AuthContext';
import { fetchNearbyShops, NearbyShop } from '../../services/shopsApi';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import AppIcon from '../AppIcon';

interface NearbyShopsModalProps {
  visible: boolean;
  onClose: () => void;
  onShopSelected?: (shop: SelectedStoreInfo | null) => void;
  latitude?: number | null;
  longitude?: number | null;
}

export default function NearbyShopsModal({
  visible,
  onClose,
  onShopSelected,
  latitude,
  longitude,
}: NearbyShopsModalProps) {
  const { city, area, pincode, selectedShop, setSelectedShop } = useAuth();
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShops = async () => {
    setLoading(true);
    try {
      const list = await fetchNearbyShops({
        lat: latitude,
        lng: longitude,
        city,
        area,
        pincode,
      });
      setShops(list);
    } catch (err) {
      console.warn('Error loading nearby shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadShops();
    }
  }, [visible, city, area, pincode, latitude, longitude]);

  const handleSelectShop = async (shop: NearbyShop) => {
    const info: SelectedStoreInfo = {
      id: shop.id,
      name: shop.shop_name,
      distance_km: shop.distance_km,
      delivery_radius_km: shop.delivery_radius_km,
      address: shop.address_line || shop.area_name || shop.city,
    };
    await setSelectedShop(info);
    if (onShopSelected) onShopSelected(info);
    onClose();
  };

  const handleResetToAuto = async () => {
    await setSelectedShop(null);
    if (onShopSelected) onShopSelected(null);
    onClose();
  };

  const renderShopItem = ({ item }: { item: NearbyShop }) => {
    const isSelected = selectedShop?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.shopCard, isSelected && styles.shopCardSelected]}
        onPress={() => handleSelectShop(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.shopTitleWrap}>
            <Text style={styles.shopEmoji}>🏪</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName} numberOfLines={1}>
                {item.shop_name}
              </Text>
              <Text style={styles.shopAddress} numberOfLines={1}>
                {[item.address_line, item.area_name, item.city].filter(Boolean).join(', ') || 'Local Kirana Partner'}
              </Text>
            </View>
          </View>
          {isSelected ? (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓ ACTIVE</Text>
            </View>
          ) : (
            <View style={styles.selectBtn}>
              <Text style={styles.selectBtnText}>Select</Text>
            </View>
          )}
        </View>

        <View style={styles.tagsRow}>
          {item.distance_km != null ? (
            <View style={styles.distanceTag}>
              <Text style={styles.tagText}>📍 {item.distance_km.toFixed(1)} km away</Text>
            </View>
          ) : null}

          <View style={styles.radiusTag}>
            <Text style={styles.radiusTagText}>
              🚚 Radius: {item.delivery_radius_km} km
            </Text>
          </View>

          <View style={[styles.statusTag, item.is_open ? styles.openTag : styles.closedTag]}>
            <Text style={[styles.statusText, item.is_open ? styles.openText : styles.closedText]}>
              {item.is_open ? '🟢 Open' : '🔴 Offline'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Stores Delivering in Your Area</Text>
              <Text style={styles.modalSubtitle}>
                {area && city ? `${area}, ${city}` : 'Select your preferred Kirana store'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Auto / Smart Fallback Option */}
          <TouchableOpacity
            style={[styles.autoOptionCard, !selectedShop && styles.autoOptionSelected]}
            onPress={handleResetToAuto}
            activeOpacity={0.8}
          >
            <View style={styles.autoLeft}>
              <Text style={{ fontSize: 18 }}>⚡</Text>
              <View>
                <Text style={styles.autoTitle}>Automatic (Nearest Center Store)</Text>
                <Text style={styles.autoSub}>Let system automatically route to the closest store</Text>
              </View>
            </View>
            {!selectedShop ? (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓ DEFAULT</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.green700} />
              <Text style={styles.loadingText}>Finding nearby stores in your radius...</Text>
            </View>
          ) : shops.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 32 }}>📍</Text>
              <Text style={styles.emptyTitle}>No stores found in this area</Text>
              <Text style={styles.emptySub}>We are expanding to more delivery locations soon!</Text>
            </View>
          ) : (
            <FlatList
              data={shops}
              keyExtractor={(item) => item.id}
              renderItem={renderShopItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FBFAF6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 28,
  },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...FONTS.muktaBold,
    fontSize: 17,
    color: COLORS.ink900,
  },
  modalSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.ink700,
  },
  autoOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  autoOptionSelected: {
    borderColor: COLORS.green700,
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  autoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  autoTitle: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink900,
  },
  autoSub: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.ink500,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  shopCardSelected: {
    borderColor: COLORS.green700,
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  shopEmoji: {
    fontSize: 22,
  },
  shopName: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  shopAddress: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1,
  },
  selectedBadge: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  selectBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.ink700,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  distanceTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    color: '#92400E',
  },
  radiusTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  radiusTagText: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: '#1E40AF',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openTag: {
    backgroundColor: '#DCFCE7',
  },
  closedTag: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
  },
  openText: {
    color: '#166534',
  },
  closedText: {
    color: '#991B1B',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink500,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
  },
});
