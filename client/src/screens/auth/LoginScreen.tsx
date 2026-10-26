/**
 * LoginScreen – Secure login with Clerk authentication.
 * Features:
 *  1. Clerk password authentication.
 *  2. Clerk Social Sign In (Google) via useSSO.
 *  3. Strict route protection: No demo bypass button.
 *  4. Clinical & Travel Health aesthetics.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignIn, useSSO, useClerk } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';

import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { InputField, Button } from '../../components/ui/primitives';
import { isValidEmail } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';

// Warm up browser cache for fast Social OAuth sign-in
WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

// ─── Error Formatter ──────────────────────────────────────────────────────────

function formatClerkError(err: any): string {
  if (!err) return 'An error occurred. Please try again.';
  const code = err.code || err.errors?.[0]?.code;
  if (code === 'form_identifier_not_found') {
    return 'No account found with this email. Please verify or sign up.';
  }
  if (code === 'form_password_incorrect') {
    return 'Incorrect password. Tap "Forgot password?" to reset.';
  }
  if (code === 'too_many_attempts') {
    return 'Too many attempts. Please pause for a few moments before trying again.';
  }
  return (
    err.longMessage ||
    err.message ||
    err.errors?.[0]?.longMessage ||
    err.errors?.[0]?.message ||
    'Unable to sign in. Please verify your credentials.'
  );
}

// ─── Main Login Screen ────────────────────────────────────────────────────────

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const { isClerkEnabled, login: fallbackLogin } = useAuth();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  // ── Clerk Email/Password Login ──────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    setAuthError(null);
    setEmailError('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isClerkEnabled && signIn) {
        const { error } = await signIn.password({
          identifier: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          setAuthError(formatClerkError(error));
          return;
        }

        if (signIn.status === 'complete') {
          const { error: finalizeError } = await signIn.finalize();
          if (finalizeError) {
            setAuthError(formatClerkError(finalizeError));
          }
        } else {
          setAuthError(`Additional verification required (${signIn.status}).`);
        }
      } else {
        // Fallback to real backend endpoint
        await fallbackLogin(email.trim().toLowerCase(), password);
      }
    } catch (err: any) {
      setAuthError(formatClerkError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Clerk Social OAuth Sign-In (Google) ────────────────────────────────────
  const handleSocialSignIn = async (strategy: 'oauth_google') => {
    setAuthError(null);
    setSocialLoading(strategy);
    try {
      if (isClerkEnabled) {
        const { createdSessionId, setActive: setSocialActive } = await startSSOFlow({
          strategy,
        });

        if (createdSessionId && setSocialActive) {
          await setSocialActive({ session: createdSessionId });
        } else if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } else {
        setAuthError('Clerk authentication is not active in this environment.');
      }
    } catch (err: any) {
      // Ignore user cancellation gracefully
      if (err?.message?.includes('cancel') || err?.code === 'popup_closed_by_user') {
        return;
      }
      setAuthError(formatClerkError(err));
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back navigation and MediConnect branding */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('GetStarted')}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
          </TouchableOpacity>

          <View style={styles.badgeWrap}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="heart" size={20} color={Colors.primary[500]} />
            </View>
            <Text style={styles.brandTitle}>MediConnect</Text>
          </View>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.subhead}>
            Sign in to access your doctor consultations, records, and appointments.
          </Text>

          {/* Social Sign-In (Google) */}
          <View style={styles.socialGroup}>
            <TouchableOpacity
              style={[styles.socialBtn, styles.googleBtn]}
              onPress={() => handleSocialSignIn('oauth_google')}
              disabled={Boolean(socialLoading) || isSubmitting}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.socialBtnText}>
                {socialLoading === 'oauth_google' ? 'Connecting to Google…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Error Banner */}
          {authError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          {/* Email Input */}
          <InputField
            label={i18n.t('auth.email')}
            placeholder="you@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (emailError) setEmailError('');
              if (authError) setAuthError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={emailError}
          />

          {/* Password Input */}
          <InputField
            label={i18n.t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (authError) setAuthError(null);
            }}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(v => !v)}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <Button
            label="Sign In"
            onPress={handlePasswordLogin}
            isLoading={isSubmitting || fetchStatus === 'fetching'}
            size="lg"
            style={styles.loginBtn}
          />

          {/* Security Badge */}
          <View style={styles.secureNotice}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.sage.main} />
            <Text style={styles.secureNoticeText}>End-to-end encrypted medical records</Text>
          </View>
        </View>

        {/* Bottom Sign-Up Link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
            <Text style={styles.signupLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing[8],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  badgeWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 40,
    gap: Spacing[2],
  },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },

  card: {
    marginHorizontal: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[6],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadows.md,
  },
  headline: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.6,
    marginBottom: Spacing[1],
  },
  subhead: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    lineHeight: 20,
    marginBottom: Spacing[5],
  },

  socialGroup: {
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingVertical: 13,
    borderRadius: BorderRadius.full,
  },
  googleBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  socialBtnText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[800],
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginVertical: Spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[150],
  },
  dividerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[400],
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.error.light,
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.error.main + '33',
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error.dark,
    lineHeight: 17,
  },

  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing[1],
    marginBottom: Spacing[5],
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[600],
  },

  loginBtn: {
    width: '100%',
    marginBottom: Spacing[4],
  },

  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: Spacing[1],
  },
  secureNoticeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.sage.dark,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[5],
  },
  signupPrompt: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  signupLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
  },
});
