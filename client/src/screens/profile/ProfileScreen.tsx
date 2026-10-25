/**
 * ProfileScreen – user profile with health info, emergency contacts, and settings navigation.
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProfileStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Avatar, Badge, Divider, Button } from '../../components/ui/primitives';
import { useAuth } from '../../context/AuthContext';
import { i18n } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const MENU_ITEMS = [
    { icon: 'create-outline',        label: i18n.t('profile.editProfile'),     screen: 'EditProfile' as const },
    { icon: 'medical-outline',       label: i18n.t('profile.medicalHistory'),  screen: 'MedicalHistory' as const },
    { icon: 'settings-outline',      label: i18n.t('nav.settings'),            screen: 'Settings' as const },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header gradient */}
        <LinearGradient colors={[Colors.primary[800], Colors.primary[600]]} style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('profile.title')}</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar uri={user?.profileImage} name={user?.name} size={80} />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name ?? '—'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
            <Text style={styles.userPhone}>{user?.phone ?? '—'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editAvatarBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="camera" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Health overview */}
        <View style={styles.healthCard}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <View style={styles.healthGrid}>
            <HealthItem icon="water" label={i18n.t('profile.bloodGroup')} value={user?.bloodGroup ?? '—'} color={Colors.error.main} />
            <HealthItem icon="alert-circle" label={i18n.t('profile.allergies')} value={user?.allergies?.length ? `${user.allergies.length} noted` : 'None'} color={Colors.warning.main} />
            <HealthItem icon="document-text" label={i18n.t('profile.medicalHistory')} value={user?.medicalHistory?.length ? `${user.medicalHistory.length} records` : 'None'} color={Colors.primary[500]} />
          </View>
        </View>

        {/* Allergies */}
        {user?.allergies && user.allergies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('profile.allergies')}</Text>
            <View style={styles.badgeRow}>
              {user.allergies.map(a => (
                <Badge key={a} label={a} color={Colors.error.dark} bg={Colors.error.light} />
              ))}
            </View>
          </View>
        )}

        {/* Emergency contact */}
        {user?.emergencyContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('profile.emergencyContact')}</Text>
            <View style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Ionicons name="person" size={22} color={Colors.error.main} />
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

        {/* Menu items */}
        <View style={styles.menu}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary[600]} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <Divider />

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            label={i18n.t('auth.logout')}
            onPress={handleLogout}
            variant="danger"
            size="lg"
            icon="log-out-outline"
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── HealthItem ───────────────────────────────────────────────────────────────

const HealthItem: React.FC<{ icon: any; label: string; value: string; color: string }> = ({
  icon, label, value, color,
}) => (
  <View style={healthStyles.item}>
    <View style={[healthStyles.icon, { backgroundColor: color + '1A' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={healthStyles.value}>{value}</Text>
    <Text style={healthStyles.label}>{label}</Text>
  </View>
);

const healthStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: Spacing[2] },
  icon: { width: 44, height: 44, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  label: { fontSize: 10, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500], textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { paddingBottom: Spacing[10] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: Spacing[6],
    paddingHorizontal: Spacing[5],
  },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.white },
  settingsBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    marginTop: -Spacing[6],
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.md,
    position: 'relative',
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },
  userEmail: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  userPhone: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  editAvatarBtn: {
    position: 'absolute',
    bottom: Spacing[4] + 4,
    left: Spacing[4] + 56,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  healthCard: { margin: Spacing[4], backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], ...Shadows.sm },
  healthGrid: { flexDirection: 'row', gap: Spacing[2] },

  section: { paddingHorizontal: Spacing[5], marginBottom: Spacing[4] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[800], marginBottom: Spacing[3] },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },

  contactCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], ...Shadows.sm },
  contactIcon: { width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: Colors.error.light, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[900] },
  contactRel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  contactPhone: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.primary[600], marginTop: 2 },

  menu: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], marginBottom: Spacing[2], ...Shadows.sm },
  menuIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[800] },

  logoutSection: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },
});

export default ProfileScreen;
