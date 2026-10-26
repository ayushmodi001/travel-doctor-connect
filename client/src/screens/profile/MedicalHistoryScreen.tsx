/**
 * MedicalHistoryScreen – Health records manager.
 * Tracks known allergies, existing medical conditions, and travel vaccines.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/primitives';
import { UserService } from '../../services/api';
import { ErrorState } from '../../components/ui/ErrorState';

export const MedicalHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();

  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await UserService.getMedicalRecords();
      setAllergies(records.allergies || []);
      setConditions(records.conditions || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load medical records from health server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    if (allergies.includes(newAllergy.trim())) {
      Alert.alert('Duplicate', 'This allergy is already recorded.');
      return;
    }
    setAllergies([...allergies, newAllergy.trim()]);
    setNewAllergy('');
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter(a => a !== item));
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    if (conditions.includes(newCondition.trim())) {
      Alert.alert('Duplicate', 'This condition is already recorded.');
      return;
    }
    setConditions([...conditions, newCondition.trim()]);
    setNewCondition('');
  };

  const removeCondition = (item: string) => {
    setConditions(conditions.filter(c => c !== item));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setShowSavedToast(false);
    try {
      await UserService.updateMedicalRecords({
        allergies,
        conditions,
      });
      await updateProfile({
        allergies,
        medicalHistory: conditions,
      });
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2500);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update medical history.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading medical records…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical History</Text>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState
          title="Records Unavailable"
          message={error}
          onRetry={loadRecords}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical History</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveHeaderText}>{isSaving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {showSavedToast && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.sage.main} />
            <Text style={styles.toastText}>Medical records saved successfully</Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary[600]} />
          <Text style={styles.infoText}>
            These medical records are shared with doctors during emergency triage and video consultations for accurate diagnosis.
          </Text>
        </View>

        {/* Known Allergies Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="warning-outline" size={18} color={Colors.primary[500]} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Known Allergies</Text>
              <Text style={styles.cardSub}>Medications, foods, or environmental triggers</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyPill}>
                <Text style={styles.allergyText}>{allergy}</Text>
                <TouchableOpacity onPress={() => removeAllergy(allergy)} style={styles.removeBtn}>
                  <Ionicons name="close" size={14} color={Colors.primary[700]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add input */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add allergy (e.g. Aspirin)"
              placeholderTextColor={Colors.neutral[400]}
              value={newAllergy}
              onChangeText={setNewAllergy}
              onSubmitEditing={addAllergy}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addAllergy} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chronic Conditions Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: Colors.terracotta.light }]}>
              <Ionicons name="fitness-outline" size={18} color={Colors.terracotta.main} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Medical Conditions</Text>
              <Text style={styles.cardSub}>Current or past diagnosed conditions</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {conditions.map((cond, index) => (
              <View key={index} style={styles.conditionPill}>
                <Text style={styles.conditionText}>{cond}</Text>
                <TouchableOpacity onPress={() => removeCondition(cond)} style={styles.removeBtn}>
                  <Ionicons name="close" size={14} color={Colors.terracotta.dark} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add condition (e.g. Diabetes Type 2)"
              placeholderTextColor={Colors.neutral[400]}
              value={newCondition}
              onChangeText={setNewCondition}
              onSubmitEditing={addCondition}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: Colors.terracotta.main }]}
              onPress={addCondition}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Travel Vaccinations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: Colors.sage.light }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.sage.main} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Travel Vaccinations</Text>
              <Text style={styles.cardSub}>Recorded immunization status</Text>
            </View>
          </View>

          <View style={styles.vaccineList}>
            {[
              { name: 'Yellow Fever', date: 'Valid until 2030', status: 'verified' },
              { name: 'Hepatitis A & B', date: 'Boosted 2024', status: 'verified' },
              { name: 'Tetanus / DTP', date: 'Due 2028', status: 'verified' },
            ].map((v, i) => (
              <View key={i} style={styles.vaccineRow}>
                <View style={styles.vaccineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vaccineName}>{v.name}</Text>
                  <Text style={styles.vaccineDate}>{v.date}</Text>
                </View>
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark" size={12} color={Colors.sage.dark} />
                  <Text style={styles.verifiedText}>Active</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Button
          label="Save Medical History"
          onPress={handleSave}
          isLoading={isSaving}
          size="lg"
          style={styles.bottomSaveBtn}
        />
      </ScrollView>
    </View>
  );
};

export default MedicalHistoryScreen;

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
  },
  saveHeaderBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
  },
  saveHeaderText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[500],
  },

  scroll: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.sage.light,
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  toastText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.sage.dark,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.primary[50],
    padding: Spacing[4],
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.primary[100],
    marginBottom: Spacing[4],
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    lineHeight: 18,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[5],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 1,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  allergyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  allergyText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[700],
  },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.terracotta.light,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.terracotta.main + '33',
  },
  conditionText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.terracotta.dark,
  },
  removeBtn: {
    padding: 2,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  addInput: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },

  vaccineList: {
    gap: Spacing[3],
  },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[50],
    padding: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  vaccineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sage.main,
  },
  vaccineName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },
  vaccineDate: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.sage.light,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
  },

  bottomSaveBtn: {
    width: '100%',
    marginTop: Spacing[2],
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
});
