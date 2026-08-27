import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import {
  OnboardingBackButton,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';

export default function LoginScreen({ route, navigation }: any) {
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(28);
  const [canResend, setCanResend] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();
  const inputRefs = useRef<any[]>([]);

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
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await sendOtp(mobile, 'consumer');
    setLoading(false);
    if (res.success) {
      setStep(2);
      setResendTimer(28);
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
      setError('Please enter the complete 6-digit code');
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
      setError("That code didn't match. Check and try again.");
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
      return;
    }

    newDigits[index] = cleanText;
    setOtpDigits(newDigits);
    if (error) setError('');

    if (cleanText && index < 5) {
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

  // Format the mobile number as "+91 98765 43210" or similar
  const formattedMobile = mobile.length === 10 
    ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
    : `+91 ${mobile}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.main}>
          {step === 1 ? (
            <>
              {/* Header Row matching Figma A3 */}
              <View style={styles.headerRow}>
                <OnboardingBackButton onPress={() => navigation.goBack()} />
                <TouchableOpacity onPress={handleGuest} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>Enter your mobile number</Text>
                <Text style={styles.subtitle}>
                  We'll send a one-time code to verify it's you.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Mobile number</Text>
              <View style={[styles.phoneInputCard, error ? styles.inputError : null]}>
                <View style={styles.prefixRow}>
                  <Text style={styles.prefixText}>🇮🇳 +91</Text>
                </View>
                <View style={styles.verticalDivider} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor={COLORS.ink300}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val.replace(/[^\d]/g, ''));
                    if (error) setError('');
                  }}
                  autoFocus
                />
              </View>

              {error ? (
                <View style={styles.inlineErrorRow}>
                  <Text style={styles.inlineErrorIcon}>!</Text>
                  <Text style={styles.inlineErrorText}>{error}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <OnboardingBackButton
                onPress={() => {
                  setStep(1);
                  setError('');
                }}
              />

              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>Verify your number</Text>
                <View style={styles.otpSubtitleRow}>
                  <Text style={styles.subtitle}>
                    Enter the code we sent to {formattedMobile}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStep(1);
                      setError('');
                    }}
                  >
                    <Text style={styles.editLink}>Edit</Text>
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
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={idx === 0}
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorTextCenter}>{error}</Text> : null}

              <View style={styles.resendRow}>
                {canResend ? (
                  <View style={styles.resendActionRow}>
                    <Text style={styles.resendText}>Didn't get the code? </Text>
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={styles.resendActive}>Resend code</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.resendTimer}>
                    Didn't get the code?  Resend in {formattedTimer}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.bottomBar}>
          {step === 1 ? (
            <>
              <Text style={styles.termsText}>
                By continuing you agree to our Terms & Privacy Policy.
              </Text>
              <OnboardingPrimaryButton
                label="Continue"
                onPress={handleSendOtp}
                disabled={mobile.length < 10}
                loading={loading}
              />
              <TouchableOpacity onPress={handleGuest} style={styles.guestRow}>
                <Text style={styles.guestText}>Browse as a guest</Text>
                <AppIcon name="arrow-right" size={18} color={COLORS.green700} />
              </TouchableOpacity>
            </>
          ) : (
            <OnboardingPrimaryButton
              label="Verify"
              onPress={handleVerifyOtp}
              disabled={otpDigits.join('').length < 6}
              loading={loading}
            />
          )}
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
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: COLORS.paper,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 40,
    marginBottom: 22,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  skipText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  backSpacer: {
    width: 40,
    height: 40,
    marginBottom: 22,
  },
  headerBlock: {
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
  inputLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: '#3D4A44',
    marginBottom: 8,
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
    height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    backgroundColor: COLORS.surface,
    ...FONTS.balooSemiBold,
    fontSize: 22,
    color: COLORS.ink900,
  },
  otpBoxFocused: { borderColor: '#2A8B54' },
  otpBoxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  errorTextCenter: {
    ...FONTS.muktaMedium,
    color: COLORS.error,
    fontSize: 12,
    marginBottom: 12,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
  },
  resendTimer: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
  },
  resendActive: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.green700,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
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
    marginBottom: 2,
  },
});
