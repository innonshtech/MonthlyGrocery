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
import { useToast } from '../../context/ToastContext';
import {
  HelpSupportScreenConfig,
  buildEmailUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  fetchHelpSupportScreenConfig,
  formatHelpTemplate,
} from '../../services/helpSupportApi';

const SCREEN_BG = '#F8FAF8';

const WHATSAPP_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#1E7A46"/></svg>`;

const EMAIL_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 6l-10 7L2 6" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CALL_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CHEVRON_DOWN_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function HelpSupportScreen({ route, navigation }: any) {
  const { showToast } = useToast();
  const orderDisplayId = route?.params?.orderDisplayId;

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
    const whatsappNumber = screenConfig?.whatsapp_phone || '917758885145';
    const customMsg = orderDisplayId
      ? `Hi MonthlyGrocery Support, I need help regarding my order ${orderDisplayId}.`
      : (screenConfig?.whatsapp_message || 'Hi MonthlyGrocery Support, I need assistance with MonthlyGrocery app.');
    const url = buildWhatsAppUrl(
      whatsappNumber,
      customMsg,
    );
    Linking.openURL(url).catch(() => {
      showToast({
        type: 'info',
        title: screenConfig?.chat_fallback_alert_title || 'WhatsApp Unavailable',
        message: screenConfig?.chat_fallback_alert_message || 'Please use email or call support.',
      });
    });
  };

  const handleEmailSupport = () => {
    const email = screenConfig?.support_email || 'monthlygrocery7@gmail.com';
    const subject = orderDisplayId
      ? `Help with Order #${orderDisplayId}`
      : 'MonthlyGrocery Customer Support Request';
    const body = orderDisplayId
      ? `Hi MonthlyGrocery Team,\n\nI need help regarding my order #${orderDisplayId}.\n\nIssue Details: `
      : 'Hi MonthlyGrocery Team,\n\nI need help regarding: ';
    const url = buildEmailUrl(email, subject, body);
    Linking.openURL(url).catch(() => {
      showToast({
        type: 'info',
        title: 'Email App Unavailable',
        message: `Please email us directly at ${email}`,
      });
    });
  };

  const handleCallUs = () => {
    const phone = screenConfig?.phone_number || '+917758885145';
    Linking.openURL(buildTelUrl(phone)).catch(() => {
      const fallbackMessage = formatHelpTemplate(
        screenConfig?.call_fallback_message_template || 'Call our support team at {phone} ({hours}).',
        {
          phone: phone,
          hours: screenConfig?.call_subtitle || '7 AM – 10 PM daily',
        },
      );
      showToast({
        type: 'info',
        title: screenConfig?.call_fallback_alert_title || 'Call Support',
        message: fallbackMessage || `Call us at ${phone}`,
      });
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
        {orderDisplayId ? (
          <>
            <View style={{ flex: 1 }} />
            <View style={styles.orderPill}>
              <Text style={styles.orderPillTxt}>{orderDisplayId}</Text>
            </View>
          </>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Channels */}
        <View style={styles.contactRow}>
          {/* 1. WhatsApp Chat */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleChatWhatsApp}
            activeOpacity={0.85}
          >
            <View style={styles.chatIconBox}>
              <SvgXml xml={WHATSAPP_XML} width={22} height={22} />
            </View>
            <Text style={styles.contactTitle}>{screenConfig.chat_title || 'WhatsApp Chat'}</Text>
            <Text style={styles.contactSub}>+91 7758885145</Text>
            <Text style={styles.contactTag}>Instant · ~2 min</Text>
          </TouchableOpacity>

          {/* 2. Email Support */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleEmailSupport}
            activeOpacity={0.85}
          >
            <View style={styles.emailIconBox}>
              <SvgXml xml={EMAIL_XML} width={22} height={22} />
            </View>
            <Text style={styles.contactTitle}>{screenConfig.email_title || 'Email Support'}</Text>
            <Text style={styles.contactSub} numberOfLines={1}>monthlygrocery7@gmail.com</Text>
            <Text style={styles.contactTag}>Response in 24h</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Helpline Strip */}
        <TouchableOpacity
          style={styles.callStrip}
          onPress={handleCallUs}
          activeOpacity={0.85}
        >
          <View style={styles.callIconBox}>
            <SvgXml xml={CALL_XML} width={20} height={20} />
          </View>
          <View style={styles.callTextCol}>
            <Text style={styles.callStripTitle}>Customer Helpline: +91 7758885145</Text>
            <Text style={styles.callStripSub}>{screenConfig.call_subtitle || '7:00 AM – 10:00 PM daily'}</Text>
          </View>
        </TouchableOpacity>

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
  orderPill: {
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: '#1E7A46',
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
    marginBottom: 12,
  },
  emailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  callIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FDEFD8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  contactSub: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    lineHeight: 15,
    color: '#64748B',
    marginTop: 2,
  },
  contactTag: {
    ...FONTS.muktaSemiBold,
    fontSize: 10.5,
    color: '#1E7A46',
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  callStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  callTextCol: {
    flex: 1,
  },
  callStripTitle: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: '#1E293B',
  },
  callStripSub: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    color: '#64748B',
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
