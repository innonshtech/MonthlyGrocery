import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const FAQS = [
  {
    q: 'Where do you deliver?',
    a: 'We currently deliver across Pune (Kothrud, Baner, Aundh, Hinjewadi, Wakad, Viman Nagar) with expanding coverage across Maharashtra.'
  },
  {
    q: 'How does the ₹2,000 minimum work?',
    a: 'To provide direct-from-brand wholesale pricing, maximum savings, and free scheduled doorstep delivery, all monthly baskets require a minimum value of ₹2,000.'
  },
  {
    q: 'Can I edit or cancel a placed order?',
    a: 'Yes, you can edit item quantities or cancel your order anytime before the local hub begins packing your basket.'
  },
  {
    q: 'How do subscriptions & baskets work?',
    a: 'You can tap "Save as a basket" on any active cart to create a reusable template. Next month, open Saved Baskets and reorder in 1 tap with verified live rates.'
  },
  {
    q: 'Delivery slots and timing',
    a: 'We offer planned 3-hour delivery windows: Morning (7:00 AM - 10:00 AM), Afternoon (12:00 PM - 3:00 PM), and Evening (6:00 PM - 9:00 PM).'
  }
];

export default function HelpSupportScreen({ navigation }: any) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  const handleChatWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hi%20MonthlyGrocery%20Support').catch(() => {
      Alert.alert('Support Chat', 'Connecting with customer care executive...');
    });
  };

  const handleCallUs = () => {
    Linking.openURL('tel:+919876543210').catch(() => {
      Alert.alert('Helpline', 'Call our support team at +91 98765 43210 (7:00 AM - 10:00 PM daily).');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & support</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 2 Quick Contact Cards */}
        <View style={styles.contactRow}>
          {/* Chat with us */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleChatWhatsApp}
            activeOpacity={0.85}
          >
            <View style={styles.contactIconBox}>
              <AppIcon name="help" size={20} color={COLORS.green700} />
            </View>
            <Text style={styles.contactTitle}>Chat with us</Text>
            <Text style={styles.contactSub}>Avg reply: &lt; 5 min</Text>
          </TouchableOpacity>

          {/* Call us */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleCallUs}
            activeOpacity={0.85}
          >
            <View style={styles.contactIconBox}>
              <AppIcon name="phone" size={20} color={COLORS.green700} />
            </View>
            <Text style={styles.contactTitle}>Call us</Text>
            <Text style={styles.contactSub}>7:00 AM - 10:00 PM daily</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionHeading}>FREQUENTLY ASKED QUESTIONS</Text>

        <View style={styles.faqsCard}>
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedIdx === idx;
            const isLast = idx === FAQS.length - 1;

            return (
              <View key={idx} style={[styles.faqItem, !isLast && styles.faqBorder]}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleFaq(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  <Text style={[styles.faqChevron, isExpanded && styles.faqChevronRotated]}>
                    {isExpanded ? '⌃' : '⌄'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <Text style={styles.faqAnswerText}>{faq.a}</Text>
                )}
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
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
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
    borderWidth: 1,
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 11,
    color: COLORS.ink500,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  faqsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
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
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink900,
    paddingRight: 10,
  },
  faqChevron: {
    fontSize: 16,
    color: COLORS.ink500,
    fontWeight: 'bold',
  },
  faqChevronRotated: {
    color: COLORS.green700,
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: COLORS.ink500,
    lineHeight: 18,
    marginTop: 8,
    paddingTop: 4,
  },
});
