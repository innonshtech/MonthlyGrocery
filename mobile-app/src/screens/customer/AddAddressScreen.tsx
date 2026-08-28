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
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  CheckoutBackIcon,
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
  const { token, user } = useAuth();
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
        Alert.alert(
          screenConfig.login_required_title,
          screenConfig.login_required_message,
        );
      }
      return;
    }

    if (!flat.trim() || !street.trim() || !pincode.trim()) {
      Alert.alert(screenConfig.incomplete_title, screenConfig.incomplete_message);
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
        pincode: pincode.trim(),
        phone: phone.trim(),
        isDefault: editingAddress?.isDefault,
      });

      await cacheAddressesLocally(addresses);

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
      Alert.alert(
        screenConfig.save_error_title,
        err.message || screenConfig.load_error_message,
      );
    } finally {
      setSaving(false);
    }
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => loadConfig()}>
            <ActivityIndicator color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerTitle = editingAddress ? screenConfig.edit_title : screenConfig.add_title;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <CheckoutBackIcon size={24} />
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

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{screenConfig.flat_label}</Text>
          <TextInput
            style={styles.input}
            value={flat}
            onChangeText={setFlat}
            placeholder={screenConfig.flat_placeholder}
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{screenConfig.street_label}</Text>
          <TextInput
            style={styles.input}
            value={street}
            onChangeText={setStreet}
            placeholder={screenConfig.street_placeholder}
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{screenConfig.landmark_label}</Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder={screenConfig.landmark_placeholder}
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>{screenConfig.pincode_label}</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder={screenConfig.pincode_placeholder}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={COLORS.ink300}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>{screenConfig.phone_label}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={screenConfig.phone_placeholder}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={COLORS.ink300}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{screenConfig.save_as_label}</Text>
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
                  <Icon size={16} />
                  <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {saving ? screenConfig.saving_button_label : screenConfig.save_button_label}
            </Text>
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
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
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
    gap: 6,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: COLORS.ink500,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...FONTS.muktaMedium,
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  tagChipSelected: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green50,
  },
  tagChipText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  tagChipTextSelected: {
    color: COLORS.green700,
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
