/**
 * MedicalTranslatorScreen – International Doctor & Pharmacy Phrasebook.
 * Enables travelers abroad to communicate symptoms, allergies, and emergency needs
 * with local medical professionals using phonetics and a "Show Doctor Fullscreen" display.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MedicalPhrase } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { TravelService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';
import { MEDICAL_PHRASES } from '../../data/travelData';

const CATEGORIES = [
  { id: 'all', label: 'All Phrases' },
  { id: 'emergency', label: '🚨 Emergency' },
  { id: 'allergies', label: '⚠️ Allergies' },
  { id: 'pharmacy', label: '💊 Pharmacy' },
  { id: 'symptoms', label: '🩺 Symptoms' },
  { id: 'doctor', label: '👨‍⚕️ At Doctor' },
];

const COUNTRY_TO_LANG: Record<string, string> = {
  IN: 'hi',
  INDIA: 'hi',
  ES: 'es',
  SPAIN: 'es',
  JP: 'ja',
  JAPAN: 'ja',
  FR: 'fr',
  FRANCE: 'fr',
  DE: 'de',
  GERMANY: 'de',
  IT: 'it',
  ITALY: 'it',
  US: 'en',
  UK: 'en',
};

const LANG_CODE_TO_META: Record<string, { label: string; flag: string }> = {
  hi: { label: 'Hindi', flag: '🇮🇳' },
  es: { label: 'Spanish', flag: '🇪🇸' },
  ja: { label: 'Japanese', flag: '🇯🇵' },
  fr: { label: 'French', flag: '🇫🇷' },
  de: { label: 'German', flag: '🇩🇪' },
  it: { label: 'Italian', flag: '🇮🇹' },
  en: { label: 'English', flag: '🇺🇸' },
};

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

const getSpeechLanguageCode = (langCode?: string): string => {
  if (!langCode) return 'hi-IN';
  const code = langCode.toLowerCase().trim();
  const map: Record<string, string> = {
    hi: 'hi-IN',
    hindi: 'hi-IN',
    es: 'es-ES',
    spanish: 'es-ES',
    ja: 'ja-JP',
    japanese: 'ja-JP',
    fr: 'fr-FR',
    french: 'fr-FR',
    de: 'de-DE',
    german: 'de-DE',
    it: 'it-IT',
    italian: 'it-IT',
    en: 'en-US',
    english: 'en-US',
  };
  return map[code] || code;
};

const getTextToSpeak = (phrase: MedicalPhrase): string => {
  // Strip parenthetical text (e.g. Romanized pronunciation) so TTS pronounces clean native script
  const cleaned = phrase.translation.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned || phrase.translation;
};

export default function MedicalTranslatorScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [phrases, setPhrases] = useState<MedicalPhrase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.initialCategory || 'all');
  const [fullscreenPhrase, setFullscreenPhrase] = useState<MedicalPhrase | null>(null);

  // Text-To-Speech State
  const [speakingPhraseId, setSpeakingPhraseId] = useState<string | null>(null);

  // Auto-Location State
  const [detectedLocation, setDetectedLocation] = useState<{
    countryCode: string;
    countryName: string;
    flag: string;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Gemini Live AI Translation State
  const [customText, setCustomText] = useState('');
  const [isTranslatingAI, setIsTranslatingAI] = useState(false);

  // Determine active country & local language from live GPS or route params
  const activeLocationMeta = useMemo(() => {
    const code = (detectedLocation?.countryCode || route.params?.countryCode || 'IN').toUpperCase();
    const countryName = detectedLocation?.countryName || route.params?.countryName || 'India';
    const flag = detectedLocation?.flag || route.params?.flag || '🇮🇳';
    const langCode = COUNTRY_TO_LANG[code] || 'hi';
    const langMeta = LANG_CODE_TO_META[langCode] || { label: 'Hindi', flag: '🇮🇳' };

    return {
      countryCode: code,
      countryName,
      flag,
      langCode,
      langLabel: langMeta.label,
    };
  }, [detectedLocation, route.params]);

  // GPS Location Permission & Country Auto-Detection
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsDetectingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const geo = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (isMounted && geo && geo.length > 0) {
          const rawIso = geo[0].isoCountryCode?.toUpperCase();
          const iso = rawIso === 'GB' ? 'UK' : rawIso || '';
          const countryName = geo[0].country || 'Current Destination';
          const flag = iso ? getFlagEmoji(iso) : '📍';

          setDetectedLocation({
            countryCode: iso,
            countryName,
            flag,
          });
        }
      } catch (locErr) {
        console.warn('[MedicalTranslator] GPS country detection notice:', locErr);
      } finally {
        if (isMounted) setIsDetectingLocation(false);
      }
    })();

    return () => {
      isMounted = false;
      Speech.stop();
    };
  }, []);

  // Text-To-Speech Handler
  const handleSpeak = (phrase: MedicalPhrase) => {
    if (speakingPhraseId === phrase.id) {
      Speech.stop();
      setSpeakingPhraseId(null);
      return;
    }

    Speech.stop();
    const textToSpeak = getTextToSpeak(phrase);
    const lang = getSpeechLanguageCode(phrase.languageCode || activeLocationMeta.langCode);

    setSpeakingPhraseId(phrase.id);

    Speech.speak(textToSpeak, {
      language: lang,
      rate: 0.85,
      pitch: 1.0,
      onDone: () => setSpeakingPhraseId(null),
      onStopped: () => setSpeakingPhraseId(null),
      onError: (err) => {
        console.warn('[TTS] Speech error:', err);
        setSpeakingPhraseId(null);
      },
    });
  };

  const handleTranslateWithGemini = async () => {
    const text = customText.trim();
    if (!text) {
      Alert.alert('Enter Phrase', 'Please type a symptom, allergy, or request (e.g., "I need an asthma inhaler", "Are there nuts in this?").');
      return;
    }
    setIsTranslatingAI(true);
    try {
      const res = await TravelService.translateText(text, activeLocationMeta.langCode);
      const newPhrase: MedicalPhrase = {
        id: `ai-gemini-${Date.now()}`,
        category: selectedCategory === 'all' ? 'symptoms' : (selectedCategory as any),
        english: text,
        translation: res.translatedText,
        phonetic: res.phonetic,
        language: activeLocationMeta.langLabel,
        languageCode: activeLocationMeta.langCode,
        flag: activeLocationMeta.flag,
      };
      setPhrases(prev => [newPhrase, ...prev]);
      setCustomText('');
      Alert.alert(
        '✨ Translated with Gemini AI',
        `Successfully translated into ${activeLocationMeta.langLabel} (${activeLocationMeta.flag}) and saved to your phrasebook!`
      );
    } catch (err: any) {
      Alert.alert('Translation Error', err.message || 'Gemini translation service temporarily unavailable.');
    } finally {
      setIsTranslatingAI(false);
    }
  };

  const loadPhrases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getMedicalPhrases();
      if (Array.isArray(data) && data.length > 0) {
        setPhrases(data);
      } else {
        setPhrases(MEDICAL_PHRASES);
      }
    } catch (err: any) {
      console.warn('[MedicalTranslator] Server offline, falling back to local phrasebook:', err.message);
      setPhrases(MEDICAL_PHRASES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhrases();
  }, [loadPhrases]);

  const phraseList = Array.isArray(phrases) && phrases.length > 0 ? phrases : MEDICAL_PHRASES;

  const filteredPhrases = useMemo(() => {
    return phraseList.filter(phrase => {
      const matchesLang = (phrase.languageCode || '').toLowerCase() === activeLocationMeta.langCode.toLowerCase();
      const matchesCat =
        selectedCategory === 'all' || phrase.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        phrase.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.phonetic.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesLang && matchesCat && matchesSearch;
    });
  }, [phraseList, activeLocationMeta.langCode, selectedCategory, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 20) + Spacing[2] },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Medical Translator</Text>
          <View style={styles.headerLocationRow}>
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color={Colors.primary[600]} style={{ width: 10, height: 10 }} />
            ) : (
              <View style={styles.liveGpsDot} />
            )}
            <Text style={styles.headerSub}>
              {isDetectingLocation
                ? 'Detecting your location…'
                : `${activeLocationMeta.countryName} ${activeLocationMeta.flag} • ${activeLocationMeta.langLabel} Phrasebook`}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeLocationMeta.langLabel} phrases, symptoms, medicine…`}
          placeholderTextColor={Colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Destination Banner */}
      <View style={styles.destBanner}>
        <Ionicons name="navigate" size={13} color={Colors.primary[600]} />
        <Text style={styles.destBannerText}>
          {activeLocationMeta.countryName} {activeLocationMeta.flag} • Local Language: {activeLocationMeta.langLabel} (GPS Auto-Located)
        </Text>
      </View>

      {/* Category Pills (Clean uncompressed horizontal bar) */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  isSelected && styles.catChipSelected,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.catLabel,
                    isSelected && styles.catLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Phrases List */}
      <ScrollView
        contentContainerStyle={[
          styles.listScroll,
          { paddingBottom: Math.max(insets.bottom, 20) + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gemini AI Live Translator Card */}
        <View style={styles.aiComposerBox}>
          <View style={styles.aiComposerHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={13} color="#7C3AED" />
              <Text style={styles.aiBadgeText}>GEMINI 2.5 LIVE MEDICAL TRANSLATOR</Text>
            </View>
            <View style={styles.neonDbTag}>
              <Text style={styles.neonDbTagText}>NEON DB SYNCED</Text>
            </View>
          </View>
          <Text style={styles.aiComposerTitle}>Translate Custom Symptom or Question</Text>
          <TextInput
            style={styles.aiInput}
            placeholder="Type any medical sentence (e.g. 'I am diabetic and feeling faint')…"
            placeholderTextColor={Colors.neutral[400]}
            value={customText}
            onChangeText={setCustomText}
            multiline
          />
          {/* Target Language locked to auto-located language */}
          <View style={styles.aiLangRow}>
            <Text style={styles.aiLangLabel}>Target Language:</Text>
            <View style={styles.aiAutoLangBadge}>
              <View style={styles.liveGpsDot} />
              <Text style={styles.aiAutoLangText}>
                {activeLocationMeta.flag} {activeLocationMeta.langLabel} (Auto-Located)
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.aiTranslateBtn, isTranslatingAI && { opacity: 0.7 }]}
            onPress={handleTranslateWithGemini}
            disabled={isTranslatingAI}
            activeOpacity={0.88}
          >
            {isTranslatingAI ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color={Colors.white} />
                <Text style={styles.aiTranslateBtnText}>Translate with Gemini AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={{ marginTop: 12, color: Colors.neutral[600], fontSize: 13, fontFamily: Typography.fontFamily.medium }}>
              Connecting to medical phrase service…
            </Text>
          </View>
        ) : error ? (
          <ErrorState
            title="Phrasebook Unavailable"
            message={error}
            onRetry={loadPhrases}
          />
        ) : filteredPhrases.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbox-ellipses-outline" size={40} color={Colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No phrases found</Text>
            <Text style={styles.emptySub}>
              Try searching for different symptoms or clearing the filters.
            </Text>
          </View>
        ) : (
          filteredPhrases.map(phrase => (
            <View key={phrase.id} style={styles.phraseCard}>
              <View style={styles.phraseCardTop}>
                <View style={styles.phraseLangBadge}>
                  <Text style={styles.phraseFlag}>{phrase.flag}</Text>
                  <Text style={styles.phraseLangText}>{phrase.language}</Text>
                </View>
                <View style={styles.phraseCatBadge}>
                  <Text style={styles.phraseCatText}>
                    {phrase.category.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* English */}
              <Text style={styles.englishText}>{phrase.english}</Text>

              {/* Translation in Foreign Language with Audio TTS Button */}
              <View style={styles.transWrap}>
                <View style={styles.transHeaderRow}>
                  <Text style={styles.transText}>{phrase.translation}</Text>
                  <TouchableOpacity
                    style={[
                      styles.speakBtn,
                      speakingPhraseId === phrase.id && styles.speakBtnActive,
                    ]}
                    onPress={() => handleSpeak(phrase)}
                    accessibilityRole="button"
                    accessibilityLabel="Listen to pronunciation"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={speakingPhraseId === phrase.id ? 'volume-high' : 'volume-medium'}
                      size={20}
                      color={speakingPhraseId === phrase.id ? Colors.primary[600] : Colors.neutral[600]}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.phoneticText}>🗣️ {phrase.phonetic}</Text>
              </View>

              <View style={styles.dbVerifiedRow}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.sage.main} />
                <Text style={styles.dbVerifiedText}>Verified Neon DB Record</Text>
              </View>

              {/* Action: Show Doctor Fullscreen */}
              <TouchableOpacity
                style={styles.showDoctorBtn}
                onPress={() => setFullscreenPhrase(phrase)}
                activeOpacity={0.85}
              >
                <Ionicons name="expand-outline" size={14} color={Colors.primary[600]} />
                <Text style={styles.showDoctorBtnText}>
                  Show Doctor / Pharmacist (Large Display)
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Fullscreen Doctor Display Modal */}
      <Modal
        visible={!!fullscreenPhrase}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setFullscreenPhrase(null)}
      >
        <View
          style={[
            styles.modalContainer,
            {
              paddingTop: Math.max(insets.top, 24) + Spacing[4],
              paddingBottom: Math.max(insets.bottom, 24) + Spacing[6],
            },
          ]}
        >
          <View style={styles.modalTopNav}>
            <View style={styles.modalNoticePill}>
              <Ionicons name="eye" size={16} color={Colors.primary[600]} />
              <Text style={styles.modalNoticeText}>
                SHOW THIS SCREEN TO YOUR HEALTHCARE PROVIDER
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setFullscreenPhrase(null)}
              style={styles.modalDoneBtn}
            >
              <Ionicons name="close" size={24} color={Colors.neutral[800]} />
            </TouchableOpacity>
          </View>

          {fullscreenPhrase && (
            <View style={styles.modalCard}>
              <View style={styles.modalLangHeader}>
                <Text style={styles.modalFlag}>{fullscreenPhrase.flag}</Text>
                <Text style={styles.modalLanguageName}>
                  {fullscreenPhrase.language}
                </Text>
              </View>

              <View style={styles.modalTranslationRow}>
                <Text style={styles.modalForeignText}>
                  {fullscreenPhrase.translation}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.modalSpeakBtn,
                    speakingPhraseId === fullscreenPhrase.id && styles.modalSpeakBtnActive,
                  ]}
                  onPress={() => handleSpeak(fullscreenPhrase)}
                  accessibilityRole="button"
                  accessibilityLabel="Play audio"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={speakingPhraseId === fullscreenPhrase.id ? 'volume-high' : 'volume-medium'}
                    size={28}
                    color={speakingPhraseId === fullscreenPhrase.id ? Colors.primary[600] : Colors.white}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalPhoneticBox}>
                <Text style={styles.modalPhoneticLabel}>Phonetic Pronunciation:</Text>
                <Text style={styles.modalPhoneticValue}>
                  {fullscreenPhrase.phonetic}
                </Text>
              </View>

              <View style={styles.modalEnglishBox}>
                <Text style={styles.modalEnglishLabel}>English Meaning:</Text>
                <Text style={styles.modalEnglishValue}>
                  {fullscreenPhrase.english}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.modalClosePill}
            onPress={() => setFullscreenPhrase(null)}
          >
            <Text style={styles.modalClosePillText}>Done / Close Card</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
  },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveGpsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  destBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  destBannerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[700],
    flex: 1,
  },
  categoryContainer: {
    paddingVertical: Spacing[1],
    marginBottom: Spacing[2],
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
    alignItems: 'center',
  },
  catChip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  catChipSelected: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[700],
  },
  catLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
  },
  catLabelSelected: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  listScroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
    gap: Spacing[3],
  },
  aiComposerBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    ...Shadows.sm,
  },
  aiComposerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  neonDbTag: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  neonDbTagText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#6D28D9',
  },
  aiComposerTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing[2],
  },
  aiInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: Spacing[2],
  },
  aiLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
    marginTop: 2,
  },
  aiLangLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
  },
  aiAutoLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  aiAutoLangText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: '#7C3AED',
  },
  aiTranslateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  aiTranslateBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  dbVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[2],
    marginBottom: 4,
  },
  dbVerifiedText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.sage.dark,
  },
  phraseCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  phraseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  phraseLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  phraseFlag: {
    fontSize: 14,
  },
  phraseLangText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[700],
  },
  phraseCatBadge: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  phraseCatText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[500],
    letterSpacing: 0.5,
  },
  englishText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
    marginBottom: Spacing[2],
  },
  transWrap: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  transHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: 4,
  },
  transText: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
    lineHeight: 24,
  },
  speakBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  speakBtnActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[400],
  },
  phoneticText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  showDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  showDoctorBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[10],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
    marginTop: Spacing[2],
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0E0D',
    paddingHorizontal: Spacing[5],
    justifyContent: 'space-between',
  },
  modalTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(230, 0, 35, 0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  modalNoticeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#FF6B6B',
    letterSpacing: 0.6,
  },
  modalDoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#241E1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#1C1815',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[6],
    borderWidth: 1.5,
    borderColor: '#362E28',
  },
  modalLangHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing[4],
  },
  modalFlag: {
    fontSize: 28,
  },
  modalLanguageName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#DED6CA',
  },
  modalTranslationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[3],
    marginBottom: Spacing[5],
  },
  modalForeignText: {
    flex: 1,
    fontSize: 30,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: 42,
  },
  modalSpeakBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2420',
    borderWidth: 1.5,
    borderColor: '#4A3E36',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  modalSpeakBtnActive: {
    backgroundColor: Colors.primary[700],
    borderColor: Colors.primary[400],
  },
  modalPhoneticBox: {
    backgroundColor: '#2A2420',
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  modalPhoneticLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#968B7E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalPhoneticValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#FFC2C2',
    lineHeight: 20,
  },
  modalEnglishBox: {
    paddingHorizontal: 2,
  },
  modalEnglishLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#968B7E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalEnglishValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#C7BCAD',
  },
  modalClosePill: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePillText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: '#191512',
  },
});
