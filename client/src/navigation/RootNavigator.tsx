/**
 * Root navigation configuration.
 * - AuthStack:  Login → Signup → ForgotPassword
 * - MainTabs:   HomeStack | AppointmentsStack | ProfileStack
 * - HomeStack:  Home → SymptomTriage → DoctorList → DoctorProfile → …
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing } from '../theme';

// ── Auth screens ──────────────────────────────────────────────────────────────
import LoginScreen        from '../screens/auth/LoginScreen';
import SignupScreen       from '../screens/auth/SignupScreen';

// ── Home stack screens ────────────────────────────────────────────────────────
import HomeScreen          from '../screens/home/HomeScreen';
import SymptomTriageScreen from '../screens/home/SymptomTriageScreen';
import DoctorListScreen    from '../screens/home/DoctorListScreen';
import DoctorProfileScreen from '../screens/home/DoctorProfileScreen';
import BookAppointmentScreen from '../screens/home/BookAppointmentScreen';
import ChatScreen          from '../screens/home/ChatScreen';
import VideoCallScreen     from '../screens/home/VideoCallScreen';
import EmergencyScreen     from '../screens/home/EmergencyScreen';

// ── Appointments stack ────────────────────────────────────────────────────────
import AppointmentsScreen  from '../screens/appointments/AppointmentsScreen';

// ── Profile stack screens ─────────────────────────────────────────────────────
import ProfileScreen  from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// ─── Placeholder screens (EditProfile, MedicalHistory, ForgotPassword) ────────
import { i18n } from '../localization/i18n';

const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.semiBold, color: Colors.neutral[700] }}>
      {title}
    </Text>
    <Text style={{ fontSize: 14, color: Colors.neutral[400], marginTop: 8 }}>
      Screen coming soon…
    </Text>
  </View>
);

// ─── Stack creators ────────────────────────────────────────────────────────────

const AuthStack       = createNativeStackNavigator();
const HomeStack       = createNativeStackNavigator();
const ApptStack       = createNativeStackNavigator();
const ProfileStack    = createNativeStackNavigator();
const Tab             = createBottomTabNavigator();

// ─── Auth Navigator ────────────────────────────────────────────────────────────

const ForgotPasswordScreen = () => <PlaceholderScreen title="Forgot Password" />;
const AppointmentDetailScreen = () => <PlaceholderScreen title="Appointment Detail" />;
const EditProfileScreen = () => <PlaceholderScreen title="Edit Profile" />;
const MedicalHistoryScreen = () => <PlaceholderScreen title="Medical History" />;

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"          component={LoginScreen} />
      <AuthStack.Screen name="Signup"         component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Home Stack ────────────────────────────────────────────────────────────────

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home"             component={HomeScreen} />
      <HomeStack.Screen name="SymptomTriage"    component={SymptomTriageScreen} />
      <HomeStack.Screen name="DoctorList"       component={DoctorListScreen} />
      <HomeStack.Screen name="DoctorProfile"    component={DoctorProfileScreen} />
      <HomeStack.Screen name="BookAppointment"  component={BookAppointmentScreen} />
      <HomeStack.Screen name="Chat"             component={ChatScreen} />
      <HomeStack.Screen name="VideoCall"        component={VideoCallScreen} />
      <HomeStack.Screen name="Emergency"        component={EmergencyScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Appointments Stack ────────────────────────────────────────────────────────

function AppointmentsNavigator() {
  return (
    <ApptStack.Navigator screenOptions={{ headerShown: false }}>
      <ApptStack.Screen name="Appointments"     component={AppointmentsScreen} />
      <ApptStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
    </ApptStack.Navigator>
  );
}

// ─── Profile Stack ─────────────────────────────────────────────────────────────

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile"        component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile"    component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings"       component={SettingsScreen} />
      <ProfileStack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Main Tab Navigator ────────────────────────────────────────────────────────

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Typography.fontFamily.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
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

  // Show splash/loading while restoring session from AsyncStorage
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.splashText}>MediConnect</Text>
      </View>
    );
  }

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
    gap: Spacing[4],
    backgroundColor: Colors.primary[700],
  },
  splashText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
