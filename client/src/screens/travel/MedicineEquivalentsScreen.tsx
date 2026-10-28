/**
 * MedicineEquivalentsScreen – International Medication Brand Converter.
 * Helps travelers find their home country medication equivalents abroad
 * and warns about restricted or banned substances at foreign customs checkpoints.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MedicineEquivalent } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { TravelService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';

export default function MedicineEquivalentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [medicines, setMedicines] = useState<MedicineEquivalent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isResearchingAI, setIsResearchingAI] = useState(false);

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getMedicineEquivalents();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to pharmaceutical database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const handleResearchWithGemini = async (nameToResearch: string) => {
    const medName = (nameToResearch || searchQuery).trim();
    if (!medName) {
      Alert.alert('Enter Medicine', 'Please type a medication or symptom to research (e.g., Metformin, Aspirin, Azithromycin).');
      return;
    }

    setIsResearchingAI(true);
    try {
      const newMed = await TravelService.generateMedicineAI(medName);
      setMedicines(prev => {
        const filtered = prev.filter(m => m.id !== newMed.id);
        return [newMed, ...filtered];
      });
      setSearchQuery('');
      Alert.alert(
        '✨ Medicine Researched with Gemini',
        `Generated international brand equivalents for ${newMed.genericName} across US, UK, France, Germany, Spain, and Japan!`
      );
    } catch (err: any) {
      Alert.alert('AI Research Error', err.message || 'Failed to research medicine with Gemini.');
    } finally {
      setIsResearchingAI(false);
    }
  };

  const filteredMeds = useMemo(() => {
    const list = Array.isArray(medicines) ? medicines : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(med => {
      if (!med) return false;
      const matchesGeneric = (med.genericName || '').toLowerCase().includes(q);
      const matchesUse = (med.primaryUse || '').toLowerCase().includes(q);
      const homeBrands = Array.isArray(med.commonHomeBrands)
        ? med.commonHomeBrands
        : typeof med.commonHomeBrands === 'string'
        ? [med.commonHomeBrands]
        : [];
      const matchesBrands = homeBrands.some(b =>
        typeof b === 'string' && b.toLowerCase().includes(q)
      );
      const countryBrands = typeof med.brandsByCountry === 'object' && med.brandsByCountry !== null
        ? Object.values(med.brandsByCountry)
        : [];
      const matchesCountryBrands = countryBrands.some(b =>
        typeof b === 'string' && b.toLowerCase().includes(q)
      );
      return matchesGeneric || matchesUse || matchesBrands || matchesCountryBrands;
    });
  }, [medicines, searchQuery]);

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
          <Text style={styles.headerTitle}>Medicine Converter</Text>
          <Text style={styles.headerSub}>International brands & customs restrictions</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Tylenol, Advil, Imodium, pain, allergy…"
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

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customs Warning Notice */}
        <View style={styles.customsAlert}>
          <View style={styles.customsAlertHeader}>
            <Ionicons name="alert-circle" size={18} color={Colors.ochre.main} />
            <Text style={styles.customsAlertTitle}>Border Customs Notice</Text>
          </View>
          <Text style={styles.customsAlertText}>
            Always carry prescription drugs in their original pharmacy containers with doctor notes.
            Certain common OTC cold decongestants (e.g. Pseudoephedrine in Sudafed) are strictly illegal
            in countries like Japan and UAE!
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Medication Equivalents</Text>

        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={{ marginTop: 12, color: Colors.neutral[600], fontSize: 13, fontFamily: Typography.fontFamily.medium }}>
              Searching international medicine directory…
            </Text>
          </View>
        ) : error ? (
          <ErrorState
            title="Medication Database Offline"
            message={error}
            onRetry={loadMedicines}
          />
        ) : (!Array.isArray(filteredMeds) || filteredMeds.length === 0) ? (
          <View style={styles.emptyWrap}>
            <View style={styles.aiResearchBox}>
              <View style={styles.aiBadgeRow}>
                <Ionicons name="sparkles" size={14} color="#7C3AED" />
                <Text style={styles.aiBadgeText}>GEMINI PHARMA AI RESEARCH</Text>
              </View>
              <Text style={styles.aiResearchTitle}>
                {searchQuery.trim() ? `Research "${searchQuery.trim()}" abroad` : 'Medicine not in library?'}
              </Text>
              <Text style={styles.aiResearchSub}>
                Use Gemini to identify local brand equivalents in US, UK, France, Germany, Spain, and Japan, plus foreign customs alerts.
              </Text>
              <TouchableOpacity
                style={[styles.aiResearchBtn, isResearchingAI && { opacity: 0.7 }]}
                onPress={() => handleResearchWithGemini(searchQuery)}
                disabled={isResearchingAI}
                activeOpacity={0.85}
              >
                {isResearchingAI ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={15} color={Colors.white} />
                    <Text style={styles.aiResearchBtnText}>
                      {searchQuery.trim() ? `Research "${searchQuery.trim()}" with Gemini` : 'Research with Gemini AI'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          (Array.isArray(filteredMeds) ? filteredMeds : []).map((med, medIdx) => {
            if (!med) return null;

            const homeBrandsList = Array.isArray(med.commonHomeBrands)
              ? med.commonHomeBrands.join(' • ')
              : typeof med.commonHomeBrands === 'string'
              ? med.commonHomeBrands
              : 'Over-the-counter international equivalent';

            const brands = (typeof med.brandsByCountry === 'object' && med.brandsByCountry !== null)
              ? med.brandsByCountry
              : ({} as Record<string, string>);

            const customs = (typeof med.customsRestrictions === 'object' && med.customsRestrictions !== null)
              ? med.customsRestrictions
              : { isRestricted: false };

            const isRestricted = Boolean(customs.isRestricted);
            const warningNote = customs.warningNote || (customs as any).notes || null;
            const otcText = med.otcAvailability || 'Consult licensed pharmacist abroad for local OTC regulations.';

            return (
              <View key={med.id || `med-${medIdx}`} style={styles.medCard}>
                {/* Card Header */}
                <View style={styles.medCardTop}>
                  <View style={styles.medIconCircle}>
                    <Ionicons name="medkit" size={20} color={Colors.primary[500]} />
                  </View>
                  <View style={styles.medTitleBox}>
                    <Text style={styles.medGenericName}>{med.genericName || 'Medication'}</Text>
                    <Text style={styles.medPrimaryUse}>{med.primaryUse || 'General Therapeutic Use'}</Text>
                  </View>
                </View>

                {/* Home Brands */}
                <View style={styles.homeBrandsRow}>
                  <Text style={styles.homeBrandsLabel}>Common Home Brands:</Text>
                  <Text style={styles.homeBrandsList}>
                    {homeBrandsList}
                  </Text>
                </View>

                {/* International Equivalents Table */}
                <View style={styles.equivalentsBox}>
                  <Text style={styles.equivalentsTitle}>Foreign Brand Names:</Text>
                  
                  <View style={styles.countryRow}>
                    <Text style={styles.countryBadge}>🇺🇸 USA</Text>
                    <Text style={styles.countryBrandText}>{brands.US || 'Available'}</Text>
                  </View>

                  <View style={styles.countryRow}>
                    <Text style={styles.countryBadge}>🇬🇧 UK</Text>
                    <Text style={styles.countryBrandText}>{brands.UK || 'Available'}</Text>
                  </View>

                  <View style={styles.countryRow}>
                    <Text style={styles.countryBadge}>🇫🇷 France</Text>
                    <Text style={styles.countryBrandText}>{brands.FR || 'Available'}</Text>
                  </View>

                  <View style={styles.countryRow}>
                    <Text style={styles.countryBadge}>🇪🇸 Spain</Text>
                    <Text style={styles.countryBrandText}>{brands.ES || 'Available'}</Text>
                  </View>

                  <View style={styles.countryRow}>
                    <Text style={styles.countryBadge}>🇩🇪 Germany</Text>
                    <Text style={styles.countryBrandText}>{brands.DE || 'Available'}</Text>
                  </View>

                  <View style={styles.countryRow}>
                    <Text style={styles.countryBadge}>🇯🇵 Japan</Text>
                    <Text
                      style={[
                        styles.countryBrandText,
                        isRestricted && styles.restrictedText,
                      ]}
                    >
                      {brands.JP || (isRestricted ? 'RESTRICTED / BANNED' : 'Available')}
                    </Text>
                  </View>
                </View>

                {/* Customs Warning Note if any */}
                {warningNote && (
                  <View style={styles.medRestrictionWarning}>
                    <Ionicons name="warning" size={16} color={Colors.primary[600]} />
                    <Text style={styles.medRestrictionText}>
                      {warningNote}
                    </Text>
                  </View>
                )}

                {/* OTC Availability Footer */}
                <View style={styles.otcFooter}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={Colors.neutral[500]} />
                  <Text style={styles.otcFooterText}>{otcText}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  scroll: {
    paddingHorizontal: Spacing[4],
  },
  customsAlert: {
    backgroundColor: Colors.ochre.light,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  customsAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  customsAlertTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.ochre.dark,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  customsAlertText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
    marginBottom: Spacing[3],
  },
  medCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  medIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTitleBox: {
    flex: 1,
  },
  medGenericName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  medPrimaryUse: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  homeBrandsRow: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[2],
    marginBottom: Spacing[3],
  },
  homeBrandsLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
  },
  homeBrandsList: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
    marginTop: 1,
  },
  equivalentsBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  equivalentsTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[2],
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  countryBadge: {
    width: 85,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[700],
  },
  countryBrandText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
  },
  restrictedText: {
    color: Colors.primary[600],
    fontFamily: Typography.fontFamily.bold,
  },
  medRestrictionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  medRestrictionText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[700],
    lineHeight: 16,
  },
  otcFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[150],
    paddingTop: Spacing[2],
  },
  otcFooterText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
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
  aiResearchBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    width: '100%',
    alignItems: 'center',
    ...Shadows.sm,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing[2],
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.6,
  },
  aiResearchTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: 4,
    textAlign: 'center',
  },
  aiResearchSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[4],
  },
  aiResearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  aiResearchBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
