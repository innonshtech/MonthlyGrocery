import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import AppLoader from '../../components/AppLoader';
import {
  AccountChevronIcon,
  AccountGuestIcon,
  AccountLogoutIcon,
  AccountMenuAboutIcon,
  AccountMenuHelpIcon,
  AccountMenuPercentIcon,
  AccountMenuPinIcon,
  AccountSavingsCoinLargeIcon,
} from '../../components/account/AccountHubIcons';
import {
  AccountScreenConfig,
  AccountSummary,
  fetchAccountScreenConfig,
  fetchAccountSummary,
  formatAccountTemplate,
  formatDisplayPhone,
  formatInr,
} from '../../services/accountApi';

const SCREEN_BG = '#F8FAF8';

type MenuRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: number;
  isLast?: boolean;
};

function MenuRow({ icon, label, onPress, badge, isLast }: MenuRowProps) {
  return (
    <>
      <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.menuIconSquircle}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
        {badge != null && badge > 0 ? (
          <View style={styles.couponBadge}>
            <Text style={styles.couponBadgeText}>{badge}</Text>
          </View>
        ) : null}
        <AccountChevronIcon size={18} color="#94A3B8" />
      </TouchableOpacity>
      {!isLast ? <View style={styles.menuDivider} /> : null}
    </>
  );
}

export default function AccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, token, logout, city, area } = useAuth();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<AccountScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchAccountScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadSummary = useCallback(async () => {
    if (!token) {
      setSummary(null);
      setMetricsError(false);
      return;
    }
    setMetricsLoading(true);
    setMetricsError(false);
    const { summary: data, error } = await fetchAccountSummary(token);
    if (error || !data) {
      setSummary(null);
      setMetricsError(true);
    } else {
      setSummary(data);
    }
    setMetricsLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadConfig().then(() => loadSummary());
    }, [loadConfig, loadSummary]),
  );

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Splash' }],
    });
  };

  if (configLoading) {
    return (
      <View style={styles.safe}>
        <View style={styles.centered}>
          <AppLoader message="Loading account..." />
        </View>
      </View>
    );
  }

  if (!screenConfig) {
    return (
      <View style={styles.safe}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => loadConfig()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayName = user?.name?.trim() || '';
  const displayPhone = formatDisplayPhone(user?.mobile);
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : '';

  const guestAreaLabel =
    city && area
      ? formatAccountTemplate(screenConfig.guest_delivery_area_template, { area, city })
      : screenConfig.guest_no_area_label;

  const savingsSince =
    summary?.joined_month
      ? formatAccountTemplate(screenConfig.savings_since_template, {
          month: summary.joined_month,
        })
      : null;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {token && user ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                ) : initialLetter ? (
                  <Text style={styles.avatarLetter}>{initialLetter}</Text>
                ) : null}
              </View>
              <View style={styles.profileInfo}>
                {displayName ? (
                  <Text style={styles.profileName}>{displayName}</Text>
                ) : null}
                {displayPhone ? (
                  <Text style={styles.profilePhone}>{displayPhone}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.85}
              >
                <Text style={styles.editBtnText}>{screenConfig.edit_label}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.savingsCard}>
              <View style={styles.savingsTextBlock}>
                <Text style={styles.savingsHeader}>{screenConfig.savings_header}</Text>
                {metricsLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={styles.savingsLoader}
                  />
                ) : metricsError ? (
                  <TouchableOpacity onPress={loadSummary}>
                    <Text style={styles.metricsErrorText}>
                      {screenConfig.metrics_error_message}
                    </Text>
                    <Text style={styles.metricsRetryText}>{screenConfig.retry_label}</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.savingsAmount}>
                      {formatInr(summary?.total_saved ?? 0)}
                    </Text>
                    {savingsSince ? (
                      <Text style={styles.savingsSince}>{savingsSince}</Text>
                    ) : null}
                  </>
                )}
              </View>
              <View style={styles.savingsCoinCircle}>
                <AccountSavingsCoinLargeIcon size={26} />
              </View>
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon={<AccountMenuPinIcon size={20} />}
                label={screenConfig.menu_saved_addresses}
                onPress={() => navigation.navigate('SavedAddresses')}
              />
              <MenuRow
                icon={<AccountMenuPercentIcon size={20} />}
                label={screenConfig.menu_my_coupons}
                onPress={() => navigation.navigate('MyCoupons')}
                badge={summary?.available_coupons_count}
              />
              <MenuRow
                icon={<AccountMenuHelpIcon size={20} />}
                label={screenConfig.menu_help_support}
                onPress={() => navigation.navigate('HelpSupport')}
              />
              <MenuRow
                icon={<AccountMenuAboutIcon size={20} />}
                label={screenConfig.menu_about_terms}
                onPress={() =>
                  showToast({
                    type: 'info',
                    title: screenConfig.about_alert_title || 'About & Terms',
                    message: screenConfig.about_alert_message || 'Monthly Grocery v1.0.0',
                  })
                }
                isLast
              />
            </View>

            <TouchableOpacity
              style={styles.logoutRow}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.85}
            >
              <AccountLogoutIcon size={18} color="#E53E3E" />
              <Text style={styles.logoutText}>{screenConfig.logout_label}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.guestCard}>
              <View style={styles.guestIconCircle}>
                <AccountGuestIcon size={30} />
              </View>
              <Text style={styles.guestTitle}>{screenConfig.guest_title}</Text>
              <Text style={styles.guestSub}>{screenConfig.guest_subtitle}</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{screenConfig.guest_login_label}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('CitySelection')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconSquircle}>
                  <AccountMenuPinIcon size={20} />
                </View>
                <View style={styles.guestMenuText}>
                  <Text style={styles.menuLabel}>{screenConfig.guest_delivery_area_label}</Text>
                  <Text style={styles.guestAreaSub}>{guestAreaLabel}</Text>
                </View>
                <AccountChevronIcon size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <MenuRow
                icon={<AccountMenuHelpIcon size={20} />}
                label={screenConfig.menu_help_support}
                onPress={() => navigation.navigate('HelpSupport')}
              />
              <MenuRow
                icon={<AccountMenuAboutIcon size={20} />}
                label={screenConfig.menu_about_terms}
                onPress={() =>
                  showToast({
                    type: 'info',
                    title: screenConfig.about_alert_title || 'About & Terms',
                    message: screenConfig.about_alert_message || 'Monthly Grocery v1.0.0',
                  })
                }
                isLast
              />
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLogoutModal(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{screenConfig.logout_sheet_title}</Text>
            <Text style={styles.sheetSub}>{screenConfig.logout_sheet_subtitle}</Text>
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelBtnText}>{screenConfig.logout_cancel_label}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmLogoutText}>
                  {screenConfig.logout_confirm_label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 26,
    lineHeight: 30,
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarLetter: {
    ...FONTS.muktaBold,
    fontSize: 22,
    lineHeight: 26,
    color: '#1E7A46',
  },
  profileInfo: { flex: 1, paddingRight: 8 },
  profileName: {
    ...FONTS.muktaBold,
    fontSize: 17,
    lineHeight: 22,
    color: '#111827',
  },
  profilePhone: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: '#1E7A46',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  editBtnText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#1E7A46',
  },
  savingsCard: {
    backgroundColor: '#165B33',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsTextBlock: { flex: 1, paddingRight: 12 },
  savingsHeader: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: '#D4E972',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  savingsAmount: {
    ...FONTS.balooBold,
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
  },
  savingsSince: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  savingsLoader: { alignSelf: 'flex-start', marginTop: 8 },
  metricsErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: '#D1FAE5',
  },
  metricsRetryText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#D4E972',
    marginTop: 4,
  },
  savingsCoinCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAB82C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#1E293B',
    flex: 1,
  },
  couponBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  couponBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F4F1',
  },
  guestMenuText: {
    flex: 1,
    paddingRight: 8,
  },
  guestAreaSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    marginTop: 1,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 32,
  },
  logoutText: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    color: '#E53E3E',
  },
  guestCard: {
    backgroundColor: '#EAF5EE',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  guestTitle: {
    ...FONTS.muktaBold,
    fontSize: 17,
    lineHeight: 22,
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  guestSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: '#1E7A46',
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdrop: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.ink900,
    marginBottom: 6,
  },
  sheetSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.ink500,
    marginBottom: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.ink700,
  },
  confirmLogoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
