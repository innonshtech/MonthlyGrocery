import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import { AccountDeleteTrashIcon } from '../../components/account/AccountHubIcons';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  EditProfileScreenConfig,
  fetchEditProfileScreenConfig,
  fetchProfile,
  formatDisplayPhone,
  updateProfile,
} from '../../services/profileApi';

const SCREEN_BG = '#FBFAF6';

export default function EditProfileScreen({ navigation }: any) {
  const { user, token, updateUser } = useAuth();

  const [screenConfig, setScreenConfig] = useState<EditProfileScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchEditProfileScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    const profile = await fetchProfile(token);
    if (profile) {
      setName(profile.name?.trim() || '');
      setPhone(profile.mobile || '');
      setEmail(profile.email?.trim() || '');
      updateUser({
        name: profile.name,
        mobile: profile.mobile,
        email: profile.email,
      });
    }
    setProfileLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadConfig().then(() => loadProfile());
    }, [loadConfig, loadProfile]),
  );

  const handleSave = async () => {
    if (!screenConfig || !token) return;

    if (!name.trim()) {
      Alert.alert(screenConfig.name_required_title, screenConfig.name_required_message);
      return;
    }

    setSaving(true);
    const result = await updateProfile(token, name, email);
    setSaving(false);

    if (!result.success || !result.user) {
      Alert.alert('Error', result.error || screenConfig.save_error_message);
      return;
    }

    updateUser({
      name: result.user.name,
      mobile: result.user.mobile,
      email: result.user.email,
    });

    Alert.alert(screenConfig.save_success_title, screenConfig.save_success_message, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading profile..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => loadConfig()}>
            <Text style={styles.saveBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initialLetter = name.trim() ? name.trim().charAt(0).toUpperCase() : '';
  const formattedPhone = phone ? formatDisplayPhone(phone) : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {profileLoading ? (
              <ActivityIndicator color={COLORS.green700} />
            ) : initialLetter ? (
              <Text style={styles.avatarLetter}>{initialLetter}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                screenConfig.change_photo_alert_title,
                screenConfig.change_photo_alert_message,
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.changePhotoText}>{screenConfig.change_photo_label}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>{screenConfig.full_name_label}</Text>
        <TextInput
          style={styles.inputField}
          value={name}
          onChangeText={setName}
          placeholder={screenConfig.full_name_placeholder}
          placeholderTextColor={COLORS.ink300}
          autoCapitalize="words"
        />

        <Text style={styles.fieldLabel}>{screenConfig.phone_label}</Text>
        <View style={styles.phoneInputWrap}>
          <Text style={styles.phoneInputText}>{formattedPhone}</Text>
          {phone ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>
                ✓ {screenConfig.verified_label}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.fieldLabel}>{screenConfig.email_label}</Text>
        <TextInput
          style={styles.inputField}
          value={email}
          onChangeText={setEmail}
          placeholder={screenConfig.email_placeholder}
          placeholderTextColor={COLORS.ink300}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.deleteLinkRow}
          onPress={() => navigation.navigate('DeleteAccount')}
          activeOpacity={0.8}
        >
          <AccountDeleteTrashIcon size={16} />
          <Text style={styles.deleteLinkText}>{screenConfig.delete_account_label}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving || !token}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{screenConfig.save_button_label}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLetter: {
    ...FONTS.balooBold,
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.green700,
  },
  changePhotoText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.green700,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink700,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
    marginBottom: 18,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  phoneInputText: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink700,
  },
  verifiedBadge: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  verifiedBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.green700,
  },
  deleteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  deleteLinkText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#DC2626',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  saveBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
