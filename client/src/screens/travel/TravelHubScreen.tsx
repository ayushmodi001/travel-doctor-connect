/**
 * TravelHubScreen – International Travel Companion Command Center.
 * Provides destination country intelligence, instant local emergency EMS calling,
 * water/vaccine advisories, embassy support, and direct access to medical translator,
 * international medicine brand equivalents, and travel insurance assistance.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelStackParamList, DestinationCountry } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { TravelService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';

type NavProp = NativeStackNavigationProp<TravelStackParamList>;

export default function TravelHubScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const [countries, setCountries] = useState<DestinationCountry[]>([]);
  const [activeCountry, setActiveCountry] = useState<DestinationCountry | null>(null);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Automatically detect device location and set active country by default
  const detectAndApplyUserLocation = useCallback(async (availableCountries: DestinationCountry[]): Promise<DestinationCountry | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const isoCode = geocode[0].isoCountryCode?.toUpperCase();
        const countryName = geocode[0].country || 'Current Destination';

        if (isoCode) {
          setDetectedCountryCode(isoCode);
          const match = availableCountries.find(
            c => c.code.toUpperCase() === isoCode || c.name.toLowerCase() === countryName.toLowerCase()
          );

          if (match) {
            setActiveCountry(match);
            return match;
          }

          // Build dynamic destination for traveler's detected country
          const dynamicCountry: DestinationCountry = {
            code: isoCode,
            name: countryName,
            flag: getFlagEmoji(isoCode),
            capital: geocode[0].city || geocode[0].region || countryName,
            currency: isoCode === 'IN' ? 'INR' : isoCode === 'US' ? 'USD' : isoCode === 'GB' ? 'GBP' : 'EUR',
            currencySymbol: isoCode === 'IN' ? '₹' : isoCode === 'US' ? '$' : isoCode === 'GB' ? '£' : '€',
            primaryLanguage: isoCode === 'IN' ? 'Hindi / English' : 'Local / English',
            emergencyNumbers: {
              general: isoCode === 'US' ? '911' : '112',
              ambulance: isoCode === 'IN' ? '108' : isoCode === 'US' ? '911' : '112',
              police: isoCode === 'IN' ? '100' : isoCode === 'US' ? '911' : '112',
              fire: isoCode === 'IN' ? '101' : isoCode === 'US' ? '911' : '112',
            },
            embassySupport: {
              title: 'Emergency Medical & Consular Services',
              phone: '+1 888 407 4747',
              address: `${geocode[0].city || 'Capital City'}, ${countryName}`,
            },
            healthAdvisories: {
              waterSafety: isoCode === 'IN' ? 'bottled_recommended' : 'safe',
              malariaRisk: isoCode === 'IN' ? 'low' : 'none',
              requiredVaccines: ['None for general entry'],
              recommendedVaccines: ['Routine vaccines'],
              currentAlert: `Local Emergency Services: Dial ${isoCode === 'US' ? '911' : '112'} for immediate first responder assistance.`,
            },
          };

          setActiveCountry(dynamicCountry);
          return dynamicCountry;
        }
      }
    } catch (locErr) {
      console.warn('[TravelHub] GPS country detection notice:', locErr);
    }
    return null;
  }, []);

  const loadCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getDestinationCountries();
      setCountries(data);

      // Automatically detect and select GPS location by default
      const detected = await detectAndApplyUserLocation(data);
      if (!detected && data.length > 0) {
        setActiveCountry(data[0]);
      } else if (!detected && data.length === 0) {
        throw new Error('No destination countries returned from healthcare server.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to travel intelligence server.');
    } finally {
      setIsLoading(false);
    }
  }, [detectAndApplyUserLocation]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);


  const handleCallEmergency = (number: string, title: string) => {
    if (!activeCountry) return;
    Alert.alert(
      `Call ${title}?`,
      `You are about to dial local emergency services in ${activeCountry.name} (${number}). Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Call ${number}`,
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${number}`).catch(() => {
              Alert.alert('Unable to dial', `Please dial ${number} manually.`);
            });
          },
        },
      ]
    );
  };

  const handleCallEmbassy = () => {
    if (!activeCountry) return;
    const phone = activeCountry.embassySupport.phone.replace(/\s+/g, '');
    Alert.alert(
      'Call Consular Services?',
      `Dial ${activeCountry.embassySupport.title} at ${activeCountry.embassySupport.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading destination intelligence…</Text>
      </View>
    );
  }

  if (error || !activeCountry) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          title="Destination Intelligence Unavailable"
          message={error || 'Unable to load destination data.'}
          onRetry={loadCountries}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 20) + Spacing[2],
            paddingBottom: Math.max(insets.bottom, 20) + Spacing[8],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>INTERNATIONAL TRAVEL COMPANION</Text>
            </View>
            <Text style={styles.title}>Global Health Hub</Text>
          </View>

          {/* Automatically Detected Location Pill */}
          <View style={styles.countryDetectedPill}>
            <View style={styles.liveGpsDot} />
            <Text style={styles.flagEmoji}>{activeCountry.flag}</Text>
            <Text style={styles.countryName}>{activeCountry.name}</Text>
          </View>
        </View>

        {/* Local Emergency SOS Banner */}
        <View style={styles.sosBanner}>
          <View style={styles.sosHeader}>
            <View style={styles.sosTitleRow}>
              <View style={styles.sosIconCircle}>
                <Ionicons name="warning" size={16} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.sosTitle}>
                  {activeCountry.name} Local Emergency EMS
                </Text>
                <Text style={styles.sosSub}>
                  One-tap direct dial to local first responders
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sosButtonsRow}>
            {/* General 112/911/999 */}
            <TouchableOpacity
              style={[styles.sosBtn, styles.sosBtnPrimary]}
              onPress={() =>
                handleCallEmergency(
                  activeCountry.emergencyNumbers.general,
                  'General Emergency'
                )
              }
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={18} color={Colors.white} />
              <View>
                <Text style={styles.sosBtnPrimaryLabel}>Emergency</Text>
                <Text style={styles.sosBtnPrimaryNumber}>
                  {activeCountry.emergencyNumbers.general}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Ambulance */}
            <TouchableOpacity
              style={[styles.sosBtn, styles.sosBtnSecondary]}
              onPress={() =>
                handleCallEmergency(
                  activeCountry.emergencyNumbers.ambulance,
                  'Medical Ambulance'
                )
              }
              activeOpacity={0.85}
            >
              <Ionicons name="medkit" size={16} color={Colors.primary[600]} />
              <View>
                <Text style={styles.sosBtnSecondaryLabel}>Ambulance</Text>
                <Text style={styles.sosBtnSecondaryNumber}>
                  {activeCountry.emergencyNumbers.ambulance}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Police */}
            <TouchableOpacity
              style={[styles.sosBtn, styles.sosBtnSecondary]}
              onPress={() =>
                handleCallEmergency(
                  activeCountry.emergencyNumbers.police,
                  'Local Police'
                )
              }
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={16} color={Colors.neutral[800]} />
              <View>
                <Text style={styles.sosBtnSecondaryLabel}>Police</Text>
                <Text style={styles.sosBtnSecondaryNumber}>
                  {activeCountry.emergencyNumbers.police}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Travel Health Intelligence Card */}
        <View style={styles.advisoryCard}>
          <View style={styles.advisoryHeader}>
            <Ionicons name="shield" size={18} color={Colors.sage.main} />
            <Text style={styles.advisoryTitle}>
              Health & Entry Advisory for {activeCountry.name}
            </Text>
          </View>

          <View style={styles.advisoryPillsRow}>
            {/* Water Safety */}
            <View
              style={[
                styles.healthMetricPill,
                activeCountry.healthAdvisories.waterSafety === 'safe'
                  ? styles.healthMetricSafe
                  : styles.healthMetricCaution,
              ]}
            >
              <Ionicons
                name="water"
                size={14}
                color={
                  activeCountry.healthAdvisories.waterSafety === 'safe'
                    ? Colors.sage.main
                    : Colors.ochre.main
                }
              />
              <Text
                style={[
                  styles.healthMetricText,
                  {
                    color:
                      activeCountry.healthAdvisories.waterSafety === 'safe'
                        ? Colors.sage.dark
                        : Colors.ochre.dark,
                  },
                ]}
              >
                {activeCountry.healthAdvisories.waterSafety === 'safe'
                  ? 'Tap Water Safe'
                  : 'Bottled Water Only'}
              </Text>
            </View>

            {/* Currency & Language */}
            <View style={[styles.healthMetricPill, styles.healthMetricNeutral]}>
              <Ionicons name="cash-outline" size={14} color={Colors.neutral[700]} />
              <Text style={styles.healthMetricNeutralText}>
                {activeCountry.currency} ({activeCountry.currencySymbol})
              </Text>
            </View>

            <View style={[styles.healthMetricPill, styles.healthMetricNeutral]}>
              <Ionicons name="chatbubbles-outline" size={14} color={Colors.neutral[700]} />
              <Text style={styles.healthMetricNeutralText}>
                {activeCountry.primaryLanguage}
              </Text>
            </View>
          </View>

          {activeCountry.healthAdvisories.currentAlert && (
            <View style={styles.alertNotice}>
              <Ionicons name="information-circle" size={16} color={Colors.ochre.main} />
              <Text style={styles.alertNoticeText}>
                {activeCountry.healthAdvisories.currentAlert}
              </Text>
            </View>
          )}

          {/* Recommended Vaccines */}
          <View style={styles.vaccineRow}>
            <Text style={styles.vaccineLabel}>Recommended Vaccines:</Text>
            <Text style={styles.vaccineValue}>
              {activeCountry.healthAdvisories.recommendedVaccines.join(' • ')}
            </Text>
          </View>
        </View>

        {/* Section: Travel Health Services */}
        <Text style={styles.sectionTitle}>International Care Tools</Text>

        <View style={styles.toolsGrid}>
          {/* 1. Medical Translator & Phrasebook */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('MedicalTranslator', {})}
            activeOpacity={0.88}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: '#FDF2F0' }]}>
              <Ionicons name="language" size={24} color={Colors.primary[500]} />
            </View>
            <View style={styles.toolContent}>
              <View style={styles.toolBadgeRow}>
                <Text style={styles.toolBadgeText}>DOCTOR PHRASEBOOK</Text>
              </View>
              <Text style={styles.toolTitle}>Medical Translator</Text>
              <Text style={styles.toolDesc}>
                Phonetic phrases & high-contrast screen cards for foreign doctors and pharmacies.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>

          {/* 2. Global Medicine Equivalents */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('MedicineEquivalents')}
            activeOpacity={0.88}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: Colors.sage.light }]}>
              <Ionicons name="fitness" size={24} color={Colors.sage.main} />
            </View>
            <View style={styles.toolContent}>
              <View style={[styles.toolBadgeRow, { backgroundColor: Colors.sage.light }]}>
                <Text style={[styles.toolBadgeText, { color: Colors.sage.dark }]}>
                  CROSS-BORDER MEDS
                </Text>
              </View>
              <Text style={styles.toolTitle}>Medicine Converter</Text>
              <Text style={styles.toolDesc}>
                Foreign brand equivalents for Tylenol, Advil, Imodium & customs banned drug alerts.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>

          {/* 3. Travel Insurance & Claims */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('TravelInsurance')}
            activeOpacity={0.88}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: Colors.terracotta.light }]}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.terracotta.main} />
            </View>
            <View style={styles.toolContent}>
              <View style={[styles.toolBadgeRow, { backgroundColor: Colors.terracotta.light }]}>
                <Text style={[styles.toolBadgeText, { color: Colors.terracotta.dark }]}>
                  24/7 HOTLINE
                </Text>
              </View>
              <Text style={styles.toolTitle}>Travel Insurance Vault</Text>
              <Text style={styles.toolDesc}>
                Digital emergency card, 24/7 global claim desk, and document checklist.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>

          {/* 4. Find English-Speaking Doctors Abroad */}
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('DoctorList', {})}
            activeOpacity={0.88}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: Colors.ochre.light }]}>
              <Ionicons name="person-add" size={24} color={Colors.ochre.dark} />
            </View>
            <View style={styles.toolContent}>
              <View style={[styles.toolBadgeRow, { backgroundColor: Colors.ochre.light }]}>
                <Text style={[styles.toolBadgeText, { color: Colors.ochre.dark }]}>
                  GLOBAL SPECIALISTS
                </Text>
              </View>
              <Text style={styles.toolTitle}>Find Doctors in {activeCountry.name}</Text>
              <Text style={styles.toolDesc}>
                Verified multilingual doctors with video & in-person appointments in {activeCountry.currencySymbol}.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* Embassy Assistance Banner */}
        <View style={styles.embassyCard}>
          <View style={styles.embassyTop}>
            <Ionicons name="business-outline" size={20} color={Colors.neutral[800]} />
            <Text style={styles.embassyTitle}>{activeCountry.embassySupport.title}</Text>
          </View>
          <Text style={styles.embassyAddress}>{activeCountry.embassySupport.address}</Text>

          <TouchableOpacity
            style={styles.embassyCallBtn}
            onPress={handleCallEmbassy}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={14} color={Colors.white} />
            <Text style={styles.embassyCallText}>
              Call Consular Assistance ({activeCountry.embassySupport.phone})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  scroll: {
    paddingHorizontal: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[500],
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
    letterSpacing: 0.8,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.5,
  },
  countryDetectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  liveGpsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
  },

  // SOS Banner
  sosBanner: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  sosHeader: {
    marginBottom: Spacing[3],
  },
  sosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  sosIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  sosSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  sosButtonsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  sosBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
  },
  sosBtnPrimary: {
    backgroundColor: Colors.primary[500],
    flex: 1.2,
  },
  sosBtnPrimaryLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  sosBtnPrimaryNumber: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  sosBtnSecondary: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  sosBtnSecondaryLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
  },
  sosBtnSecondaryNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },

  // Advisory Card
  advisoryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  advisoryTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  advisoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  healthMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  healthMetricSafe: {
    backgroundColor: Colors.sage.light,
  },
  healthMetricCaution: {
    backgroundColor: Colors.ochre.light,
  },
  healthMetricText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  healthMetricNeutral: {
    backgroundColor: Colors.neutral[100],
  },
  healthMetricNeutralText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.ochre.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  alertNoticeText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.ochre.dark,
    lineHeight: 16,
  },
  vaccineRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[150],
    paddingTop: Spacing[2],
  },
  vaccineLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vaccineValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[800],
  },

  // Tools Section
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
    marginBottom: Spacing[3],
  },
  toolsGrid: {
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolContent: {
    flex: 1,
  },
  toolBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF2F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 3,
  },
  toolBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
    letterSpacing: 0.5,
  },
  toolTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    lineHeight: 16,
  },

  // Embassy Card
  embassyCard: {
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  embassyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 4,
  },
  embassyTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  embassyAddress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginBottom: Spacing[3],
  },
  embassyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.neutral[900],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.full,
  },
  embassyCallText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
