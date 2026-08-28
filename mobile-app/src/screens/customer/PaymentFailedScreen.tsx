import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/theme';
import {
  PaymentFailedXIcon,
  PaymentRetryIcon,
} from '../../components/CheckoutFigmaIcons';

const SCREEN_BG = '#FBFAF6';
const ERROR_CIRCLE_BG = '#FDEEEC';

export default function PaymentFailedScreen({ route, navigation }: any) {
  const {
    failureReason = 'transaction declined by bank',
    paymentParams = {},
  } = route?.params || {};

  const reasonText = failureReason.replace(/^reason:\s*/i, '').trim();

  const handleTryAgain = () => {
    navigation.replace('PaymentMethod', paymentParams);
  };

  const handleChooseAnother = () => {
    navigation.replace('PaymentMethod', paymentParams);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <PaymentFailedXIcon size={50} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Payment failed</Text>
          <Text style={styles.subtitle}>
            Your payment couldn’t be completed. Don’t worry — no money was deducted.
          </Text>
        </View>

        <View style={styles.reasonPill}>
          <Text style={styles.reasonText}>Reason: {reasonText}</Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={handleTryAgain}
            activeOpacity={0.85}
          >
            <PaymentRetryIcon size={18} />
            <Text style={styles.tryAgainText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chooseAnotherBtn}
            onPress={handleChooseAnother}
            activeOpacity={0.8}
          >
            <Text style={styles.chooseAnotherText}>Choose another payment method</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 16,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: ERROR_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...FONTS.balooBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.26,
    color: COLORS.ink900,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  reasonPill: {
    backgroundColor: COLORS.muted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  reasonText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 4,
  },
  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 49,
  },
  tryAgainText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  chooseAnotherBtn: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  chooseAnotherText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.green700,
  },
});
