/**
 * TravelInsuranceScreen – Digital Travel Health Insurance & Claims Assistant.
 * Stores traveler's international medical policy card, 24/7 worldwide emergency hotline,
 * and step-by-step documentation checklist for filing out-of-country medical claims.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelInsurancePolicy } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { TravelService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAuth } from '../../context/AuthContext';

export default function TravelInsuranceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [policy, setPolicy] = useState<TravelInsurancePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const loadPolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getTravelInsurance();
      setPolicy(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve travel insurance policy.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCallAssistance = () => {
    if (!policy) return;
    const phone = policy.emergencyAssistancePhone.replace(/\s+/g, '');
    Alert.alert(
      'Call 24/7 Travel Assistance?',
      `Dial ${policy.provider} worldwide hotline at ${policy.emergencyAssistancePhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Retrieving policy details…</Text>
      </View>
    );
  }

  if (error || !policy) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          title="Insurance Policy Unavailable"
          message={error || 'Failed to retrieve travel insurance.'}
          onRetry={loadPolicy}
        />
      </View>
    );
  }

  const travelerName = user?.name || (policy as any).insuredName || 'Ayush Modi';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 20) + Spacing[2] },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Travel Insurance</Text>
          <Text style={styles.headerSub}>Policy vault & claim assistant</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Digital Policy Card */}
        <View style={styles.policyCard}>
          {/* Card Top */}
          <View style={styles.policyTopRow}>
            <View style={styles.policyBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
              <Text style={styles.policyBadgeText}>ACTIVE WORLDWIDE COVERAGE</Text>
            </View>
            <Ionicons name="airplane" size={18} color="rgba(255,255,255,0.7)" />
          </View>

          {/* Provider & Policy # */}
          <Text style={styles.providerName}>{policy.provider}</Text>
          <Text style={styles.policyNumber}>Policy #{policy.policyNumber}</Text>

          {/* Details Row */}
          <View style={styles.policyDetailsRow}>
            <View>
              <Text style={styles.detailLabel}>INSURED TRAVELER</Text>
              <Text style={styles.detailValue}>{travelerName}</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>VALID THROUGH</Text>
              <Text style={styles.detailValue}>{policy.validUntil}</Text>
            </View>
          </View>

          {/* Coverage Limit */}
          <View style={styles.coverageBox}>
            <Text style={styles.coverageLabel}>MAXIMUM MEDICAL EMERGENCY LIMIT</Text>
            <Text style={styles.coverageValue}>{policy.coverageLimit}</Text>
          </View>
        </View>

        {/* 24/7 International Emergency Assistance Button */}
        <TouchableOpacity
          style={styles.assistanceBtn}
          onPress={handleCallAssistance}
          activeOpacity={0.88}
        >
          <View style={styles.assistanceIconWrap}>
            <Ionicons name="call" size={20} color={Colors.white} />
          </View>
          <View style={styles.assistanceTextWrap}>
            <Text style={styles.assistanceTitle}>Call 24/7 Global Medical Assistance</Text>
            <Text style={styles.assistanceSub}>
              {policy.emergencyAssistancePhone} (Toll-Free / Collect)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>

        {/* Claim Checklist Section */}
        <View style={styles.checklistSection}>
          <View style={styles.checklistHeader}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary[500]} />
            <Text style={styles.checklistTitle}>
              Out-of-Country Medical Claim Checklist
            </Text>
          </View>
          <Text style={styles.checklistIntro}>
            To guarantee 100% reimbursement by your travel insurer, collect these documents
            before leaving the clinic or hospital:
          </Text>

          {policy.claimChecklist.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.checkItem,
                  isChecked && styles.checkItemDone,
                ]}
                onPress={() => toggleCheck(idx)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked && styles.checkboxActive,
                  ]}
                >
                  {isChecked && (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.checkItemText,
                    isChecked && styles.checkItemTextDone,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pro-Tip Box */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={Colors.sage.main} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Travel Doctor Pro-Tip</Text>
            <Text style={styles.tipDesc}>
              Ask the foreign doctor for a copy of the diagnostic notes written in English.
              Most international hospitals in Spain, France, Japan, and Germany have bilingual
              medical liaisons to assist travelers upon request.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  scroll: {
    paddingHorizontal: Spacing[4],
  },

  // Policy Card
  policyCard: {
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[5],
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  policyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  policyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  policyBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: 0.6,
  },
  providerName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  policyNumber: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: Spacing[4],
  },
  policyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: Spacing[3],
    marginBottom: Spacing[3],
  },
  detailLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  coverageBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
  },
  coverageLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coverageValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: '#38BDF8',
  },

  // Assistance Hotline Button
  assistanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  assistanceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistanceTextWrap: {
    flex: 1,
  },
  assistanceTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  assistanceSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // Checklist
  checklistSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  checklistTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  checklistIntro: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    lineHeight: 17,
    marginBottom: Spacing[3],
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  checkItemDone: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: Colors.sage.main,
    borderColor: Colors.sage.main,
  },
  checkItemText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[800],
    lineHeight: 17,
  },
  checkItemTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[400],
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.sage.light,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    lineHeight: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
});
