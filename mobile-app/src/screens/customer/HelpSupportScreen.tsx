import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert
} from 'react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    category: 'Orders & Limits',
    question: 'What is the ₹2,500 minimum monthly order limit?',
    answer: 'MonthlyGrocery operates on a planned monthly restocking model. By delivering full household grocery baskets in single batches instead of multiple daily 10-minute micro-orders, we save heavily on logistics and pass maximum wholesale savings and free delivery directly to you.'
  },
  {
    id: '2',
    category: 'Orders & Limits',
    question: 'How does the "One-Click Monthly Cart" work?',
    answer: 'Our smart algorithm reviews your previous monthly order history and household size (2, 4, 6+ members) to automatically populate a balanced basket of daily essentials like Atta, Rice, Cooking Oil, Pulses, Ghee, and Spices with a single tap.'
  },
  {
    id: '3',
    category: 'Delivery',
    question: 'How does scheduled monthly delivery work?',
    answer: 'During checkout, you can select your preferred delivery date (Tomorrow, Day After, or Next Monday) along with a convenient time window (Morning 8 AM - 12 PM, Afternoon 12 PM - 4 PM, or Evening 4 PM - 8 PM).'
  },
  {
    id: '4',
    category: 'Delivery',
    question: 'What are the delivery charges?',
    answer: 'Delivery is 100% FREE for all standard monthly orders above ₹1,000. Orders below ₹1,000 carry a nominal ₹49 delivery charge.'
  },
  {
    id: '5',
    category: 'Payments & Refunds',
    question: 'What payment options are supported?',
    answer: 'We support Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking.'
  },
  {
    id: '6',
    category: 'Payments & Refunds',
    question: 'What if an item is damaged or missing?',
    answer: 'You can check your order upon delivery. If any item is missing or damaged, contact our WhatsApp support within 24 hours for an instant replacement or full refund.'
  }
];

export default function HelpSupportScreen({ navigation }: any) {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('1');

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/918830480015?text=Hi%20MonthlyGrocery%20Support%2C%20I%20need%20assistance%20with%20my%20order.').catch(() => {
      Alert.alert('Support Contact', 'WhatsApp: +91 8830480015\nEmail: support@monthlygrocery.in');
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+918830480015').catch(() => {
      Alert.alert('Customer Care', 'Helpline: +91 8830480015 (9:00 AM - 8:00 PM)');
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@monthlygrocery.in?subject=Customer%20Support%20Inquiry').catch(() => {
      Alert.alert('Email Support', 'Please email us at support@monthlygrocery.in');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Contact Us Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Fast Assistance?</Text>
          <Text style={styles.contactSubtitle}>Our support team is available everyday from 9:00 AM to 8:00 PM.</Text>

          <View style={styles.channelRow}>
            <TouchableOpacity style={[styles.channelBtn, styles.waBtn]} onPress={handleWhatsAppSupport}>
              <Text style={styles.channelEmoji}>💬</Text>
              <Text style={styles.channelLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.channelBtn, styles.callBtn]} onPress={handleCallSupport}>
              <Text style={styles.channelEmoji}>📞</Text>
              <Text style={styles.channelLabel}>Call Us</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.channelBtn, styles.mailBtn]} onPress={handleEmailSupport}>
              <Text style={styles.channelEmoji}>✉️</Text>
              <Text style={styles.channelLabel}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>

        {FAQS.map((faq) => {
          const isExpanded = expandedFaqId === faq.id;
          return (
            <TouchableOpacity
              key={faq.id}
              style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
              onPress={() => setExpandedFaqId(isExpanded ? null : faq.id)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionActive]}>{faq.question}</Text>
                <Text style={styles.faqToggleText}>{isExpanded ? '▲' : '▼'}</Text>
              </View>
              {isExpanded && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  contactSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  channelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  callBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  mailBtn: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  channelEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqCardExpanded: {
    borderColor: '#22C55E',
    backgroundColor: '#F8FAFC',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    paddingRight: 10,
    lineHeight: 18,
  },
  faqQuestionActive: {
    color: '#16A34A',
    fontWeight: 'bold',
  },
  faqToggleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  faqAnswer: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    lineHeight: 18,
  },
});
