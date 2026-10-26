/**
 * OpenMapsScreen – OpenStreetMap (OSM) integration for MediConnect.
 * Displays nearby doctors, clinics, hospitals, and pharmacies on OpenStreetMap tiles.
 * Features:
 *  - OpenStreetMap UrlTile provider.
 *  - Custom clinical markers with category filters.
 *  - Interactive bottom card with booking and OSM turn-by-turn directions.
 *  - GPS recenter button via expo-location.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList, Doctor } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { MapsService } from '../../services/api';
import { haversineDistance } from '../../utils/helpers';
import { Button } from '../../components/ui/primitives';
import { ErrorState } from '../../components/ui/ErrorState';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'OpenMaps'>;
type RouteProps = RouteProp<HomeStackParamList, 'OpenMaps'>;

interface MapPlace {
  id: string;
  name: string;
  category: 'doctor' | 'hospital' | 'clinic' | 'pharmacy' | 'emergency';
  specialty?: string;
  address: string;
  rating?: number;
  latitude: number;
  longitude: number;
  image?: string;
  phone?: string;
  fee?: number;
  currency?: string;
  availableNow?: boolean;
  rawDoctor?: Doctor;
}

const CATEGORIES = [
  { id: 'all', label: 'All Places', icon: 'apps-outline' },
  { id: 'doctor', label: 'Doctors', icon: 'person-outline' },
  { id: 'hospital', label: 'Hospitals', icon: 'business-outline' },
  { id: 'clinic', label: 'Clinics', icon: 'medkit-outline' },
  { id: 'pharmacy', label: 'Pharmacies', icon: 'flask-outline' },
  { id: 'emergency', label: '24/7 ER', icon: 'warning-outline' },
] as const;

export const OpenMapsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const mapRef = useRef<MapView>(null);

  const initialCat = route.params?.initialCategory || 'all';
  const targetDocId = route.params?.doctorId;

  const [activeCategory, setActiveCategory] = useState<string>(initialCat);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default region: San Francisco Medical District
  const [region, setRegion] = useState({
    latitude: route.params?.latitude || 37.7749,
    longitude: route.params?.longitude || -122.4194,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  // Load user GPS location and places
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let userLat = 37.7749;
        let userLng = -122.4194;

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          userLat = loc.coords.latitude;
          userLng = loc.coords.longitude;
          if (isMounted) {
            setUserLocation({ latitude: userLat, longitude: userLng });
            if (!route.params?.latitude) {
              setRegion({
                latitude: userLat,
                longitude: userLng,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
              });
            }
          }
        }

        // Fetch places from Maps API
        setError(null);
        try {
          const loadedPlaces = await MapsService.getLocations();
          if (isMounted) {
            setPlaces(loadedPlaces);
            if (targetDocId) {
              const match = loadedPlaces.find((p: MapPlace) => p.id === targetDocId);
              if (match) setSelectedPlace(match);
            } else if (loadedPlaces.length > 0) {
              setSelectedPlace(loadedPlaces[0]);
            }
          }
        } catch (fetchErr: any) {
          if (isMounted) {
            setError(fetchErr.message || 'Unable to load clinical map locations.');
          }
        }
      } catch (err) {
        console.warn('Map initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [targetDocId]);

  // Filter places based on active category
  const filteredPlaces = places.filter(place => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'doctor') return place.category === 'doctor';
    if (activeCategory === 'hospital') return place.category === 'hospital';
    if (activeCategory === 'clinic') return place.category === 'clinic';
    if (activeCategory === 'emergency') return place.category === 'emergency';
    if (activeCategory === 'pharmacy') return place.category === 'pharmacy';
    return true;
  });

  const recenterToUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });
    }
  };

  const openOpenStreetMapDirections = (destLat: number, destLng: number) => {
    const originLat = userLocation?.latitude || region.latitude;
    const originLng = userLocation?.longitude || region.longitude;
    // Turn-by-turn directions via OpenStreetMap OSRM router
    const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat}%2C${originLng}%3B${destLat}%2C${destLng}`;
    Linking.openURL(osmUrl).catch(() => {
      // Fallback to geo link
      Linking.openURL(`geo:${destLat},${destLng}?q=${destLat},${destLng}`);
    });
  };

  const getMarkerColor = (category: MapPlace['category']) => {
    switch (category) {
      case 'doctor':
        return Colors.primary[500]; // Clinical Ocean Azure
      case 'hospital':
        return '#0D9488'; // Medical Teal
      case 'emergency':
        return Colors.error.main; // Emergency Red
      case 'pharmacy':
        return Colors.sage.main; // Clinical Emerald
      default:
        return Colors.neutral[800];
    }
  };

  const getMarkerIcon = (category: MapPlace['category']): any => {
    switch (category) {
      case 'doctor':
        return 'person';
      case 'hospital':
        return 'business';
      case 'emergency':
        return 'warning';
      case 'pharmacy':
        return 'flask';
      default:
        return 'medkit';
    }
  };

  if (error && places.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
          </TouchableOpacity>
          <View style={styles.osmBadge}>
            <Text style={styles.osmBadgeText}>Clinical Maps</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState
          title="Clinical Maps Unavailable"
          message={error}
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            MapsService.getLocations().then(p => { setPlaces(p); if (p.length) setSelectedPlace(p[0]); }).catch(e => setError(e.message)).finally(() => setIsLoading(false));
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Floating Header & Filter Chips */}
      <View style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.neutral[900]} />
          </TouchableOpacity>

          <View style={styles.osmBadge}>
            <Ionicons name="map" size={14} color={Colors.primary[500]} />
            <Text style={styles.osmBadgeText}>OpenStreetMap</Text>
          </View>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={recenterToUser}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Category Pill Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? Colors.white : Colors.neutral[700]}
                />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Map View with OpenStreetMap Tiles */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Rendering OpenStreetMap…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          provider={PROVIDER_DEFAULT}
          showsUserLocation={Boolean(userLocation)}
          showsMyLocationButton={false}
        >
          {/* OpenStreetMap-powered CartoDB Voyager Tile Layer (Open Access Policy Compliant) */}
          <UrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
            maximumZ={19}
            flipY={false}
            zIndex={-1}
            shouldReplaceMapContent={true}
          />

          {/* Markers */}
          {filteredPlaces.map(place => {
            const isSelected = selectedPlace?.id === place.id;
            const color = getMarkerColor(place.category);
            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                onPress={() => setSelectedPlace(place)}
                zIndex={isSelected ? 10 : 1}
              >
                <View style={[styles.customPin, isSelected && styles.customPinSelected, { borderColor: color }]}>
                  <View style={[styles.pinInner, { backgroundColor: color }]}>
                    <Ionicons name={getMarkerIcon(place.category)} size={14} color={Colors.white} />
                  </View>
                  {isSelected && (
                    <View style={[styles.pinTail, { borderTopColor: color }]} />
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* OpenStreetMap Attribution */}
      <View style={styles.attributionPill}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>

      {/* Bottom Floating Place Detail Card */}
      {selectedPlace && (
        <View style={styles.bottomCardWrapper}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.placeAvatarWrap}>
                {selectedPlace.image ? (
                  <Image source={{ uri: selectedPlace.image }} style={styles.placeAvatar} />
                ) : (
                  <View
                    style={[
                      styles.placeAvatarFallback,
                      { backgroundColor: getMarkerColor(selectedPlace.category) + '18' },
                    ]}
                  >
                    <Ionicons
                      name={getMarkerIcon(selectedPlace.category)}
                      size={22}
                      color={getMarkerColor(selectedPlace.category)}
                    />
                  </View>
                )}
              </View>

              <View style={styles.placeInfo}>
                <View style={styles.placeTitleRow}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {selectedPlace.name}
                  </Text>
                  {selectedPlace.availableNow && (
                    <View style={styles.openNowBadge}>
                      <View style={styles.openNowDot} />
                      <Text style={styles.openNowText}>Available</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.placeSub} numberOfLines={1}>
                  {selectedPlace.specialty || selectedPlace.category.toUpperCase()} • {selectedPlace.address}
                </Text>

                <View style={styles.placeMetaRow}>
                  {selectedPlace.rating && (
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={12} color="#D97706" />
                      <Text style={styles.ratingText}>{selectedPlace.rating.toFixed(1)}</Text>
                    </View>
                  )}

                  {userLocation && (
                    <View style={styles.distPill}>
                      <Ionicons name="navigate-outline" size={12} color={Colors.neutral[500]} />
                      <Text style={styles.distText}>
                        {haversineDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          selectedPlace.latitude,
                          selectedPlace.longitude
                        ).toFixed(1)} km away
                      </Text>
                    </View>
                  )}

                  {selectedPlace.fee && (
                    <Text style={styles.feeText}>
                      ${selectedPlace.fee} / consult
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.actionRow}>
              {selectedPlace.rawDoctor ? (
                <Button
                  label="View Profile"
                  icon="person-outline"
                  onPress={() =>
                    navigation.navigate('DoctorProfile', { doctorId: selectedPlace.id })
                  }
                  variant="primary"
                  size="md"
                  style={styles.actionPrimary}
                />
              ) : selectedPlace.phone ? (
                <Button
                  label="Call Emergency"
                  icon="call"
                  onPress={() => Linking.openURL(`tel:${selectedPlace.phone}`)}
                  variant="danger"
                  size="md"
                  style={styles.actionPrimary}
                />
              ) : null}

              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() =>
                  openOpenStreetMapDirections(selectedPlace.latitude, selectedPlace.longitude)
                }
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={16} color={Colors.neutral[900]} />
                <Text style={styles.directionsText}>OSM Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default OpenMapsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },

  // Floating Top Controls
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  osmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  osmBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },

  filterScroll: {
    paddingVertical: 4,
    gap: Spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
  },
  filterChipTextActive: {
    color: Colors.white,
  },

  // Custom Markers
  customPin: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  customPinSelected: {
    transform: [{ scale: 1.25 }],
    ...Shadows.lg,
  },
  pinInner: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTail: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // Attribution
  attributionPill: {
    position: 'absolute',
    bottom: 230,
    right: Spacing[4],
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  attributionText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },

  // Bottom Floating Card
  bottomCardWrapper: {
    position: 'absolute',
    bottom: Spacing[6],
    left: Spacing[4],
    right: Spacing[4],
    zIndex: 10,
  },
  bottomCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.lg,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  placeAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
  },
  placeAvatar: {
    width: '100%',
    height: '100%',
  },
  placeAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  placeName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  openNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sage.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  openNowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage.main,
  },
  openNowText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sage.dark,
  },
  placeSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  placeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.ochre.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.ochre.dark,
  },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
  feeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginLeft: 'auto',
  },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionPrimary: {
    flex: 1,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing[4],
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  directionsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },
});
