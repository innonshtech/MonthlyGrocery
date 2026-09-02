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
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import { AccountDeleteTrashIcon, AccountCameraIcon } from '../../components/account/AccountHubIcons';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  EditProfileScreenConfig,
  fetchEditProfileScreenConfig,
  fetchProfile,
  formatDisplayPhone,
  updateProfile,
  uploadAvatar,
} from '../../services/profileApi';

let imagePickerModule: any = null;
try {
  imagePickerModule = require('react-native-image-picker');
} catch (e) {
  imagePickerModule = null;
}

const SCREEN_BG = '#FAF9F5';

export default function EditProfileScreen({ navigation }: any) {
  const { token, userProfile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 8 : 16;

  const [screenConfig, setScreenConfig] = useState<EditProfileScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAssetSelect = async (asset: any) => {
    if (!asset?.uri) return;
    setAvatarUri(asset.uri);

    if (token && asset.base64) {
      setProfileLoading(true);
      const res = await uploadAvatar(token, asset.base64, asset.type || 'image/jpeg');
      setProfileLoading(false);
      if (res.success && res.avatar_url) {
        setAvatarUri(res.avatar_url);
      }
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option to update your profile photo',
      [
        {
          text: '📷 Take Photo',
          onPress: async () => {
            if (imagePickerModule?.launchCamera) {
              try {
                const res = await imagePickerModule.launchCamera({
                  mediaType: 'photo',
                  maxWidth: 800,
                  maxHeight: 800,
                  quality: 0.8,
                  includeBase64: true,
                  saveToPhotos: true,
                });
                if (res.didCancel) return;
                if (res.errorMessage) {
                  Alert.alert('Camera Error', res.errorMessage);
                  return;
                }
                if (res.assets && res.assets[0]) {
                  await handleAssetSelect(res.assets[0]);
                }
              } catch (err: any) {
                Alert.alert('Camera Error', err?.message || 'Could not launch camera');
              }
            } else {
              Alert.alert('Rebuild Required', 'Please run "npm run android" in terminal to enable native camera hardware.');
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            if (imagePickerModule?.launchImageLibrary) {
              try {
                const res = await imagePickerModule.launchImageLibrary({
                  mediaType: 'photo',
                  maxWidth: 800,
                  maxHeight: 800,
                  quality: 0.8,
                  includeBase64: true,
                  selectionLimit: 1,
                });
                if (res.didCancel) return;
                if (res.errorMessage) {
                  Alert.alert('Gallery Error', res.errorMessage);
                  return;
                }
                if (res.assets && res.assets[0]) {
                  await handleAssetSelect(res.assets[0]);
                }
              } catch (err: any) {
                Alert.alert('Gallery Error', err?.message || 'Could not launch photo library');
              }
            } else {
              Alert.alert('Rebuild Required', 'Please run "npm run android" in terminal to enable native photo gallery.');
            }
          },
        },
        avatarUri
          ? {
              text: '🗑️ Remove Photo',
              style: 'destructive',
              onPress: () => setAvatarUri(null),
            }
          : undefined,
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ].filter(Boolean) as any,
    );
  };

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchEditProfileScreenConfig();
    setScreenConfig(config);
    setConfigError(!config);
    setConfigLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig]),
  );

  const loadUserProfile = useCallback(async () => {
    if (!token) {
      setName('');
      setEmail('');
      setPhone('');
      return;
    }

    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || userProfile.mobile || '');
    }

    setProfileLoading(true);
    const profile = await fetchProfile(token);
    setProfileLoading(false);

    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.mobile || '');
    }
  }, [token, userProfile]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile]),
  );

  const handleSave = async () => {
    if (!token || !screenConfig) return;

    if (!name.trim()) {
      Alert.alert(
        screenConfig.name_required_title || 'Error',
        screenConfig.name_required_message,
      );
      return;
    }

    setSaving(true);
    const result = await updateProfile(token, name.trim(), email.trim());
    setSaving(false);

    if (result.success) {
      await refreshProfile();
      Alert.alert(
        screenConfig.save_success_title,
        screenConfig.save_success_message,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      Alert.alert(
        'Error',
        result.error || screenConfig.save_error_message,
      );
    }
  };

  const initialLetter = name.trim() ? name.trim().charAt(0).toUpperCase() : '';
  const formattedPhone = phone ? formatDisplayPhone(phone) : '';

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
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <CheckoutBackIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.configErrorText}>
            {configError
              ? 'Could not load profile screen config.'
              : 'Screen configuration unavailable.'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadConfig}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={styles.avatarCircleContainer}
            onPress={handleChangePhoto}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCircle}>
              {profileLoading ? (
                <ActivityIndicator color={COLORS.green700} />
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : initialLetter ? (
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              ) : null}
            </View>
            <View style={styles.cameraBadge}>
              <AccountCameraIcon size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
            <Text style={styles.changePhotoText}>{screenConfig.change_photo_label}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>
          {screenConfig.full_name_label ? screenConfig.full_name_label.toUpperCase() : 'FULL NAME'}
        </Text>
        <TextInput
          style={styles.inputField}
          value={name}
          onChangeText={setName}
          placeholder={screenConfig.full_name_placeholder}
          placeholderTextColor={COLORS.ink300}
          autoCapitalize="words"
        />

        <Text style={styles.fieldLabel}>
          {screenConfig.phone_label ? screenConfig.phone_label.toUpperCase() : 'PHONE NUMBER'}
        </Text>
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

        <Text style={styles.fieldLabel}>
          {screenConfig.email_label ? screenConfig.email_label.toUpperCase() : 'EMAIL ADDRESS'}
        </Text>
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
          <AccountDeleteTrashIcon size={18} color="#D9383A" />
          <Text style={styles.deleteLinkText}>{screenConfig.delete_account_label}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
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
  configErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green700,
  },
  retryBtnText: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#17251E',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircleContainer: {
    position: 'relative',
    width: 88,
    height: 88,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E4F3EA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarLetter: {
    ...FONTS.balooBold,
    fontSize: 34,
    color: COLORS.green700,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.green700,
    borderWidth: 2.5,
    borderColor: SCREEN_BG,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  changePhotoText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.green700,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    color: '#3D4A44',
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    ...FONTS.muktaMedium,
    fontSize: 15,
    lineHeight: 22,
    color: '#17251E',
    marginBottom: 20,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3EE',
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  phoneInputText: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 15,
    lineHeight: 22,
    color: '#17251E',
  },
  verifiedBadge: {
    backgroundColor: '#E4F3EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  verifiedBadgeText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.green700,
  },
  deleteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    borderRadius: RADIUS.pill,
    marginTop: 12,
    marginBottom: 16,
  },
  deleteLinkText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#D9383A',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE9E2',
  },
  saveBtn: {
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
