import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { NearbyShop, fetchShopsForArea } from '../services/shopsApi';

const { height: SCREEN_H } = Dimensions.get('window');
const SLIDE_MAX_H = SCREEN_H * 0.72;

interface ShopPickerSlideProps {
  visible: boolean;
  areaName: string;
  city: string;
  onShopSelected: (shop: NearbyShop) => void;
  onClose: () => void;
}

export default function ShopPickerSlide({
  visible,
  areaName,
  city,
  onShopSelected,
  onClose,
}: ShopPickerSlideProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SLIDE_MAX_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      loadShops();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 68,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SLIDE_MAX_H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadShops = async () => {
    setLoading(true);
    const result = await fetchShopsForArea(areaName, city);
    setShops(result);
    setLoading(false);
  };

  const handleContinue = () => {
    const chosen = shops.find((s) => s.id === selectedId);
    if (chosen) {
      onShopSelected(chosen);
    }
  };

  const renderShopCard = ({ item }: { item: NearbyShop }) => {
    const isSelected = item.id === selectedId;
    const isOpen = item.is_open;

    return (
      <TouchableOpacity
        style={[styles.shopCard, isSelected && styles.shopCardSelected]}
        activeOpacity={0.75}
        onPress={() => setSelectedId(item.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
      >
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.shopInfo}>
          <View style={styles.shopNameRow}>
            <Text style={styles.shopName} numberOfLines={1}>{item.shop_name}</Text>
            <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
              <View style={[styles.badgeDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
              <Text style={[styles.badgeText, isOpen ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          {Boolean(item.address_line) && (
            <Text style={styles.shopAddress} numberOfLines={1}>{item.address_line}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.55],
              }),
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { maxHeight: SLIDE_MAX_H, paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handleBar} />

        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetLabel}>SHOPS NEAR YOU</Text>
            <Text style={styles.sheetTitle} numberOfLines={1}>Shops in {areaName}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.green700} />
            <Text style={styles.stateText}>Finding shops…</Text>
          </View>
        ) : shops.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={styles.emptyTitle}>No shops yet</Text>
            <Text style={styles.emptySubtitle}>
              {'We\'re expanding to ' + areaName + ' soon.\nPlease check back later!'}
            </Text>
            <TouchableOpacity style={styles.closeAreaBtn} onPress={onClose}>
              <Text style={styles.closeAreaBtnText}>Choose a different area</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.listHint}>
              {shops.length} shop{shops.length > 1 ? 's' : ''} available · Tap to choose
            </Text>
            <FlatList
              data={shops}
              keyExtractor={(item) => item.id}
              renderItem={renderShopCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.continueBtn, !selectedId && styles.continueBtnDisabled]}
                onPress={handleContinue}
                disabled={!selectedId}
                activeOpacity={0.85}
              >
                <Text style={[styles.continueBtnText, !selectedId && styles.continueBtnTextDisabled]}>
                  {selectedId ? 'Continue' : 'Select a shop to continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: COLORS.line,
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sheetLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.green700,
  },
  sheetTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.ink900,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 14,
    color: COLORS.ink500,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginHorizontal: 20,
  },
  listHint: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  shopCardSelected: {
    backgroundColor: COLORS.green50,
    borderColor: COLORS.green700,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: COLORS.green700,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.green700,
  },
  shopInfo: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  shopName: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.ink900,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  badgeOpen: { backgroundColor: COLORS.green100 },
  badgeClosed: { backgroundColor: COLORS.muted },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  dotOpen: { backgroundColor: COLORS.green700 },
  dotClosed: { backgroundColor: COLORS.ink300 },
  badgeText: { ...FONTS.muktaSemiBold, fontSize: 11 },
  badgeTextOpen: { color: COLORS.green700 },
  badgeTextClosed: { color: COLORS.ink500 },
  shopAddress: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    marginTop: 3,
  },
  separator: { height: 8 },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  continueBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: COLORS.muted },
  continueBtnText: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  continueBtnTextDisabled: { color: COLORS.ink300 },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  stateText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    marginTop: 12,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.ink900,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  closeAreaBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeAreaBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    color: COLORS.green700,
  },
});
