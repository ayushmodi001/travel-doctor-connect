/**
 * SettingsScreen – app settings with language, notifications, and preferences.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProfileStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Divider } from '../../components/ui/primitives';
import { i18n, SUPPORTED_LOCALES } from '../../localization/i18n';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [location, setLocation]           = useState(true);
  const [biometric, setBiometric]         = useState(false);
  const [language, setLanguage]           = useState(i18n.locale);

  const APP_VERSION = '1.0.0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('settings.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Language */}
        <SectionLabel title="Language & Region" />
        <View style={styles.card}>
          <Text style={styles.settingLabel}>{i18n.t('settings.language')}</Text>
          <View style={styles.languageRow}>
            {SUPPORTED_LOCALES.map(loc => (
              <TouchableOpacity
                key={loc.code}
                style={[styles.langBtn, language === loc.code && styles.langBtnActive]}
                onPress={() => {
                  setLanguage(loc.code);
                  i18n.locale = loc.code;
                }}
              >
                <Text style={[styles.langBtnText, language === loc.code && styles.langBtnTextActive]}>
                  {loc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <SectionLabel title="Preferences" />
        <View style={styles.card}>
          <SettingToggle
            icon="notifications-outline"
            label={i18n.t('settings.notifications')}
            value={notifications}
            onToggle={setNotifications}
          />
          <Divider style={styles.settingDivider} />
          <SettingToggle
            icon="moon-outline"
            label={i18n.t('settings.darkMode')}
            value={darkMode}
            onToggle={setDarkMode}
          />
          <Divider style={styles.settingDivider} />
          <SettingToggle
            icon="location-outline"
            label={i18n.t('settings.location')}
            value={location}
            onToggle={setLocation}
          />
          <Divider style={styles.settingDivider} />
          <SettingToggle
            icon="finger-print-outline"
            label={i18n.t('settings.biometric')}
            value={biometric}
            onToggle={setBiometric}
          />
        </View>

        {/* Legal */}
        <SectionLabel title="Legal & About" />
        <View style={styles.card}>
          <SettingLink icon="document-text-outline" label={i18n.t('settings.privacy')} onPress={() => {}} />
          <Divider style={styles.settingDivider} />
          <SettingLink icon="shield-checkmark-outline" label={i18n.t('settings.terms')} onPress={() => {}} />
          <Divider style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary[600]} />
            </View>
            <Text style={styles.settingLabel}>{i18n.t('settings.version')}</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* Danger zone */}
        <SectionLabel title="Account" />
        <View style={styles.card}>
          <SettingLink
            icon="trash-outline"
            label="Delete Account"
            onPress={() => {}}
            danger
          />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

const SettingToggle: React.FC<{
  icon: any;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}> = ({ icon, label, value, onToggle }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingIconWrap}>
      <Ionicons name={icon} size={20} color={Colors.primary[600]} />
    </View>
    <Text style={styles.settingLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: Colors.neutral[200], true: Colors.primary[400] }}
      thumbColor={value ? Colors.primary[600] : Colors.neutral[400]}
    />
  </View>
);

const SettingLink: React.FC<{
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}> = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <View style={[styles.settingIconWrap, danger && styles.dangerIconWrap]}>
      <Ionicons name={icon} size={20} color={danger ? Colors.error.main : Colors.primary[600]} />
    </View>
    <Text style={[styles.settingLabel, danger && styles.dangerLabel]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { padding: Spacing[4], paddingBottom: Spacing[10] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[5],
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.neutral[900] },

  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing[5],
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[1],
  },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing[4], ...Shadows.sm },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconWrap: { backgroundColor: Colors.error.light },
  settingLabel: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[800] },
  settingValue: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  dangerLabel: { color: Colors.error.main },

  settingDivider: { marginVertical: 0 },

  languageRow: { flexDirection: 'row', gap: Spacing[2], paddingBottom: Spacing[4] },
  langBtn: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: BorderRadius.full, backgroundColor: Colors.neutral[100], borderWidth: 1, borderColor: Colors.neutral[200] },
  langBtnActive: { backgroundColor: Colors.primary[50], borderColor: Colors.primary[400] },
  langBtnText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.neutral[600] },
  langBtnTextActive: { color: Colors.primary[700], fontFamily: Typography.fontFamily.semiBold },
});

export default SettingsScreen;
