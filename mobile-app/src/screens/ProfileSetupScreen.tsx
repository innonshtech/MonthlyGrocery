import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from '../components/AppIcon';
import {
  OnboardingBackButton,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import { useOnboardingLayout } from '../components/onboarding/onboardingLayout';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import {
  ProfileSetupConfig,
  fetchOnboardingConfig,
} from '../services/onboardingApi';
import { updateProfile } from '../services/profileApi';

const DISPLAY_NAME_KEY = '@user_display_name';
const EMAIL_KEY = '@user_email';

/**
 * A7 · Profile Setup — Redesign (Figma node 410:622)
 * Copy from /api/admin/onboarding; profile saved via API when logged in.
 */
export default function ProfileSetupScreen({ route, navigation }: any) {
  const { token, user, updateUser } = useAuth();
  const { bottomPadding, insets, keyboardBehavior } = useOnboardingLayout();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [config, setConfig] = useState<ProfileSetupConfig | null>(null);
  const [configLoadError, setConfigLoadError] = useState({ message: '', retry: 'Retry' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const redirectTarget = route.params?.redirect || 'Shop';

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const onboarding = await fetchOnboardingConfig();
    const profileConfig = onboarding?.profile_setup ?? null;
    setConfig(profileConfig);
    setConfigLoadError({
      message: profileConfig?.load_error_message ?? '',
      retry: profileConfig?.retry_label ?? 'Retry',
    });

    const savedName = await AsyncStorage.getItem(DISPLAY_NAME_KEY);
    const savedEmail = await AsyncStorage.getItem(EMAIL_KEY);
    const userName = user?.name?.trim();
    const initialName =
      savedName ||
      (userName && userName !== 'User' ? userName : '');
    setName(initialName);
    if (savedEmail) setEmail(savedEmail);

    setLoading(false);
  }, [user?.name]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handlePhotoPress = () => {
    if (config?.photo_unavailable_message) {
      Alert.alert('', config.photo_unavailable_message);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    if (!name.trim()) {
      Alert.alert(config.name_required_title, config.name_required_message);
      return;
    }

    setSaving(true);
    try {
      await AsyncStorage.setItem(DISPLAY_NAME_KEY, name.trim());
      if (email.trim()) {
        await AsyncStorage.setItem(EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(EMAIL_KEY);
      }

      if (token) {
        const res = await updateProfile(token, name.trim(), email.trim() || undefined);
        if (!res.success) {
          Alert.alert('Error', res.error || config.save_error_message);
          setSaving(false);
          return;
        }
        if (res.user) {
          await updateUser({
            id: res.user.id,
            mobile: res.user.mobile,
            name: res.user.name,
            role: res.user.role as 'consumer' | 'admin' | 'super_admin',
          });
        } else {
          await updateUser({ name: name.trim() });
        }
      } else {
        await updateUser({ name: name.trim() });
      }

      navigation.replace(redirectTarget);
    } catch {
      Alert.alert('Error', config.save_error_message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.green700} />
      </SafeAreaView>
    );
  }

  if (!config) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorText}>
          {configLoadError.message || 'Could not load profile setup.'}
        </Text>
        <OnboardingPrimaryButton label={configLoadError.retry} onPress={loadConfig} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardBehavior}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.main}>
            <OnboardingBackButton
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
              }}
            />

            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePhotoPress}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.avatarCircle}>
                  <AppIcon name="user" size={44} color={COLORS.green700} />
                  <View style={styles.cameraBadge}>
                    <Text style={styles.cameraIcon}>📷</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>{config.title}</Text>
                <Text style={styles.subtitle}>{config.subtitle}</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{config.name_label}</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder={config.name_placeholder}
                  placeholderTextColor={COLORS.ink300}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  autoFocus={Platform.OS === 'ios'}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{config.email_label}</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder={config.email_placeholder}
                  placeholderTextColor={COLORS.ink300}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
          <OnboardingPrimaryButton
            label={config.submit_label}
            onPress={handleSave}
            disabled={!name.trim()}
            loading={saving}
            showArrow
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  centered: {
    flex: 1,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.green50,
    borderWidth: 2,
    borderColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: { fontSize: 13 },
  headerBlock: {
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: COLORS.ink500,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink900,
    padding: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
});
