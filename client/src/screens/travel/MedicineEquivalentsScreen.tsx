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

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TravelService.getMedicineEquivalents();
      setMedicines(data);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to pharmaceutical database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const filteredMeds = useMemo(() => {
    if (!searchQuery.trim()) return medicines;
    const q = searchQuery.toLowerCase();
    return medicines.filter(med => {
      const matchesGeneric = med.genericName.toLowerCase().includes(q);
      const matchesUse = med.primaryUse.toLowerCase().includes(q);
      const matchesBrands = med.commonHomeBrands.some(b =>
        b.toLowerCase().includes(q)
      );
      const matchesCountryBrands = Object.values(med.brandsByCountry).some(b =>
        b.toLowerCase().includes(q)
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
        ) : filteredMeds.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="medical-outline" size={40} color={Colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No medication found</Text>
            <Text style={styles.emptySub}>
              Try searching by brand name (e.g., "Tylenol") or generic name ("Ibuprofen").
            </Text>
          </View>
        ) : (
          filteredMeds.map(med => (
            <View key={med.id} style={styles.medCard}>
              {/* Card Header */}
              <View style={styles.medCardTop}>
                <View style={styles.medIconCircle}>
                  <Ionicons name="medkit" size={20} color={Colors.primary[500]} />
                </View>
                <View style={styles.medTitleBox}>
                  <Text style={styles.medGenericName}>{med.genericName}</Text>
                  <Text style={styles.medPrimaryUse}>{med.primaryUse}</Text>
                </View>
              </View>

              {/* Home Brands */}
              <View style={styles.homeBrandsRow}>
                <Text style={styles.homeBrandsLabel}>Common Home Brands:</Text>
                <Text style={styles.homeBrandsList}>
                  {med.commonHomeBrands.join(' • ')}
                </Text>
              </View>

              {/* International Equivalents Table */}
              <View style={styles.equivalentsBox}>
                <Text style={styles.equivalentsTitle}>Foreign Brand Names:</Text>
                
                <View style={styles.countryRow}>
                  <Text style={styles.countryBadge}>🇺🇸 USA</Text>
                  <Text style={styles.countryBrandText}>{med.brandsByCountry.US}</Text>
                </View>

                <View style={styles.countryRow}>
                  <Text style={styles.countryBadge}>🇬🇧 UK</Text>
                  <Text style={styles.countryBrandText}>{med.brandsByCountry.UK}</Text>
                </View>

                <View style={styles.countryRow}>
                  <Text style={styles.countryBadge}>🇫🇷 France</Text>
                  <Text style={styles.countryBrandText}>{med.brandsByCountry.FR}</Text>
                </View>

                <View style={styles.countryRow}>
                  <Text style={styles.countryBadge}>🇪🇸 Spain</Text>
                  <Text style={styles.countryBrandText}>{med.brandsByCountry.ES}</Text>
                </View>

                <View style={styles.countryRow}>
                  <Text style={styles.countryBadge}>🇩🇪 Germany</Text>
                  <Text style={styles.countryBrandText}>{med.brandsByCountry.DE}</Text>
                </View>

                <View style={styles.countryRow}>
                  <Text style={styles.countryBadge}>🇯🇵 Japan</Text>
                  <Text
                    style={[
                      styles.countryBrandText,
                      med.customsRestrictions.isRestricted && styles.restrictedText,
                    ]}
                  >
                    {med.brandsByCountry.JP}
                  </Text>
                </View>
              </View>

              {/* Customs Warning Note if any */}
              {med.customsRestrictions.warningNote && (
                <View style={styles.medRestrictionWarning}>
                  <Ionicons name="warning" size={16} color={Colors.primary[600]} />
                  <Text style={styles.medRestrictionText}>
                    {med.customsRestrictions.warningNote}
                  </Text>
                </View>
              )}

              {/* OTC Availability Footer */}
              <View style={styles.otcFooter}>
                <Ionicons name="shield-checkmark-outline" size={14} color={Colors.neutral[500]} />
                <Text style={styles.otcFooterText}>{med.otcAvailability}</Text>
              </View>
            </View>
          ))
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
});
