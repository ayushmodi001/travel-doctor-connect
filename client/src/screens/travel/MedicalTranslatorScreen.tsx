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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MedicalPhrase } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { TravelService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';

const LANGUAGES = [
  { code: 'all', label: 'All Languages', flag: '🌐' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Phrases' },
  { id: 'emergency', label: '🚨 Emergency' },
  { id: 'allergies', label: '⚠️ Allergies' },
  { id: 'pharmacy', label: '💊 Pharmacy' },
  { id: 'symptoms', label: '🩺 Symptoms' },
  { id: 'doctor', label: '👨‍⚕️ At Doctor' },
];

export default function MedicalTranslatorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [phrases, setPhrases] = useState<MedicalPhrase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fullscreenPhrase, setFullscreenPhrase] = useState<MedicalPhrase | null>(null);

  const loadPhrases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getMedicalPhrases();
      setPhrases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to medical translation server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhrases();
  }, [loadPhrases]);

  const filteredPhrases = useMemo(() => {
    return phrases.filter(phrase => {
      const matchesLang =
        selectedLanguage === 'all' || phrase.languageCode === selectedLanguage;
      const matchesCat =
        selectedCategory === 'all' || phrase.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        phrase.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.phonetic.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesLang && matchesCat && matchesSearch;
    });
  }, [phrases, selectedLanguage, selectedCategory, searchQuery]);


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
          <Text style={styles.headerSub}>Bilingual doctor & pharmacy phrasebook</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search symptoms, pain, penicillin, medicine…"
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

      {/* Language Selector Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {LANGUAGES.map(lang => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langChip,
                isSelected && styles.langChipSelected,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.langLabel,
                  isSelected && styles.langLabelSelected,
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterScroll, { paddingTop: 4 }]}
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

      {/* Phrases List */}
      <ScrollView
        contentContainerStyle={[
          styles.listScroll,
          { paddingBottom: Math.max(insets.bottom, 20) + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
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

              {/* Translation in Foreign Language */}
              <View style={styles.transWrap}>
                <Text style={styles.transText}>{phrase.translation}</Text>
                <Text style={styles.phoneticText}>🗣️ {phrase.phonetic}</Text>
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

              <Text style={styles.modalForeignText}>
                {fullscreenPhrase.translation}
              </Text>

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
  filterScroll: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
  },
  langChipSelected: {
    backgroundColor: Colors.neutral[900],
    borderColor: Colors.neutral[900],
  },
  langFlag: {
    fontSize: 14,
  },
  langLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
  },
  langLabelSelected: {
    color: Colors.white,
  },
  catChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  catChipSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  catLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  catLabelSelected: {
    color: Colors.primary[600],
    fontFamily: Typography.fontFamily.bold,
  },
  listScroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    gap: Spacing[3],
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
  transText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
    marginBottom: 4,
    lineHeight: 24,
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
  modalForeignText: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: Spacing[5],
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
