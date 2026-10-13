import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export interface TermsPrivacyModalProps {
  visible: boolean;
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export default function TermsPrivacyModal({
  visible,
  initialTab = 'terms',
  onClose,
}: TermsPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Sheet Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Legal & Policies</Text>
              <Text style={styles.headerSubtitle}>EVER & EVER MERCHANT</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'terms' && styles.tabItemActive]}
              onPress={() => setActiveTab('terms')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'terms' && styles.tabTextActive,
                ]}
              >
                Terms & Conditions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'privacy' && styles.tabItemActive]}
              onPress={() => setActiveTab('privacy')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'privacy' && styles.tabTextActive,
                ]}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {activeTab === 'terms' ? (
              <View style={styles.policyBlock}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>
                    Effective: Jan 1, 2026 • Updated: Sep 26, 2026
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
                <Text style={styles.bodyText}>
                  By downloading, registering, or using EVER (Customer App) or EVER MERCHANT (Partner App), you agree to be legally bound by these Terms and Conditions. If you do not agree, please discontinue using the service immediately.
                </Text>

                <Text style={styles.sectionHeading}>2. Eligibility & Account Security</Text>
                <Text style={styles.bodyText}>
                  • You must be at least 18 years of age to place grocery orders or register a partner store.{"\n"}
                  • Accounts are authenticated securely via SMS One-Time Passwords (OTP).{"\n"}
                  • You are responsible for all actions conducted under your account.
                </Text>

                <Text style={styles.sectionHeading}>3. Marketplace & Store Operations</Text>
                <Text style={styles.bodyText}>
                  EVER is a technology marketplace connecting customers with verified local merchant grocery stores. While we enforce strict quality benchmarks and merchant KYC compliance, goods and produce are stocked and packed by independent local merchant partners.
                </Text>

                <Text style={styles.sectionHeading}>4. Orders, Pricing & Minimum Order Limit</Text>
                <Text style={styles.bodyText}>
                  • Prices comply with Legal Metrology Maximum Retail Price (MRP) guidelines and may include promotional store discounts.{"\n"}
                  • Orders are subject to a store Minimum Order Limit (displayed at checkout) to ensure viable local delivery economics.{"\n"}
                  • Items in custom monthly baskets and One-Click Carts are fulfilled based on real-time store inventory.
                </Text>

                <Text style={styles.sectionHeading}>5. Delivery & Geolocation Policy</Text>
                <Text style={styles.bodyText}>
                  • Deliveries are fulfilled within serviceable postal PIN codes and designated delivery zones.{"\n"}
                  • Transparent delivery charges may be calculated based on road distance and chosen delivery time slots.{"\n"}
                  • Customers are responsible for providing complete address and landmark details.
                </Text>

                <Text style={styles.sectionHeading}>6. Payments & Billing</Text>
                <Text style={styles.bodyText}>
                  • Cash on Delivery (COD) and secure digital UPI payments are supported.{"\n"}
                  • An itemized digital invoice with applicable taxes (GST) is provided for every completed order.{"\n"}
                  • Any failed digital payment deducted by banks is auto-reversed within 3 to 7 working banking days.
                </Text>

                <Text style={styles.sectionHeading}>7. Cancellation, Returns & Refunds</Text>
                <Text style={styles.bodyText}>
                  • Orders may be cancelled free of cost prior to store packaging and dispatch.{"\n"}
                  • Perishable and grocery goods may be inspected at delivery; damaged, expired, or incorrect items can be returned at the doorstep.{"\n"}
                  • Approved refunds for prepaid orders are credited back to the source account within 3 to 5 business days.
                </Text>

                <Text style={styles.sectionHeading}>8. Merchant Partner Obligations (EVER MERCHANT)</Text>
                <Text style={styles.bodyText}>
                  Partner store owners agree to maintain valid FSSAI licenses, comply with food safety standards, provide genuine products, and fulfill orders with proper sanitary packaging.
                </Text>

                <Text style={styles.sectionHeading}>9. Account & Data Deletion</Text>
                <Text style={styles.bodyText}>
                  Users have the absolute right to delete their account at any time via Account &gt; Edit Profile &gt; Delete Account, or by emailing monthlygrocery7@gmail.com. Data is permanently purged within 48 hours.
                </Text>

                <Text style={styles.sectionHeading}>10. Governing Law & Jurisdiction</Text>
                <Text style={styles.bodyText}>
                  These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the competent courts in Pune, Maharashtra, India.
                </Text>

                <View style={styles.contactCard}>
                  <Text style={styles.contactTitle}>Grievance & Legal Contact</Text>
                  <Text style={styles.contactText}>EVER Support Team</Text>
                  <Text style={styles.contactText}>Email: founder@monthlygrocery.in</Text>
                  <Text style={styles.contactText}>Helpline: +91 7758885145</Text>
                  <Text style={styles.contactText}>Operations: Pune, Maharashtra, India</Text>
                </View>
              </View>
            ) : (
              <View style={styles.policyBlock}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>
                    Effective: Jan 1, 2026 • Updated: Sep 26, 2026
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>1. Introduction & Scope</Text>
                <Text style={styles.bodyText}>
                  This Privacy Policy describes how EVER and EVER MERCHANT ("we", "us", or "our") collect, use, store, share, and protect your personal information when you use our mobile applications and grocery delivery services.
                </Text>

                <Text style={styles.sectionHeading}>2. Information We Collect</Text>
                <Text style={styles.bodyText}>
                  👤 <Text style={styles.boldText}>Personal Account Information:</Text> Full Name, Mobile Phone Number, Delivery Address, Flat/House Number, Landmark, and optional Email Address for verification and order dispatch.{"\n\n"}
                  📍 <Text style={styles.boldText}>Location & GPS Data:</Text> Precise and approximate coordinates and PIN code to find nearby stores, compute delivery distance, and enable navigation.{"\n\n"}
                  🛒 <Text style={styles.boldText}>Order Details:</Text> Items purchased, monthly grocery baskets, delivery slot history, and payment method identifiers.{"\n\n"}
                  📷 <Text style={styles.boldText}>Merchant Documents:</Text> Shop registration, Aadhaar, and FSSAI certificates strictly for merchant business KYC compliance.
                </Text>

                <View style={styles.highlightBox}>
                  <Text style={styles.highlightTitle}>📍 Prominent Disclosure: Location Data Usage</Text>
                  <Text style={styles.highlightBody}>
                    Our applications access location data only when you actively use features requiring geographic precision:{"\n"}
                    • Nearby Store Discovery by residential PIN code.{"\n"}
                    • Delivery Distance Calculation based on road routes.{"\n"}
                    • Order Navigation for accurate delivery fulfillment.{"\n\n"}
                    * Location data is never shared with third-party advertisers or data brokers.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>3. How We Use Your Information</Text>
                <Text style={styles.bodyText}>
                  • Authentication & Security: Secure OTP verification via SMS.{"\n"}
                  • Order Fulfillment: Packing and dispatching grocery items directly to your address.{"\n"}
                  • Customer Support: Resolving inquiries, refunds, and delivery schedule updates.{"\n"}
                  • Service Improvements: Optimizing stock availability and app performance.
                </Text>

                <Text style={styles.sectionHeading}>4. Third-Party Service Providers</Text>
                <Text style={styles.bodyText}>
                  We work with secure infrastructure partners:{"\n"}
                  • Google Maps Platform (Address geocoding & mapping){"\n"}
                  • Amazon Web Services (AWS EC2, RDS, S3 for encrypted cloud storage){"\n"}
                  • 2Factor SMS Gateway (Transactional OTP messages){"\n\n"}
                  ✓ We do NOT sell, rent, or trade your personal data to external marketing agencies.
                </Text>

                <Text style={styles.sectionHeading}>5. Data Security & Retention</Text>
                <Text style={styles.bodyText}>
                  All data in transit is protected using TLS/HTTPS 256-bit encryption. Data is stored in secure, restricted-access databases and retained only as long as necessary for order records and tax obligations.
                </Text>

                <Text style={styles.sectionHeading}>6. Account & Data Deletion</Text>
                <Text style={styles.bodyText}>
                  In accordance with Google Play User Data Policies, every user has the absolute right to request deletion of their account:{"\n"}
                  • In-App: Go to Account Tab &gt; Edit Profile &gt; Delete Account.{"\n"}
                  • Email Request: Email monthlygrocery7@gmail.com with subject "Account Deletion Request".{"\n\n"}
                  All personal identifiers and active sessions will be purged within 48 hours.
                </Text>

                <Text style={styles.sectionHeading}>7. Children's Privacy</Text>
                <Text style={styles.bodyText}>
                  Our services are intended for adults aged 18 and older managing household purchases. We do not knowingly collect information from children under 13.
                </Text>

                <View style={styles.contactCard}>
                  <Text style={styles.contactTitle}>Contact & Grievance Officer</Text>
                  <Text style={styles.contactText}>EVER / Monthly Grocery Support Team</Text>
                  <Text style={styles.contactText}>Email: founder@monthlygrocery.in</Text>
                  <Text style={styles.contactText}>Helpline: +91 7758885145</Text>
                  <Text style={styles.contactText}>Operations: Pune, Maharashtra, India</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Close Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCDAD4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.ink900,
    lineHeight: 24,
  },
  headerSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink700,
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FAF9F5',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    gap: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE8E1',
  },
  tabItemActive: {
    backgroundColor: COLORS.green700,
  },
  tabText: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink700,
  },
  tabTextActive: {
    ...FONTS.muktaSemiBold,
    color: '#FFFFFF',
  },
  scrollBody: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  policyBlock: {
    gap: 12,
  },
  metaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: '#D4EAD9',
    marginBottom: 4,
  },
  metaBadgeText: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.green700,
  },
  sectionHeading: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    color: COLORS.ink900,
    marginTop: 8,
  },
  bodyText: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink700,
    lineHeight: 20,
  },
  boldText: {
    ...FONTS.muktaSemiBold,
    color: COLORS.ink900,
  },
  highlightBox: {
    backgroundColor: '#F0F9F4',
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.green700,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  highlightTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.green900,
    marginBottom: 4,
  },
  highlightBody: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink700,
    lineHeight: 18,
  },
  contactCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  contactTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
    marginBottom: 4,
  },
  contactText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink700,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  actionButton: {
    backgroundColor: COLORS.green700,
    height: 46,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
