import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppLoader from '../../components/AppLoader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { CheckoutBackIcon, SavingsCoinIcon } from '../../components/CheckoutFigmaIcons';
import {
  HubHeroBadgeIcon,
  HubOneClickIcon,
  HubCopyIcon,
  HubSavedIcon,
  HubBuildIcon,
  HubChevronIcon,
} from '../../components/monthlyGrocery/MonthlyGroceryHubIcons';
import {
  fetchMonthlyGroceryHubScreenConfig,
  fetchMonthlyHubSummary,
  formatHubTemplate,
  MonthlyGroceryHubScreenConfig,
  MonthlyHubSummary,
} from '../../services/monthlyGroceryHubApi';

const SCREEN_BG = '#FBFAF6';

export default function MyMonthlyGroceryHub({ navigation }: any) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<MonthlyGroceryHubScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [summary, setSummary] = useState<MonthlyHubSummary | null>(null);
  const [savedBasketsCount, setSavedBasketsCount] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(false);
    const config = await fetchMonthlyGroceryHubScreenConfig();
    setScreenConfig(config);
    setConfigError(!config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadMetrics = useCallback(async (config: MonthlyGroceryHubScreenConfig) => {
    setMetricsLoading(true);
    setMetricsError(false);
    try {
      const saved = await AsyncStorage.getItem('@saved_baskets');
      if (saved) {
        const list = JSON.parse(saved);
        setSavedBasketsCount(Array.isArray(list) ? list.length : 0);
      } else {
        setSavedBasketsCount(0);
      }

      if (token) {
        const hubSummary = await fetchMonthlyHubSummary(token);
        if (!hubSummary) {
          setMetricsError(true);
          setSummary(null);
        } else {
          setSummary(hubSummary);
        }
      } else {
        setSummary(null);
      }
    } catch {
      setMetricsError(true);
      setSummary(null);
    } finally {
      setMetricsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadConfig().then((config) => {
        if (config) loadMetrics(config);
      });
    }, [loadConfig, loadMetrics]),
  );

  const handleRetryConfig = () => {
    loadConfig().then((config) => {
      if (config) loadMetrics(config);
    });
  };

  const handleRetryMetrics = () => {
    if (screenConfig) loadMetrics(screenConfig);
  };

  const handleCopyLastMonth = () => {
    if (!summary?.has_last_order) {
      showToast({
        type: 'info',
        title: screenConfig?.no_last_order_title || 'No past order yet',
        message:
          screenConfig?.no_last_order_message ||
          'Place your first monthly grocery order to copy it next time.',
      });
      return;
    }
    navigation.navigate('CopyLastMonth');
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading Monthly Grocery Hub..." />
        </View>
      </SafeAreaView>
    );
  }

  if (configError || !screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <CheckoutBackIcon size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {screenConfig?.load_error_message ||
              'Could not load monthly grocery hub. Check that the backend is running.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetryConfig}>
            <Text style={styles.retryBtnText}>
              {screenConfig?.retry_label || 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const savedThisMonth = summary?.saved_this_month ?? 0;
  const copySubtitle = summary?.has_last_order
    ? formatHubTemplate(screenConfig.card_copy_subtitle_template, {
        month: summary.last_order_month,
        count: summary.last_order_item_count,
      })
    : screenConfig.card_copy_empty_subtitle;

  const savedSubtitle =
    savedBasketsCount > 0
      ? formatHubTemplate(screenConfig.card_saved_subtitle_template, {
          count: savedBasketsCount,
        })
      : screenConfig.card_saved_empty_subtitle;

  const savingsLabel =
    !metricsLoading && !metricsError && savedThisMonth > 0
      ? formatHubTemplate(screenConfig.hero_savings_template, {
          amount: savedThisMonth.toLocaleString('en-IN'),
        })
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <HubHeroBadgeIcon size={15} />
            <Text style={styles.heroBadge}>{screenConfig.hero_badge}</Text>
          </View>
          <Text style={styles.heroTitle}>{screenConfig.hero_title}</Text>
          <Text style={styles.heroSubtitle}>{screenConfig.hero_subtitle}</Text>
          {metricsLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.marigold500}
              style={styles.heroLoader}
            />
          ) : metricsError ? (
            <TouchableOpacity style={styles.metricsErrorRow} onPress={handleRetryMetrics}>
              <Text style={styles.metricsErrorText}>{screenConfig.metrics_error_message}</Text>
              <Text style={styles.metricsRetryText}>{screenConfig.retry_label}</Text>
            </TouchableOpacity>
          ) : savingsLabel ? (
            <View style={styles.heroSavingsPill}>
              <SavingsCoinIcon size={14} />
              <Text style={styles.heroSavingsText}>{savingsLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionCardsWrap}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardTall]}
            onPress={() => navigation.navigate('OneClickCart')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleSoft]}>
              <HubOneClickIcon size={22} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{screenConfig.card_one_click_title}</Text>
              <Text style={styles.cardSub}>{screenConfig.card_one_click_subtitle}</Text>
            </View>
            <HubChevronIcon size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCopyLastMonth}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleSoft]}>
              <HubCopyIcon size={21} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{screenConfig.card_copy_title}</Text>
              <Text style={styles.cardSub}>
                {metricsLoading ? '…' : copySubtitle}
              </Text>
            </View>
            <HubChevronIcon size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SavedBaskets')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleSoft]}>
              <HubSavedIcon size={20} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{screenConfig.card_saved_title}</Text>
              <Text style={styles.cardSub}>
                {metricsLoading ? '…' : savedSubtitle}
              </Text>
            </View>
            <HubChevronIcon size={20} />
          </TouchableOpacity>

          <View style={[styles.actionCard, styles.actionCardDisabled]}>
            <View style={[styles.iconCircle, styles.iconCircleMuted]}>
              <HubBuildIcon size={21} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, styles.cardTitleInline]}>
                  {screenConfig.card_build_title}
                </Text>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>
                    {screenConfig.card_build_soon_badge}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardSub}>{screenConfig.card_build_subtitle}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF7' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: '#17251E',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: '#155A38',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
    borderWidth: 0,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  heroBadge: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FEF3DD',
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: '#E4F3EA',
    lineHeight: 19,
    marginBottom: 16,
  },
  heroLoader: { alignSelf: 'flex-start' },
  heroSavingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroSavingsText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#17251E',
  },
  metricsErrorRow: {
    alignSelf: 'flex-start',
    gap: 4,
  },
  metricsErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#D1FAE5',
    lineHeight: 16,
  },
  metricsRetryText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#F59E0B',
  },
  actionCardsWrap: { gap: 12 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 0,
  },
  actionCardTall: {
    paddingVertical: 18,
  },
  actionCardDisabled: { opacity: 0.9 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleSoft: {
    backgroundColor: '#EAF5EE',
  },
  iconCircleMuted: {
    backgroundColor: '#F3F4F6',
  },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    ...FONTS.balooBold,
    fontSize: 15.5,
    color: '#17251E',
    marginBottom: 2,
  },
  cardTitleInline: { marginBottom: 0 },
  cardSub: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    color: '#6B7772',
    lineHeight: 17,
  },
  soonBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soonBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.4,
  },
  errorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: '#6B7772',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1E7A46',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
