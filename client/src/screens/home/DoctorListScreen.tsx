/**
 * DoctorListScreen – Searchable, filterable list of doctors.
 * Supports Open Maps view toggle, category filter, and robust error handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, Doctor, DoctorFilter, ConsultationType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import DoctorCard from '../../components/DoctorCard';
import { EmptyState } from '../../components/ui/primitives';
import { ErrorState } from '../../components/ui/ErrorState';
import { DoctorService } from '../../services/api';
import { i18n } from '../../localization/i18n';
import { useDebounce } from '../../hooks/useApi';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'DoctorList'>;
type RoutePropType = RouteProp<HomeStackParamList, 'DoctorList'>;

const FILTER_TYPES: { label: string; value: ConsultationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Video', value: 'video' },
  { label: 'Chat', value: 'chat' },
  { label: 'In-person', value: 'in-person' },
];

const SORT_OPTIONS = [
  { label: 'Rating', value: 'rating' as const },
  { label: 'Fee (low)', value: 'fee' as const },
  { label: 'Experience', value: 'experience' as const },
];

export const DoctorListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();

  const [searchText, setSearchText] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ConsultationType | 'all'>('all');
  const [selectedSort, setSelectedSort] = useState<'rating' | 'fee' | 'experience'>('rating');
  const [selectedSpecialty, setSelectedSpecialty] = useState(route.params?.specialty ?? '');
  const [availableNow, setAvailableNow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchText, 400);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filter: DoctorFilter = {
        specialty: selectedSpecialty || undefined,
        consultationType: selectedType !== 'all' ? selectedType : undefined,
        availableNow: availableNow || undefined,
        sortBy: selectedSort,
      };

      let result = await DoctorService.getDoctors(filter);

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        result = result.filter(
          d =>
            d.name.toLowerCase().includes(q) ||
            d.specialty.toLowerCase().includes(q) ||
            d.hospital.toLowerCase().includes(q)
        );
      }

      setDoctors(result);
    } catch (err: any) {
      // REQUIREMENT 2: DO NOT fall back silently to fake mock data. Show proper error.
      setError(err.message || 'Unable to retrieve doctors from healthcare server.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedType, selectedSort, selectedSpecialty, availableNow]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <DoctorCard
      doctor={item}
      onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.id })}
      onBookPress={() => navigation.navigate('BookAppointment', { doctorId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('doctors.title')}</Text>

        <View style={styles.headerActions}>
          {/* Open Maps View Toggle */}
          <TouchableOpacity
            style={styles.mapToggleBtn}
            onPress={() => navigation.navigate('OpenMaps', { initialCategory: 'doctor' })}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={18} color={Colors.primary[500]} />
          </TouchableOpacity>

          {/* Filter Panel Toggle */}
          <TouchableOpacity
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
            onPress={() => setShowFilters(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={showFilters ? Colors.white : Colors.neutral[700]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={i18n.t('doctors.search')}
          placeholderTextColor={Colors.neutral[400]}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Consultation Type</Text>
          <View style={styles.filterRow}>
            {FILTER_TYPES.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, selectedType === f.value && styles.filterChipActive]}
                onPress={() => setSelectedType(f.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === f.value && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.filterRow}>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.filterChip, selectedSort === o.value && styles.filterChipActive]}
                onPress={() => setSelectedSort(o.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSort === o.value && styles.filterChipTextActive,
                  ]}
                >
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.availableToggle}
            onPress={() => setAvailableNow(v => !v)}
          >
            <Ionicons
              name={availableNow ? 'checkbox' : 'square-outline'}
              size={18}
              color={availableNow ? Colors.primary[500] : Colors.neutral[400]}
            />
            <Text style={styles.availableToggleText}>Available now only</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Header */}
      {!isLoading && !error && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {doctors.length} specialist{doctors.length !== 1 ? 's' : ''} available
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('OpenMaps', { initialCategory: 'doctor' })}
          >
            <Text style={styles.viewOnMapText}>View on Open Maps →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loaderText}>{i18n.t('common.loading')}</Text>
        </View>
      ) : error ? (
        <ErrorState
          title="Could Not Load Doctors"
          message={error}
          onRetry={fetchDoctors}
          fullScreen
        />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item: Doctor) => item.id}
          renderItem={renderDoctor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={i18n.t('doctors.noResults')}
              subtitle="Try adjusting your search criteria or filters."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchText('');
                setSelectedType('all');
                setSelectedSpecialty('');
                setAvailableNow(false);
              }}
            />
          }
        />
      )}
    </View>
  );
};

export default DoctorListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  mapToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary[100],
    ...Shadows.sm,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  filterToggleActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[4],
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    gap: Spacing[2],
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },

  filtersPanel: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  filterLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
    marginTop: Spacing[1],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  filterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
  },
  filterChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  availableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[1],
  },
  availableToggleText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
  },

  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
  },
  resultsCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[500],
  },
  viewOnMapText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[500],
  },

  list: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  loaderText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
});
