import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import {
  DeleteAccountBookmarkIcon,
  DeleteAccountCheckboxBox,
  DeleteAccountInfoIcon,
  DeleteAccountPercentIcon,
  DeleteAccountPinIcon,
  DeleteAccountReceiptIcon,
  DeleteAccountSuccessCheckIcon,
} from '../../components/account/DeleteAccountIcons';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  DeleteAccountScreenConfig,
  deleteAccount,
  fetchDeleteAccountScreenConfig,
} from '../../services/deleteAccountApi';

const SCREEN_BG = '#F8FAF8';

function getItemIcon(label: string) {
  const l = (label || '').toLowerCase();
  if (l.includes('history') || l.includes('order') || l.includes('track')) {
    return <DeleteAccountReceiptIcon size={18} />;
  }
  if (l.includes('basket') || l.includes('saved monthly')) {
    return <DeleteAccountBookmarkIcon size={18} />;
  }
  if (l.includes('address')) {
    return <DeleteAccountPinIcon size={18} />;
  }
  if (l.includes('coupon') || l.includes('reward')) {
    return <DeleteAccountPercentIcon size={18} />;
  }
  return <DeleteAccountReceiptIcon size={18} />;
}

export default function DeleteAccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token, logout } = useAuth();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<DeleteAccountScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchDeleteAccountScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig]),
  );

  const handleDelete = async () => {
    if (!screenConfig || !token) return;

    if (!agreed) {
      showToast({
        type: 'info',
        title: screenConfig.agreement_required_title || 'Confirmation Required',
        message: screenConfig.agreement_required_message || 'Please confirm that you understand this action cannot be undone.',
      });
      return;
    }

    setDeleting(true);
    const result = await deleteAccount(token);
    setDeleting(false);

    if (!result.success) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: screenConfig.delete_error_message || 'Failed to delete account',
      });
      return;
    }

    await logout();
    setIsDeleted(true);
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadConfig()}>
            <ActivityIndicator color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isDeleted) {
    const bottomPadding = Math.max(insets.bottom, 16);
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successWrap}>
          <View style={styles.greenTickCircle}>
            <DeleteAccountSuccessCheckIcon size={36} />
          </View>

          <Text style={styles.successTitle}>{screenConfig.success_title}</Text>
          <Text style={styles.successSub}>{screenConfig.success_subtitle}</Text>

          <View style={styles.activeOrdersNoteBox}>
            <DeleteAccountInfoIcon size={14} />
            <Text style={styles.activeOrdersNoteText}>
              {screenConfig.success_active_orders_note}
            </Text>
          </View>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
            activeOpacity={0.85}
          >
            <Text style={styles.backHomeBtnText}>{screenConfig.success_back_home_label}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const deletedItems = screenConfig.deleted_items?.length
    ? screenConfig.deleted_items
    : [
        { id: '1', label: 'Order history & tracking' },
        { id: '2', label: 'Saved monthly baskets' },
        { id: '3', label: 'Saved addresses' },
        { id: '4', label: 'Coupons & rewards' },
      ];

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CheckoutBackIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title || 'Delete account'}</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainWarningText}>
          {screenConfig.warning_text ||
            "This permanently deletes your MonthlyGrocery account. This action can't be undone."}
        </Text>

        <Text style={styles.sectionHeading}>
          {screenConfig.section_label || "WHAT YOU'LL LOSE"}
        </Text>

        <View style={styles.deleteListCard}>
          {deletedItems.map((item, idx) => {
            const isLast = idx === deletedItems.length - 1;
            return (
              <React.Fragment key={item.id}>
                <View style={styles.deleteItemRow}>
                  <View style={styles.itemIconBox}>
                    {getItemIcon(item.label)}
                  </View>
                  <Text style={styles.deleteItemLabel}>{item.label}</Text>
                </View>
                {!isLast && <View style={styles.itemDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <DeleteAccountInfoIcon size={16} />
          <Text style={styles.infoText}>
            {screenConfig.active_orders_warning ||
              'Any active orders will still be delivered before your account is closed.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <DeleteAccountCheckboxBox checked={agreed} size={22} />
          <Text style={styles.checkboxLabel}>
            {screenConfig.agreement_label ||
              "I understand this is permanent and can't be undone."}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Pinned Bottom Bar matching Figma with separator border */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={[styles.deleteBtn, !agreed && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={!agreed || deleting || !token}
          activeOpacity={0.85}
        >
          {deleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteBtnText}>
              {screenConfig.delete_button_label || 'Delete my account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>
            {screenConfig.cancel_label || 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  mainWarningText: {
    ...FONTS.muktaRegular,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 20,
  },
  sectionHeading: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  deleteListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  deleteItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deleteItemLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#1E293B',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F4F1',
  },
  infoBox: {
    backgroundColor: '#F3F5F3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#475569',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: SCREEN_BG,
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
  },
  deleteBtn: {
    backgroundColor: '#D9383A',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteBtnDisabled: {
    backgroundColor: '#D9383A',
    opacity: 0.45,
  },
  deleteBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#475569',
  },
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  greenTickCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E2F2E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSub: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  activeOrdersNoteBox: {
    backgroundColor: '#F3F5F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeOrdersNoteText: {
    ...FONTS.muktaMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#475569',
  },
  backHomeBtn: {
    width: '100%',
    backgroundColor: '#1E7A46',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});

