import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

interface AssignDeliveryPartnerModalProps {
  visible: boolean;
  order: any | null;
  onClose: () => void;
  onConfirm: (partnerName: string, partnerPhone: string) => Promise<void> | void;
  loading?: boolean;
}

export default function AssignDeliveryPartnerModal({
  visible,
  order,
  onClose,
  onConfirm,
  loading = false,
}: AssignDeliveryPartnerModalProps) {
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (visible && order) {
      setPartnerName(order.delivery_partner_name || '');
      setPartnerPhone(order.delivery_partner_phone || '');
      setValidationError('');
    }
  }, [visible, order]);

  if (!order) return null;

  const handleConfirm = () => {
    const cleanName = partnerName.trim();
    const cleanPhone = partnerPhone.replace(/[^0-9]/g, '');

    if (!cleanName) {
      setValidationError('Please enter delivery person name.');
      return;
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      setValidationError('Phone number must be exactly 10 digits.');
      return;
    }

    setValidationError('');
    onConfirm(cleanName, cleanPhone);
  };

  const orderId = order.display_id
    ? (String(order.display_id).startsWith('#') ? order.display_id : `#${order.display_id}`)
    : (order.id ? `#MG${String(order.id).slice(-5).toUpperCase()}` : 'Order');

  const customerName = order.profiles?.name || order.consumer_name || 'Customer';
  const deliveryAddress = order.delivery_address || order.shipping_address || order.deliver_to_label || 'Customer Address';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 26 }}>🛵</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.headerTitle}>Assign Delivery Partner</Text>
                  <Text style={styles.headerSubtitle}>
                    Dispatch {orderId} for delivery
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  disabled={loading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {/* Destination mini-card */}
                <View style={styles.destCard}>
                  <View style={styles.destRow}>
                    <Text style={styles.destCustomerName}>👤 {customerName}</Text>
                    <Text style={styles.destItemsCount}>📦 {order.order_items?.length || 0} items</Text>
                  </View>
                  <Text style={styles.destAddress} numberOfLines={2}>
                    📍 {deliveryAddress}
                  </Text>
                </View>

                {/* Input 1: Rider Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Delivery Partner Name <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, validationError && !partnerName.trim() && styles.inputError]}
                    placeholder="e.g. Ramesh Kumar or Store Rider"
                    placeholderTextColor="#9CA3AF"
                    value={partnerName}
                    onChangeText={(text) => {
                      setPartnerName(text);
                      if (validationError) setValidationError('');
                    }}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                {/* Input 2: Rider Mobile Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Mobile Number <Text style={styles.optionalTag}>(for customer direct calling)</Text>
                  </Text>
                  <View style={[styles.phoneInputRow, validationError && partnerPhone && partnerPhone.replace(/[^0-9]/g, '').length !== 10 && styles.inputError]}>
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#9CA3AF"
                      value={partnerPhone}
                      onChangeText={(text) => {
                        setPartnerPhone(text);
                        if (validationError) setValidationError('');
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Error Banner */}
                {validationError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {validationError}</Text>
                  </View>
                ) : null}

                {/* Helpful Note */}
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>
                    💡 Customer will see this delivery partner name on their tracking screen and can tap the call button to contact them directly.
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dispatchBtn, loading && styles.dispatchBtnDisabled]}
                  onPress={handleConfirm}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.dispatchBtnText}>Confirm & Dispatch 🛵</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 440,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  destCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  destRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  destCustomerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  destItemsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  destAddress: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  countryCodeBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  dispatchBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dispatchBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  dispatchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
