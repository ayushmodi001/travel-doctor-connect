/**
 * AppointmentsScreen – Appointment manager.
 * Features:
 *  - Segments for upcoming, past, and cancelled visits.
 *  - Direct navigation to rich AppointmentDetailScreen.
 *  - Real error handling with retry (no mock fallbacks).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppointmentsStackParamList, Appointment } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import AppointmentItem from '../../components/AppointmentItem';
import { EmptyState, LoadingOverlay } from '../../components/ui/primitives';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<AppointmentsStackParamList, 'Appointments'>;
type Tab = 'upcoming' | 'past' | 'cancelled';

const TABS: { label: string; value: Tab }[] = [
  { label: i18n.t('appointments.upcoming'), value: 'upcoming' },
  { label: i18n.t('appointments.past'), value: 'past' },
  { label: i18n.t('appointments.cancelled'), value: 'cancelled' },
];

export const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { appointments, fetchAppointments, cancelAppointment, isLoading, error } = useAppointments();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const userId = user?.id;
  useEffect(() => {
    if (userId) fetchAppointments(userId);
  }, [userId, fetchAppointments]);

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'upcoming') return a.status === 'confirmed' || a.status === 'pending';
    if (activeTab === 'past') return a.status === 'completed' || a.status === 'in-progress';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
    return false;
  });

  const handleCancel = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with ${appointment.doctor.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelAppointment(appointment.id),
        },
      ]
    );
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <AppointmentItem
      appointment={item}
      onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
      onJoinPress={
        item.videoCallToken
          ? () => {
              (navigation as any).navigate('HomeTab', {
                screen: 'VideoCall',
                params: { appointmentId: item.id, token: item.videoCallToken },
              });
            }
          : undefined
      }
      onCancelPress={item.status === 'confirmed' ? () => handleCancel(item) : undefined}
    />
  );

  const emptyMessage = {
    upcoming: i18n.t('appointments.noUpcoming'),
    past: i18n.t('appointments.noPast'),
    cancelled: 'No cancelled appointments',
  }[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('appointments.title')}</Text>
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => (navigation as any).navigate('HomeTab')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="calendar" size={18} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Pill Segmented Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabPillWrap}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingOverlay message="Loading appointments…" />
      ) : error ? (
        // REQUIREMENT 2: DO NOT fall back silently to fake mock data. Show ErrorState.
        <ErrorState
          title="Could Not Load Appointments"
          message={error}
          onRetry={() => userId && fetchAppointments(userId)}
          fullScreen
        />
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item: Appointment) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={emptyMessage}
              subtitle={activeTab === 'upcoming' ? 'Book a consultation with a specialist today.' : undefined}
              actionLabel={activeTab === 'upcoming' ? 'Find a Specialist' : undefined}
              onAction={() => (navigation as any).navigate('HomeTab')}
            />
          }
        />
      )}
    </View>
  );
};

export default AppointmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.4,
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },

  tabContainer: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  tabPillWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  tabPillActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[600],
  },
  tabTextActive: {
    color: Colors.neutral[900],
    fontFamily: Typography.fontFamily.bold,
  },

  list: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
});
