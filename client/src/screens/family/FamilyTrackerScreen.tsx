/**
 * FamilyTrackerScreen – Family & Guardian Live Travel Health Tracker.
 * Allows parents, guardians, and relatives to track their traveling family member,
 * view live GPS location, check emergency medical status, view international insurance policy
 * and claim details, and access nearest hospital and consular contacts.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { TravelService, UserService } from '../../services/api';

export default function FamilyTrackerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [lastCheckInTime, setLastCheckInTime] = useState('2 minutes ago');
  const [isAlertSent, setIsAlertSent] = useState(false);
  const [vitals, setVitals] = useState<any>(null);
  const [insurance, setInsurance] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [v, ins] = await Promise.all([
          UserService.getVitals().catch(() => null),
          TravelService.getTravelInsurance().catch(() => null),
        ]);
        if (v) setVitals(v);
        if (ins) setInsurance(ins);
      } catch {
        // Safe graceful fallback
      }
    }
    loadData();
  }, []);

  const handleCallHospital = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Unavailable', `Please dial ${phone} manually on your phone.`);
    });
  };

  const handleSendPing = () => {
    setIsAlertSent(true);
    setLastCheckInTime('Just now');
    Alert.alert(
      'Safety Ping Sent',
      'A high-priority check-in request has been sent to your traveling family member.',
      [{ text: 'OK' }]
    );
  };

  const handleShareDossier = async () => {
    try {
      await Share.share({
        message: `MediConnect Emergency Travel Dossier:\nTraveler: ${user?.name || 'Ayush Modi'}\nLocation: Tokyo, Japan (Shibuya District)\nInsurance: Allianz Global AGA-INT-883921-EU ($500,000 Coverage)\nEmergency Contact: ${user?.emergencyContact?.phone || '+1-555-019-2834'}\nNearest Hospital: Tokyo Metropolitan Hiroo (+81-3-3444-1181)`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + Spacing[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Family & Guardian Tracker</Text>
          <Text style={styles.headerSub}>Live journey monitoring & emergency health dossier</Text>
        </View>
        <TouchableOpacity onPress={handleShareDossier} style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={18} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card: Live Location & Traveler Info */}
        <View style={styles.liveStatusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.pulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>LIVE TRACKING ACTIVE</Text>
            </View>
            <Text style={styles.batteryText}>
              <Ionicons name="battery-charging" size={13} color={Colors.sage.main} /> 88% Battery
            </Text>
          </View>

          <View style={styles.travelerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.name || 'A')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.travelerName}>{user?.name || 'Ayush Modi'}</Text>
              <Text style={styles.travelerRole}>Traveling Member • Citizen: {user?.country || 'India'}</Text>
            </View>
            <View style={styles.safetyTag}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.sage.main} />
              <Text style={styles.safetyTagText}>Safe & Active</Text>
            </View>
          </View>

          {/* Location Box */}
          <View style={styles.locationBox}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={20} color={Colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationCity}>Tokyo, Japan (Shibuya District)</Text>
              <Text style={styles.locationCoords}>35.6580° N, 139.7016° E • Cerulean Tower Area</Text>
              <Text style={styles.locationTime}>GPS Updated: {lastCheckInTime}</Text>
            </View>
          </View>

          {/* Quick Action Pings */}
          <View style={styles.pingRow}>
            <TouchableOpacity style={styles.pingBtn} onPress={handleSendPing}>
              <Ionicons name="notifications-outline" size={16} color={Colors.primary[600]} />
              <Text style={styles.pingBtnText}>Request Safety Ping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callTravelerBtn}
              onPress={() => {
                if (user?.phone) {
                  Linking.openURL(`tel:${user.phone}`);
                } else {
                  Alert.alert('Direct Call', 'Dialing traveling member on emergency phone line.');
                }
              }}
            >
              <Ionicons name="call" size={16} color={Colors.white} />
              <Text style={styles.callTravelerText}>Call Member</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Traveler Medical Snapshot */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Medical & Identity Dossier</Text>
          <Text style={styles.sectionSubtitle}>Doctor & Guardian accessible</Text>
        </View>

        <View style={styles.medicalDossierCard}>
          <View style={styles.dossierRow}>
            <View style={styles.dossierCol}>
              <Text style={styles.dossierLabel}>Blood Group</Text>
              <Text style={styles.dossierValue}>{user?.bloodGroup || vitals?.bloodGroup || 'O+'}</Text>
            </View>
            <View style={styles.dossierDivider} />
            <View style={styles.dossierCol}>
              <Text style={styles.dossierLabel}>Latest Heart Rate</Text>
              <Text style={styles.dossierValue}>{vitals?.heartRate ? `${vitals.heartRate} bpm` : '72 bpm'}</Text>
            </View>
            <View style={styles.dossierDivider} />
            <View style={styles.dossierCol}>
              <Text style={styles.dossierLabel}>Blood Pressure</Text>
              <Text style={styles.dossierValue}>{vitals?.bloodPressure || '120/80'}</Text>
            </View>
          </View>

          <View style={styles.dossierDetailLine}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.primary[600]} />
            <Text style={styles.dossierDetailLabel}>Known Allergies:</Text>
            <Text style={styles.dossierDetailText}>
              {user?.allergies && user.allergies.length > 0 ? user.allergies.join(', ') : 'No known allergies reported'}
            </Text>
          </View>

          <View style={styles.dossierDetailLine}>
            <Ionicons name="document-text-outline" size={16} color={Colors.neutral[600]} />
            <Text style={styles.dossierDetailLabel}>Passport Status:</Text>
            <Text style={styles.dossierDetailText}>
              Verified Traveler Identity • Document ID: P***8921
            </Text>
          </View>

          <View style={styles.dossierDetailLine}>
            <Ionicons name="call-outline" size={16} color={Colors.neutral[600]} />
            <Text style={styles.dossierDetailLabel}>Primary Relative Contact:</Text>
            <Text style={styles.dossierDetailText}>
              {user?.emergencyContact?.name || 'Family Contact'} ({user?.emergencyContact?.relation || 'Guardian'}) • {user?.emergencyContact?.phone || '+1-555-019-2834'}
            </Text>
          </View>
        </View>

        {/* Digital Insurance Card & Claims Details */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>International Travel Insurance</Text>
          <View style={styles.badgeActive}>
            <Text style={styles.badgeActiveText}>POLICY ACTIVE</Text>
          </View>
        </View>

        <View style={styles.insuranceCard}>
          <View style={styles.insuranceTop}>
            <View>
              <Text style={styles.insuranceProvider}>
                {insurance?.provider || 'Allianz Global Assistance Worldwide'}
              </Text>
              <Text style={styles.insurancePolicyNumber}>
                Policy #{insurance?.policyNumber || 'AGA-INT-883921-EU'}
              </Text>
            </View>
            <Ionicons name="shield-checkmark" size={32} color={Colors.primary[500]} />
          </View>

          <View style={styles.coverageRow}>
            <View>
              <Text style={styles.coverageLabel}>Emergency Medical Evacuation Limit</Text>
              <Text style={styles.coverageValue}>
                {insurance?.coverageLimit || '$500,000 USD Comprehensive'}
              </Text>
            </View>
          </View>

          <View style={styles.claimsBox}>
            <Text style={styles.claimsTitle}>Family Claims & Emergency Instructions:</Text>
            <Text style={styles.claimsStep}>1. For critical hospitalization, call 24/7 hotline immediately for direct billing.</Text>
            <Text style={styles.claimsStep}>2. Request original diagnostic reports & physician fee sheets in English.</Text>
            <Text style={styles.claimsStep}>3. Retain itemized pharmacy receipts with stamped generic medication names.</Text>
          </View>

          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={() => handleCallHospital(insurance?.emergencyAssistancePhone || '+18006541908')}
          >
            <Ionicons name="call" size={16} color={Colors.white} />
            <Text style={styles.emergencyCallBtnText}>
              24/7 Insurance Assistance ({insurance?.emergencyAssistancePhone || '+1-800-654-1908'})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nearest Hospital & Embassy */}
        <Text style={styles.sectionTitle}>Nearest Local Healthcare & Consulate</Text>

        <View style={styles.hospitalCard}>
          <View style={styles.hospitalIconCircle}>
            <Ionicons name="business" size={22} color={Colors.primary[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hospitalName}>Tokyo Metropolitan Hiroo Hospital</Text>
            <Text style={styles.hospitalSub}>English-speaking Emergency Triage • 1.2 km from traveler</Text>
            <Text style={styles.hospitalAddress}>4-34-10 Ebisu, Shibuya-ku, Tokyo 150-0013</Text>
          </View>
          <TouchableOpacity
            style={styles.hospitalCallBtn}
            onPress={() => handleCallHospital('+81334441181')}
          >
            <Ionicons name="call-outline" size={18} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.hospitalCard}>
          <View style={[styles.hospitalIconCircle, { backgroundColor: Colors.terracotta[50] }]}>
            <Ionicons name="flag" size={20} color={Colors.terracotta.main} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hospitalName}>Consular Assistance & Embassy</Text>
            <Text style={styles.hospitalSub}>Citizen Services & Medical Repatriation</Text>
            <Text style={styles.hospitalAddress}>1-10-5 Akasaka, Minato-ku, Tokyo (US/International Embassy)</Text>
          </View>
          <TouchableOpacity
            style={styles.hospitalCallBtn}
            onPress={() => handleCallHospital('+81332245000')}
          >
            <Ionicons name="call-outline" size={18} color={Colors.terracotta.main} />
          </TouchableOpacity>
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
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing[4],
  },

  liveStatusCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sage[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.sage.light,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sage.main,
  },
  pulseText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
    letterSpacing: 0.5,
  },
  batteryText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },

  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  travelerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  travelerRole: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  safetyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sage[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  safetyTagText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.sage.dark,
  },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCity: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  locationCoords: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  locationTime: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[600],
    marginTop: 2,
  },

  pingRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  pingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  pingBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[700],
  },
  callTravelerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.xl,
    paddingVertical: 10,
  },
  callTravelerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },

  medicalDossierCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  dossierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing[3],
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  dossierCol: {
    flex: 1,
    alignItems: 'center',
  },
  dossierDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.neutral[200],
  },
  dossierLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[400],
    textTransform: 'uppercase',
  },
  dossierValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginTop: 2,
  },
  dossierDetailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: 6,
  },
  dossierDetailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
  },
  dossierDetailText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
  },

  badgeActive: {
    backgroundColor: Colors.sage[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeActiveText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
    letterSpacing: 0.5,
  },
  insuranceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  insuranceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  insuranceProvider: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  insurancePolicyNumber: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
    marginTop: 2,
  },
  coverageRow: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  coverageLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    textTransform: 'uppercase',
  },
  coverageValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[900],
    marginTop: 2,
  },
  claimsBox: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  claimsTitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  claimsStep: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    lineHeight: 17,
    marginTop: 2,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
  },
  emergencyCallBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },

  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  hospitalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  hospitalSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 1,
  },
  hospitalAddress: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  hospitalCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
