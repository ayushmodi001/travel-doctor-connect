/**
 * AppointmentDetailScreen – Appointment pass and details.
 * Features:
 *  - Doctor info card with photo and specialty.
 *  - Digital appointment ticket pass with QR confirmation code.
 *  - OpenStreetMap clinic location button.
 *  - Join Video Consultation action.
 *  - Cancel appointment with confirmation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppointmentsStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAppointments } from '../../context/AppointmentContext';
import { Button, Badge } from '../../components/ui/primitives';

type RouteProps = RouteProp<AppointmentsStackParamList, 'AppointmentDetail'>;

export const AppointmentDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { appointments, cancelAppointment } = useAppointments();

  const appointment = appointments.find(a => a.id === route.params.appointmentId);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!appointment) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="calendar-outline" size={48} color={Colors.neutral[400]} />
        <Text style={styles.notFoundTitle}>Appointment Not Found</Text>
        <Text style={styles.notFoundSub}>This appointment record may have been removed.</Text>
        <Button label="Back to Appointments" onPress={() => navigation.goBack()} variant="primary" style={{ marginTop: Spacing[4] }} />
      </View>
    );
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await cancelAppointment(appointment.id);
              navigation.goBack();
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'confirmed':
        return <Badge label="Confirmed" color={Colors.sage.dark} bg={Colors.sage.light} />;
      case 'in-progress':
        return <Badge label="In Progress" color={Colors.primary[700]} bg={Colors.primary[50]} />;
      case 'completed':
        return <Badge label="Completed" color={Colors.neutral[700]} bg={Colors.neutral[150]} />;
      case 'cancelled':
        return <Badge label="Cancelled" color={Colors.error.dark} bg={Colors.error.light} />;
      default:
        return <Badge label="Pending" color={Colors.ochre.dark} bg={Colors.ochre.light} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Digital Ticket Pass */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketTypeRow}>
              <View style={styles.typePill}>
                <Ionicons
                  name={appointment.type === 'video' ? 'videocam' : appointment.type === 'chat' ? 'chatbubble-ellipses' : 'person'}
                  size={14}
                  color={Colors.primary[600]}
                />
                <Text style={styles.typeText}>{appointment.type.toUpperCase()} CONSULTATION</Text>
              </View>
              {getStatusBadge()}
            </View>

            {/* Doctor Info */}
            <View style={styles.doctorRow}>
              {appointment.doctor.profileImage ? (
                <Image source={{ uri: appointment.doctor.profileImage }} style={styles.doctorAvatar} />
              ) : (
                <View style={styles.doctorAvatarFallback}>
                  <Ionicons name="person" size={24} color={Colors.primary[500]} />
                </View>
              )}

              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{appointment.doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{appointment.doctor.specialty}</Text>
                <Text style={styles.doctorHospital} numberOfLines={1}>
                  {appointment.doctor.hospital}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket Perforated Divider */}
          <View style={styles.perforationRow}>
            <View style={styles.perforationLeft} />
            <View style={styles.perforationLine} />
            <View style={styles.perforationRight} />
          </View>

          {/* Ticket Body */}
          <View style={styles.ticketBody}>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>DATE</Text>
                <Text style={styles.metaValue}>{appointment.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>TIME</Text>
                <Text style={styles.metaValue}>{appointment.startTime} - {appointment.endTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>FEE</Text>
                <Text style={styles.metaValue}>${appointment.doctor.fee} {appointment.doctor.currency}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>REF CODE</Text>
                <Text style={[styles.metaValue, { fontFamily: Typography.fontFamily.bold }]}>
                  #{appointment.id.toUpperCase().slice(-6)}
                </Text>
              </View>
            </View>

            {/* Reason / Notes */}
            {appointment.reason && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Reason for Consultation:</Text>
                <Text style={styles.notesText}>{appointment.reason}</Text>
              </View>
            )}

            {/* Open Maps Location Link for In-Person Consultations */}
            {appointment.type === 'in-person' && appointment.doctor.location && (
              <TouchableOpacity
                style={styles.mapLinkBox}
                onPress={() => {
                  navigation.navigate('HomeTab', {
                    screen: 'OpenMaps',
                    params: {
                      doctorId: appointment.doctorId,
                      latitude: appointment.doctor.location.latitude,
                      longitude: appointment.doctor.location.longitude,
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.mapLinkIconWrap}>
                  <Ionicons name="map" size={20} color={Colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapLinkTitle}>Clinic Location on Open Maps</Text>
                  <Text style={styles.mapLinkSub}>{appointment.doctor.location.address || appointment.doctor.hospital}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGroup}>
          {appointment.type === 'video' && appointment.status !== 'cancelled' && (
            <Button
              label="Join Video Consultation"
              icon="videocam"
              onPress={() => {
                navigation.navigate('HomeTab', {
                  screen: 'VideoCall',
                  params: {
                    appointmentId: appointment.id,
                    token: appointment.videoCallToken || 'demo-token',
                  },
                });
              }}
              variant="primary"
              size="lg"
            />
          )}

          {appointment.type === 'chat' && appointment.status !== 'cancelled' && (
            <Button
              label="Open Chat with Doctor"
              icon="chatbubble-ellipses"
              onPress={() => {
                navigation.navigate('HomeTab', {
                  screen: 'Chat',
                  params: {
                    sessionId: `chat-${appointment.id}`,
                    doctorId: appointment.doctorId,
                  },
                });
              }}
              variant="secondary"
              size="lg"
            />
          )}

          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <Button
              label="Cancel Appointment"
              onPress={handleCancel}
              isLoading={isCancelling}
              variant="ghost"
              size="md"
              style={styles.cancelBtn}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AppointmentDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    backgroundColor: Colors.canvas,
  },
  notFoundTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginTop: Spacing[3],
  },
  notFoundSub: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: Spacing[1],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },

  scroll: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
  },

  // Ticket Pass Card
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    overflow: 'hidden',
    ...Shadows.md,
  },
  ticketHeader: {
    padding: Spacing[5],
  },
  ticketTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    letterSpacing: 0.3,
  },

  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
  },
  doctorAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  doctorSpecialty: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
    marginTop: 1,
  },
  doctorHospital: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // Perforation
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: 'transparent',
  },
  perforationLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
    marginLeft: -10,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
  },
  perforationLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  perforationRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
    marginRight: -10,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
  },

  ticketBody: {
    padding: Spacing[5],
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  metaItem: {
    width: '47%',
    backgroundColor: Colors.neutral[50],
    padding: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[400],
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
    marginTop: 3,
  },

  notesBox: {
    backgroundColor: Colors.ochre.light + '44',
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.ochre.main + '33',
    marginBottom: Spacing[4],
  },
  notesLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.ochre.dark,
    marginBottom: 3,
  },
  notesText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    lineHeight: 19,
  },

  mapLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[50],
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  mapLinkIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLinkTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  mapLinkSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  actionsGroup: {
    marginTop: Spacing[5],
    gap: Spacing[3],
  },
  cancelBtn: {
    alignSelf: 'center',
  },
});
