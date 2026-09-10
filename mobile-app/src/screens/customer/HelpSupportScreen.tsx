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
import { SvgXml } from 'react-native-svg';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import AppLoader from '../../components/AppLoader';
import { FONTS } from '../../constants/theme';
import {
  HelpSupportScreenConfig,
  buildTelUrl,
  buildWhatsAppUrl,
  fetchHelpSupportScreenConfig,
  formatHelpTemplate,
} from '../../services/helpSupportApi';

const SCREEN_BG = '#F8FAF8';

const CHAT_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CALL_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CHEVRON_DOWN_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
          <AppLoader message="Loading support..." />
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
          <CheckoutBackIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title || 'Help & support'}</Text>
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
            <View style={styles.chatIconBox}>
              <SvgXml xml={CHAT_XML} width={20} height={20} />
            </View>
            <Text style={styles.contactTitle}>{screenConfig.chat_title || 'Chat with us'}</Text>
            <Text style={styles.contactSub}>{screenConfig.chat_subtitle || 'Replies in ~2 min'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleCallUs}
            activeOpacity={0.85}
          >
            <View style={styles.callIconBox}>
              <SvgXml xml={CALL_XML} width={20} height={20} />
            </View>
            <Text style={styles.contactTitle}>{screenConfig.call_title || 'Call us'}</Text>
            <Text style={styles.contactSub}>{screenConfig.call_subtitle || '8 AM – 10 PM daily'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>{screenConfig.faq_section_label || 'FREQUENT QUESTIONS'}</Text>

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
                    <SvgXml xml={CHEVRON_DOWN_XML} width={18} height={18} />
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
    backgroundColor: '#1E7A46',
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
    paddingBottom: 36,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  chatIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  callIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FDEFD8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  contactSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
    marginTop: 4,
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
  faqsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  faqItem: {
    paddingVertical: 16,
  },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#1E293B',
    paddingRight: 12,
  },
  chevronWrap: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswerText: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    marginTop: 10,
    paddingTop: 2,
  },
});
