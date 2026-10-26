/**
 * GetStartedScreen – Welcome and onboarding screen.
 * Modern clinical & travel companion design with curated health features.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/ui/primitives';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'GetStarted'>;
};

export const GetStartedScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Visual Collage - Medical & Travel card stack */}
        <View style={styles.heroSection}>
          <View style={styles.imageGrid}>
            <View style={[styles.imageCol, { paddingTop: 20 }]}>
              <View style={[styles.photoCard, styles.photoCard1]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400',
                  }}
                  style={styles.cardImage}
                />
                <View style={styles.imageOverlayBadge}>
                  <Ionicons name="sparkles" size={12} color={Colors.white} />
                  <Text style={styles.imageBadgeText}>Top Specialists</Text>
                </View>
              </View>

              <View style={[styles.photoCard, styles.photoCardSmall]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=300',
                  }}
                  style={styles.cardImage}
                />
              </View>
            </View>

            <View style={styles.imageCol}>
              <View style={[styles.photoCard, styles.photoCardTall]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400',
                  }}
                  style={styles.cardImage}
                />
                <View style={[styles.imageOverlayBadge, styles.badgeVerified]}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.white} />
                  <Text style={styles.imageBadgeText}>Board Certified</Text>
                </View>
              </View>

              <View style={[styles.photoCard, styles.photoCardMap]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=300',
                  }}
                  style={styles.cardImage}
                />
                <View style={styles.mapPinIndicator}>
                  <Ionicons name="location" size={14} color={Colors.primary[500]} />
                  <Text style={styles.mapPinText}>Open Maps</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.brandRow}>
            <View style={styles.logoPill}>
              <Ionicons name="heart" size={16} color={Colors.primary[500]} />
              <Text style={styles.brandName}>MediConnect</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>Travel Healthcare</Text>
            </View>
          </View>

          <Text style={styles.headline}>
            Your health, curated & accessible anywhere.
          </Text>

          <Text style={styles.subheadline}>
            Connect with board-certified doctors, locate clinics with Open Maps,
            and manage appointments wherever your journey takes you.
          </Text>

          {/* Value props pills */}
          <View style={styles.featurePills}>
            <View style={styles.featurePill}>
              <Ionicons name="map-outline" size={14} color={Colors.neutral[800]} />
              <Text style={styles.featureText}>Open Maps Finder</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="videocam-outline" size={14} color={Colors.neutral[800]} />
              <Text style={styles.featureText}>Instant Telehealth</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.neutral[800]} />
              <Text style={styles.featureText}>Clerk Protected</Text>
            </View>
          </View>

          {/* Call to action buttons */}
          <View style={styles.ctaGroup}>
            <Button
              label="Get Started"
              onPress={() => navigation.navigate('Signup')}
              variant="primary"
              size="lg"
              style={styles.primaryBtn}
            />

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>I already have an account</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.neutral[900]} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: Spacing[8],
  },

  // Hero Section
  heroSection: {
    paddingTop: 54,
    paddingHorizontal: Spacing[4],
  },
  imageGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
    height: 340,
  },
  imageCol: {
    flex: 1,
    gap: Spacing[3],
  },
  photoCard: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.neutral[150],
    ...Shadows.md,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  photoCard1: {
    height: 180,
  },
  photoCardSmall: {
    flex: 1,
  },
  photoCardTall: {
    height: 200,
  },
  photoCardMap: {
    flex: 1,
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: Spacing[2],
    left: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(25, 21, 18, 0.75)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeVerified: {
    backgroundColor: 'rgba(46, 125, 50, 0.85)',
  },
  imageBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  mapPinIndicator: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  mapPinText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },

  // Content
  contentSection: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  brandName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    letterSpacing: 0.2,
  },
  tagPill: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },

  headline: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: Spacing[2],
  },
  subheadline: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    lineHeight: 22,
    marginBottom: Spacing[5],
  },

  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[800],
  },

  ctaGroup: {
    gap: Spacing[3],
  },
  primaryBtn: {
    width: '100%',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.neutral[100],
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  loginBtnText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },
});
