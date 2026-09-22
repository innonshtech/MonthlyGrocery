import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS } from '../../constants/theme';
import AppIcon from '../../components/AppIcon';
import {
  fetchUserAddresses,
  cacheAddressesLocally,
  checkAddressServiceability,
} from '../../services/addressApi';
import {
  CheckoutBackIcon,
  CheckoutHomeIcon,
  CheckoutClockIcon,
  CheckoutPlusIcon,
  CheckoutPercentIcon,
  CheckoutFallbackEmoji,
  AddressRadioOnIcon,
  AddressRadioOffIcon,
  LucideLiveGpsIcon,
  LucideSearchBlackIcon,
  THUMB_BG,
} from '../../components/CheckoutFigmaIcons';
import { calculateCouponDiscount } from '../../utils/couponDiscount';
import { API_BASE } from '../../config/api';

/** Figma E1 Checkout canvas background */
const CHECKOUT_BG = '#F8FAF8';
const REQUIRED_BG = '#FDEEEC';

const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function CheckoutScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, minOrderLimit = 2500, appliedCoupon, setAppliedCoupon } = useCart();
  const { token, city, area, pincode: areaPincode } = useAuth();
  const { showToast } = useToast();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (route?.params?.appliedCoupon) {
      setAppliedCoupon(route.params.appliedCoupon);
    }
  }, [route?.params?.appliedCoupon, setAppliedCoupon]);

  // Sync address/slot when returning from child screens (merge params)
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.selectedAddress) {
        setSelectedAddress(route.params.selectedAddress);
      }
      if (route?.params?.selectedSlot) {
        setSelectedSlot(route.params.selectedSlot);
      }
      if (route?.params?.appliedCoupon) {
        setAppliedCoupon(route.params.appliedCoupon);
      }
    }, [
      route?.params?.selectedAddress,
      route?.params?.selectedSlot,
      route?.params?.appliedCoupon,
      setAppliedCoupon,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadAddresses = async () => {
        if (!token) return;
        try {
          const list = await fetchUserAddresses(token);
          await cacheAddressesLocally(list);
          setSavedAddresses(list);
          if (!selectedAddress && !route?.params?.selectedAddress && list.length > 0) {
            const defAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddress(defAddr);
          }
        } catch {
          /* ignore */
        }
      };
      loadAddresses();
    }, [token, route?.params?.selectedAddress, selectedAddress]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadDefaultSlot = async () => {
        if (route?.params?.selectedSlot || selectedSlot) return;
        try {
          const shopId = items[0]?.product?.shop_id;
          const params = new URLSearchParams({ days: '4' });
          if (shopId) params.set('shop_id', shopId);
          const pin = selectedAddress?.pincode || areaPincode;
          if (pin) params.set('pincode', pin);
          if (city) params.set('city', city);
          if (area) params.set('area', area);

          const res = await fetch(`${API_BASE}/delivery-slots?${params.toString()}`);
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.days) && data.days.length > 0) {
            const firstDay = data.days.find((d: any) => d.windows?.some((w: any) => !w.disabled)) || data.days[0];
            const firstWindow = firstDay?.windows?.find((w: any) => !w.disabled) || firstDay?.windows?.[0];
            if (firstDay && firstWindow) {
              setSelectedSlot({
                date: firstDay.date,
                dateLabel: firstDay.label,
                timeWindow: firstWindow.label,
                windowId: firstWindow.id,
                shopId: data.shop_id || shopId || undefined,
              });
            }
          }
        } catch {
          /* ignore */
        }
      };
      loadDefaultSlot();
    }, [items, selectedAddress?.pincode, areaPincode, city, area, route?.params?.selectedSlot, selectedSlot]),
  );

  const minLimit = minOrderLimit || 2500;

  const [deliveryFeeInfo, setDeliveryFeeInfo] = useState<{
    delivery_fee: number;
    is_free: boolean;
    distance_km: number | null;
    free_delivery_radius_km: number;
    delivery_fee_label: string;
    free_delivery_message: string;
  }>({
    delivery_fee: 0,
    is_free: true,
    distance_km: null,
    free_delivery_radius_km: 5,
    delivery_fee_label: 'FREE (within 5 km)',
    free_delivery_message: 'Delivery is FREE within 5 km',
  });

  const itemTotalMrp = items.reduce((sum, item) => {
    const mrp = parseFloat(item.product.mrp as any) || Math.round(Number(item.product.price) * 1.22);
    return sum + mrp * item.quantity;
  }, 0);

  const itemTotalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.product.price as any) || 0;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedAddress?.latitude) params.set('lat', String(selectedAddress.latitude));
        if (selectedAddress?.longitude) params.set('lng', String(selectedAddress.longitude));
        if (selectedAddress?.city || city) params.set('city', String(selectedAddress?.city || city));
        if (selectedAddress?.area || area) params.set('area_name', String(selectedAddress?.area || area));
        if (selectedAddress?.pincode || areaPincode) params.set('pincode', String(selectedAddress?.pincode || areaPincode));
        if (items[0]?.product?.shop_id) params.set('shop_id', String(items[0].product.shop_id));
        params.set('subtotal', String(itemTotalPrice));

        const res = await fetch(`${API_BASE}/orders/calculate-delivery-fee?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setDeliveryFeeInfo({
            delivery_fee: data.delivery_fee || 0,
            is_free: Boolean(data.is_free),
            distance_km: data.distance_km != null ? data.distance_km : null,
            free_delivery_radius_km: data.free_delivery_radius_km || 5,
            delivery_fee_label: data.delivery_fee_label || 'FREE',
            free_delivery_message: data.free_delivery_message || 'Free Delivery',
          });
        }
      } catch {
        /* fallback to free */
      }
    };

    fetchDeliveryFee();
  }, [selectedAddress, city, area, areaPincode, items, itemTotalPrice]);

  let couponDiscount = calculateCouponDiscount(appliedCoupon, itemTotalPrice);

  const productSavings = Math.max(0, itemTotalMrp - itemTotalPrice);
  const activeDeliveryFee = deliveryFeeInfo.is_free ? 0 : deliveryFeeInfo.delivery_fee;
  const toPay = Math.max(0, itemTotalPrice + activeDeliveryFee - couponDiscount);
  const isBelowMin = toPay < minLimit;
  const amountNeeded = minLimit - toPay;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);


  const addressLabel =
    selectedAddress?.tag || selectedAddress?.label || selectedAddress?.type || 'Home';
  const addressLine = selectedAddress
    ? [
        selectedAddress.flat,
        selectedAddress.building,
        selectedAddress.street || selectedAddress.area || selectedAddress.locality,
        selectedAddress.city,
        selectedAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const handleSelectAddress = () => {
    // If no address saved yet, open LocationPicker first (Blinkit style)
    // Otherwise open saved address list to pick from
    navigation.navigate('DeliveryAddress', {
      selectedAddress,
      fromCheckout: true,
    });
  };

  const handleAddNewAddress = () => {
    navigation.navigate('LocationPicker', { fromCheckout: true });
  };

  const handleSelectSlot = () => {
    const shopId = items[0]?.product?.shop_id;
    navigation.navigate('DeliverySlot', {
      selectedSlot,
      fromCheckout: true,
      shopId,
      pincode: selectedAddress?.pincode || areaPincode || undefined,
      city,
      area,
    });
  };

  const handleApplyCoupon = () => {
    navigation.navigate('OffersCoupons', {
      currentTotal: itemTotalPrice,
      fromCheckout: true,
    });
  };

  const handleProceedToPayment = async () => {
    const outOfStockItems = items.filter(
      (it) =>
        it.product.available === false ||
        (it.product as any).in_stock === false ||
        (it.product.stock !== undefined && it.product.stock !== null && Number(it.product.stock) <= 0)
    );
    if (outOfStockItems.length > 0) {
      showToast({
        type: 'error',
        title: 'Items Out of Stock',
        message: 'Some items in your cart are out of stock. Please return to Cart to remove them before proceeding.',
        actionLabel: 'Cart',
        onAction: () => navigation.navigate('Cart'),
      });
      return;
    }

    if (!city?.trim() || !area?.trim()) {
      showToast({
        type: 'info',
        title: 'Location Required',
        message: 'Please select your delivery city and area before proceeding.',
        actionLabel: 'Select',
        onAction: () => navigation.navigate('CitySelection'),
      });
      return;
    }
    if (!selectedAddress) {
      navigation.navigate('DeliveryAddress', {
        selectedAddress,
        fromCheckout: true,
      });
      return;
    }

    const serviceCheck = await checkAddressServiceability({
      pincode: selectedAddress.pincode,
      city: selectedAddress.city || city,
      area: selectedAddress.area || area,
      lat: selectedAddress.latitude,
      lng: selectedAddress.longitude,
    });

    if (!serviceCheck.isServiceable) {
      showToast({
        type: 'error',
        title: 'Service Unavailable',
        message: serviceCheck.message || `Delivery is currently not available for pincode ${selectedAddress.pincode}. Please select a different address.`,
        actionLabel: 'Change',
        onAction: () => handleSelectAddress(),
      });
      return;
    }

    if (!selectedSlot) {
      handleSelectSlot();
      return;
    }
    if (isBelowMin) {
      showToast({
        type: 'info',
        title: 'Minimum order not met',
        message: `Please add ₹${amountNeeded} more to reach the ₹${minLimit} minimum order value.`,
      });
      return;
    }
    navigation.navigate('PaymentMethod', {
      selectedAddress,
      selectedSlot,
      appliedCoupon,
      couponDiscount,
      productSavings,
      deliveryFee: activeDeliveryFee,
      deliveryFeeInfo,
      totalAmount: toPay,
      itemTotalMrp,
      totalSavings: productSavings + couponDiscount,
    });
  };

    return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header — Figma: pl16 pr20 pt8 pb12 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <CheckoutBackIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isBelowMin && (
          <View style={styles.belowMinNotice}>
            <Text style={styles.belowMinText}>
              Add {formatInr(amountNeeded)} more to reach the {formatInr(minLimit)} minimum order
              value
            </Text>
          </View>
        )}

        {/* Address card — Blinkit style */}
        {!selectedAddress ? (
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => setShowAddressModal(true)}
            activeOpacity={0.75}
          >
            <View style={styles.iconSquare}>
              <CheckoutHomeIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Address</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Select delivery location (Live GPS or Search)</Text>
            </View>
            <CheckoutPlusIcon size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => setShowAddressModal(true)}
            activeOpacity={0.75}
          >
            <View style={styles.iconSquare}>
              <CheckoutHomeIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Address</Text>
                {selectedAddress.tag ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{String(selectedAddress.tag).toUpperCase()}</Text>
                  </View>
                ) : null}
                {selectedAddress.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardSub} numberOfLines={2}>
                {addressLine}
              </Text>
            </View>
            <View style={styles.changeActionWrap}>
              <Text style={styles.changeLink}>Change</Text>
              <AppIcon name="chevron-right" size={14} color="#1E7A46" />
            </View>
          </TouchableOpacity>
        )}


        {/* Slot card */}
        {!selectedSlot ? (
          <TouchableOpacity style={styles.sectionCard} onPress={handleSelectSlot} activeOpacity={0.75}>
            <View style={styles.iconSquare}>
              <CheckoutClockIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.requiredTitle}>Choose delivery slot</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Pick a planned 4-hour window</Text>
            </View>
            <CheckoutPlusIcon size={20} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sectionCard}>
            <View style={styles.iconSquare}>
              <CheckoutClockIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <Text style={styles.cardTitle}>
                {selectedSlot.dateLabel}, {selectedSlot.timeWindow}
              </Text>
              <Text style={styles.cardSub}>Planned 4-hour delivery window</Text>
            </View>
            <TouchableOpacity onPress={handleSelectSlot} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order summary — Figma E1 */}
        <View style={styles.sectionCardCol}>
          <View style={styles.basketHeader}>
            <Text style={styles.basketTitle}>Order summary</Text>
            <Text style={styles.basketCount}>{totalItemCount} items</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbsRow}>
            {(items.length > 0 ? items : [null, null, null, null]).map((cartItem, index) => (
              <View
                key={cartItem?.product?.id ?? `fallback-${index}`}
                style={[styles.itemThumbWrap, { backgroundColor: THUMB_BG[index % THUMB_BG.length] }]}
              >
                {cartItem?.product?.image_url ? (
                  <Image
                    source={{ uri: cartItem.product.image_url }}
                    style={styles.thumbImage}
                    resizeMode="contain"
                  />
                ) : (
                  <CheckoutFallbackEmoji index={index} size={28} />
                )}
                {cartItem && cartItem.quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>{cartItem.quantity}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Coupon card */}
        {appliedCoupon ? (
          <View style={styles.appliedCouponCard}>
            <CheckoutPercentIcon size={20} color="#B45309" />
            <View style={styles.couponDetails}>
              <Text style={styles.appliedCouponCode}>{appliedCoupon.code} applied</Text>
              <Text style={styles.appliedCouponSavings}>
                You saved {formatInr(couponDiscount)} extra
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAppliedCoupon(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.removeCouponBtnTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noCouponCard}
            onPress={handleApplyCoupon}
            activeOpacity={0.8}
          >
            <View style={styles.couponLeft}>
              <CheckoutPercentIcon size={20} color="#1E7A46" />
              <Text style={styles.noCouponTitle}>Apply coupon</Text>
            </View>
            <Text style={styles.changeLink}>Select</Text>
          </TouchableOpacity>
        )}

        {/* Bill details — Figma E1 (529:685) */}
        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Bill details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total (MRP)</Text>
            <Text style={styles.billVal}>{formatInr(itemTotalMrp)}</Text>
          </View>

          {appliedCoupon && couponDiscount > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon ({appliedCoupon.code})</Text>
              <Text style={styles.billValMarigold}>− {formatInr(couponDiscount)}</Text>
            </View>
          ) : null}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Savings</Text>
            <Text style={styles.billValMarigold}>− {formatInr(productSavings)}</Text>
          </View>

          <View style={styles.billRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.billLabel}>Delivery fee</Text>
              {deliveryFeeInfo.distance_km != null ? (
                <Text style={styles.deliveryDistSub}>
                  📍 {deliveryFeeInfo.distance_km.toFixed(1)} km from store
                  {deliveryFeeInfo.is_free
                    ? ` · Free within ${deliveryFeeInfo.free_delivery_radius_km} km`
                    : ` · Free up to ${deliveryFeeInfo.free_delivery_radius_km} km`}
                </Text>
              ) : null}
            </View>
            <Text style={deliveryFeeInfo.is_free ? styles.billValFree : styles.billVal}>
              {deliveryFeeInfo.is_free ? 'FREE' : `+ ${formatInr(deliveryFeeInfo.delivery_fee)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>To pay</Text>
            <Text style={styles.billTotalVal}>{formatInr(toPay)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar — Figma height ~74, shows TO PAY & Proceed to pay, or disabled full-width button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {!selectedAddress || !selectedSlot ? (
          <View style={styles.disabledBottomBtn}>
            <Text style={styles.disabledBottomBtnText}>
              {!selectedAddress && !selectedSlot
                ? 'Add address & slot to continue'
                : !selectedAddress
                ? 'Add delivery address to continue'
                : 'Select delivery slot to continue'}
            </Text>
          </View>
        ) : (
          <View style={styles.paymentRow}>
            <View style={styles.payableSummary}>
              <Text style={styles.payableLabel}>TO PAY</Text>
              <Text style={styles.payableAmount}>{formatInr(toPay)}</Text>
            </View>
            <TouchableOpacity
              style={styles.proceedPayBtn}
              onPress={handleProceedToPayment}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedPayBtnText}>Proceed to pay</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Blinkit-style Delivery Location Selector Sheet */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddressModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          >
            {/* Sheet Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Delivery Location</Text>
                <Text style={styles.modalSubtitle}>Choose how you want to set your address</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowAddressModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Option 1: Live Location */}
            <TouchableOpacity
              style={styles.locOptionCard}
              onPress={() => {
                setShowAddressModal(false);
                navigation.navigate('LocationPicker', {
                  fromCheckout: true,
                  initialMode: 'default',
                });
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.locOptionIconWrap, { backgroundColor: '#EAF5EE' }]}>
                <LucideLiveGpsIcon size={22} color="#1E7A46" />
              </View>
              <View style={styles.locOptionTextWrap}>
                <View style={styles.locOptionTitleRow}>
                  <Text style={styles.locOptionTitle}>Use Current / Live Location</Text>
                  <View style={styles.gpsBadge}>
                    <Text style={styles.gpsBadgeText}>GPS</Text>
                  </View>
                </View>
                <Text style={styles.locOptionSub}>
                  Auto-detect street address using device GPS
                </Text>
              </View>
              <AppIcon name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Option 2: Enter Another Location */}
            <TouchableOpacity
              style={styles.locOptionCard}
              onPress={() => {
                setShowAddressModal(false);
                navigation.navigate('LocationPicker', {
                  fromCheckout: true,
                  initialMode: 'search',
                });
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.locOptionIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <LucideSearchBlackIcon size={20} color="#0F172A" />
              </View>
              <View style={styles.locOptionTextWrap}>
                <Text style={styles.locOptionTitle}>Enter Another Location</Text>
                <Text style={styles.locOptionSub}>
                  Search for area, street, landmark, or city
                </Text>
              </View>
              <AppIcon name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <View style={styles.savedSection}>
                <View style={styles.savedSectionHeader}>
                  <Text style={styles.savedSectionTitle}>SAVED ADDRESSES</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddressModal(false);
                      navigation.navigate('DeliveryAddress', {
                        selectedAddress,
                        fromCheckout: true,
                      });
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.viewAllText}>Manage</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    const formatted = [addr.flat, addr.building, addr.street || addr.area, addr.city, addr.pincode]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[
                          styles.savedAddressItem,
                          isSelected && styles.savedAddressItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedAddress(addr);
                          setShowAddressModal(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.savedAddressIcon}>
                          <AppIcon
                            name={addr.tag?.toLowerCase() === 'work' ? 'building' : 'home'}
                            size={18}
                            color={isSelected ? '#1E7A46' : '#64748B'}
                          />
                        </View>
                        <View style={styles.savedAddressBody}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.savedAddressTag}>
                              {addr.tag || 'Saved Address'}
                            </Text>
                            {addr.isDefault && (
                              <View style={styles.miniDefaultBadge}>
                                <Text style={styles.miniDefaultText}>DEFAULT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.savedAddressLine} numberOfLines={2}>
                            {formatted}
                          </Text>
                        </View>
                        <View style={styles.savedRadioWrap}>
                          {isSelected ? (
                            <AddressRadioOnIcon size={20} />
                          ) : (
                            <AddressRadioOffIcon size={20} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CHECKOUT_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: CHECKOUT_BG,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  belowMinNotice: {
    backgroundColor: COLORS.marigold100,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  belowMinText: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.marigold700,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCardCol: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  cardTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  requiredTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#1E7A46',
  },
  cardSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#EAF5EE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: '#1E7A46',
    textTransform: 'uppercase',
  },
  requiredBadge: {
    backgroundColor: REQUIRED_BG,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: COLORS.error,
    textTransform: 'uppercase',
  },
  changeLink: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#1E7A46',
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  basketTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  basketCount: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  itemThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  quantityBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadgeText: {
    ...FONTS.muktaBold,
    color: '#FFFFFF',
    fontSize: 9.5,
    lineHeight: 12,
  },
  appliedCouponCard: {
    backgroundColor: '#FDF0DC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponDetails: {
    flex: 1,
    gap: 2,
  },
  appliedCouponCode: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#8A5200',
  },
  appliedCouponSavings: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 16,
    color: '#92400E',
  },
  removeCouponBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#1E7A46',
  },
  noCouponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noCouponTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#111827',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
  },
  billHeading: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#334155',
    marginBottom: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  deliveryDistSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: '#059669',
    marginTop: 1,
  },
  billVal: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
  },
  billValMarigold: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: '#B45309',
  },
  billValFree: {
    ...FONTS.muktaBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#1E7A46',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F1',
    width: '100%',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  billTotalVal: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
    minHeight: 74,
    justifyContent: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payableSummary: {
    justifyContent: 'center',
  },
  payableLabel: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  payableAmount: {
    ...FONTS.muktaBold,
    fontSize: 24,
    lineHeight: 28,
    color: '#111827',
  },
  proceedPayBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedPayBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15.5,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  disabledBottomBtn: {
    backgroundColor: '#F3F3EE',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabledBottomBtnText: {
    ...FONTS.muktaMedium,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#9CA3AF',
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: '#475569',
    textTransform: 'uppercase',
  },
  changeActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
  },
  modalSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  locOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  locOptionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locOptionTextWrap: {
    flex: 1,
  },
  locOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locOptionTitle: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#111827',
  },
  locOptionSub: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 16,
    color: '#64748B',
    marginTop: 1,
  },
  gpsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  gpsBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 9.5,
    lineHeight: 12,
    color: '#15803D',
  },
  savedSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  savedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savedSectionTitle: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  viewAllText: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: '#1E7A46',
  },
  savedAddressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  savedAddressItemSelected: {
    borderColor: '#1E7A46',
    backgroundColor: '#F7FDF9',
  },
  savedAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedAddressBody: {
    flex: 1,
    gap: 2,
  },
  savedAddressTag: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#111827',
  },
  miniDefaultBadge: {
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniDefaultText: {
    ...FONTS.muktaBold,
    fontSize: 9,
    lineHeight: 11,
    color: '#1E7A46',
  },
  savedAddressLine: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  savedRadioWrap: {
    paddingLeft: 4,
  },
});
