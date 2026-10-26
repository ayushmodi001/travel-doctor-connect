/**
 * HomeScreen – Modern medical & travel homepage.
 * Features:
 *  - Real doctor data fetching via DoctorService (NO mock fallback on error).
 *  - Open Maps quick access.
 *  - Tactile category pills and curated doctor cards.
 *  - Upcoming appointment passes.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeStackParamList, Doctor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { EmptyState } from '../../components/ui/primitives';
import { ErrorState } from '../../components/ui/ErrorState';
import { TicketPassCard } from '../../components/home/TicketPassCard';
import { VitalsSummary } from '../../components/home/VitalsSummary';
import AppointmentItem from '../../components/AppointmentItem';
import DoctorCard from '../../components/DoctorCard';
import { DoctorService } from '../../services/api';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<HomeStackParamList>;

const CATEGORIES = [
  'All',
  'Cardiology',
  'General Care',
  'Dermatology',
  'Pediatrics',
  'Neurology',
];

const QUICK_SERVICES = [
  {
    id: 'travel',
    label: 'Travel Hub',
    desc: 'Local EMS, alerts & phrases',
    icon: 'airplane' as const,
    color: Colors.primary[500],
    bgColor: Colors.primary[50],
    screen: 'TravelHub' as const,
  },
  {
    id: 'translator',
    label: 'Medical Translator',
    desc: 'Phrases & phonetics abroad',
    icon: 'language' as const,
    color: Colors.terracotta.main,
    bgColor: Colors.terracotta.light,
    screen: 'MedicalTranslator' as const,
  },
  {
    id: 'meds',
    label: 'Medicine Converter',
    desc: 'International brand names',
    icon: 'fitness' as const,
    color: Colors.sage.main,
    bgColor: Colors.sage.light,
    screen: 'MedicineEquivalents' as const,
  },
  {
    id: 'maps',
    label: 'Open Maps',
    desc: 'Find clinics & ERs',
    icon: 'map' as const,
    color: Colors.ochre.dark,
    bgColor: Colors.ochre.light,
    screen: 'OpenMaps' as const,
  },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { appointments, fetchAppointments } = useAppointments();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{
    countryName: string;
    flag: string;
    emergencyNumber: string;
  } | null>(null);

  // Helper to generate flag emoji from 2-letter ISO code
  const getFlagEmoji = (countryCode: string): string => {
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '📍';
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const geo = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (isMounted && geo && geo.length > 0) {
          const iso = geo[0].isoCountryCode?.toUpperCase();
          const country = geo[0].country || 'Current Destination';
          const ems = iso === 'US' ? '911' : iso === 'IN' ? '112 / 108' : '112';
          setDetectedLocation({
            countryName: country,
            flag: iso ? getFlagEmoji(iso) : '📍',
            emergencyNumber: ems,
          });
        }
      } catch (locErr) {
        console.warn('[HomeScreen] GPS detection error:', locErr);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (userId) {
      fetchAppointments(userId);
    }
  }, [userId, fetchAppointments]);

  const loadDoctors = useCallback(async () => {
    setIsLoadingDoctors(true);
    setDoctorError(null);
    try {
      const result = await DoctorService.getDoctors();
      setDoctors(result);
    } catch (err: any) {
      // REQUIREMENT 2: DO NOT fall back silently to fake mock data. Show proper error.
      setDoctorError(err.message || 'Could not load doctors from healthcare server.');
    } finally {
      setIsLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const upcomingAppointments = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .slice(0, 2);

  const activePassAppointment = upcomingAppointments[0] || null;
  const firstName = user?.name?.split(' ')[0] ?? 'Traveler';

  const filteredDoctors = selectedCategory === 'All'
    ? doctors.slice(0, 4)
    : doctors.filter(d =>
      d.specialty.toLowerCase().includes(selectedCategory.toLowerCase())
    ).slice(0, 4);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 20) + Spacing[2],
            paddingBottom: Math.max(insets.bottom, 20) + Spacing[10],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={Colors.primary[500]} />
              </View>
            )}
            <View>
              <Text style={styles.greeting}>{i18n.t('home.welcome')}</Text>
              <Text style={styles.userName}>{firstName} 👋</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.travelHeaderBtn}
              onPress={() => navigation.navigate('TravelHub')}
              activeOpacity={0.8}
              accessibilityLabel={`Current destination: ${detectedLocation ? detectedLocation.countryName : 'Travel Companion'}. Tap to open Travel Companion.`}
            >
              <Text style={styles.travelFlag}>{detectedLocation?.flag || '📍'}</Text>
              <Text style={styles.travelHeaderText} numberOfLines={1}>
                {detectedLocation?.countryName || 'Travel Hub'}
              </Text>
              <Ionicons name="airplane" size={13} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* International Travel Banner */}
        <TouchableOpacity
          style={styles.travelBanner}
          onPress={() => navigation.navigate('TravelHub')}
          activeOpacity={0.88}
        >
          <View style={styles.travelBannerLeft}>
            <View style={styles.travelBadge}>
              <Ionicons name="globe-outline" size={12} color={Colors.primary[600]} />
              <Text style={styles.travelBadgeText}>INTERNATIONAL TRAVEL COMPANION</Text>
            </View>
            <Text style={styles.travelBannerTitle}>
              {detectedLocation ? `In ${detectedLocation.countryName}? ${detectedLocation.flag}` : 'Traveling Abroad? 🌍'}
            </Text>
            <Text style={styles.travelBannerSub}>
              {detectedLocation
                ? `Access ${detectedLocation.emergencyNumber} EMS, Doctor Phrasebook with phonetics, and Medicine Converter.`
                : 'Access local EMS, Doctor Phrasebook with phonetics, and Medicine Converter.'}
            </Text>
          </View>
          <View style={styles.travelBannerArrow}>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Ticket Pass Card */}
        <TicketPassCard
          appointment={activePassAppointment}
          onPress={() => {
            if (activePassAppointment) {
              // Nav to detail
            } else {
              navigation.navigate('DoctorList', {});
            }
          }}
          onActionPress={() => {
            if (activePassAppointment?.videoCallToken) {
              navigation.navigate('VideoCall', {
                appointmentId: activePassAppointment.id,
                token: activePassAppointment.videoCallToken,
              });
            } else {
              navigation.navigate('DoctorList', {});
            }
          }}
        />

        {/* Daily Vitals */}
        <VitalsSummary
          onPressVital={() => {
            navigation.navigate('SymptomTriage');
          }}
        />

        {/* Quick Services Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
        </View>

        <View style={styles.servicesGrid}>
          {QUICK_SERVICES.map(service => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate(service.screen as any)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={service.label}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: service.bgColor }]}>
                <Ionicons name={service.icon} size={22} color={service.color} />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
              <Text style={styles.serviceDesc}>{service.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* OpenStreetMap Banner */}
        <TouchableOpacity
          style={styles.osmBanner}
          onPress={() => navigation.navigate('OpenMaps')}
          activeOpacity={0.85}
        >
          <View style={styles.osmBannerLeft}>
            <View style={styles.osmTag}>
              <Ionicons name="map" size={13} color={Colors.white} />
              <Text style={styles.osmTagText}>OPEN MAPS</Text>
            </View>
            <Text style={styles.osmBannerTitle}>Explore Nearby Healthcare</Text>
            <Text style={styles.osmBannerSub}>
              Discover certified clinics, pharmacies, and emergency rooms with OpenStreetMap.
            </Text>
          </View>
          <View style={styles.osmBannerArrow}>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Find Specialists Filter Chips */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Find Specialists</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorList', {})}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Doctors List */}
        <View style={styles.doctorsContainer}>
          {isLoadingDoctors ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
              <Text style={styles.loadingText}>Fetching available specialists…</Text>
            </View>
          ) : doctorError ? (
            // REQUIREMENT 2: DO NOT fall back to fake mock data. Show ErrorState.
            <ErrorState
              title="Failed to Load Doctors"
              message={doctorError}
              onRetry={loadDoctors}
            />
          ) : filteredDoctors.length === 0 ? (
            <EmptyState
              icon="person-outline"
              title="No Doctors Available"
              subtitle="No specialists found for this category right now."
            />
          ) : (
            filteredDoctors.map(doc => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: doc.id })}
                onBookPress={() => navigation.navigate('BookAppointment', { doctorId: doc.id })}
              />
            ))
          )}
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {i18n.t('home.upcomingAppointments')}
          </Text>
        </View>

        <View style={styles.appointmentsContainer}>
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
                onPress={() => { }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scroll: {
    paddingHorizontal: Spacing[4],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[150],
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary[100],
  },
  greeting: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  travelHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  travelFlag: {
    fontSize: 14,
  },
  travelHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
    maxWidth: 120,
  },

  // Travel Banner
  travelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  travelBannerLeft: {
    flex: 1,
    paddingRight: Spacing[2],
  },
  travelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  travelBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
    letterSpacing: 0.6,
  },
  travelBannerTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  travelBannerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    lineHeight: 16,
  },
  travelBannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[5],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[500],
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  serviceCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  serviceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  serviceLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  serviceDesc: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // OpenStreetMap Banner
  osmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[900],
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[5],
    marginTop: Spacing[5],
    ...Shadows.md,
  },
  osmBannerLeft: {
    flex: 1,
    marginRight: Spacing[3],
  },
  osmTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing[2],
  },
  osmTagText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  osmBannerTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  osmBannerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    lineHeight: 16,
  },
  osmBannerArrow: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryScroll: {
    gap: Spacing[2],
    paddingBottom: Spacing[2],
  },
  categoryPill: {
    paddingHorizontal: Spacing[4],
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
  },
  categoryPillActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
  },
  categoryPillTextActive: {
    color: Colors.white,
  },

  doctorsContainer: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[6],
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },

  appointmentsContainer: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
});
