/**
 * HomeScreen – the main dashboard after login.
 * Shows emergency/consultation quick-actions, specialty shortcuts,
 * and upcoming appointments.
 */

import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { SectionHeader, EmptyState } from '../../components/ui/primitives';
import AppointmentItem from '../../components/AppointmentItem';
import { MEDICAL_SPECIALTIES } from '../../data/mockData';
import { i18n } from '../../localization/i18n';
import { formatDate, formatTime } from '../../utils/helpers';

const { width } = Dimensions.get('window');

type NavProp = NativeStackNavigationProp<HomeStackParamList>;

// ─── Quick-action card data ────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    id: 'emergency',
    label: 'Emergency',
    desc: 'Immediate assistance',
    icon: 'alert-circle' as const,
    gradientColors: [Colors.error.dark, Colors.error.main] as [string, string],
    screen: 'Emergency' as const,
  },
  {
    id: 'consult',
    label: 'Consultation',
    desc: 'See a doctor now',
    icon: 'videocam' as const,
    gradientColors: [Colors.primary[700], Colors.primary[500]] as [string, string],
    screen: 'DoctorList' as const,
  },
  {
    id: 'triage',
    label: 'Symptom Check',
    desc: 'AI-powered triage',
    icon: 'medkit' as const,
    gradientColors: ['#0f4c75', '#1b6ca8'] as [string, string],
    screen: 'SymptomTriage' as const,
  },
];

const SPECIALTY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'General Practitioner': 'person-circle-outline',
  Cardiologist: 'heart-outline',
  Dermatologist: 'sunny-outline',
  Neurologist: 'pulse-outline',
  Psychiatrist: 'chatbubble-ellipses-outline',
  Orthopedist: 'body-outline',
  Gynecologist: 'female-outline',
  Pediatrician: 'happy-outline',
  'ENT Specialist': 'ear-outline',
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const { appointments, fetchAppointments } = useAppointments();

  useEffect(() => {
    if (user?.id) fetchAppointments(user.id);
  }, [user?.id]);

  const upcomingAppointments = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .slice(0, 2);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <LinearGradient colors={[Colors.primary[800], Colors.primary[600]]} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{i18n.t('home.welcome')}</Text>
              <Text style={styles.userName}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.white} />
              {/* Unread dot */}
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroTagline}>{i18n.t('home.tagline')}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Quick Actions ─────────────────────────────────────────── */}
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen as any)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <LinearGradient colors={action.gradientColors} style={styles.actionGradient}>
                  <View style={styles.actionIconWrap}>
                    <Ionicons name={action.icon} size={26} color={Colors.white} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDesc}>{action.desc}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Specialties ───────────────────────────────────────────── */}
          <SectionHeader
            title="Browse Specialties"
            action="All Doctors"
            onActionPress={() => navigation.navigate('DoctorList', {})}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyScroll} contentContainerStyle={styles.specialtyContent}>
            {MEDICAL_SPECIALTIES.slice(0, 8).map(spec => (
              <TouchableOpacity
                key={spec}
                style={styles.specialtyChip}
                onPress={() => navigation.navigate('DoctorList', { specialty: spec })}
                activeOpacity={0.85}
              >
                <View style={styles.specialtyIcon}>
                  <Ionicons
                    name={SPECIALTY_ICONS[spec] ?? 'medical-outline'}
                    size={20}
                    color={Colors.primary[600]}
                  />
                </View>
                <Text style={styles.specialtyLabel} numberOfLines={2}>{spec}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Upcoming Appointments ─────────────────────────────────── */}
          <SectionHeader
            title={i18n.t('home.upcomingAppointments')}
            action="View All"
            onActionPress={() => {}}
          />

          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={i18n.t('home.noAppointments')}
              subtitle="Book a consultation with a specialist today."
              actionLabel={i18n.t('home.bookNow')}
              onAction={() => navigation.navigate('DoctorList', {})}
            />
          ) : (
            upcomingAppointments.map(appt => (
              <AppointmentItem
                key={appt.id}
                appointment={appt}
                onPress={() => {}}
                onJoinPress={() =>
                  appt.videoCallToken &&
                  navigation.navigate('VideoCall', {
                    appointmentId: appt.id,
                    token: appt.videoCallToken,
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { paddingBottom: Spacing[10] },

  // Hero
  hero: {
    paddingTop: 56,
    paddingBottom: 60,
    paddingHorizontal: Spacing[5],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error.main,
    borderWidth: 1.5,
    borderColor: Colors.primary[700],
  },
  heroTagline: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.85)',
  },

  // Body
  body: {
    marginTop: -40,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionGradient: {
    padding: Spacing[3],
    alignItems: 'flex-start',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
    marginTop: Spacing[2],
  },
  actionDesc: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Specialties
  specialtyScroll: { marginBottom: Spacing[6] },
  specialtyContent: { gap: Spacing[3], paddingRight: Spacing[5] },
  specialtyChip: {
    alignItems: 'center',
    width: 80,
    gap: Spacing[2],
  },
  specialtyIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  specialtyLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
    textAlign: 'center',
  },
});

export default HomeScreen;
