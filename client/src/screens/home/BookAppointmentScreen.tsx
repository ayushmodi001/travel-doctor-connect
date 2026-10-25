/**
 * BookAppointmentScreen – date/time/type selection and booking confirmation.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, ConsultationType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button, InputField, Divider } from '../../components/ui/primitives';
import { useDoctor } from '../../hooks/useApi';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime, formatFee } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';

type NavProp   = NativeStackNavigationProp<HomeStackParamList, 'BookAppointment'>;
type RouteType = RouteProp<HomeStackParamList, 'BookAppointment'>;

const CONSULT_TYPES: { label: string; value: ConsultationType; icon: any }[] = [
  { label: 'Video',     value: 'video',     icon: 'videocam-outline' },
  { label: 'Chat',      value: 'chat',      icon: 'chatbubble-outline' },
  { label: 'In-Person', value: 'in-person', icon: 'walk-outline' },
];

const BookAppointmentScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const { doctorId, slotId } = route.params;

  const { doctor }        = useDoctor(doctorId);
  const { bookAppointment } = useAppointments();
  const { user }          = useAuth();

  const [consultType, setConsultType] = useState<ConsultationType>('video');
  const [symptoms, setSymptoms]       = useState('');
  const [notes, setNotes]             = useState('');
  const [isBooking, setIsBooking]     = useState(false);
  const [booked, setBooked]           = useState(false);

  const selectedSlot = doctor?.availableSlots.find(s => s.id === slotId) ??
    doctor?.availableSlots.find(s => !s.isBooked);

  const handleBook = async () => {
    if (!doctor || !selectedSlot || !user) return;
    setIsBooking(true);
    try {
      await bookAppointment({
        doctorId: doctor.id,
        doctor,
        patientId: user.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        type: consultType,
        status: 'pending',
        symptoms,
        notes,
      });
      setBooked(true);
    } catch {
      Alert.alert('Booking Failed', i18n.t('booking.failed'));
    } finally {
      setIsBooking(false);
    }
  };

  if (booked) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.success.main} />
        </View>
        <Text style={styles.successTitle}>Appointment Booked!</Text>
        <Text style={styles.successSub}>{i18n.t('booking.success')}</Text>
        {selectedSlot && (
          <View style={styles.successDetail}>
            <Text style={styles.successDetailText}>
              {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.startTime)}
            </Text>
          </View>
        )}
        <Button
          label="Back to Home"
          onPress={() => navigation.navigate('Home')}
          size="lg"
          style={styles.successBtn}
        />
      </View>
    );
  }

  if (!doctor) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('booking.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Doctor summary */}
        <View style={styles.doctorCard}>
          <Image source={{ uri: doctor.profileImage }} style={styles.doctorAvatar} />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpec}>{doctor.specialty}</Text>
            <Text style={styles.doctorFee}>{formatFee(doctor.fee, doctor.currency)} / session</Text>
          </View>
        </View>

        <Divider />

        {/* Selected slot */}
        {selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{i18n.t('booking.selectDate')}</Text>
            <View style={styles.slotCard}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary[500]} />
              <View>
                <Text style={styles.slotDate}>{formatDate(selectedSlot.date)}</Text>
                <Text style={styles.slotTime}>
                  {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Consultation type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t('booking.consultationType')}</Text>
          <View style={styles.typeRow}>
            {CONSULT_TYPES.filter(t => doctor.consultationType.includes(t.value)).map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeBtn, consultType === t.value && styles.typeBtnActive]}
                onPress={() => setConsultType(t.value)}
              >
                <Ionicons
                  name={t.icon}
                  size={20}
                  color={consultType === t.value ? Colors.primary[600] : Colors.neutral[500]}
                />
                <Text style={[styles.typeBtnText, consultType === t.value && styles.typeBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <InputField
            label={i18n.t('booking.symptoms')}
            placeholder="Describe what you're experiencing…"
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={4}
            icon="medical-outline"
          />
          <InputField
            label={i18n.t('booking.notes')}
            placeholder="Any additional information for the doctor…"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            icon="document-text-outline"
          />
        </View>

        {/* Fee summary */}
        <View style={styles.feeSummary}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Consultation fee</Text>
            <Text style={styles.feeValue}>{formatFee(doctor.fee, doctor.currency)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform fee</Text>
            <Text style={styles.feeValue}>{formatFee(5, doctor.currency)}</Text>
          </View>
          <Divider style={{ marginVertical: Spacing[2] }} />
          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Total</Text>
            <Text style={styles.feeTotalValue}>{formatFee(doctor.fee + 5, doctor.currency)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <Button
          label={i18n.t('booking.confirm')}
          onPress={handleBook}
          isLoading={isBooking}
          size="lg"
          style={{ width: '100%' }}
          icon="checkmark-circle-outline"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { padding: Spacing[5], paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: Spacing[3], paddingHorizontal: Spacing[5], backgroundColor: Colors.white, ...Shadows.sm },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },

  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], marginBottom: Spacing[4], ...Shadows.sm },
  doctorAvatar: { width: 60, height: 60, borderRadius: BorderRadius.full },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  doctorSpec: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  doctorFee: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary[600], marginTop: 4 },

  section: { marginBottom: Spacing[4] },
  sectionLabel: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[700], marginBottom: Spacing[3], textTransform: 'uppercase', letterSpacing: 0.5 },

  slotCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.primary[50], borderRadius: BorderRadius.xl, padding: Spacing[4], borderWidth: 1, borderColor: Colors.primary[100] },
  slotDate: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[800] },
  slotTime: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },

  typeRow: { flexDirection: 'row', gap: Spacing[3] },
  typeBtn: { flex: 1, flexDirection: 'column', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3], borderRadius: BorderRadius.xl, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.neutral[200], ...Shadows.sm },
  typeBtnActive: { borderColor: Colors.primary[400], backgroundColor: Colors.primary[50] },
  typeBtnText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[500] },
  typeBtnTextActive: { color: Colors.primary[700], fontFamily: Typography.fontFamily.semiBold },

  feeSummary: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], ...Shadows.sm },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  feeLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[600] },
  feeValue: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[800] },
  feeTotalLabel: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  feeTotalValue: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.primary[600] },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing[5], paddingBottom: Spacing[6], backgroundColor: Colors.white, ...Shadows.lg },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8], backgroundColor: Colors.white, gap: Spacing[4] },
  successIcon: { width: 100, height: 100, borderRadius: BorderRadius.full, backgroundColor: Colors.success.light, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  successSub: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500], textAlign: 'center' },
  successDetail: { backgroundColor: Colors.primary[50], borderRadius: BorderRadius.xl, paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] },
  successDetailText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary[700] },
  successBtn: { width: '100%', marginTop: Spacing[4] },
});

export default BookAppointmentScreen;
