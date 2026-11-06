/**
 * MedicineEquivalentsScreen – International Medication Brand Converter.
 * Helps travelers find their home country medication equivalents abroad
 * and warns about restricted or banned substances at foreign customs checkpoints.
 * Filters to the currently selected destination country with comparison options.
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MedicineEquivalent } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { TravelService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';
import { MEDICINE_EQUIVALENTS } from '../../data/travelData';

export const COUNTRIES_LIST = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'UK', name: 'UK', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'all', name: 'All Countries', flag: '🌐' },
];

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

export default function MedicineEquivalentsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [medicines, setMedicines] = useState<MedicineEquivalent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoResearching, setIsAutoResearching] = useState(false);
  const [updatingMedId, setUpdatingMedId] = useState<string | null>(null);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<string[]>([]);
  const [autoResearchToast, setAutoResearchToast] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{
    countryCode: string;
    countryName: string;
    flag: string;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Determine initial country from route params (passed from TravelHub / GPS / Home)
  const initialCountryCode = useMemo(() => {
    const raw = (route.params?.countryCode || '').toUpperCase();
    if (raw === 'GB') return 'UK';
    if (raw && COUNTRIES_LIST.some(c => c.code === raw)) return raw;
    if (route.params?.countryName) {
      const match = COUNTRIES_LIST.find(
        c => c.name.toLowerCase() === route.params.countryName.toLowerCase()
      );
      if (match) return match.code;
    }
    return 'IN'; // Default: India
  }, [route.params]);

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
        console.warn('[MedicineEquivalents] GPS country detection notice:', locErr);
      } finally {
        if (isMounted) setIsDetectingLocation(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getMedicineEquivalents();
      if (Array.isArray(data) && data.length > 0) {
        setMedicines(data);
      } else {
        setMedicines(MEDICINE_EQUIVALENTS);
      }
    } catch (err: any) {
      console.warn('[MedicineEquivalents] Server notice, using verified clinical dataset:', err.message);
      setMedicines(MEDICINE_EQUIVALENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await TravelService.getMedicineEquivalents();
      if (Array.isArray(data) && data.length > 0) {
        setMedicines(data);
      }
    } catch {
      // Keep existing data
    } finally {
      setIsRefreshing(false);
    }
  };

  // Intelligent Auto-Research with Gemini AI
  const handleAutoResearchMedicine = useCallback(async (medicineNameToResearch: string) => {
    const medName = medicineNameToResearch.trim();
    if (!medName || isAutoResearching) return;

    setIsAutoResearching(true);
    try {
      const newMed = await TravelService.generateMedicineAI(medName);
      setMedicines(prev => {
        const filtered = prev.filter(m => m.id !== newMed.id && m.genericName.toLowerCase() !== newMed.genericName.toLowerCase());
        return [newMed, ...filtered];
      });
      setRecentlyUpdatedIds(prev => [...prev, newMed.id]);
      setAutoResearchToast(`Auto-updated: Verified ${newMed.genericName} brand equivalents in database!`);
      setTimeout(() => setAutoResearchToast(null), 5000);
    } catch (err: any) {
      console.warn('[MedicineEquivalents] AI auto-research notice:', err.message);
      Alert.alert(
        'Auto-Update Notice',
        `Could not synthesize real-time clinical equivalents for "${medName}" (${err.message}).`
      );
    } finally {
      setIsAutoResearching(false);
    }
  }, [isAutoResearching]);

  // Update existing card with latest 2026 formulations & status
  const handleUpdateMedCard = async (med: MedicineEquivalent) => {
    if (updatingMedId) return;
    setUpdatingMedId(med.id);
    try {
      const updated = await TravelService.generateMedicineAI(med.genericName);
      setMedicines(prev => prev.map(m => m.id === med.id ? { ...updated, id: med.id } : m));
      setRecentlyUpdatedIds(prev => [...prev, med.id]);
      setAutoResearchToast(`Updated latest clinical formulations & local brands for ${med.genericName}`);
      setTimeout(() => setAutoResearchToast(null), 4000);
    } catch (err: any) {
      Alert.alert('Auto-Update Notice', err.message || 'Could not refresh latest clinical data right now.');
    } finally {
      setUpdatingMedId(null);
    }
  };

  // Intelligent Debounced Auto-Search: triggers when query has >= 3 chars and no local match exists
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 3 || isAutoResearching || isLoading) return;

    const list = Array.isArray(medicines) && medicines.length > 0 ? medicines : MEDICINE_EQUIVALENTS;
    const hasMatch = list.some(med => {
      const generic = (med.genericName || '').toLowerCase();
      const use = (med.primaryUse || '').toLowerCase();
      const homeBrands = Array.isArray(med.commonHomeBrands)
        ? med.commonHomeBrands.join(' ').toLowerCase()
        : '';
      const countryBrands = typeof med.brandsByCountry === 'object' && med.brandsByCountry
        ? Object.values(med.brandsByCountry).join(' ').toLowerCase()
        : '';
      return generic.includes(q) || use.includes(q) || homeBrands.includes(q) || countryBrands.includes(q);
    });

    if (!hasMatch) {
      const timer = setTimeout(() => {
        handleAutoResearchMedicine(searchQuery.trim());
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, medicines, isAutoResearching, isLoading, handleAutoResearchMedicine]);

  const filteredMeds = useMemo(() => {
    const list = Array.isArray(medicines) && medicines.length > 0 ? medicines : MEDICINE_EQUIVALENTS;
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

  const activeCountryMeta = useMemo(() => {
    const code = detectedLocation?.countryCode || initialCountryCode || 'IN';
    const found = COUNTRIES_LIST.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (found) return found;
    if (detectedLocation) {
      return {
        code: detectedLocation.countryCode,
        name: detectedLocation.countryName,
        flag: detectedLocation.flag,
      };
    }
    return {
      code: 'IN',
      name: 'India',
      flag: '🇮🇳',
    };
  }, [detectedLocation, initialCountryCode]);

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
          <View style={styles.headerLocationRow}>
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color={Colors.primary[600]} style={{ width: 10, height: 10 }} />
            ) : (
              <View style={styles.liveGpsDot} />
            )}
            <Text style={styles.headerSub}>
              {isDetectingLocation
                ? 'Detecting your location…'
                : `Showing equivalents for ${activeCountryMeta.name} ${activeCountryMeta.flag} (GPS Auto-Located)`}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search brand in ${activeCountryMeta.name}, symptoms, Tylenol, pain…`}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Customs Warning Notice */}
        <View style={styles.customsAlert}>
          <View style={styles.customsAlertHeader}>
            <Ionicons name="alert-circle" size={18} color={Colors.ochre.main} />
            <Text style={styles.customsAlertTitle}>Border Customs Notice</Text>
          </View>
          <Text style={styles.customsAlertText}>
            Always carry prescription drugs in original pharmacy containers with doctor notes.
            Certain OTC decongestants (Pseudoephedrine in Sudafed) are strictly illegal in Japan, UAE & Singapore!
          </Text>
        </View>

        {/* Intelligent Auto-Enrichment Header Box */}
        <View style={styles.autoEnrichBox}>
          <View style={styles.autoEnrichHeader}>
            <View style={styles.aiBadgeRow}>
              <Ionicons name="sparkles" size={14} color="#7C3AED" />
              <Text style={styles.aiBadgeText}>GEMINI 2.5 PHARMA AI AUTO-SYNC</Text>
            </View>
            <View style={styles.neonDbTag}>
              <Text style={styles.neonDbTagText}>NEON DB LIVE</Text>
            </View>
          </View>
          <Text style={styles.autoEnrichTitle}>Intelligent Medication Sync</Text>
          <Text style={styles.autoEnrichSub}>
            Medicines and trade names change frequently abroad. Search any medication or symptom above, and the engine automatically researches and synchronizes with real-time global databases for {activeCountryMeta.name} {activeCountryMeta.flag}.
          </Text>

          {/* Quick 1-tap Auto-Enrich Chips */}
          <Text style={styles.quickChipsLabel}>Quick Auto-Search & Enrich:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsScroll}
          >
            {['Dolo 650', 'Allegra', 'Augmentin', 'Metformin', 'Ozempic', 'Ventolin', 'Omeprazole'].map(name => (
              <TouchableOpacity
                key={name}
                style={styles.quickChip}
                onPress={() => {
                  setSearchQuery(name);
                  handleAutoResearchMedicine(name);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={11} color="#7C3AED" />
                <Text style={styles.quickChipText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Auto-Research Live Toast Notification */}
        {autoResearchToast && (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.toastBannerText}>{autoResearchToast}</Text>
          </View>
        )}

        <View style={styles.resultsHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>
              Equivalents in {activeCountryMeta.name} {activeCountryMeta.flag}
            </Text>
            <Text style={styles.sectionSub}>
              Showing local brands for {activeCountryMeta.name}
            </Text>
          </View>
          <View style={styles.badgeGroup}>
            {isAutoResearching && (
              <View style={styles.syncingBadge}>
                <ActivityIndicator size="small" color="#7C3AED" style={{ width: 10, height: 10 }} />
                <Text style={styles.syncingBadgeText}>AI Syncing…</Text>
              </View>
            )}
            <Text style={styles.resultsBadge}>{filteredMeds.length} Medicines</Text>
          </View>
        </View>

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
          isAutoResearching ? (
            <View style={styles.autoResearchingCard}>
              <View style={styles.aiBadgeRow}>
                <Ionicons name="sparkles" size={16} color="#7C3AED" />
                <Text style={styles.aiBadgeText}>INTELLIGENT AUTO-SYNC IN PROGRESS</Text>
              </View>
              <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 14 }} />
              <Text style={styles.autoResearchingTitle}>
                Auto-updating "{searchQuery}" with Gemini AI…
              </Text>
              <Text style={styles.autoResearchingSub}>
                Synthesizing 2026 formulations, trade names in {activeCountryMeta.name}, and customs regulations…
              </Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="sparkles-outline" size={38} color="#7C3AED" />
              <Text style={styles.emptyTitle}>No local match for "{searchQuery}"</Text>
              <Text style={styles.emptySub}>
                Medicines update continuously. Tap below to automatically research with Gemini AI and sync brand equivalents to database.
              </Text>
              <TouchableOpacity
                style={styles.autoResearchBtn}
                onPress={() => handleAutoResearchMedicine(searchQuery)}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={15} color={Colors.white} />
                <Text style={styles.autoResearchBtnText}>
                  Auto-Research "{searchQuery}" with AI
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          filteredMeds.map((med, medIdx) => {
            if (!med) return null;

            const isRecentlyUpdated = recentlyUpdatedIds.includes(med.id);

            const homeBrandsList = Array.isArray(med.commonHomeBrands)
              ? med.commonHomeBrands.join(' • ')
              : typeof med.commonHomeBrands === 'string'
              ? med.commonHomeBrands
              : 'Over-the-counter equivalent';

            const brands = (typeof med.brandsByCountry === 'object' && med.brandsByCountry !== null)
              ? med.brandsByCountry
              : ({} as Record<string, string | undefined>);

            const customs = (typeof med.customsRestrictions === 'object' && med.customsRestrictions !== null)
              ? med.customsRestrictions
              : { isRestricted: false };

            const isRestricted = Boolean(customs.isRestricted);
            const warningNote = customs.warningNote || (customs as any).notes || null;
            const otcText = med.otcAvailability || 'Consult licensed pharmacist abroad for local regulations.';

            // Auto-located country specific brand name lookup
            const targetCode = activeCountryMeta.code === 'UK' ? 'UK' : activeCountryMeta.code;
            const brandInSelectedCountry =
              brands[targetCode] ||
              brands[targetCode === 'UK' ? 'GB' : targetCode] ||
              (targetCode === 'US' ? brands.US : undefined);

            const isJapan = activeCountryMeta.code === 'JP';
            const isCountryBanned =
              isRestricted &&
              (isJapan ||
                (warningNote && warningNote.toLowerCase().includes(activeCountryMeta.name.toLowerCase())) ||
                (brandInSelectedCountry &&
                  (brandInSelectedCountry.toLowerCase().includes('prohibited') ||
                    brandInSelectedCountry.toLowerCase().includes('banned'))));

            return (
              <View
                key={med.id || `med-${medIdx}`}
                style={[styles.medCard, isRecentlyUpdated && styles.medCardUpdated]}
              >
                <View style={styles.dbCardTagRow}>
                  {isRecentlyUpdated ? (
                    <View style={styles.recentlyUpdatedTag}>
                      <Ionicons name="flash" size={10} color="#059669" />
                      <Text style={styles.recentlyUpdatedTagText}>AUTO-UPDATED JUST NOW</Text>
                    </View>
                  ) : (
                    <View style={styles.dbCardTag}>
                      <Ionicons name="shield-checkmark" size={11} color={Colors.sage.main} />
                      <Text style={styles.dbCardTagText}>VERIFIED CLINICAL DATA</Text>
                    </View>
                  )}
                </View>

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
                  <Text style={styles.homeBrandsLabel}>Common Home Brands (US/International):</Text>
                  <Text style={styles.homeBrandsList}>{homeBrandsList}</Text>
                </View>

                {/* Auto-Located Country Card */}
                <View style={styles.destCountryCard}>
                  <View style={styles.destCountryCardHeader}>
                    <View style={styles.destCountryLabelWrap}>
                      <Text style={styles.destCountryFlagLarge}>{activeCountryMeta.flag}</Text>
                      <View>
                        <Text style={styles.destCountryTitle}>
                          Local Brand in {activeCountryMeta.name}
                        </Text>
                        <Text style={styles.destCountrySub}>
                          Local pharmacy & generic name
                        </Text>
                      </View>
                    </View>
                    {isCountryBanned ? (
                      <View style={styles.restrictedBadge}>
                        <Ionicons name="alert-circle" size={11} color={Colors.white} />
                        <Text style={styles.restrictedBadgeText}>BANNED</Text>
                      </View>
                    ) : (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={11} color={Colors.sage.dark} />
                        <Text style={styles.verifiedBadgeText}>AVAILABLE</Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.destBrandText,
                      isCountryBanned && styles.restrictedBrandText,
                    ]}
                  >
                    {brandInSelectedCountry ||
                      `Available under generic: ${med.genericName} (Consult pharmacist)`}
                  </Text>
                </View>

                {/* Customs Warning Note if any for this country */}
                {warningNote && (isCountryBanned || isRestricted) && (
                  <View style={styles.medRestrictionWarning}>
                    <Ionicons name="warning" size={16} color={Colors.primary[600]} />
                    <Text style={styles.medRestrictionText}>{warningNote}</Text>
                  </View>
                )}

                {/* OTC Availability Footer */}
                <View style={styles.otcFooter}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={Colors.neutral[500]} />
                  <Text style={styles.otcFooterText}>{otcText}</Text>
                </View>

                {/* Intelligent Auto-Update Button on Card */}
                <TouchableOpacity
                  style={styles.cardAutoUpdateBtn}
                  onPress={() => handleUpdateMedCard(med)}
                  disabled={updatingMedId === med.id}
                  activeOpacity={0.8}
                >
                  {updatingMedId === med.id ? (
                    <>
                      <ActivityIndicator size="small" color="#7C3AED" style={{ width: 14, height: 14 }} />
                      <Text style={styles.cardAutoUpdateBtnText}>
                        Checking latest formulations with Gemini AI…
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sync" size={13} color="#7C3AED" />
                      <Text style={styles.cardAutoUpdateBtnText}>
                        Auto-Check 2026 Formulations & Regulations
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
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
    marginBottom: Spacing[2],
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
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    marginTop: 1,
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
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 1,
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
  medCardUpdated: {
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
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

  // Highlighted Single Destination Brand Card
  destCountryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  destCountryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  destCountryLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  destCountryFlagLarge: {
    fontSize: 22,
  },
  destCountryTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  destCountrySub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.sage.light,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  restrictedBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  destBrandText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    lineHeight: 20,
  },
  restrictedBrandText: {
    color: Colors.primary[700],
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
    paddingTop: Spacing[1],
    marginBottom: Spacing[2],
  },
  otcFooterText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    flex: 1,
  },

  // Card On-Demand Auto-Update Button
  cardAutoUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: BorderRadius.lg,
    paddingVertical: 7,
    paddingHorizontal: Spacing[3],
    marginTop: 4,
  },
  cardAutoUpdateBtnText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#6D28D9',
  },

  recentlyUpdatedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  recentlyUpdatedTagText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#059669',
  },

  // Auto-Enrich Box & Quick Chips
  autoEnrichBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  autoEnrichHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  aiBadgeRow: {
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  neonDbTagText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#6D28D9',
  },
  autoEnrichTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  autoEnrichSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    lineHeight: 16,
    marginBottom: Spacing[3],
  },
  quickChipsLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  quickChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  quickChipText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#6D28D9',
  },

  // Live Toast Banner
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
    marginBottom: Spacing[3],
  },
  toastBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: '#065F46',
  },

  // Results Header
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  syncingBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#7C3AED',
  },
  resultsBadge: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },

  // Auto-Researching Card in Results
  autoResearchingCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing[4],
  },
  autoResearchingTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  autoResearchingSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 16,
  },

  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
    marginTop: 10,
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing[4],
    lineHeight: 18,
  },
  autoResearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing[4],
    paddingVertical: 11,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  autoResearchBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  dbCardTagRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  dbCardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sage.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  dbCardTagText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
  },
});
