import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';

export default function LandingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8ED" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>MonthlyGrocery</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚡ Now delivering Pan India</Text>
          </View>

          <Text style={styles.heroTitle}>
            Ghar ka <Text style={styles.highlightText}>poora</Text>{"\n"}mahine ka kirana.
          </Text>

          <Text style={styles.heroDesc}>
            Aata, chawal, dal, tel, ghee, chai, masale, sabun —{" "}
            <Text style={styles.boldText}>poora mahine ka saamaan</Text>, sealed packs mein, aapke{" "}
            <Text style={styles.brandText}>ghar par 4 ghante mein</Text>. Har order par upto 20% ki bachat.
          </Text>

          {/* CTA Buttons */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Login', { role: 'consumer' })}
          >
            <Text style={styles.ctaButtonText}>Start Shopping ➔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => navigation.navigate('Login', { role: 'admin' })}
          >
            <Text style={styles.secondaryCtaText}>Merchant/Admin Login</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🚚</Text>
            <Text style={styles.statLabel}>4-Hour Delivery</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏷️</Text>
            <Text style={styles.statLabel}>Upto 20% OFF</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔒</Text>
            <Text style={styles.statLabel}>OTP Login</Text>
          </View>
        </View>

        {/* Floating Stat Info Card */}
        <View style={styles.statBox}>
          <View style={styles.statBoxIcon}>
            <Text style={{ fontSize: 24 }}>🛒</Text>
          </View>
          <View>
            <Text style={styles.statBoxLabel}>MINIMUM ORDER</Text>
            <Text style={styles.statBoxVal}>₹2,500</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ 4.9/5</Text>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>SIRF 3 STEPS</Text>
          <Text style={styles.sectionTitle}>Kaise kaam karta hai?</Text>

          <View style={styles.stepCard}>
            <View style={[styles.stepIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.stepEmoji}>🛒</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>1. Cart mein daalo</Text>
              <Text style={styles.stepDesc}>500+ SKUs. Atta, dal, ghee, sabun — sab kuch select karo.</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={[styles.stepIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.stepEmoji}>🕐</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>2. Slot chuno</Text>
              <Text style={styles.stepDesc}>Agle 7 din mein koi bhi 4-ghante ka slot. Ham time pe pahunchte hain.</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={[styles.stepIconContainer, { backgroundColor: '#FCE7F3' }]}>
              <Text style={styles.stepEmoji}>📦</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>3. Unpack & muskurao</Text>
              <Text style={styles.stepDesc}>Tin cans, bottles and sealed bags deliver honge direct aapki rasoi tak.</Text>
            </View>
          </View>
        </View>

        {/* Testimonials Card */}
        <View style={styles.testimonialCard}>
          <Text style={styles.testimonialSubtitle}>FAMILIES KA PYAAR</Text>
          <Text style={styles.testimonialText}>
            &ldquo;Kirana ki tension khatam. Har mahine paisa bhi bacha, aur market jaane ka time bhi.&rdquo;
          </Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarText}>P</Text>
            </View>
            <View>
              <Text style={styles.authorName}>Priya M., Andheri</Text>
              <Text style={styles.authorDesc}>Since 2025 · 4 logon ka ghar</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  signInBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: '#22C55E',
  },
  signInBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1EAD8',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 15,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B1220',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0B1220',
    lineHeight: 42,
    letterSpacing: -1,
  },
  highlightText: {
    color: '#22C55E',
  },
  heroDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 15,
    marginBottom: 25,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0B1220',
  },
  brandText: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  ctaButton: {
    backgroundColor: '#22C55E',
    width: '100%',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryCta: {
    width: '100%',
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B1220',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  secondaryCtaText: {
    color: '#0B1220',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  statBox: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  statBoxIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  statBoxVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  ratingBadge: {
    marginLeft: 'auto',
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22C55E',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 5,
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  stepDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  testimonialCard: {
    backgroundColor: '#22C55E',
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  testimonialSubtitle: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  testimonialText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginVertical: 15,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 15,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  authorName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  authorDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 1,
  },
});
