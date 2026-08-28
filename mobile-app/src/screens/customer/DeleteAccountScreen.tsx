import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import {
  DeleteAccountCheckboxBox,
  DeleteAccountItemXIcon,
  DeleteAccountSuccessCheckIcon,
  DeleteAccountWarningIcon,
} from '../../components/account/DeleteAccountIcons';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  DeleteAccountScreenConfig,
  deleteAccount,
  fetchDeleteAccountScreenConfig,
} from '../../services/deleteAccountApi';

const SCREEN_BG = '#FBFAF6';

export default function DeleteAccountScreen({ navigation }: any) {
  const { token, logout } = useAuth();

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
      Alert.alert(
        screenConfig.agreement_required_title,
        screenConfig.agreement_required_message,
      );
      return;
    }

    setDeleting(true);
    const result = await deleteAccount(token);
    setDeleting(false);

    if (!result.success) {
      Alert.alert(screenConfig.delete_error_message);
      return;
    }

    await logout();
    setIsDeleted(true);
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.green700} />
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
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successWrap}>
          <View style={styles.greenTickCircle}>
            <DeleteAccountSuccessCheckIcon size={32} />
          </View>

          <Text style={styles.successTitle}>{screenConfig.success_title}</Text>
          <Text style={styles.successSub}>{screenConfig.success_subtitle}</Text>

          <View style={styles.activeOrdersNoteBox}>
            <Text style={styles.activeOrdersNoteText}>
              {screenConfig.success_active_orders_note}
            </Text>
          </View>

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

  const deletedItems = screenConfig.deleted_items || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainWarningText}>{screenConfig.warning_text}</Text>

        <Text style={styles.sectionHeading}>{screenConfig.section_label}</Text>

        <View style={styles.deleteListCard}>
          {deletedItems.map((item) => (
            <View key={item.id} style={styles.deleteItemRow}>
              <DeleteAccountItemXIcon size={14} />
              <Text style={styles.deleteItemLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.amberCard}>
          <View style={styles.amberRow}>
            <DeleteAccountWarningIcon size={16} />
            <Text style={styles.amberText}>{screenConfig.active_orders_warning}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <DeleteAccountCheckboxBox checked={agreed} size={20} />
          <Text style={styles.checkboxLabel}>{screenConfig.agreement_label}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, !agreed && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={!agreed || deleting || !token}
          activeOpacity={0.85}
        >
          {deleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteBtnText}>{screenConfig.delete_button_label}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>{screenConfig.cancel_label}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    gap: 10,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  mainWarningText: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.ink700,
    marginBottom: 20,
  },
  sectionHeading: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  deleteListCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  deleteItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteItemLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.ink900,
  },
  amberCard: {
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20,
  },
  amberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  amberText: {
    flex: 1,
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.marigold700,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  checkboxLabel: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.ink900,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.ink500,
  },
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  greenTickCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    lineHeight: 26,
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 20,
  },
  activeOrdersNoteBox: {
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginBottom: 32,
  },
  activeOrdersNoteText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.green700,
  },
  backHomeBtn: {
    width: '100%',
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
