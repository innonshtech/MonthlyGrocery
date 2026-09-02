import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
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

const SCREEN_BG = '#FBFAF6';

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
        <View style={styles.menuIconCircle}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
        {badge != null && badge > 0 ? (
          <View style={styles.couponBadge}>
            <Text style={styles.couponBadgeText}>{badge}</Text>
          </View>
        ) : null}
        <AccountChevronIcon size={20} />
      </TouchableOpacity>
      {!isLast ? <View style={styles.menuDivider} /> : null}
    </>
  );
}

export default function AccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, token, logout, city, area } = useAuth();

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
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading account..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => loadConfig()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
                {initialLetter ? (
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
                <AccountSavingsCoinLargeIcon size={28} />
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
                  Alert.alert(
                    screenConfig.about_alert_title,
                    screenConfig.about_alert_message,
                  )
                }
                isLast
              />
            </View>

            <TouchableOpacity
              style={styles.logoutRow}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.85}
            >
              <AccountLogoutIcon size={20} color="#D9383A" />
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
                <View style={styles.menuIconCircle}>
                  <AccountMenuPinIcon size={20} />
                </View>
                <View style={styles.guestMenuText}>
                  <Text style={styles.menuLabel}>{screenConfig.guest_delivery_area_label}</Text>
                  <Text style={styles.guestAreaSub}>{guestAreaLabel}</Text>
                </View>
                <AccountChevronIcon size={20} />
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
                  Alert.alert(
                    screenConfig.about_alert_title,
                    screenConfig.about_alert_message,
                  )
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
    </SafeAreaView>
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
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 24,
    lineHeight: 28,
    color: COLORS.ink900,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 80,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  avatarLetter: {
    ...FONTS.balooBold,
    fontSize: 24,
    lineHeight: 28,
    color: COLORS.green700,
  },
  profileInfo: { flex: 1, paddingRight: 8 },
  profileName: {
    ...FONTS.balooBold,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  profilePhone: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.ink500,
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  editBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.ink700,
  },
  savingsCard: {
    backgroundColor: COLORS.green800,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsTextBlock: { flex: 1, paddingRight: 12 },
  savingsHeader: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.marigold500,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  savingsAmount: {
    ...FONTS.balooBold,
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
  },
  savingsSince: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 16,
    color: '#D1FAE5',
    marginTop: 4,
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
    color: COLORS.marigold500,
    marginTop: 4,
  },
  savingsCoinCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.marigold500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    gap: 11,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  menuLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.ink900,
    flex: 1,
  },
  couponBadge: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.marigold500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 4,
  },
  couponBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink900,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.line,
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
    borderWidth: 1.5,
    borderColor: '#EAE9E2',
    borderRadius: RADIUS.pill,
    marginTop: 12,
    marginBottom: 24,
  },
  logoutText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#D9383A',
  },
  guestCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: COLORS.green700,
    height: 44,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
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
