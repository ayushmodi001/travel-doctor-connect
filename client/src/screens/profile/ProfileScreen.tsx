/**
 * ProfileScreen – Traveler health profile.
 * Displays medical ID, allergies overview, emergency contacts, and settings navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProfileStackParamList, User } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Avatar, Badge, Divider, Button } from '../../components/ui/primitives';
import { ErrorState } from '../../components/ui/ErrorState';
import { UserService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user: authUser, logout } = useAuth();

  const [profile, setProfile] = useState<User | null>(authUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await UserService.getProfile();
      setProfile(prev => ({
        ...(authUser || {}),
        ...(data || {}),
        name: (data?.name && data.name !== 'Traveler') ? data.name : (authUser?.name || data?.name || 'Traveler'),
        email: data?.email || authUser?.email || '',
        profileImage: data?.profileImage || authUser?.profileImage,
      }));
    } catch (err: any) {
      // If server lookup failed, gracefully rely on authenticated Clerk user
      if (authUser) {
        setProfile(authUser);
      } else {
        setError(err.message || 'Unable to retrieve user health profile.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const currentUser = profile || authUser;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of MediConnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const MENU_ITEMS = [
    { icon: 'create-outline', label: i18n.t('profile.editProfile'), screen: 'EditProfile' as const },
    { icon: 'medical-outline', label: i18n.t('profile.medicalHistory'), screen: 'MedicalHistory' as const },
    { icon: 'shield-checkmark-outline', label: 'Admin & Doctor Portal', screen: 'AdminDoctorPanel' as const },
    { icon: 'settings-outline', label: i18n.t('nav.settings'), screen: 'Settings' as const },
  ];

  if (isLoading && !currentUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (error && !currentUser) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Profile Unavailable"
          message={error}
          onRetry={loadProfile}
        />
      </View>
    );
  }


  const user = currentUser;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('profile.title')}</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.neutral[800]} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.profileImage} name={user?.name} size={76} />
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={13} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name ?? 'Traveler'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
            {user?.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          </View>
        </View>

        {/* Health ID Overview */}
        <View style={styles.healthCard}>
          <Text style={styles.sectionTitle}>Medical ID Snapshot</Text>
          <View style={styles.healthGrid}>
            <HealthItem
              icon="water"
              label={i18n.t('profile.bloodGroup')}
              value={user?.bloodGroup ?? 'O+'}
              color={Colors.primary[500]}
            />
            <HealthItem
              icon="alert-circle"
              label={i18n.t('profile.allergies')}
              value={user?.allergies?.length ? `${user.allergies.length} recorded` : 'None'}
              color={Colors.terracotta.main}
            />
            <HealthItem
              icon="document-text"
              label={i18n.t('profile.medicalHistory')}
              value={user?.medicalHistory?.length ? `${user.medicalHistory.length} conditions` : 'None'}
              color={Colors.sage.main}
            />
          </View>
        </View>

        {/* Known Allergies */}
        {user?.allergies && user.allergies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('profile.allergies')}</Text>
            <View style={styles.badgeRow}>
              {user.allergies.map(a => (
                <Badge key={a} label={a} color={Colors.primary[700]} bg={Colors.primary[50]} />
              ))}
            </View>
          </View>
        )}

        {/* Emergency Contact */}
        {user?.emergencyContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('profile.emergencyContact')}</Text>
            <View style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Ionicons name="shield" size={20} color={Colors.primary[500]} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{user.emergencyContact.name}</Text>
                <Text style={styles.contactRel}>{user.emergencyContact.relation}</Text>
                <Text style={styles.contactPhone}>{user.emergencyContact.phone}</Text>
              </View>
            </View>
          </View>
        )}

        <Divider />

        {/* Menu Items */}
        <View style={styles.menu}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={Colors.neutral[800]} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <Divider />

        {/* Sign Out Button */}
        <View style={styles.logoutSection}>
          <Button
            label="Sign Out"
            onPress={handleLogout}
            variant="outline"
            size="lg"
            icon="log-out-outline"
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const HealthItem: React.FC<{
  icon: any;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View style={styles.healthItem}>
    <View style={[styles.healthIconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.healthValue}>{value}</Text>
    <Text style={styles.healthLabel}>{label}</Text>
  </View>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: 54,
    paddingBottom: Spacing[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.4,
  },
  settingsBtn: {
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

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[5],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: Spacing[4],
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  userPhone: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
    marginTop: 3,
  },

  healthCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[5],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
    marginBottom: Spacing[3],
  },
  healthGrid: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  healthItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  healthIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  healthValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  healthLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },

  section: {
    marginBottom: Spacing[4],
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  contactRel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[600],
  },
  contactPhone: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: 2,
  },

  menu: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },

  logoutSection: {
    marginTop: Spacing[2],
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
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
