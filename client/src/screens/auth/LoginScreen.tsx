/**
 * LoginScreen – professional medical app login with email/password auth.
 * Uses AuthContext for state management and AsyncStorage for persistence.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { InputField, Button } from '../../components/ui/primitives';
import { isValidEmail } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError]   = useState('');

  const validateAndLogin = async () => {
    clearError();
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    await login(email.trim().toLowerCase(), password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header gradient */}
        <LinearGradient
          colors={[Colors.primary[700], Colors.primary[500]]}
          style={styles.header}
        >
          <View style={styles.logoWrap}>
            <Ionicons name="heart-circle" size={52} color={Colors.white} />
          </View>
          <Text style={styles.appName}>MediConnect</Text>
          <Text style={styles.appTagline}>Your Health, Wherever You Are</Text>
        </LinearGradient>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{i18n.t('auth.login')}</Text>
          <Text style={styles.cardSubtitle}>Welcome back. Sign in to continue.</Text>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error.dark} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <InputField
            label={i18n.t('auth.email')}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={emailError}
          />

          <InputField
            label={i18n.t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(v => !v)}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>{i18n.t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button
            label={i18n.t('auth.login')}
            onPress={validateAndLogin}
            isLoading={isLoading}
            size="lg"
            style={styles.loginBtn}
          />

          {/* Demo hint */}
          <View style={styles.demoHint}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.neutral[400]} />
            <Text style={styles.demoText}>Demo: any email + password ≥ 6 chars</Text>
          </View>
        </View>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>{i18n.t('auth.noAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>{i18n.t('auth.signup')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { flexGrow: 1 },

  // Header gradient section
  header: {
    paddingTop: 70,
    paddingBottom: 50,
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
  },

  // Form card
  card: {
    marginHorizontal: Spacing[5],
    marginTop: -30,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing[1],
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginBottom: Spacing[5],
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.error.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error.dark,
  },

  // Links
  forgotLink: { alignSelf: 'flex-end', marginTop: -Spacing[2], marginBottom: Spacing[4] },
  forgotText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[500],
  },
  loginBtn: { width: '100%' },

  // Demo hint
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing[4],
    justifyContent: 'center',
  },
  demoText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
  },

  // Signup
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  signupPrompt: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  signupLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[500],
  },
});

export default LoginScreen;
