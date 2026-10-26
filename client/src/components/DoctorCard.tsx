/**
 * DoctorCard – Reusable card component to display doctor information.
 * Features: Tactile pill geometry, clinical teal & sage status badges, and ocean azure actions.
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
import { Doctor, ConsultationType } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { formatFee } from '../utils/helpers';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress?: () => void;
  /** 'full' shows all info; 'compact' shows minimal info for lists */
  variant?: 'full' | 'compact';
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  onBookPress,
  variant = 'full',
}) => {
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Doctor ${doctor.name}, ${doctor.specialty}`}
    >
      {/* Avatar + Verified badge */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: doctor.profileImage }}
          style={[styles.avatar, isCompact && styles.avatarCompact]}
          defaultSource={require('../../assets/icon.png')}
        />
        {doctor.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.sage.main} />
          </View>
        )}
        {doctor.isAvailableNow && !isCompact && (
          <View style={styles.availableDot} />
        )}
      </View>

      {/* Main Info */}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
          {doctor.isAvailableNow && (
            <View style={styles.availablePill}>
              <Text style={styles.availableText}>Now</Text>
            </View>
          )}
        </View>

        <Text style={styles.specialty} numberOfLines={1}>{doctor.specialty}</Text>
        {!isCompact && (
          <Text style={styles.hospital} numberOfLines={1}>{doctor.hospital}</Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={13} color="#D97706" />
            <Text style={styles.statText}>{doctor.rating.toFixed(1)}</Text>
            {!isCompact && (
              <Text style={styles.statSub}> ({doctor.reviewCount})</Text>
            )}
          </View>
          <View style={styles.dot} />
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={13} color={Colors.neutral[500]} />
            <Text style={styles.statText}>{doctor.experience}yr</Text>
          </View>
          {!isCompact && (
            <>
              <View style={styles.dot} />
              <View style={styles.stat}>
                <Ionicons name="cash-outline" size={13} color={Colors.neutral[500]} />
                <Text style={styles.statText}>{formatFee(doctor.fee, doctor.currency)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Consultation type chips */}
        {!isCompact && (
          <View style={styles.chips}>
            {doctor.consultationType.map((type: ConsultationType) => (
              <View key={type} style={styles.chip}>
                <Ionicons
                  name={
                    type === 'video'
                      ? 'videocam-outline'
                      : type === 'chat'
                      ? 'chatbubble-outline'
                      : 'walk-outline'
                  }
                  size={11}
                  color={Colors.primary[600]}
                />
                <Text style={styles.chipText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Book button */}
      {onBookPress && !isCompact && (
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={onBookPress}
          accessibilityRole="button"
          accessibilityLabel={`Book appointment with ${doctor.name}`}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Book</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[3],
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  cardCompact: {
    padding: Spacing[3],
    marginBottom: Spacing[2],
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing[3],
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.neutral[150],
  },
  avatarCompact: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  availableDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sage.main,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  // Info
  info: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 2,
  },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
  },
  specialty: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[600],
    marginBottom: 2,
  },
  hospital: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    marginBottom: Spacing[2],
  },

  // Available pill
  availablePill: {
    backgroundColor: Colors.sage.light,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  availableText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Spacing[2],
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
  },
  statSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.neutral[300],
  },

  // Chips
  chips: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[700],
  },

  // Book button
  bookBtn: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginLeft: Spacing[2],
    ...Shadows.card,
  },
  bookBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default DoctorCard;
