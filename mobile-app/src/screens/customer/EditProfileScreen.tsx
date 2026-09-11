import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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

const SCREEN_BG = '#F8FAF8';

export default function EditProfileScreen({ navigation }: any) {
  const { token, user, updateUser } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);

  const [screenConfig, setScreenConfig] = useState<EditProfileScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const processImagePickerResult = async (res: any) => {
    if (!res || res.didCancel) return;
    if (res.errorMessage) {
      showToast({
        type: 'error',
        title: 'Image Error',
        message: res.errorMessage,
      });
      return;
    }
    const asset = res.assets && res.assets[0];
    if (!asset || !asset.uri) return;

    // Show local preview immediately
    setAvatarUri(asset.uri);

    // If base64 is available and token exists, upload to Supabase Storage bucket 'avatars'
    if (token && asset.base64) {
      const uploadRes = await uploadAvatar(token, asset.base64);
      if (uploadRes.success && uploadRes.avatar_url) {
        setAvatarUri(uploadRes.avatar_url);
      }
    }
  };

  const handleChangePhoto = async () => {
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
        await processImagePickerResult(res);
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Gallery Error',
          message: err?.message || 'Could not launch photo library',
        });
      }
    } else {
      showToast({
        type: 'info',
        title: 'Photo Upload',
        message: 'Image library is ready.',
      });
    }
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
      setAvatarUri(null);
      return;
    }

    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.mobile || '');
      if (user.avatar_url) {
        setAvatarUri(user.avatar_url);
      }
    }

    setProfileLoading(true);
    const profile = await fetchProfile(token);
    setProfileLoading(false);

    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.mobile || '');
      if (profile.avatar_url) {
        setAvatarUri(profile.avatar_url);
      }
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile]),
  );

  const handleSave = async () => {
    if (!token || !screenConfig) return;

    if (!name.trim()) {
      showToast({
        type: 'info',
        title: screenConfig.name_required_title || 'Name Required',
        message: screenConfig.name_required_message || 'Please enter your name.',
      });
      return;
    }

    setSaving(true);
    const result = await updateProfile(token, name.trim(), email.trim(), avatarUri);
    setSaving(false);

    if (result.success && result.user) {
      await updateUser({
        name: result.user.name,
        email: result.user.email,
        avatar_url: result.user.avatar_url,
      });
      showToast({
        type: 'success',
        title: screenConfig.save_success_title || 'Profile Updated',
        message: screenConfig.save_success_message || 'Your changes have been saved successfully.',
      });
      navigation.goBack();
    } else {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: result.error || screenConfig.save_error_message || 'Failed to save changes.',
      });
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
          <CheckoutBackIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title || 'Edit profile'}</Text>
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
            <Text style={styles.changePhotoText}>{screenConfig.change_photo_label || 'Change photo'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>
          {screenConfig.full_name_label ? screenConfig.full_name_label.toUpperCase() : 'FULL NAME'}
        </Text>
        <TextInput
          style={styles.inputField}
          value={name}
          onChangeText={setName}
          placeholder={screenConfig.full_name_placeholder || 'Enter your name'}
          placeholderTextColor="#94A3B8"
          autoCapitalize="words"
        />

        <Text style={styles.fieldLabel}>
          {screenConfig.phone_label ? screenConfig.phone_label.toUpperCase() : 'PHONE NUMBER'}
        </Text>
        <View style={styles.phoneInputWrap}>
          <Text style={styles.phoneInputText}>{formattedPhone || phone}</Text>
          {phone ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>
                ✓ {screenConfig.verified_label || 'Verified'}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.fieldLabel}>
          {screenConfig.email_label ? screenConfig.email_label.toUpperCase() : 'EMAIL (OPTIONAL)'}
        </Text>
        <TextInput
          style={styles.inputField}
          value={email}
          onChangeText={setEmail}
          placeholder={screenConfig.email_placeholder || 'name@email.com'}
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.deleteLinkRow}
          onPress={() => navigation.navigate('DeleteAccount')}
          activeOpacity={0.7}
        >
          <AccountDeleteTrashIcon size={16} color="#E53E3E" />
          <Text style={styles.deleteLinkText}>{screenConfig.delete_account_label || 'Delete account'}</Text>
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
            <Text style={styles.saveBtnText}>{screenConfig.save_button_label || 'Save changes'}</Text>
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
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
  avatarCircleContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E2F2E7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarLetter: {
    ...FONTS.muktaBold,
    fontSize: 36,
    lineHeight: 42,
    color: '#1E7A46',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E7A46',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    lineHeight: 18,
    color: '#1E7A46',
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: '#334155',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    marginBottom: 20,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  phoneInputText: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  verifiedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#1E7A46',
  },
  deleteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 24,
    alignSelf: 'center',
  },
  deleteLinkText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: '#E53E3E',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
  },
  saveBtn: {
    backgroundColor: '#1E7A46',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
