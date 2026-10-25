/**
 * AppointmentItem – displays a single appointment in the list.
 * Shows status badge, date/time, doctor info, and action buttons.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { formatDate, formatTime, getStatusBadge, isAppointmentJoinable } from '../utils/helpers';

interface AppointmentItemProps {
  appointment: Appointment;
  onPress: () => void;
  onJoinPress?: () => void;
  onCancelPress?: () => void;
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({
  appointment,
  onPress,
  onJoinPress,
  onCancelPress,
}) => {
  const { doctor, date, startTime, endTime, type, status } = appointment;
  const badge = getStatusBadge(status);
  const canJoin =
    (status === 'confirmed' || status === 'in-progress') &&
    (type === 'video' || type === 'chat') &&
    isAppointmentJoinable(date, startTime);

  const typeIcon =
    type === 'video'
      ? 'videocam-outline'
      : type === 'chat'
      ? 'chatbubble-outline'
      : 'walk-outline';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${doctor.name} on ${formatDate(date)}`}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: badge.color }]} />

      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <Image
            source={{ uri: doctor.profileImage }}
            style={styles.avatar}
            defaultSource={require('../../assets/icon.png')}
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName} numberOfLines={1}>{doctor.name}</Text>
            <Text style={styles.specialty}>{doctor.specialty}</Text>
          </View>
          {/* Status badge */}
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Date / Time / Type row */}
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Ionicons name="calendar-outline" size={14} color={Colors.neutral[500]} />
            <Text style={styles.detailText}>{formatDate(date)}</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="time-outline" size={14} color={Colors.neutral[500]} />
            <Text style={styles.detailText}>
              {formatTime(startTime)} – {formatTime(endTime)}
            </Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name={typeIcon} size={14} color={Colors.primary[500]} />
            <Text style={[styles.detailText, { color: Colors.primary[600] }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {(canJoin || (status === 'confirmed' && onCancelPress)) && (
          <View style={styles.actions}>
            {canJoin && onJoinPress && (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={onJoinPress}
                accessibilityRole="button"
                accessibilityLabel="Join consultation call"
              >
                <Ionicons name="enter-outline" size={15} color={Colors.white} />
                <Text style={styles.joinBtnText}>Join Now</Text>
              </TouchableOpacity>
            )}
            {status === 'confirmed' && onCancelPress && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancelPress}
                accessibilityRole="button"
                accessibilityLabel="Cancel appointment"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing[3],
    overflow: 'hidden',
    ...Shadows.md,
  },
  accentBar: {
    width: 4,
    borderRadius: BorderRadius.sm,
  },
  content: {
    flex: 1,
    padding: Spacing[4],
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  doctorInfo: { flex: 1 },
  doctorName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },
  specialty: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing[3],
  },

  // Details
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  joinBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  cancelBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
});

export default AppointmentItem;
