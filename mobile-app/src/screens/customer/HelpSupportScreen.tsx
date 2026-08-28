import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import {
  AccountChevronIcon,
  AccountMenuHelpIcon,
  HelpSupportPhoneIcon,
} from '../../components/account/AccountHubIcons';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  HelpSupportScreenConfig,
  buildTelUrl,
  buildWhatsAppUrl,
  fetchHelpSupportScreenConfig,
  formatHelpTemplate,
} from '../../services/helpSupportApi';

const SCREEN_BG = '#FBFAF6';

export default function HelpSupportScreen({ navigation }: any) {
  const [screenConfig, setScreenConfig] = useState<HelpSupportScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchHelpSupportScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig]),
  );

  const handleChatWhatsApp = () => {
    if (!screenConfig) return;
    const url = buildWhatsAppUrl(
      screenConfig.whatsapp_phone,
      screenConfig.whatsapp_message,
    );
    Linking.openURL(url).catch(() => {
      Alert.alert(
        screenConfig.chat_fallback_alert_title,
        screenConfig.chat_fallback_alert_message,
      );
    });
  };

  const handleCallUs = () => {
    if (!screenConfig) return;
    Linking.openURL(buildTelUrl(screenConfig.phone_number)).catch(() => {
      const fallbackMessage = formatHelpTemplate(
        screenConfig.call_fallback_message_template,
        {
          phone: screenConfig.phone_number,
          hours: screenConfig.call_subtitle,
        },
      );
      Alert.alert(
        screenConfig.call_fallback_alert_title,
        fallbackMessage || screenConfig.call_fallback_alert_message,
      );
    });
  };

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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

  const faqs = screenConfig.faqs || [];

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
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleChatWhatsApp}
            activeOpacity={0.85}
          >
            <View style={styles.contactIconBox}>
              <AccountMenuHelpIcon size={20} />
            </View>
            <Text style={styles.contactTitle}>{screenConfig.chat_title}</Text>
            <Text style={styles.contactSub}>{screenConfig.chat_subtitle}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleCallUs}
            activeOpacity={0.85}
          >
            <View style={styles.contactIconBox}>
              <HelpSupportPhoneIcon size={20} />
            </View>
            <Text style={styles.contactTitle}>{screenConfig.call_title}</Text>
            <Text style={styles.contactSub}>{screenConfig.call_subtitle}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>{screenConfig.faq_section_label}</Text>

        <View style={styles.faqsCard}>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedId === faq.id;
            const isLast = idx === faqs.length - 1;

            return (
              <View key={faq.id} style={[styles.faqItem, !isLast && styles.faqBorder]}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <View
                    style={[
                      styles.chevronWrap,
                      isExpanded && styles.chevronExpanded,
                    ]}
                  >
                    <AccountChevronIcon
                      size={18}
                      color={isExpanded ? COLORS.green700 : COLORS.ink500}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && faq.answer ? (
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
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
    paddingTop: 16,
    paddingBottom: 36,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactTitle: {
    ...FONTS.muktaBold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
    marginBottom: 2,
  },
  contactSub: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.ink500,
  },
  sectionHeading: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  faqsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
  },
  faqItem: {
    paddingVertical: 14,
  },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestionText: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.ink900,
  },
  chevronWrap: {
    transform: [{ rotate: '90deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '-90deg' }],
  },
  faqAnswerText: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.ink500,
    marginTop: 8,
    paddingTop: 4,
  },
});
