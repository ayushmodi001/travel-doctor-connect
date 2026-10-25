/**
 * AppointmentsScreen – bottom-tab screen showing upcoming, past, and cancelled appointments.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppointmentsStackParamList, Appointment } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import AppointmentItem from '../../components/AppointmentItem';
import { EmptyState, LoadingOverlay } from '../../components/ui/primitives';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<AppointmentsStackParamList>;

type Tab = 'upcoming' | 'past' | 'cancelled';

const TABS: { label: string; value: Tab }[] = [
  { label: i18n.t('appointments.upcoming'),  value: 'upcoming' },
  { label: i18n.t('appointments.past'),      value: 'past' },
  { label: i18n.t('appointments.cancelled'), value: 'cancelled' },
];

const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { appointments, fetchAppointments, cancelAppointment, isLoading } = useAppointments();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  useEffect(() => {
    if (user?.id) fetchAppointments(user.id);
  }, [user?.id]);

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'upcoming')  return a.status === 'confirmed' || a.status === 'pending';
    if (activeTab === 'past')      return a.status === 'completed' || a.status === 'in-progress';
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
      onPress={() => {}}
      onJoinPress={item.videoCallToken
        ? () => {}  // navigate to VideoCall
        : undefined}
      onCancelPress={item.status === 'confirmed' ? () => handleCancel(item) : undefined}
    />
  );

  const emptyMessage = {
    upcoming:  i18n.t('appointments.noUpcoming'),
    past:      i18n.t('appointments.noPast'),
    cancelled: 'No cancelled appointments',
  }[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('appointments.title')}</Text>
        <TouchableOpacity style={styles.calendarBtn} onPress={() => {}}>
          <Ionicons name="calendar-outline" size={22} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.value && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingOverlay message="Loading appointments…" />
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={item => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={emptyMessage}
              subtitle={activeTab === 'upcoming' ? 'Book a consultation to get started.' : undefined}
              actionLabel={activeTab === 'upcoming' ? 'Find a Doctor' : undefined}
              onAction={() => {}}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[5],
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  calendarBtn: { padding: Spacing[2], backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', position: 'relative' },
  tabActive: {},
  tabText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[500] },
  tabTextActive: { color: Colors.primary[600], fontFamily: Typography.fontFamily.semiBold },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: Colors.primary[500], borderRadius: BorderRadius.full },

  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
});

export default AppointmentsScreen;
