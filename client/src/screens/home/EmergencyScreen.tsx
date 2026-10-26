/**
 * EmergencyScreen – Local EMS info, quick-dial buttons, and OpenStreetMap hospital finder.
 * Strict compliance with Requirement 2: Displays ErrorState with retry if services fail.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, EmergencyService } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { haversineDistance } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmergencyApi } from '../../services/api';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Emergency'>;

export const EmergencyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationAndServices = async () => {
    setIsLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required to find nearby emergency hospitals.');
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // Fetch from backend API using EmergencyApi
      const rawServices = await EmergencyApi.getNearbyServices(latitude, longitude);

      if (!rawServices || rawServices.length === 0) {
        throw new Error('No emergency services available in your current area.');
      }

      const withDistances = rawServices.map(svc => ({
        ...svc,
        distance: haversineDistance(latitude, longitude, svc.location.latitude, svc.location.longitude),
      })).sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));

      setServices(withDistances);
    } catch (err: any) {
      // REQUIREMENT 2: DO NOT fall back silently to fake mock data. Show proper error.
      setError(err.message || 'Unable to load nearby emergency services. Please check your connection.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchLocationAndServices();
  }, []);

  const callNumber = (phone: string, label: string) => {
    Alert.alert(
      `Call ${label}`,
      `Dial ${phone} immediately?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const getServiceColor = (type: EmergencyService['type']): string => ({
    ambulance: Colors.primary[500],
    fire: '#EA580C',
    police: '#2563EB',
    hospital: Colors.terracotta.main,
    clinic: Colors.neutral[800],
    pharmacy: Colors.sage.main,
  }[type] ?? Colors.primary[500]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{i18n.t('emergency.title')}</Text>
          <Text style={styles.headerSub}>Instant 24/7 Response Services</Text>
        </View>
        <View style={styles.emergencyIconWrap}>
          <Ionicons name="warning" size={22} color={Colors.white} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Quick-Dial Grid */}
        <View style={styles.quickDials}>
          <QuickDialButton
            label="Call Emergency (911)"
            icon="call"
            color={Colors.primary[500]}
            onPress={() => callNumber('911', 'Emergency Services')}
          />
          <QuickDialButton
            label="Ambulance Dispatch"
            icon="fitness-outline"
            color={Colors.terracotta.main}
            onPress={() => callNumber('911', 'Ambulance')}
          />
          <QuickDialButton
            label="Poison Control"
            icon="flask-outline"
            color="#7C3AED"
            onPress={() => callNumber('1-800-222-1222', 'Poison Control')}
          />
          <QuickDialButton
            label="Crisis Hotline (988)"
            icon="heart-half-outline"
            color="#0891B2"
            onPress={() => callNumber('988', 'Crisis Hotline')}
          />
        </View>

        {/* OpenStreetMap Action Banner */}
        <TouchableOpacity
          style={styles.openMapCard}
          onPress={() => navigation.navigate('OpenMaps', { initialCategory: 'emergency' })}
          activeOpacity={0.85}
        >
          <View style={styles.openMapIconWrap}>
            <Ionicons name="map" size={24} color={Colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.openMapTitle}>Open on OpenStreetMap</Text>
            <Text style={styles.openMapSub}>
              View live emergency hospitals, ambulances, and 24/7 pharmacies on Open Maps
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary[500]} />
        </TouchableOpacity>

        {/* Nearest Facilities Section */}
        <Text style={styles.sectionTitle}>{i18n.t('emergency.nearest')}</Text>

        {isLocating ? (
          <View style={styles.locating}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Text style={styles.locatingText}>{i18n.t('emergency.locating')}</Text>
          </View>
        ) : error ? (
          // REQUIREMENT 2: Proper error state with retry
          <ErrorState
            title="Emergency Data Unavailable"
            message={error}
            onRetry={fetchLocationAndServices}
          />
        ) : (
          services.map(svc => (
            <View key={svc.id} style={styles.serviceCard}>
              <View style={[styles.serviceIconWrap, { backgroundColor: getServiceColor(svc.type) + '1A' }]}>
                <Ionicons
                  name={svc.type === 'hospital' ? 'business' : svc.type === 'ambulance' ? 'fitness' : 'medkit'}
                  size={22}
                  color={getServiceColor(svc.type)}
                />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceAddress} numberOfLines={1}>
                  {svc.address}
                </Text>
                <View style={styles.serviceMeta}>
                  {svc.distance !== undefined && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color={Colors.neutral[500]} />
                      <Text style={styles.metaText}>{svc.distance.toFixed(1)} km</Text>
                    </View>
                  )}
                  {svc.available24h && (
                    <View style={styles.availablePill}>
                      <View style={styles.availableDot} />
                      <Text style={styles.availableText}>24h Active</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: getServiceColor(svc.type) }]}
                onPress={() => callNumber(svc.phone, svc.name)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Safety Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>⚠️ Critical Emergency Tips</Text>
          {[
            'State your exact location clearly (street names and building numbers).',
            'Stay on the line until the emergency dispatcher confirms dispatch.',
            'Keep your phone unlocked and doors open for first responders.',
            'Have your MediConnect Medical ID ready for arriving paramedics.',
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

const QuickDialButton: React.FC<{
  label: string;
  icon: any;
  color: string;
  onPress: () => void;
}> = ({ label, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.quickDialBtn, { borderColor: color + '2E' }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.quickDialIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.quickDialLabel, { color }]} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default EmergencyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: 54,
    paddingBottom: Spacing[5],
    paddingHorizontal: Spacing[5],
    backgroundColor: Colors.primary[500],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  headerSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.85)',
  },
  emergencyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },

  quickDials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  quickDialBtn: {
    width: '47.5%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  quickDialIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  quickDialLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    textAlign: 'center',
  },

  openMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    marginBottom: Spacing[5],
    ...Shadows.sm,
  },
  openMapIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  openMapSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
    lineHeight: 16,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
    marginBottom: Spacing[3],
  },

  locating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    justifyContent: 'center',
  },
  locatingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },

  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  serviceIconWrap: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
  },
  serviceAddress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sage.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  availableDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.sage.main,
  },
  availableText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipsCard: {
    backgroundColor: Colors.ochre.light + '44',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4],
    marginTop: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.ochre.main + '33',
  },
  tipsTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.ochre.dark,
    marginBottom: Spacing[2],
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.ochre.dark,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    lineHeight: 18,
  },
});
