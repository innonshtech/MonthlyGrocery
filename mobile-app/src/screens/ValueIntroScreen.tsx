import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Monthly planning, not instant deliveries.',
    desc: 'Why order daily and pay multiple delivery fees? Plan your entire month\'s groceries once and get them delivered in bulk packages.',
    emoji: '📅',
    color: '#DCFCE7',
  },
  {
    title: 'Consolidated savings and bulk discounts.',
    desc: 'Unlock wholesale-like prices and deep discounts when building a monthly basket of ₹2,500+. Save up to 20% compared to local supermarkets.',
    emoji: '🏷️',
    color: '#FEF3C7',
  },
  {
    title: 'Smart helpers for easy repeat orders.',
    desc: 'Use One-Click Monthly Cart generation or Copy Last Month\'s Cart to build your monthly list in under 10 seconds. No item forgotten.',
    emoji: '💡',
    color: '#FCE7F3',
  }
];

export default function ValueIntroScreen({ navigation }: any) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('CitySelection');
    }
  };

  const handleSkip = () => {
    navigation.navigate('CitySelection');
  };

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MonthlyGrocery</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View style={[styles.emojiBg, { backgroundColor: slide.color }]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDesc}>{slide.desc}</Text>
      </View>

      {/* Footer / Controls */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlide === index ? styles.indicatorActive : styles.indicatorInactive
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentSlide === SLIDES.length - 1 ? 'Get Started ➔' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 15,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emojiBg: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emoji: {
    fontSize: 60,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B1220',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#22C55E',
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: '#E5E7EB',
  },
  nextBtn: {
    backgroundColor: '#22C55E',
    height: 52,
    width: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
