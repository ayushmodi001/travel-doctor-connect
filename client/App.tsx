/**
 * App.tsx – Entry point for MediConnect.
 *
 * Responsibilities:
 *  1. Load Inter font family using expo-font.
 *  2. Wrap the app with ClerkProvider (when configured) and tokenCache.
 *  3. Wrap the app with global context providers (Auth, Appointments).
 *  4. Render the RootNavigator.
 */

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';

import { tokenCache } from './src/utils/tokenCache';
import { AuthProvider } from './src/context/AuthContext';
import { AppointmentProvider } from './src/context/AppointmentContext';
import RootNavigator from './src/navigation/RootNavigator';

// Keep the native splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkConfigured = Boolean(
  publishableKey &&
  publishableKey.startsWith('pk_') &&
  !publishableKey.includes('placeholder')
);

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Hide the splash screen once fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const appContent = (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <RootNavigator />
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {isClerkConfigured ? (
          <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
              <AuthProvider isClerkEnabled={true}>
                <AppointmentProvider>
                  {appContent}
                </AppointmentProvider>
              </AuthProvider>
            </ClerkLoaded>
          </ClerkProvider>
        ) : (
          <AuthProvider isClerkEnabled={false}>
            <AppointmentProvider>
              {appContent}
            </AppointmentProvider>
          </AuthProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
