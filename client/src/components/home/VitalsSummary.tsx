/**
 * VitalsSummary – Health.UI signature vitals cards with coral heart rate waveform,
 * mint oxygen levels, and body activity stats.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export interface UserVitalsData {
  heartRate?: string | number | null;
  bloodPressure?: string | null;
  bloodOxygen?: string | number | null;
  bloodGroup?: string | null;
  recordedAt?: string | null;
}

interface VitalsSummaryProps {
  vitals?: UserVitalsData | null;
  onPressVital?: (vital: string) => void;
}

export const VitalsSummary: React.FC<VitalsSummaryProps> = ({ vitals, onPressVital }) => {
  const hasVitals = Boolean(
    vitals && (vitals.heartRate || vitals.bloodOxygen || vitals.bloodPressure)
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Daily Vitals</Text>
        <TouchableOpacity onPress={() => onPressVital?.('all')}>
          <Text style={styles.seeAll}>{hasVitals ? 'History' : '+ Log Vitals'}</Text>
        </TouchableOpacity>
      </View>

      {!hasVitals ? (
        <View style={styles.emptyContainer}>
          <TouchableOpacity
            style={styles.emptyCard}
            activeOpacity={0.85}
            onPress={() => onPressVital?.('log')}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons name="pulse" size={24} color={Colors.coral.main} />
            </View>
            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No Vitals Recorded Yet</Text>
              <Text style={styles.emptySub}>
                Tap to record your pulse, blood oxygen, and blood pressure, or connect a health sensor.
              </Text>
            </View>
            <View style={styles.logBtnSmall}>
              <Text style={styles.logBtnText}>+ Log</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Heart Rate Card */}
          {vitals?.heartRate ? (
            <TouchableOpacity
              style={[styles.vitalCard, styles.vitalCardHeart]}
              activeOpacity={0.88}
              onPress={() => onPressVital?.('heart_rate')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.coral.light }]}>
                  <Ionicons name="heart" size={16} color={Colors.coral.main} />
                </View>
                <Text style={styles.vitalTag}>Recorded</Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>
                  {String(vitals.heartRate).replace(/[^0-9]/g, '') || String(vitals.heartRate)}
                </Text>
                <Text style={styles.metricUnit}>bpm</Text>
              </View>
              <Text style={styles.vitalLabel}>Heart Rate</Text>

              {/* Pulse waveform */}
              <View style={styles.waveformContainer}>
                <View style={[styles.waveBar, { height: 8, backgroundColor: Colors.coral.light }]} />
                <View style={[styles.waveBar, { height: 16, backgroundColor: Colors.coral.main }]} />
                <View style={[styles.waveBar, { height: 26, backgroundColor: Colors.coral.main }]} />
                <View style={[styles.waveBar, { height: 12, backgroundColor: Colors.coral.light }]} />
                <View style={[styles.waveBar, { height: 22, backgroundColor: Colors.coral.main }]} />
                <View style={[styles.waveBar, { height: 10, backgroundColor: Colors.coral.light }]} />
                <View style={[styles.waveBar, { height: 18, backgroundColor: Colors.coral.main }]} />
              </View>
            </TouchableOpacity>
          ) : null}

          {/* SpO2 Card */}
          {vitals?.bloodOxygen ? (
            <TouchableOpacity
              style={styles.vitalCard}
              activeOpacity={0.88}
              onPress={() => onPressVital?.('oxygen')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.mint.light }]}>
                  <Ionicons name="pulse" size={16} color={Colors.mint.main} />
                </View>
                <Text style={[styles.vitalTag, { color: Colors.mint.main, backgroundColor: Colors.mint.light }]}>
                  SpO2
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>
                  {String(vitals.bloodOxygen).replace(/[^0-9.]/g, '')}
                </Text>
                <Text style={styles.metricUnit}>%</Text>
              </View>
              <Text style={styles.vitalLabel}>Blood Oxygen</Text>

              <View style={styles.waveformContainer}>
                <View style={[styles.waveBar, { height: 14, backgroundColor: Colors.mint.light }]} />
                <View style={[styles.waveBar, { height: 18, backgroundColor: Colors.mint.main }]} />
                <View style={[styles.waveBar, { height: 24, backgroundColor: Colors.mint.main }]} />
                <View style={[styles.waveBar, { height: 20, backgroundColor: Colors.mint.main }]} />
                <View style={[styles.waveBar, { height: 26, backgroundColor: Colors.mint.main }]} />
                <View style={[styles.waveBar, { height: 16, backgroundColor: Colors.mint.light }]} />
                <View style={[styles.waveBar, { height: 22, backgroundColor: Colors.mint.main }]} />
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Blood Pressure Card */}
          {vitals?.bloodPressure ? (
            <TouchableOpacity
              style={styles.vitalCard}
              activeOpacity={0.88}
              onPress={() => onPressVital?.('blood_pressure')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.primary[100] }]}>
                  <Ionicons name="speedometer" size={16} color={Colors.primary[500]} />
                </View>
                <Text style={[styles.vitalTag, { color: Colors.primary[600], backgroundColor: Colors.primary[50] }]}>
                  BP
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={[styles.metricValue, { fontSize: 20 }]}>{vitals.bloodPressure}</Text>
              </View>
              <Text style={styles.vitalLabel}>Blood Pressure</Text>

              <View style={styles.waveformContainer}>
                <View style={[styles.waveBar, { height: 10, backgroundColor: Colors.primary[200] }]} />
                <View style={[styles.waveBar, { height: 16, backgroundColor: Colors.primary[300] }]} />
                <View style={[styles.waveBar, { height: 22, backgroundColor: Colors.primary[500] }]} />
                <View style={[styles.waveBar, { height: 18, backgroundColor: Colors.primary[400] }]} />
                <View style={[styles.waveBar, { height: 24, backgroundColor: Colors.primary[500] }]} />
                <View style={[styles.waveBar, { height: 14, backgroundColor: Colors.primary[200] }]} />
                <View style={[styles.waveBar, { height: 20, backgroundColor: Colors.primary[500] }]} />
              </View>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[5],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[600],
  },
  emptyContainer: {
    paddingHorizontal: Spacing[4],
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.coral.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    lineHeight: 16,
  },
  logBtnSmall: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  logBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  vitalCard: {
    width: 146,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  vitalCardHeart: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.coral.main,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalTag: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.coral.main,
    backgroundColor: Colors.coral[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: Spacing[1],
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  metricUnit: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
  vitalLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[400],
    marginBottom: Spacing[2],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 28,
    paddingTop: 4,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
  },
});

export default VitalsSummary;
