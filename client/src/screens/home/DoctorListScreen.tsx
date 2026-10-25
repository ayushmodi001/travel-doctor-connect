/**
 * DoctorListScreen – searchable, filterable list of doctors.
 * Supports specialty filter passed from the Home screen.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, Doctor, DoctorFilter, ConsultationType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import DoctorCard from '../../components/DoctorCard';
import { EmptyState } from '../../components/ui/primitives';
import { DoctorService } from '../../services/api';
import { MEDICAL_SPECIALTIES } from '../../data/mockData';
import { i18n } from '../../localization/i18n';
import { useDebounce } from '../../hooks/useApi';

type NavProp  = NativeStackNavigationProp<HomeStackParamList, 'DoctorList'>;
type RoutePropType = RouteProp<HomeStackParamList, 'DoctorList'>;

const FILTER_TYPES: { label: string; value: ConsultationType | 'all' }[] = [
  { label: 'All',        value: 'all' },
  { label: 'Video',      value: 'video' },
  { label: 'Chat',       value: 'chat' },
  { label: 'In-person',  value: 'in-person' },
];

const SORT_OPTIONS = [
  { label: 'Rating',     value: 'rating' as const },
  { label: 'Fee (low)',  value: 'fee' as const },
  { label: 'Experience', value: 'experience' as const },
];

const DoctorListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RoutePropType>();

  const [searchText, setSearchText]           = useState('');
  const [doctors, setDoctors]                 = useState<Doctor[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [selectedType, setSelectedType]       = useState<ConsultationType | 'all'>('all');
  const [selectedSort, setSelectedSort]       = useState<'rating' | 'fee' | 'experience'>('rating');
  const [selectedSpecialty, setSelectedSpecialty] = useState(route.params?.specialty ?? '');
  const [availableNow, setAvailableNow]       = useState(false);
  const [showFilters, setShowFilters]         = useState(false);

  const debouncedSearch = useDebounce(searchText, 400);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: DoctorFilter = {
        specialty: selectedSpecialty || undefined,
        consultationType: selectedType !== 'all' ? selectedType : undefined,
        availableNow: availableNow || undefined,
        sortBy: selectedSort,
      };

      let result = await DoctorService.getDoctors(filter);

      // Apply text search
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        result = result.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q)
        );
      }

      setDoctors(result);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedType, selectedSort, selectedSpecialty, availableNow]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

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
          <Ionicons name="arrow-back" size={22} color={Colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('doctors.title')}</Text>
        <TouchableOpacity
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(v => !v)}
        >
          <Ionicons name="options-outline" size={20} color={showFilters ? Colors.primary[600] : Colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
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

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Type filter */}
          <Text style={styles.filterLabel}>Consultation type</Text>
          <View style={styles.filterRow}>
            {FILTER_TYPES.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, selectedType === f.value && styles.filterChipActive]}
                onPress={() => setSelectedType(f.value)}
              >
                <Text style={[styles.filterChipText, selectedType === f.value && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort */}
          <Text style={styles.filterLabel}>Sort by</Text>
          <View style={styles.filterRow}>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.filterChip, selectedSort === o.value && styles.filterChipActive]}
                onPress={() => setSelectedSort(o.value)}
              >
                <Text style={[styles.filterChipText, selectedSort === o.value && styles.filterChipTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Available now toggle */}
          <TouchableOpacity
            style={styles.availableToggle}
            onPress={() => setAvailableNow(v => !v)}
          >
            <Ionicons
              name={availableNow ? 'checkbox' : 'square-outline'}
              size={20}
              color={availableNow ? Colors.primary[500] : Colors.neutral[400]}
            />
            <Text style={styles.availableToggleText}>Available now only</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results count */}
      {!isLoading && (
        <Text style={styles.resultsCount}>
          {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loaderText}>{i18n.t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={item => item.id}
          renderItem={renderDoctor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={i18n.t('doctors.noResults')}
              subtitle="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={() => { setSearchText(''); setSelectedType('all'); setSelectedSpecialty(''); }}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[5],
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { marginRight: Spacing[3] },
  headerTitle: { flex: 1, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  filterToggle: { padding: Spacing[2], borderRadius: BorderRadius.lg, backgroundColor: Colors.neutral[100] },
  filterToggleActive: { backgroundColor: Colors.primary[50] },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    margin: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
  },

  filtersPanel: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  filterLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[2] },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  filterChip: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: BorderRadius.full, backgroundColor: Colors.neutral[100], borderWidth: 1, borderColor: Colors.neutral[200] },
  filterChipActive: { backgroundColor: Colors.primary[50], borderColor: Colors.primary[400] },
  filterChipText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[600] },
  filterChipTextActive: { color: Colors.primary[700] },
  availableToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  availableToggleText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[700] },

  resultsCount: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500], paddingHorizontal: Spacing[5], marginBottom: Spacing[2] },

  list: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[10] },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  loaderText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
});

export default DoctorListScreen;
