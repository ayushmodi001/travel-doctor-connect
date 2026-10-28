/**
 * TravelHubScreen – International Travel Companion Command Center.
 * Provides destination country intelligence, instant local emergency EMS calling,
 * water/vaccine advisories, embassy support, and direct access to medical translator,
 * international medicine brand equivalents, and travel insurance assistance.
 * 
 * Powered by Gemini AI for real-time destination health intelligence.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

  // Gemini AI Destination Generator & Country Switcher Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [aiCountryInput, setAiCountryInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Travel destinations database is empty. Please generate real destinations using Gemini AI.');
      }
      setCountries(data);

      const detected = await detectAndApplyUserLocation(data);
      if (detected) {
        setActiveCountry(detected);
      } else {
        setActiveCountry(data[0]);
      }
    } catch (err: any) {
      setCountries([]);
      setActiveCountry(null);
      setError(err.message || 'Travel database is empty. Please generate destination data using Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  }, [detectAndApplyUserLocation]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  // Handle Gemini AI dynamic country harvester
  const handleGenerateWithGemini = async () => {
    if (!aiCountryInput.trim()) {
      Alert.alert('Enter Destination', 'Please type a country name or 2-letter country code (e.g., Greece, Norway, Egypt).');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const newCountry = await TravelService.generateDestinationAI(aiCountryInput.trim());
      // Add or replace in countries list
      setCountries(prev => {
        const filtered = prev.filter(c => c.code.toUpperCase() !== newCountry.code.toUpperCase());
        return [newCountry, ...filtered];
      });
      setActiveCountry(newCountry);
      setAiCountryInput('');
      setIsModalVisible(false);
      Alert.alert(
        '✨ Destination Generated with Gemini',
        `Real-time health advisories, local EMS numbers, and embassy support loaded for ${newCountry.name} (${newCountry.flag})!`
      );
    } catch (genErr: any) {
      Alert.alert('AI Generation Error', genErr.message || 'Failed to harvest intelligence with Gemini.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

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

  const filteredCountriesList = useMemo(() => {
    if (!searchFilter.trim()) return countries;
    const q = searchFilter.toLowerCase().trim();
    return countries.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q)
    );
  }, [countries, searchFilter]);

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
      <View style={[styles.container, { paddingTop: insets.top, paddingHorizontal: Spacing[4] }]}>
        <ErrorState
          title="Travel Database Empty"
          message={error || 'No destination intelligence found in database. Use Gemini AI to generate real destination data.'}
          onRetry={loadCountries}
        />
        <TouchableOpacity
          style={styles.emptyGenBtn}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={18} color={Colors.white} />
          <Text style={styles.emptyGenBtnText}>Generate Destination with Gemini AI</Text>
        </TouchableOpacity>

        {/* Modal to allow generating destination even when DB is empty */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Generate Destination with Gemini</Text>
                  <Text style={styles.modalSubtitle}>Query Gemini AI to harvest verified travel intelligence</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={Colors.neutral[700]} />
                </TouchableOpacity>
              </View>

              <View style={styles.aiGeneratorCard}>
                <View style={styles.aiBadgeRow}>
                  <Ionicons name="sparkles" size={14} color="#7C3AED" />
                  <Text style={styles.aiBadgeText}>GEMINI AI TRAVEL INTELLIGENCE</Text>
                </View>
                <Text style={styles.aiCardDesc}>
                  Type any destination in the world to automatically generate local EMS numbers, vaccine advisories, and embassy care:
                </Text>
                <View style={styles.aiInputRow}>
                  <TextInput
                    style={styles.aiInput}
                    placeholder="e.g. Greece, Norway, Egypt, Brazil..."
                    placeholderTextColor={Colors.neutral[400]}
                    value={aiCountryInput}
                    onChangeText={setAiCountryInput}
                    autoCapitalize="words"
                    editable={!isGeneratingAI}
                  />
                  <TouchableOpacity
                    style={[styles.aiGenerateBtn, isGeneratingAI && { opacity: 0.7 }]}
                    onPress={handleGenerateWithGemini}
                    disabled={isGeneratingAI}
                    activeOpacity={0.85}
                  >
                    {isGeneratingAI ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={14} color={Colors.white} />
                        <Text style={styles.aiGenerateBtnText}>Generate</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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

          {/* Destination Selector Pill */}
          <TouchableOpacity
            style={styles.countryDetectedPill}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Switch destination country"
          >
            <View style={styles.liveGpsDot} />
            <Text style={styles.flagEmoji}>{activeCountry.flag}</Text>
            <Text style={styles.countryName}>{activeCountry.name}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        {/* Quick Horizontal Destination Selector Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countryPillsScroll}
          >
            {countries.map(country => {
              const isActive = country.code.toUpperCase() === activeCountry.code.toUpperCase();
              return (
                <TouchableOpacity
                  key={country.code}
                  style={[styles.countryChip, isActive && styles.countryChipActive]}
                  onPress={() => setActiveCountry(country)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.countryChipFlag}>{country.flag}</Text>
                  <Text style={[styles.countryChipText, isActive && styles.countryChipTextActive]}>
                    {country.name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={13} color={Colors.white} style={{ marginLeft: 2 }} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* AI Generator Action Pill */}
            <TouchableOpacity
              style={styles.countryChipAi}
              onPress={() => setIsModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={14} color={Colors.primary[600]} />
              <Text style={styles.countryChipAiText}>+ Add with Gemini</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Local Emergency SOS Banner */}
        <View style={styles.sosBanner}>
          <View style={styles.sosHeader}>
            <View style={styles.sosTitleRow}>
              <View style={styles.sosIconCircle}>
                <Ionicons name="warning" size={16} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosTitle}>
                  {activeCountry.name} Local Emergency EMS
                </Text>
                <Text style={styles.sosSub}>
                  One-tap direct dial to certified local first responders
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
            <View style={styles.advisoryHeaderTitleRow}>
              <Ionicons name="shield" size={18} color={Colors.sage.main} />
              <Text style={styles.advisoryTitle}>
                Health & Entry Advisory for {activeCountry.name}
              </Text>
            </View>
            <View style={styles.capitalTag}>
              <Text style={styles.capitalTagText}>Capital: {activeCountry.capital}</Text>
            </View>
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
          {activeCountry.healthAdvisories.recommendedVaccines &&
            activeCountry.healthAdvisories.recommendedVaccines.length > 0 && (
              <View style={styles.vaccineRow}>
                <Text style={styles.vaccineLabel}>Recommended Vaccines:</Text>
                <Text style={styles.vaccineValue}>
                  {activeCountry.healthAdvisories.recommendedVaccines.join(' • ')}
                </Text>
              </View>
            )}
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
                Phonetic phrases & high-contrast screen cards for foreign doctors and pharmacies in {activeCountry.name}.
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
                Brand equivalents for Tylenol, Advil, Imodium & customs banned drug alerts abroad.
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

      {/* ─── Gemini AI Destination Harvester & Country Selector Modal ─── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Destination</Text>
                <Text style={styles.modalSubtitle}>16+ verified destinations or generate with Gemini AI</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={Colors.neutral[700]} />
              </TouchableOpacity>
            </View>

            {/* Gemini AI Country Generator Box */}
            <View style={styles.aiGeneratorCard}>
              <View style={styles.aiBadgeRow}>
                <Ionicons name="sparkles" size={14} color="#7C3AED" />
                <Text style={styles.aiBadgeText}>GEMINI AI TRAVEL INTELLIGENCE</Text>
              </View>
              <Text style={styles.aiCardDesc}>
                Type any destination in the world to automatically generate local EMS numbers, vaccine advisories, and embassy care:
              </Text>
              <View style={styles.aiInputRow}>
                <TextInput
                  style={styles.aiInput}
                  placeholder="e.g. Greece, Norway, Egypt, Brazil..."
                  placeholderTextColor={Colors.neutral[400]}
                  value={aiCountryInput}
                  onChangeText={setAiCountryInput}
                  autoCapitalize="words"
                  editable={!isGeneratingAI}
                />
                <TouchableOpacity
                  style={[styles.aiGenerateBtn, isGeneratingAI && { opacity: 0.7 }]}
                  onPress={handleGenerateWithGemini}
                  disabled={isGeneratingAI}
                  activeOpacity={0.85}
                >
                  {isGeneratingAI ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={14} color={Colors.white} />
                      <Text style={styles.aiGenerateBtnText}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Existing Countries */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={Colors.neutral[500]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search verified countries…"
                placeholderTextColor={Colors.neutral[400]}
                value={searchFilter}
                onChangeText={setSearchFilter}
              />
              {searchFilter.length > 0 && (
                <TouchableOpacity onPress={() => setSearchFilter('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Countries List */}
            <ScrollView style={styles.countriesList} showsVerticalScrollIndicator={false}>
              {filteredCountriesList.map(c => {
                const isSelected = c.code.toUpperCase() === activeCountry.code.toUpperCase();
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.countryListItem, isSelected && styles.countryListItemActive]}
                    onPress={() => {
                      setActiveCountry(c);
                      setIsModalVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.countryListFlag}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.countryListName, isSelected && styles.countryListNameActive]}>
                        {c.name}
                      </Text>
                      <Text style={styles.countryListSub}>
                        {c.capital} • {c.currency} ({c.currencySymbol}) • EMS: {c.emergencyNumbers.general}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: Spacing[3],
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

  // Carousel Country Chips
  carouselContainer: {
    marginBottom: Spacing[4],
  },
  countryPillsScroll: {
    gap: Spacing[2],
    paddingVertical: 2,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  countryChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[600],
  },
  countryChipFlag: {
    fontSize: 16,
  },
  countryChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
  },
  countryChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  countryChipAi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  countryChipAiText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: '#7C3AED',
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
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  sosBtnSecondary: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sosBtnSecondaryLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
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
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  advisoryHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
  },
  advisoryTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  capitalTag: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  capitalTagText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
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
    paddingVertical: 6,
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
    fontFamily: Typography.fontFamily.semiBold,
  },
  healthMetricNeutral: {
    backgroundColor: Colors.neutral[100],
  },
  healthMetricNeutralText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[800],
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    backgroundColor: Colors.ochre.light,
    padding: Spacing[3],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing[3],
  },
  alertNoticeText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.ochre.dark,
    lineHeight: 18,
  },
  vaccineRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[150],
    paddingTop: Spacing[3],
  },
  vaccineLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  vaccineValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    lineHeight: 18,
  },

  // Tools Section
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
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
    padding: Spacing[4],
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolContent: {
    flex: 1,
  },
  toolBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF2F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
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
    color: Colors.neutral[600],
    lineHeight: 16,
  },

  // Embassy Card
  embassyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  embassyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 6,
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
    gap: Spacing[2],
    backgroundColor: Colors.neutral[900],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.xl,
  },
  embassyCallText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gemini AI Box in Modal
  aiGeneratorCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.6,
  },
  aiCardDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    lineHeight: 16,
    marginBottom: Spacing[2],
  },
  aiInputRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  aiInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
  },
  aiGenerateBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Search in Modal
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
  },

  // Countries List in Modal
  countriesList: {
    maxHeight: 340,
  },
  countryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[150],
  },
  countryListItemActive: {
    backgroundColor: '#FDF2F0',
    borderRadius: BorderRadius.xl,
  },
  countryListFlag: {
    fontSize: 24,
  },
  countryListName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },
  countryListNameActive: {
    color: Colors.primary[600],
    fontFamily: Typography.fontFamily.bold,
  },
  countryListSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  emptyGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.xl,
    marginTop: Spacing[4],
    alignSelf: 'center',
    ...Shadows.sm,
  },
  emptyGenBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
