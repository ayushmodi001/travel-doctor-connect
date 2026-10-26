/**
 * EditProfileScreen – Health profile editor.
 * Allows travelers to update vital medical information, emergency contacts,
 * and profile details with instant local and server persistence.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { InputField, Button } from '../../components/ui/primitives';
import { UserService } from '../../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [avatarUri, setAvatarUri] = useState(user?.profileImage || '');

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContact?.phone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(user?.emergencyContact?.relation || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow photo gallery access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(false);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        bloodGroup,
        profileImage: avatarUri,
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relation: emergencyRelation.trim() || 'Family',
        },
      };

      await UserService.updateProfile(payload);
      await updateProfile(payload);

      setSuccessMessage(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Unable to update profile on server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveHeaderText}>{isSaving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Picker Card */}
        <View style={styles.avatarCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={44} color={Colors.primary[500]} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {successMessage && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.sage.main} />
            <Text style={styles.successBannerText}>Profile updated successfully!</Text>
          </View>
        )}

        {/* General Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>General Information</Text>

          <InputField
            label="Full Name"
            placeholder="Jane Doe"
            value={name}
            onChangeText={setName}
            icon="person-outline"
          />

          <InputField
            label="Phone Number"
            placeholder="+1 415 555 0101"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon="call-outline"
          />

          {/* Blood Group Picker */}
          <Text style={styles.inputLabel}>Blood Group</Text>
          <View style={styles.bloodGroupRow}>
            {BLOOD_GROUPS.map(bg => {
              const isSelected = bloodGroup === bg;
              return (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bloodPill, isSelected && styles.bloodPillSelected]}
                  onPress={() => setBloodGroup(bg)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.bloodText, isSelected && styles.bloodTextSelected]}>
                    {bg}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Emergency Contact Card */}
        <View style={styles.card}>
          <View style={styles.emergencyTitleRow}>
            <Ionicons name="shield-outline" size={18} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>Emergency Contact</Text>
          </View>
          <Text style={styles.cardSub}>
            This contact is displayed in emergency situations and on your travel medical ID.
          </Text>

          <InputField
            label="Contact Name"
            placeholder="Maria Johnson"
            value={emergencyName}
            onChangeText={setEmergencyName}
            icon="person-outline"
          />

          <InputField
            label="Phone Number"
            placeholder="+1 415 555 0202"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <InputField
            label="Relationship"
            placeholder="e.g. Spouse, Parent, Sibling"
            value={emergencyRelation}
            onChangeText={setEmergencyRelation}
            icon="heart-outline"
          />
        </View>

        {/* Save Button */}
        <Button
          label="Save Changes"
          onPress={handleSave}
          isLoading={isSaving}
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  flex: {
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

  avatarCard: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[150],
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[100],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[600],
    marginTop: Spacing[2],
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.sage.light,
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  successBannerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.sage.dark,
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
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
    marginBottom: Spacing[3],
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  cardSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    lineHeight: 18,
    marginBottom: Spacing[4],
  },

  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
  },
  bloodGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  bloodPill: {
    width: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
  },
  bloodPillSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  bloodText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
  },
  bloodTextSelected: {
    color: Colors.white,
  },

  saveBtn: {
    width: '100%',
    marginTop: Spacing[2],
  },
});
