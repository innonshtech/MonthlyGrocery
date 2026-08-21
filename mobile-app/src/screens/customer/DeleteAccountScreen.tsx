import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function DeleteAccountScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    if (!agreed) {
      Alert.alert('Required', 'Please check the confirmation box to proceed.');
      return;
    }

    setDeleting(true);
    setTimeout(async () => {
      try {
        await AsyncStorage.clear();
      } catch (err) {}
      logout();
      setDeleting(false);
      setIsDeleted(true);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         SLIDE 1: DELETE ACCOUNT CONFIRMATION (G BOTTOM 2ND IN FIGMA)
         ========================================================================= */}
      {!isDeleted ? (
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Delete account</Text>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.mainWarningText}>
              This permanently deletes your MonthlyGrocery account and all your saved data. This action cannot be undone.
            </Text>

            <Text style={styles.sectionHeading}>WHAT WILL BE DELETED:</Text>

            <View style={styles.deleteListCard}>
              {[
                'Order history & tracking',
                'Saved monthly baskets',
                'Saved addresses',
                'Coupons & rewards',
              ].map((item, idx) => (
                <View key={idx} style={styles.deleteItemRow}>
                  <Text style={styles.deleteItemBullet}>✕</Text>
                  <Text style={styles.deleteItemLabel}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Amber Warning Box */}
            <View style={styles.amberCard}>
              <Text style={styles.amberText}>
                ⚠️ Any active orders will be delivered before your account is closed.
              </Text>
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, agreed && styles.checkboxBoxChecked]}>
                {agreed && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand this is permanent and cannot be undone
              </Text>
            </TouchableOpacity>

            {/* Red Delete Button */}
            <TouchableOpacity
              style={[styles.deleteBtn, !agreed && styles.deleteBtnDisabled]}
              onPress={handleDelete}
              disabled={!agreed || deleting}
              activeOpacity={0.85}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete my account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        /* =========================================================================
           SLIDE 2: ACCOUNT DELETED SUCCESS (G BOTTOM 3RD IN FIGMA)
           ========================================================================= */
        <View style={styles.successWrap}>
          {/* Green Checkmark Circle */}
          <View style={styles.greenTickCircle}>
            <Text style={styles.greenTickSymbol}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Your account has been deleted</Text>
          <Text style={styles.successSub}>
            Your MonthlyGrocery account and all your associated data have been permanently removed. We're sorry to see you go — you're always welcome back!
          </Text>

          <View style={styles.activeOrdersNoteBox}>
            <Text style={styles.activeOrdersNoteText}>
              Active orders (if any) will still be delivered.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
            activeOpacity={0.85}
          >
            <Text style={styles.backHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  mainWarningText: {
    fontSize: 13.5,
    color: COLORS.ink700,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  deleteListCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
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
  deleteItemBullet: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
  },
  deleteItemLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  amberCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20,
  },
  amberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    lineHeight: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.ink300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxBoxChecked: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink500,
  },
  /* Success Screen */
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
  greenTickSymbol: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 19,
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
    fontSize: 12,
    fontWeight: '700',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
