/**
 * Shared reusable UI primitives used across the app.
 * Keeps styling consistent with the design system.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  isLoading = false, disabled = false, icon, style,
}) => {
  const isDisabled = disabled || isLoading;
  const btnStyle   = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    isDisabled && styles.btnDisabled,
    style,
  ];
  const textStyle = [styles.btnText, styles[`btnText_${variant}`], styles[`btnText_${size}`]];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary[500]} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
              color={variant === 'primary' ? Colors.white : Colors.primary[500]}
            />
          )}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── Input Field ──────────────────────────────────────────────────────────────

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label, placeholder, value, onChangeText,
  secureTextEntry = false, keyboardType = 'default',
  autoCapitalize = 'sentences', error, icon,
  rightIcon, onRightIconPress, style, multiline, numberOfLines,
}) => (
  <View style={[styles.inputWrapper, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={[styles.inputContainer, error ? styles.inputError : null, multiline ? styles.inputMultiline : null]}>
      {icon && (
        <Ionicons name={icon} size={18} color={error ? Colors.error.main : Colors.neutral[400]} style={styles.inputIcon} />
      )}
      <TextInput
        style={[styles.input, multiline ? styles.inputMultilineText : null]}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
          <Ionicons name={rightIcon} size={18} color={Colors.neutral[400]} />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  action?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, onActionPress }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onActionPress}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Loading Overlay ──────────────────────────────────────────────────────────

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color={Colors.primary[500]} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search-outline', title, subtitle, actionLabel, onAction,
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon} size={36} color={Colors.neutral[400]} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {actionLabel && onAction && (
      <Button label={actionLabel} onPress={onAction} variant="primary" size="sm" style={styles.emptyAction} />
    )}
  </View>
);

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = Colors.primary[600],
  bg    = Colors.primary[50],
}) => (
  <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
    <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
  </View>
);

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.divider, style]} />
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  uri?: string;
  size?: number;
  name?: string; // for initials fallback
}

export const Avatar: React.FC<AvatarProps> = ({ uri, size = 48, name }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.neutral[100] }}
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Button
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btn_primary:   { backgroundColor: Colors.primary[500] },
  btn_secondary: { backgroundColor: Colors.neutral[100], borderWidth: 1, borderColor: Colors.neutral[200] },
  btn_ghost:     { backgroundColor: Colors.transparent },
  btn_danger:    { backgroundColor: Colors.error.main },
  btn_sm:        { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3] },
  btn_md:        { paddingVertical: Spacing[3], paddingHorizontal: Spacing[4] },
  btn_lg:        { paddingVertical: Spacing[4], paddingHorizontal: Spacing[6] },
  btnDisabled:   { opacity: 0.5 },
  btnText: {
    fontFamily: Typography.fontFamily.semiBold,
  },
  btnText_primary:   { color: Colors.white },
  btnText_secondary: { color: Colors.neutral[700] },
  btnText_ghost:     { color: Colors.primary[500] },
  btnText_danger:    { color: Colors.white },
  btnText_sm:        { fontSize: Typography.fontSize.sm },
  btnText_md:        { fontSize: Typography.fontSize.base },
  btnText_lg:        { fontSize: Typography.fontSize.lg },

  // Input
  inputWrapper: { marginBottom: Spacing[4] },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
    marginBottom: Spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3],
    minHeight: 50,
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingVertical: Spacing[3],
    minHeight: 100,
  },
  inputError: { borderColor: Colors.error.main, backgroundColor: Colors.error.light + '33' },
  inputIcon:  { marginRight: Spacing[2] },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  inputMultilineText: {
    textAlignVertical: 'top',
  },
  rightIconBtn: { padding: Spacing[1] },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error.main,
    marginTop: Spacing[1],
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[900],
  },
  sectionAction: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[500],
  },

  // Loading
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
    gap: Spacing[3],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: { marginTop: Spacing[2] },

  // Badge
  badgeContainer: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing[3],
  },

  // Avatar
  avatarFallback: {
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[700],
  },
});
