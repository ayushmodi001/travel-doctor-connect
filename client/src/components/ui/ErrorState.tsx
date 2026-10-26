/**
 * ErrorState – Clinical error display component.
 * Displays a clear, actionable error banner or full-screen card with retry capability.
 * Enforces requirement: No silent fallback mock data when something fails!
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from './primitives';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to connect to the healthcare service. Please check your connection and try again.',
  onRetry,
  fullScreen = false,
  style,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={32} color={Colors.primary[500]} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <Button
          label="Try Again"
          icon="refresh-outline"
          onPress={onRetry}
          variant="primary"
          size="md"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    marginHorizontal: Spacing[4],
    marginVertical: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.sm,
  },
  fullScreen: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
    backgroundColor: Colors.canvas,
    borderRadius: 0,
    borderWidth: 0,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: Spacing[1],
  },
  message: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: Spacing[4],
  },
  retryBtn: {
    minWidth: 140,
  },
});

export default ErrorState;
