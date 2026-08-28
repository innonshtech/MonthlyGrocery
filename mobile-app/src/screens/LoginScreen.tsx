import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import AppLoader from '../components/AppLoader';
import {
  OnboardingBackButton,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import {
  useOnboardingLayout,
} from '../components/onboarding/onboardingLayout';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';
import { fetchOnboardingConfig, PhoneEntryConfig, OtpVerificationConfig } from '../services/onboardingApi';

export default function LoginScreen({ route, navigation }: any) {
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [phoneEntry, setPhoneEntry] = useState<PhoneEntryConfig | null>(null);
  const [otpVerification, setOtpVerification] = useState<OtpVerificationConfig | null>(null);
  const [configLoadError, setConfigLoadError] = useState({ message: '', retry: 'Retry' });
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(28);
  const [canResend, setCanResend] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();
  const inputRefs = useRef<any[]>([]);
  const { bottomPadding: bottomPad, insets, keyboardBehavior } = useOnboardingLayout();

  const loadOnboardingConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchOnboardingConfig();
    setPhoneEntry(config?.phone_entry ?? null);
    setOtpVerification(config?.otp_verification ?? null);
    setConfigLoadError({
      message: config?.phone_entry?.load_error_message ?? '',
      retry: config?.phone_entry?.retry_label ?? 'Retry',
    });
    if (config?.otp_verification?.resend_seconds) {
      setResendTimer(config.otp_verification.resend_seconds);
    }
    setConfigLoading(false);
  }, []);

  useEffect(() => {
    loadOnboardingConfig();
  }, [loadOnboardingConfig]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const formattedTimer = `0:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}`;

  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      setError(phoneEntry?.invalid_phone_error || '');
      return;
    }
    setError('');
    setLoading(true);
    const res = await sendOtp(mobile, 'consumer');
    setLoading(false);
    if (res.success) {
      setStep(2);
      const seconds = otpVerification?.resend_seconds ?? 28;
      setResendTimer(seconds);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setActiveOtpIndex(0);
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join('');
    if (fullCode.length < 6) {
      setError(otpVerification?.incomplete_error || '');
      return;
    }
    setError('');
    setLoading(true);
    const res = await verifyOtp(mobile, fullCode, undefined, 'consumer');
    setLoading(false);
    if (res.success) {
      const redirect = route.params?.redirect || 'CitySelection';
      navigation.replace(redirect);
    } else {
      setError(res.error || otpVerification?.invalid_otp_error || '');
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanText.length > 1) {
      const pasted = cleanText.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || '';
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      setActiveOtpIndex(nextIndex);
      if (error) setError('');
      return;
    }

    if (!cleanText) {
      if (otpDigits[index]) {
        newDigits[index] = '';
        setOtpDigits(newDigits);
        if (error) setError('');
        return;
      }
      if (index > 0) {
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
        setActiveOtpIndex(index - 1);
        if (error) setError('');
      }
      return;
    }

    newDigits[index] = cleanText.slice(-1);
    setOtpDigits(newDigits);
    if (error) setError('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveOtpIndex(index + 1);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveOtpIndex(index - 1);
    }
  };

  const handleGuest = () => navigation.navigate('CitySelection');

  const countryCode = phoneEntry?.country_code ?? '+91';
  const formattedMobile =
    mobile.length === 10
      ? `${countryCode} ${mobile.slice(0, 5)} ${mobile.slice(5)}`
      : `${countryCode} ${mobile}`;

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
          {step === 1 ? (
            configLoading ? (
              <View style={styles.configLoading}>
                <AppLoader message="Loading..." />
              </View>
            ) : !phoneEntry ? (
              <View style={styles.configError}>
                <Text style={styles.configErrorText}>
                  {configLoadError.message || 'Could not load login screen.'}
                </Text>
                <OnboardingPrimaryButton
                  label={configLoadError.retry}
                  onPress={loadOnboardingConfig}
                />
              </View>
            ) : (
            <>
              <OnboardingBackButton onPress={() => navigation.goBack()} />

              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>{phoneEntry.title}</Text>
                <Text style={styles.subtitle}>{phoneEntry.subtitle}</Text>
              </View>

              <View style={[styles.phoneInputCard, error ? styles.inputError : null]}>
                <View style={styles.prefixRow}>
                  <Text style={styles.prefixText}>
                    {phoneEntry.country_flag} {phoneEntry.country_code}
                  </Text>
                </View>
                <View style={styles.verticalDivider} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder={phoneEntry.phone_placeholder}
                  placeholderTextColor={COLORS.ink300}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete={Platform.OS === 'android' ? 'tel' : 'tel'}
                  returnKeyType="done"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val.replace(/[^\d]/g, ''));
                    if (error) setError('');
                  }}
                  autoFocus={Platform.OS === 'ios'}
                />
                {mobile.length === 10 ? (
                  <AppIcon name="check" size={22} color={COLORS.green700} />
                ) : null}
              </View>

              {error ? (
                <View style={styles.inlineErrorRow}>
                  <Text style={styles.inlineErrorIcon}>!</Text>
                  <Text style={styles.inlineErrorText}>{error}</Text>
                </View>
              ) : null}
            </>
            )
          ) : configLoading || !otpVerification ? (
            <View style={styles.configLoading}>
              <AppLoader message="Loading..." />
            </View>
          ) : (
            <>
              <OnboardingBackButton
                onPress={() => {
                  setStep(1);
                  setError('');
                }}
              />

              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>{otpVerification.title}</Text>
                <View style={styles.otpSubtitleRow}>
                  <Text style={styles.subtitle}>
                    {otpVerification.subtitle_prefix} {formattedMobile}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStep(1);
                      setError('');
                    }}
                  >
                    <Text style={styles.editLink}>{otpVerification.edit_label}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => {
                      inputRefs.current[idx] = ref;
                    }}
                    style={[
                      styles.otpBox,
                      activeOtpIndex === idx && styles.otpBoxFocused,
                      error ? styles.otpBoxError : null,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    onFocus={() => setActiveOtpIndex(idx)}
                    keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                    textContentType="oneTimeCode"
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                    importantForAutofill="yes"
                    selectTextOnFocus
                    maxLength={1}
                    textAlign="center"
                    autoFocus={idx === 0 && Platform.OS === 'ios'}
                  />
                ))}
              </View>

              {error ? (
                <View style={styles.inlineErrorRow}>
                  <Text style={styles.inlineErrorIcon}>!</Text>
                  <Text style={styles.inlineErrorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.resendRow}>
                <AppIcon name="clock" size={16} color={COLORS.ink500} />
                {canResend ? (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendActive}>{otpVerification.resend_label}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendTimer}>
                    {otpVerification.resend_timer_label} {formattedTimer}
                  </Text>
                )}
              </View>
            </>
          )}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          {step === 1 && phoneEntry ? (
            <>
              <OnboardingPrimaryButton
                label={phoneEntry.continue_label}
                onPress={handleSendOtp}
                disabled={mobile.length < 10}
                loading={loading}
              />
              <TouchableOpacity onPress={handleGuest} style={styles.guestRow}>
                <Text style={styles.guestText}>{phoneEntry.guest_label}</Text>
                <AppIcon name="arrow-right" size={18} color={COLORS.green700} />
              </TouchableOpacity>
              <Text style={styles.termsText}>{phoneEntry.terms_text}</Text>
            </>
          ) : step === 2 && otpVerification ? (
            <OnboardingPrimaryButton
              label={otpVerification.verify_label}
              onPress={handleVerifyOtp}
              disabled={otpDigits.join('').length < 6}
              loading={loading}
            />
          ) : null}
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
  flex: { 
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scrollContent: {
    flexGrow: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: COLORS.paper,
  },
  configLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  configErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  backSpacer: {
    width: 40,
    height: 40,
    marginBottom: 22,
  },
  headerBlock: {
    marginTop: 22,
    marginBottom: 22,
    gap: 8,
  },
  mainTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
  },
  subtitle: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink500,
    lineHeight: 24,
  },
  otpSubtitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  editLink: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.green700,
  },
  phoneInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefixText: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  verticalDivider: {
    width: 1.5,
    height: 22,
    backgroundColor: '#EAE9E2',
  },
  phoneInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink900,
    padding: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  inlineErrorIcon: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
    overflow: 'hidden',
  },
  inlineErrorText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.error,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    maxWidth: 50,
    height: 66,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    backgroundColor: COLORS.surface,
    ...FONTS.balooSemiBold,
    fontSize: 22,
    color: COLORS.ink900,
    ...(Platform.OS === 'android'
      ? { textAlignVertical: 'center', includeFontPadding: false, paddingVertical: 0 }
      : null),
  },
  otpBoxFocused: { borderColor: '#2A8B54' },
  otpBoxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  resendTimer: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 20,
  },
  resendActive: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.green700,
    lineHeight: 20,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 14,
    backgroundColor: COLORS.paper,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  guestText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  termsText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 16,
  },
});
