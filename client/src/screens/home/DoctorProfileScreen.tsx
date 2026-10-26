/**
 * DoctorProfileScreen – full doctor detail view.
 * Shows bio, qualifications, available slots, and action buttons.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, TimeSlot } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button, Badge, Divider } from '../../components/ui/primitives';
import { useDoctor } from '../../hooks/useApi';
import { formatFee, formatDate, formatTime } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';

type NavProp  = NativeStackNavigationProp<HomeStackParamList, 'DoctorProfile'>;
type RouteType = RouteProp<HomeStackParamList, 'DoctorProfile'>;

import { ErrorState } from '../../components/ui/ErrorState';

const DoctorProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const { doctorId } = route.params;

  const { doctor, isLoading, error } = useDoctor(doctorId);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [activeTab, setActiveTab]       = useState<'about' | 'reviews'>('about');

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !doctor) {
    return (
      <View style={styles.container}>
        <View style={{ paddingHorizontal: Spacing[4], paddingTop: Spacing[10] }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.neutral[800]} />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Doctor Unavailable"
          message={error || `Doctor ${doctorId} could not be loaded from healthcare server.`}
          onRetry={() => navigation.goBack()}
        />
      </View>
    );
  }

  const availableSlots = doctor.availableSlots.filter(s => !s.isBooked);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <LinearGradient colors={[Colors.primary[800], Colors.primary[600]]} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: doctor.profileImage }} style={styles.avatar} />
              {doctor.isAvailableNow && (
                <View style={styles.availableBadge}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              )}
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              {doctor.verified && (
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary[200]} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              <Text style={styles.specialty}>{doctor.specialty}</Text>
              <Text style={styles.hospital}>{doctor.hospital}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { icon: 'star', value: doctor.rating.toFixed(1), label: 'Rating' },
              { icon: 'people', value: `${doctor.reviewCount}+`, label: 'Reviews' },
              { icon: 'briefcase', value: `${doctor.experience}yr`, label: 'Experience' },
              { icon: 'cash', value: formatFee(doctor.fee, doctor.currency), label: 'Fee' },
            ].map(stat => (
              <View key={stat.label} style={styles.stat}>
                <Ionicons name={stat.icon as any} size={16} color={Colors.primary[200]} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {doctor.consultationType.includes('video') && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('BookAppointment', { doctorId: doctor.id })}
            >
              <Ionicons name="videocam-outline" size={20} color={Colors.primary[600]} />
              <Text style={styles.actionBtnText}>Video</Text>
            </TouchableOpacity>
          )}
          {doctor.consultationType.includes('chat') && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Chat', { sessionId: 'new', doctorId: doctor.id })}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary[600]} />
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>
          )}
          {doctor.consultationType.includes('in-person') && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('BookAppointment', { doctorId: doctor.id })}
            >
              <Ionicons name="walk-outline" size={20} color={Colors.primary[600]} />
              <Text style={styles.actionBtnText}>In-Person</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.body}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {(['about', 'reviews'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'about' && (
            <>
              {/* About */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('doctors.about')}</Text>
                <Text style={styles.aboutText}>{doctor.about}</Text>
              </View>
              <Divider />

              {/* Qualifications */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('doctors.qualifications')}</Text>
                {doctor.qualifications.map((q, i) => (
                  <View key={i} style={styles.qualRow}>
                    <Ionicons name="ribbon-outline" size={14} color={Colors.primary[500]} />
                    <Text style={styles.qualText}>{q}</Text>
                  </View>
                ))}
              </View>
              <Divider />

              {/* Languages */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('doctors.languages')}</Text>
                <View style={styles.langRow}>
                  {doctor.languages.map(lang => (
                    <Badge key={lang} label={lang} />
                  ))}
                </View>
              </View>
              <Divider />

              {/* Available slots */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('doctors.selectSlot')}</Text>
                {availableSlots.length === 0 ? (
                  <Text style={styles.noSlots}>No available slots this week.</Text>
                ) : (
                  <View style={styles.slots}>
                    {availableSlots.map(slot => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[styles.slot, selectedSlot?.id === slot.id && styles.slotActive]}
                        onPress={() => setSelectedSlot(slot)}
                      >
                        <Text style={[styles.slotDate, selectedSlot?.id === slot.id && styles.slotTextActive]}>
                          {formatDate(slot.date)}
                        </Text>
                        <Text style={[styles.slotTime, selectedSlot?.id === slot.id && styles.slotTextActive]}>
                          {formatTime(slot.startTime)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.section}>
              <Text style={styles.aboutText}>
                {`⭐ ${doctor.rating.toFixed(1)} / 5.0 from ${doctor.reviewCount} verified patients.\n\n"Extremely professional and thorough. Took time to explain everything clearly." – Sarah T.\n\n"Best consultation experience I've had online. Highly recommend Dr. ${doctor.name.split(' ').slice(-1)[0]}." – Michael K.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book button */}
      <View style={styles.footer}>
        <Button
          label={selectedSlot ? i18n.t('doctors.bookAppointment') : 'Select a Slot to Book'}
          onPress={() => {
            if (selectedSlot) {
              navigation.navigate('BookAppointment', { doctorId: doctor.id, slotId: selectedSlot.id });
            }
          }}
          size="lg"
          disabled={!selectedSlot}
          style={styles.bookBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { paddingBottom: 100 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { paddingTop: 56, paddingBottom: Spacing[6], paddingHorizontal: Spacing[5] },
  backBtn: { marginBottom: Spacing[4] },
  heroContent: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[5] },
  avatarWrap: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: BorderRadius.full, borderWidth: 3, borderColor: Colors.white },
  availableBadge: { position: 'absolute', bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success.main, borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2 },
  availableDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.white },
  availableText: { fontSize: 9, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  heroInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  doctorName: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.white },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.primary[200] },
  specialty: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary[200] },
  hospital: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.65)' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: BorderRadius.xl, padding: Spacing[4] },
  stat: { alignItems: 'center', gap: 3 },
  statValue: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.white },
  statLabel: { fontSize: 10, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.65)' },

  actionRow: { flexDirection: 'row', gap: Spacing[3], paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], backgroundColor: Colors.white, ...Shadows.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], backgroundColor: Colors.primary[50], borderRadius: BorderRadius.xl, paddingVertical: Spacing[3], borderWidth: 1, borderColor: Colors.primary[100] },
  actionBtnText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary[700] },

  body: { padding: Spacing[5] },
  tabs: { flexDirection: 'row', marginBottom: Spacing[5], backgroundColor: Colors.neutral[100], borderRadius: BorderRadius.xl, padding: 4 },
  tab: { flex: 1, paddingVertical: Spacing[2], alignItems: 'center', borderRadius: BorderRadius.lg },
  tabActive: { backgroundColor: Colors.white, ...Shadows.sm },
  tabText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[500] },
  tabTextActive: { color: Colors.neutral[900], fontFamily: Typography.fontFamily.semiBold },

  section: { marginBottom: Spacing[4] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[800], marginBottom: Spacing[3] },
  aboutText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[600], lineHeight: 22 },
  qualRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  qualText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[700] },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  slot: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.white },
  slotActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  slotDate: { fontSize: 10, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500], marginBottom: 2 },
  slotTime: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[800] },
  slotTextActive: { color: Colors.white },
  noSlots: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[400] },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing[4], paddingBottom: Spacing[6], ...Shadows.lg },
  bookBtn: { width: '100%' },
});

export default DoctorProfileScreen;
