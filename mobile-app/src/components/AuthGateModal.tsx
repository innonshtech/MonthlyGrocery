import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal
} from 'react-native';
import AppIcon from './AppIcon';
import { COLORS, RADIUS } from '../constants/theme';

export type AuthGateType = 'checkout' | 'save_basket';

interface AuthGateModalProps {
  visible: boolean;
  type: AuthGateType;
  onClose: () => void;
  onContinue: () => void;
}

export default function AuthGateModal({
  visible,
  type,
  onClose,
  onContinue
}: AuthGateModalProps) {
  const isCheckout = type === 'checkout';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          {/* Centered Mint Icon Circle */}
          <View style={styles.mintCircle}>
            {isCheckout ? (
              <AppIcon name="phone" size={26} color={COLORS.green700} />
            ) : (
              <AppIcon name="tag" size={26} color={COLORS.green700} />
            )}
          </View>

          {/* Headline */}
          <Text style={styles.headline}>
            {isCheckout ? 'Sign in to place your order' : 'Sign in to save baskets'}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {isCheckout
              ? "We'll need your mobile number so your delivery partner can reach you and you can track your order."
              : "Save this cart and reorder it in one tap every month — once you're signed in."}
          </Text>

          {/* Primary Green CTA */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue with phone number</Text>
          </TouchableOpacity>

          {/* Secondary Dismiss Link */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>
              {isCheckout ? 'Keep browsing' : 'Not now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    marginBottom: 20,
  },
  mintCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink500,
  },
});
