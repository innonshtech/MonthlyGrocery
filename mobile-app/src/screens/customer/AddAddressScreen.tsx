import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  MapPinLargeIcon,
  TagHomeIcon,
  TagWorkIcon,
  TagOtherIcon,
} from '../../components/CheckoutFigmaIcons';
import {
  type AddressItem,
  type AddAddressScreenConfig,
  fetchAddAddressScreenConfig,
  saveUserAddress,
  cacheAddressesLocally,
} from '../../services/addressApi';
import {
  isValidIndianPincode,
  normalizePincode,
  validateAddressPincode,
} from '../../utils/locationParams';

const SCREEN_BG = '#FBFAF6';
const MAP_BG = '#E8F0EA';

const TAG_ICONS: Record<string, typeof TagHomeIcon> = {
  Home: TagHomeIcon,
  Work: TagWorkIcon,
  Other: TagOtherIcon,
};

function defaultPhoneFromUser(mobile?: string): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export default function AddAddressScreen({ navigation, route }: any) {
  const { token, user, pincode: areaPincode } = useAuth();
  const { showToast } = useToast();
  const editingAddress = route?.params?.editingAddress as AddressItem | undefined;
  const fromCheckout = route?.params?.fromCheckout;

  const [screenConfig, setScreenConfig] = useState<AddAddressScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [tag, setTag] = useState('');
  const [flat, setFlat] = useState(editingAddress?.flat || '');
  const [street, setStreet] = useState(editingAddress?.street || '');
  const [landmark, setLandmark] = useState(editingAddress?.landmark || '');
  const [pincode, setPincode] = useState(editingAddress?.pincode || '');
  const [phone, setPhone] = useState(
    editingAddress?.phone || defaultPhoneFromUser(user?.mobile),
  );
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchAddAddressScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig]),
  );

  useEffect(() => {
    if (!screenConfig) return;
    const initialTag =
      editingAddress?.tag ||
      screenConfig.default_tag_key ||
      screenConfig.tag_home_key;
    setTag(initialTag);
  }, [screenConfig, editingAddress?.tag]);

  useEffect(() => {
    if (editingAddress?.pincode || pincode.trim()) return;
    if (areaPincode) {
      setPincode(areaPincode);
    }
  }, [areaPincode, editingAddress?.pincode, pincode]);

  const tagOptions = useMemo(() => {
    if (!screenConfig) return [];
    return [
      {
        key: screenConfig.tag_home_key,
        label: screenConfig.tag_home_label,
        Icon: TAG_ICONS[screenConfig.tag_home_key] || TagHomeIcon,
      },
      {
        key: screenConfig.tag_work_key,
        label: screenConfig.tag_work_label,
        Icon: TAG_ICONS[screenConfig.tag_work_key] || TagWorkIcon,
      },
      {
        key: screenConfig.tag_other_key,
        label: screenConfig.tag_other_label,
        Icon: TAG_ICONS[screenConfig.tag_other_key] || TagOtherIcon,
      },
    ];
  }, [screenConfig]);

  const handleSave = async () => {
    if (!screenConfig || !token) {
      if (screenConfig) {
        showToast({
          type: 'info',
          title: screenConfig.login_required_title,
          message: screenConfig.login_required_message,
        });
      }
      return;
    }

    if (!flat.trim() || !street.trim() || !pincode.trim()) {
      showToast({
        type: 'info',
        title: screenConfig.incomplete_title,
        message: screenConfig.incomplete_message,
      });
      return;
    }

    const normalizedPin = normalizePincode(pincode);
    if (!isValidIndianPincode(normalizedPin)) {
      showToast({
        type: 'error',
        title: screenConfig.incomplete_title,
        message: 'Please enter a valid 6-digit pincode.',
      });
      return;
    }

    const pinCheck = validateAddressPincode(normalizedPin, areaPincode);
    if (!pinCheck.valid) {
      showToast({
        type: 'error',
        title: screenConfig.incomplete_title,
        message: pinCheck.message || 'Invalid pincode.',
      });
      return;
    }

    setSaving(true);
    try {
      const { address: savedAddr, addresses } = await saveUserAddress(token, {
        id: editingAddress?.id,
        tag,
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: normalizedPin,
        phone: phone.trim(),
        isDefault: editingAddress?.isDefault,
      });

      await cacheAddressesLocally(addresses);

      showToast({
        type: 'success',
        title: 'Address Saved',
        message: 'Your address has been saved successfully.',
      });

      if (fromCheckout) {
        navigation.navigate({
          name: 'Checkout',
          params: { selectedAddress: savedAddr },
          merge: true,
        });
        return;
      }

      navigation.goBack();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: screenConfig.save_error_title,
        message: err.message || screenConfig.load_error_message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <AppLoader message="Loading..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => loadConfig()}>
            <ActivityIndicator color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerTitle = editingAddress
    ? screenConfig.edit_title || 'Edit address'
    : screenConfig.add_title || 'Add new address';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header section matching Figma 538:709 */}
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mapPreview}>
          <MapPinLargeIcon size={34} />
        </View>

        {/* Flat / House No. & Building */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {screenConfig.flat_label || 'FLAT / HOUSE NO. & BUILDING'}
          </Text>
          <TextInput
            style={styles.input}
            value={flat}
            onChangeText={setFlat}
            placeholder={screenConfig.flat_placeholder || 'e.g. Flat 402, Green Meadows'}
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        {/* Area / Locality */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {screenConfig.street_label || 'AREA / LOCALITY'}
          </Text>
          <TextInput
            style={styles.input}
            value={street}
            onChangeText={setStreet}
            placeholder={screenConfig.street_placeholder || 'e.g. Paud Road, Kothrud'}
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        {/* Landmark (Optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {screenConfig.landmark_label || 'LANDMARK (OPTIONAL)'}
          </Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder={screenConfig.landmark_placeholder || 'Near City Pride multiplex'}
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        {/* Pincode & Phone */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>
              {screenConfig.pincode_label || 'PINCODE'}
            </Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={(text) => setPincode(normalizePincode(text))}
              placeholder={screenConfig.pincode_placeholder || '411038'}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={COLORS.ink300}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>
              {screenConfig.phone_label || 'PHONE'}
            </Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={screenConfig.phone_placeholder || 'Mobile number'}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={COLORS.ink300}
            />
          </View>
        </View>

        {/* Save As Tag Chips */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {screenConfig.save_as_label || 'SAVE AS'}
          </Text>
          <View style={styles.tagRow}>
            {tagOptions.map(({ key, label, Icon }) => {
              const selected = tag === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  onPress={() => setTag(key)}
                  activeOpacity={0.85}
                >
                  <Icon size={16} color={selected ? COLORS.green700 : COLORS.ink500} />
                  <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {screenConfig.save_button_label || 'Save address'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    paddingTop: 10,
    paddingBottom: 40,
    gap: 14,
  },
  mapPreview: {
    height: 120,
    borderRadius: 14,
    backgroundColor: MAP_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: COLORS.ink500,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    height: 48,
    paddingHorizontal: 14,
    ...FONTS.muktaRegular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  tagChipSelected: {
    borderColor: COLORS.green700,
    borderWidth: 1.5,
    backgroundColor: '#E4F3EA',
  },
  tagChipText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.ink700,
  },
  tagChipTextSelected: {
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
  saveBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
