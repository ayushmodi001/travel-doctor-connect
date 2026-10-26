/**
 * TicketPassCard – signature Health.UI ticket pass card with notched borders,
 * date/time chips, location, and scannable barcode / action footer.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Appointment } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatDate, formatTime } from '../../utils/helpers';

interface TicketPassCardProps {
  appointment?: Appointment | null;
  onPress?: () => void;
  onActionPress?: () => void;
  title?: string;
  subtitle?: string;
}

export const TicketPassCard: React.FC<TicketPassCardProps> = ({
  appointment,
  onPress,
  onActionPress,
  title,
  subtitle,
}) => {
  if (!appointment) {
    return (
      <TouchableOpacity
        style={styles.wrapper}
        activeOpacity={0.92}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Book an appointment"
      >
        <LinearGradient
          colors={[Colors.primary[600], Colors.primary[800]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.glowCircle} />
          <View style={styles.headerRow}>
            <View style={styles.badgePill}>
              <Ionicons name="calendar-outline" size={12} color={Colors.white} />
              <Text style={styles.badgeText}>APPOINTMENT PASS</Text>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.doctorName}>No Upcoming Consultations</Text>
            <Text style={styles.specialtyText}>Schedule a consultation with top clinical specialists worldwide.</Text>
          </View>

          <View style={[styles.footerRow, { marginTop: Spacing[4] }]}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onPress}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>Find a Doctor</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const doctorName = appointment.doctor?.name || title || 'Physician';
  const specialty = appointment.doctor?.specialty || subtitle || 'General Consultation';
  const hospital = appointment.doctor?.hospital || appointment.doctor?.location?.city || 'Healthcare Center';
  const dateStr = appointment.date ? formatDate(appointment.date) : '';
  const timeStr = appointment.startTime && appointment.endTime
    ? `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`
    : (appointment.startTime || 'Scheduled session');

  return (
    <TouchableOpacity
      style={styles.wrapper}
      activeOpacity={0.92}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Appointment ticket for ${doctorName}`}
    >
      <LinearGradient
        colors={[Colors.ticket.start, Colors.ticket.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative background glow circle */}
        <View style={styles.glowCircle} />

        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.badgePill}>
            <Ionicons name="sparkles" size={12} color={Colors.white} />
            <Text style={styles.badgeText}>UPCOMING PASS</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Confirmed</Text>
          </View>
        </View>

        {/* Main Title & Doctor */}
        <View style={styles.titleSection}>
          <Text style={styles.doctorName} numberOfLines={1}>{doctorName}</Text>
          <Text style={styles.specialtyText} numberOfLines={1}>{specialty}</Text>
        </View>

        {/* Meta Info: Date & Time */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={14} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={14} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.metaLabel}>TIME</Text>
              <Text style={styles.metaValue}>{timeStr}</Text>
            </View>
          </View>
        </View>

        {/* Location Row */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.locationText} numberOfLines={1}>{hospital}</Text>
        </View>

        {/* Notched perforated separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.notchLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.notchRight} />
        </View>

        {/* Barcode & Action Footer */}
        <View style={styles.footerRow}>
          {/* Faux digital barcode lines */}
          <View style={styles.barcodeWrap}>
            <View style={[styles.bar, { width: 3 }]} />
            <View style={[styles.bar, { width: 1 }]} />
            <View style={[styles.bar, { width: 4 }]} />
            <View style={[styles.bar, { width: 2 }]} />
            <View style={[styles.bar, { width: 1 }]} />
            <View style={[styles.bar, { width: 5 }]} />
            <View style={[styles.bar, { width: 2 }]} />
            <View style={[styles.bar, { width: 3 }]} />
            <View style={[styles.bar, { width: 1 }]} />
            <View style={[styles.bar, { width: 4 }]} />
            <View style={[styles.bar, { width: 2 }]} />
            <View style={[styles.bar, { width: 3 }]} />
            <View style={[styles.bar, { width: 5 }]} />
            <View style={[styles.bar, { width: 2 }]} />
            <View style={[styles.bar, { width: 1 }]} />
            <View style={[styles.bar, { width: 3 }]} />
          </View>

          {onActionPress && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onActionPress}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>
                {appointment?.type === 'video' ? 'Join Video' : 'View Pass'}
              </Text>
              <Ionicons
                name={appointment?.type === 'video' ? 'videocam' : 'chevron-forward'}
                size={14}
                color={Colors.primary[600]}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[5],
    ...Shadows.iris,
  },
  card: {
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[5],
    overflow: 'hidden',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(60, 209, 136, 0.22)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.mint.main,
  },
  liveText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  titleSection: {
    marginBottom: Spacing[4],
  },
  doctorName: {
    color: Colors.white,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.3,
  },
  specialtyText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  metaValue: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing[4],
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    flex: 1,
  },
  separatorContainer: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
    marginHorizontal: -Spacing[5],
    marginVertical: Spacing[1],
  },
  dashedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.35)',
    borderStyle: 'dashed',
    marginHorizontal: 22,
  },
  notchLeft: {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
  },
  notchRight: {
    position: 'absolute',
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[2],
  },
  barcodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    gap: 3,
  },
  bar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  actionBtnText: {
    color: Colors.primary[600],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
});

export default TicketPassCard;
