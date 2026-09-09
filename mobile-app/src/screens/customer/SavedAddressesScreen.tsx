import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  CheckoutPlusIcon,
  AddressRadioOnIcon,
  AddressRadioOffIcon,
  AddressPinIcon,
  AddressEditIcon,
} from '../../components/CheckoutFigmaIcons';
import {
  type AddressItem,
  type SavedAddressesScreenConfig,
  fetchUserAddresses,
  fetchSavedAddressesScreenConfig,
  cacheAddressesLocally,
} from '../../services/addressApi';

export type { AddressItem };

const SCREEN_BG = '#FBFAF6';

export default function SavedAddressesScreen({ navigation, route }: any) {
  const { token } = useAuth();
  const isSelectMode =
    route?.name === 'DeliveryAddress' || typeof route?.params?.onSelect === 'function' || route?.params?.fromCheckout;

  const [screenConfig, setScreenConfig] = useState<SavedAddressesScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(
    route?.params?.selectedAddress?.id || '',
  );

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchSavedAddressesScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadStoredAddresses = useCallback(async () => {
    if (!token) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const list = await fetchUserAddresses(token);
      setAddresses(list);
      await cacheAddressesLocally(list);

      const incomingId = route?.params?.selectedAddress?.id;
      if (incomingId && list.some((a) => a.id === incomingId)) {
        setSelectedId(incomingId);
      } else if (list.length > 0) {
        const def = list.find((a) => a.isDefault) || list[0];
        setSelectedId(def.id);
      } else {
        setSelectedId('');
      }
    } catch {
      setAddresses([]);
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  }, [token, route?.params?.selectedAddress?.id]);

  useFocusEffect(
    useCallback(() => {
      loadConfig().then(() => loadStoredAddresses());
    }, [loadConfig, loadStoredAddresses]),
  );

  const formatLine = (addr: AddressItem) =>
    [addr.flat, addr.street, addr.landmark, addr.pincode]
      .filter(Boolean)
      .join(', ');

  const handleOpenAdd = () => {
    navigation.navigate('AddAddress', {
      fromCheckout: route?.params?.fromCheckout,
    });
  };

  const handleOpenEdit = (addr: AddressItem) => {
    navigation.navigate('AddAddress', {
      editingAddress: addr,
      fromCheckout: route?.params?.fromCheckout,
    });
  };

  const handleDeliver = () => {
    if (!screenConfig) return;
    const addr = addresses.find((a) => a.id === selectedId);
    if (!addr) {
      Alert.alert(
        screenConfig.select_alert_title || 'Select Address',
        screenConfig.select_alert_message || 'Please select a delivery address.',
      );
      return;
    }

    if (route?.params?.onSelect) {
      route.params.onSelect(addr);
      navigation.goBack();
      return;
    }

    navigation.navigate({
      name: 'Checkout',
      params: { selectedAddress: addr },
      merge: true,
    });
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <AppLoader message="Loading addresses..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadConfig()}>
            <Text style={{ color: '#FFFFFF' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerTitle = isSelectMode
    ? screenConfig.select_title || 'Select delivery address'
    : screenConfig.title || 'Saved Addresses';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header section matching Figma 537:704 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="chevron-left" size={24} color={COLORS.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <AppLoader message="Loading addresses..." />
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{screenConfig.empty_title || 'No saved addresses'}</Text>
            <Text style={styles.emptySub}>
              {screenConfig.empty_message || 'Add a delivery address to proceed with your orders.'}
            </Text>
          </View>
        ) : (
          addresses.map((addr) => {
            const selected = addr.id === selectedId;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressCard,
                  selected ? styles.addressCardSelected : styles.addressCardIdle,
                ]}
                onPress={() => setSelectedId(addr.id)}
                activeOpacity={0.85}
              >
                {selected ? <AddressRadioOnIcon size={22} /> : <AddressRadioOffIcon size={22} />}

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <AddressPinIcon size={16} />
                    <Text style={styles.tagText}>{addr.tag}</Text>
                    {addr.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>
                          {screenConfig.default_badge_label || 'DEFAULT'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.addressLine}>{formatLine(addr)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleOpenEdit(addr)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <AddressEditIcon size={17} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* Add Address Action Card */}
        <TouchableOpacity style={styles.addCard} onPress={handleOpenAdd} activeOpacity={0.85}>
          <CheckoutPlusIcon size={16} />
          <Text style={styles.addCardText}>
            {screenConfig.add_address_label || 'Add a new address'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Deliver CTA Button */}
      {isSelectMode ? (
        <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.deliverBtn}
              onPress={handleDeliver}
              activeOpacity={0.85}
            >
              <Text style={styles.deliverBtnText}>
                {screenConfig.deliver_button_label || 'Deliver to this address'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  addressCardSelected: {
    backgroundColor: '#F7FBF8',
    borderWidth: 1.5,
    borderColor: COLORS.green700,
  },
  addressCardIdle: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  defaultBadge: {
    backgroundColor: COLORS.green100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  defaultBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.green700,
    textTransform: 'uppercase',
  },
  addressLine: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    marginTop: 2,
  },
  editBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCardText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.green700,
  },
  bottomSafe: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  deliverBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
