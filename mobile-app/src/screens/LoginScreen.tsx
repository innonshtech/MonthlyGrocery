import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../constants/theme';

export default function LoginScreen({ route, navigation }: any) {
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);
  const [step, setStep] = useState<1 | 2>(1); // 1: Phone Entry, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(28);
  const [canResend, setCanResend] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();

  const inputRefs = useRef<any[]>([]);

  useEffect(() => {
    let interval: any;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const formattedTimer = `0:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}`;

  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
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
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
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

  const handleSkip = () => {
    navigation.navigate('CitySelection');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            <View style={styles.screenWrap}>
              {/* Top Bar with Skip Link */}
              <View style={styles.topBar}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>

              {/* Header Title & Subtitle */}
              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>Enter your phone number</Text>
                <Text style={styles.subtitle}>We'll send a one-time code to verify it.</Text>
              </View>

              {/* Phone Input Box with Label */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Mobile number</Text>
                <View style={[styles.phoneInputCard, error ? styles.cardError : null]}>
                  <Text style={styles.prefixText}>+91</Text>
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
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              {/* Bottom Sticky Action Area */}
              <View style={styles.bottomArea}>
                <Text style={styles.termsText}>
                  By continuing you agree to our Terms & Privacy Policy.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    mobile.length === 10 ? styles.btnActive : styles.btnDisabled
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading || mobile.length < 10}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.continueBtnText}>Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkip} style={styles.guestLinkRow}>
                  <Text style={styles.guestLinkText}>Browse as a guest</Text>
                  <Text style={styles.guestArrow}>➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.screenWrap}>
              {/* Top Bar with Back Arrow */}
              <View style={styles.topBar}>
                <TouchableOpacity
                  onPress={() => {
                    setStep(1);
                    setError('');
                  }}
                  style={styles.backArrowBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.backArrowText}>‹</Text>
                </TouchableOpacity>
              </View>

              {/* Header Title & Subtitle */}
              <View style={styles.headerBlock}>
                <Text style={styles.mainTitle}>Verify your number</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to +91 {mobile}
                </Text>
              </View>

              {/* 6 Individual OTP Boxes */}
              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, idx) => {
                  const isFocused = activeOtpIndex === idx;
                  return (
                    <TextInput
                      key={idx}
                      ref={(ref) => { inputRefs.current[idx] = ref; }}
                      style={[
                        styles.otpBox,
                        isFocused && styles.otpBoxFocused,
                        error ? styles.otpBoxError : null
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
                  );
                })}
              </View>

              {error ? <Text style={styles.errorTextCenter}>{error}</Text> : null}

              {/* Resend Timer Line */}
              <View style={styles.resendLine}>
                <Text style={styles.resendPromptText}>Didn't get the code? </Text>
                {canResend ? (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendActiveLink}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendTimerText}>Resend in {formattedTimer}</Text>
                )}
              </View>

              {/* Verify Primary Button */}
              <View style={styles.verifyBtnWrap}>
                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    otpDigits.join('').length === 6 ? styles.btnActive : styles.btnDisabled
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading || otpDigits.join('').length < 6}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.continueBtnText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper background #FAF9F5
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
  },
  screenWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: 20,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green700, // #1E7A46
  },
  backArrowBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 34,
  },
  headerBlock: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.ink900, // #17251E
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.ink500, // #6B7772
    lineHeight: 20,
  },
  inputSection: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink700, // #3D4A44
    marginBottom: 8,
  },
  phoneInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface, // #FFFFFF
    borderWidth: 1.5,
    borderColor: COLORS.line, // #EAE9E2
    borderRadius: RADIUS.md, // 12px
    height: 54,
    paddingHorizontal: 16,
  },
  cardError: {
    borderColor: COLORS.error, // #D8453B
    backgroundColor: COLORS.errorBg, // #FBE9E7
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink900,
    marginRight: 14,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.line,
    marginRight: 14,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink900,
    letterSpacing: 0.5,
    padding: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  errorTextCenter: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  bottomArea: {
    marginTop: 40,
    gap: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.pill, // 999px
    backgroundColor: COLORS.green700, // #1E7A46
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: {
    opacity: 1,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  guestLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green700,
  },
  guestArrow: {
    fontSize: 14,
    color: COLORS.green700,
    fontWeight: 'bold',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.md, // 12px
    borderWidth: 1.5,
    borderColor: COLORS.line, // #EAE9E2
    backgroundColor: COLORS.surface, // #FFFFFF
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  otpBoxFocused: {
    borderColor: COLORS.green700, // #1E7A46
  },
  otpBoxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
    color: COLORS.error,
  },
  resendLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  resendPromptText: {
    fontSize: 13,
    color: COLORS.ink500,
  },
  resendTimerText: {
    fontSize: 13,
    color: COLORS.ink500,
    fontWeight: '500',
  },
  resendActiveLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  verifyBtnWrap: {
    marginTop: 'auto',
  },
});
