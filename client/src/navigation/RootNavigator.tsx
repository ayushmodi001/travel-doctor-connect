/**
 * Root navigation configuration for MediConnect.
 *
 * Strict Protected Routes (Requirement 1):
 * - If user is not authenticated via Clerk/verified credentials, ONLY AuthNavigator is mounted.
 * - The application cannot be used or navigated without valid login.
 *
 * Navigators:
 * - AuthStack: GetStarted → Login ↔ Signup → ForgotPassword
 * - MainTabs:  HomeStack | AppointmentsStack | ProfileStack
 * - HomeStack: Home → OpenMaps → SymptomTriage → DoctorList → DoctorProfile → BookAppointment → Chat → VideoCall → Emergency
 * - ApptStack: Appointments → AppointmentDetail
 * - ProfileStack: Profile → EditProfile → MedicalHistory → Settings
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../theme';

// ── Auth screens ──────────────────────────────────────────────────────────────
import GetStartedScreen from '../screens/auth/GetStartedScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// ── Home stack screens ────────────────────────────────────────────────────────
import HomeScreen from '../screens/home/HomeScreen';
import OpenMapsScreen from '../screens/home/OpenMapsScreen';
import SymptomTriageScreen from '../screens/home/SymptomTriageScreen';
import DoctorListScreen from '../screens/home/DoctorListScreen';
import DoctorProfileScreen from '../screens/home/DoctorProfileScreen';
import BookAppointmentScreen from '../screens/home/BookAppointmentScreen';
import ChatScreen from '../screens/home/ChatScreen';
import VideoCallScreen from '../screens/home/VideoCallScreen';
import EmergencyScreen from '../screens/home/EmergencyScreen';

// ── International Travel Companion stack screens ──────────────────────────────
import TravelHubScreen from '../screens/travel/TravelHubScreen';
import MedicalTranslatorScreen from '../screens/travel/MedicalTranslatorScreen';
import MedicineEquivalentsScreen from '../screens/travel/MedicineEquivalentsScreen';
import TravelInsuranceScreen from '../screens/travel/TravelInsuranceScreen';

// ── Appointments stack ────────────────────────────────────────────────────────
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';

// ── Profile stack screens ─────────────────────────────────────────────────────
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MedicalHistoryScreen from '../screens/profile/MedicalHistoryScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AdminDoctorPanelScreen from '../screens/admin/AdminDoctorPanelScreen';

import { i18n } from '../localization/i18n';

// ─── Stack creators ────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const TravelStack = createNativeStackNavigator();
const MapsStack = createNativeStackNavigator();
const ApptStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Navigator ────────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="GetStarted"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <AuthStack.Screen name="GetStarted" component={GetStartedScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Home Stack ────────────────────────────────────────────────────────────────

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="OpenMaps" component={OpenMapsScreen} />
      <HomeStack.Screen name="TravelHub" component={TravelHubScreen} />
      <HomeStack.Screen name="MedicalTranslator" component={MedicalTranslatorScreen} />
      <HomeStack.Screen name="MedicineEquivalents" component={MedicineEquivalentsScreen} />
      <HomeStack.Screen name="TravelInsurance" component={TravelInsuranceScreen} />
      <HomeStack.Screen name="SymptomTriage" component={SymptomTriageScreen} />
      <HomeStack.Screen name="DoctorList" component={DoctorListScreen} />
      <HomeStack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <HomeStack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="VideoCall" component={VideoCallScreen} />
      <HomeStack.Screen name="Emergency" component={EmergencyScreen} />
      <HomeStack.Screen name="AdminDoctorPanel" component={AdminDoctorPanelScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Travel Navigator (International Companion) ───────────────────────────────

function TravelNavigator() {
  return (
    <TravelStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <TravelStack.Screen name="TravelHub" component={TravelHubScreen} />
      <TravelStack.Screen name="MedicalTranslator" component={MedicalTranslatorScreen} />
      <TravelStack.Screen name="MedicineEquivalents" component={MedicineEquivalentsScreen} />
      <TravelStack.Screen name="TravelInsurance" component={TravelInsuranceScreen} />
      <TravelStack.Screen name="DoctorList" component={DoctorListScreen} />
      <TravelStack.Screen name="OpenMaps" component={OpenMapsScreen} />
    </TravelStack.Navigator>
  );
}

// ─── Maps Navigator ───────────────────────────────────────────────────────────

function MapsNavigator() {
  return (
    <MapsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <MapsStack.Screen name="MapsView" component={OpenMapsScreen} />
      <MapsStack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <MapsStack.Screen name="BookAppointment" component={BookAppointmentScreen} />
    </MapsStack.Navigator>
  );
}

// ─── Appointments Stack ────────────────────────────────────────────────────────

function AppointmentsNavigator() {
  return (
    <ApptStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ApptStack.Screen name="Appointments" component={AppointmentsScreen} />
      <ApptStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <ApptStack.Screen name="VideoCall" component={VideoCallScreen} />
      <ApptStack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
    </ApptStack.Navigator>
  );
}

// ─── Profile Stack ─────────────────────────────────────────────────────────────

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
      <ProfileStack.Screen name="TravelInsurance" component={TravelInsuranceScreen} />
      <ProfileStack.Screen name="AdminDoctorPanel" component={AdminDoctorPanelScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Main Tab Navigator ────────────────────────────────────────────────────────

function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1.5,
          borderTopColor: Colors.neutral[150],
          height: 60 + Math.max(insets.bottom, 12),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: Typography.fontFamily.semiBold,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TravelTab') {
            iconName = focused ? 'airplane' : 'airplane-outline';
          } else if (route.name === 'MapsTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'AppointmentsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{ tabBarLabel: i18n.t('nav.home') }}
      />
      <Tab.Screen
        name="TravelTab"
        component={TravelNavigator}
        options={{ tabBarLabel: 'Travel' }}
      />
      <Tab.Screen
        name="MapsTab"
        component={MapsNavigator}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsNavigator}
        options={{ tabBarLabel: i18n.t('nav.appointments') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ tabBarLabel: i18n.t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────────────────

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show splash/loading while restoring session
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashIconWrap}>
          <Ionicons name="heart" size={36} color={Colors.white} />
        </View>
        <Text style={styles.splashText}>MediConnect</Text>
        <ActivityIndicator size="small" color={Colors.white} style={{ marginTop: Spacing[2] }} />
      </View>
    );
  }

  /**
   * REQUIREMENT 1: Strict Route Protection.
   * If not authenticated, only AuthNavigator is returned.
   * The app is completely inaccessible without genuine authentication.
   */
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary[500],
  },
  splashIconWrap: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  splashText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
});
