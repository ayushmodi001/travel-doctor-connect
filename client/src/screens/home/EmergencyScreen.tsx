/**
 * EmergencyScreen – local EMS info, quick-dial buttons, and nearby hospital map.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

import { EmergencyService } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { MOCK_EMERGENCY_SERVICES } from '../../data/mockData';
import { haversineDistance } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';

const EmergencyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    const fetchLocationAndServices = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = loc.coords;

          // Calculate distances from user to each service
          const withDistances = MOCK_EMERGENCY_SERVICES.map(svc => ({
            ...svc,
            distance: haversineDistance(latitude, longitude, svc.location.latitude, svc.location.longitude),
          })).sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));

          setServices(withDistances);
        } else {
          setServices(MOCK_EMERGENCY_SERVICES);
        }
      } catch {
        setServices(MOCK_EMERGENCY_SERVICES);
      } finally {
        setIsLocating(false);
      }
    };

    fetchLocationAndServices();
  }, []);

  const callNumber = (phone: string, label: string) => {
    Alert.alert(
      `Call ${label}`,
      `This will dial ${phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', style: 'destructive', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const getServiceIcon = (type: EmergencyService['type']): any => ({
    ambulance: 'fitness-outline',
    fire:      'flame-outline',
    police:    'shield-outline',
    hospital:  'business-outline',
  }[type] ?? 'medical-outline');

  const getServiceColor = (type: EmergencyService['type']): string => ({
    ambulance: Colors.error.main,
    fire:      '#F97316',
    police:    Colors.info.main,
    hospital:  Colors.primary[500],
  }[type] ?? Colors.primary[500]);

  return (
    <View style={styles.container}>
      {/* Alert header */}
      <LinearGradient colors={[Colors.error.dark, Colors.error.main]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{i18n.t('emergency.title')}</Text>
          <Text style={styles.headerSub}>Tap to dial immediately</Text>
        </View>
        <Ionicons name="warning" size={28} color={Colors.white} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Emergency quick-dial grid */}
        <View style={styles.quickDials}>
          <QuickDialButton
            label={i18n.t('emergency.callEmergency')}
            icon="call"
            color={Colors.error.main}
            onPress={() => callNumber('911', 'Emergency Services')}
          />
          <QuickDialButton
            label={i18n.t('emergency.callAmbulance')}
            icon="fitness-outline"
            color="#DC2626"
            onPress={() => callNumber('911', 'Ambulance')}
          />
          <QuickDialButton
            label={i18n.t('emergency.callPoison')}
            icon="flask-outline"
            color="#7C3AED"
            onPress={() => callNumber('1-800-222-1222', 'Poison Control')}
          />
          <QuickDialButton
            label="Mental Health Crisis"
            icon="heart-half-outline"
            color="#0891B2"
            onPress={() => callNumber('988', 'Mental Health Hotline')}
          />
        </View>

        {/* Nearest services */}
        <Text style={styles.sectionTitle}>{i18n.t('emergency.nearest')}</Text>

        {isLocating ? (
          <View style={styles.locating}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Text style={styles.locatingText}>{i18n.t('emergency.locating')}</Text>
          </View>
        ) : (
          services.map(svc => (
            <View key={svc.id} style={styles.serviceCard}>
              <View style={[styles.serviceIconWrap, { backgroundColor: getServiceColor(svc.type) + '1A' }]}>
                <Ionicons name={getServiceIcon(svc.type)} size={22} color={getServiceColor(svc.type)} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceAddress} numberOfLines={1}>{svc.address}</Text>
                <View style={styles.serviceMeta}>
                  {svc.distance !== undefined && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color={Colors.neutral[500]} />
                      <Text style={styles.metaText}>{svc.distance.toFixed(1)} km</Text>
                    </View>
                  )}
                  {svc.available24h && (
                    <View style={[styles.metaItem, styles.availablePill]}>
                      <View style={styles.availableDot} />
                      <Text style={styles.availableText}>24h</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: getServiceColor(svc.type) }]}
                onPress={() => callNumber(svc.phone, svc.name)}
              >
                <Ionicons name="call" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Safety tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>⚠️ Emergency Tips</Text>
          {[
            'Stay calm and speak clearly when calling emergency services.',
            'Give your exact location (street address, landmarks).',
            'Do not hang up until instructed by the dispatcher.',
            'If possible, unlock your front door for paramedics.',
            'Keep a list of current medications nearby.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── QuickDialButton ──────────────────────────────────────────────────────────

const QuickDialButton: React.FC<{
  label: string;
  icon: any;
  color: string;
  onPress: () => void;
}> = ({ label, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.quickDialBtn, { borderColor: color + '33' }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.quickDialIcon, { backgroundColor: color + '1A' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={[styles.quickDialLabel, { color }]} numberOfLines={2}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { padding: Spacing[4], paddingBottom: Spacing[10] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: 56,
    paddingBottom: Spacing[5],
    paddingHorizontal: Spacing[5],
  },
  backBtn: { marginRight: Spacing[1] },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.white },
  headerSub: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.7)' },

  quickDials: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[5] },
  quickDialBtn: { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, ...Shadows.sm },
  quickDialIcon: { width: 52, height: 52, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2] },
  quickDialLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, textAlign: 'center' },

  sectionTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[900], marginBottom: Spacing[3] },

  locating: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[4] },
  locatingText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },

  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing[4], marginBottom: Spacing[3], ...Shadows.sm },
  serviceIconWrap: { width: 48, height: 48, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[900] },
  serviceAddress: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500], marginTop: 2 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  availablePill: { backgroundColor: Colors.success.light, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  availableDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.success.main },
  availableText: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: Colors.success.dark },
  callBtn: { width: 44, height: 44, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },

  tipsCard: { backgroundColor: Colors.warning.light, borderRadius: BorderRadius.xl, padding: Spacing[4], marginTop: Spacing[3] },
  tipsTitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.warning.dark, marginBottom: Spacing[3] },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2], marginBottom: Spacing[2] },
  tipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.warning.dark, marginTop: 7 },
  tipText: { flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[800], lineHeight: 20 },
});

export default EmergencyScreen;
