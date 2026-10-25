/**
 * App.tsx – Entry point for MediConnect.
 *
 * Responsibilities:
 *  1. Load Inter font family using expo-font.
 *  2. Wrap the app with all global context providers.
 *  3. Render the RootNavigator.
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

import { AuthProvider } from './src/context/AuthContext';
import { AppointmentProvider } from './src/context/AppointmentContext';
import RootNavigator from './src/navigation/RootNavigator';

// Keep the native splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

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
    // Return null while fonts load – splash screen is still visible
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* ── Global providers ─────────────────────────────────────────── */}
        <AuthProvider>
          <AppointmentProvider>
            <View style={styles.root} onLayout={onLayoutRootView}>
              <StatusBar style="auto" />
              {/* ── Root navigation ───────────────────────────────────── */}
              <RootNavigator />
            </View>
          </AppointmentProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
