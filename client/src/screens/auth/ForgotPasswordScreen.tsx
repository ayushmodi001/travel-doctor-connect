/**
 * ForgotPasswordScreen – Clerk Core 3 password reset flow.
 * Step 1: Send reset code to email.
 * Step 2: Verify code + submit new password.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignIn, useClerk } from '@clerk/expo';

import { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { InputField, Button } from '../../components/ui/primitives';
import { isValidEmail, isValidPassword } from '../../utils/helpers';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!signIn) {
      setError('Authentication service is still initializing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: createError } = await signIn.create({
        identifier: email.trim().toLowerCase(),
      });
      if (createError) {
        setError(createError.message || 'Unable to find account with this email.');
        return;
      }

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(sendError.message || 'Failed to send reset code.');
        return;
      }

      setStep('reset');
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err.message || 'Unable to send password reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!signIn) return;

    setIsSubmitting(true);
    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code.');
        return;
      }

      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });

      if (submitError) {
        setError(submitError.message || 'Failed to set new password.');
        return;
      }

      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        setError(finalizeError.message || 'Failed to finalize session.');
        return;
      }

      if (signIn.createdSessionId && setActive) {
        await setActive({ session: signIn.createdSessionId });
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => step === 'reset' ? setStep('request') : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
          </TouchableOpacity>
          <View style={styles.badgeWrap}>
            <Text style={styles.brandTitle}>Reset Password</Text>
          </View>
        </View>

        <View style={styles.card}>
          {success ? (
            <View style={styles.successView}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.sage.main} />
              </View>
              <Text style={styles.headline}>Password Updated</Text>
              <Text style={styles.subhead}>
                Your password has been successfully reset. You can now sign in with your new credentials.
              </Text>
              <Button
                label="Go to Sign In"
                onPress={() => navigation.navigate('Login')}
                size="lg"
                style={{ width: '100%', marginTop: Spacing[4] }}
              />
            </View>
          ) : step === 'request' ? (
            <>
              <Text style={styles.headline}>Forgot password?</Text>
              <Text style={styles.subhead}>
                Enter your account email. We'll send you a 6-digit confirmation code to securely reset your password.
              </Text>

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}

              <InputField
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />

              <Button
                label="Send Reset Code"
                onPress={handleSendCode}
                isLoading={isSubmitting}
                size="lg"
                style={{ width: '100%', marginTop: Spacing[2] }}
              />
            </>
          ) : (
            <>
              <Text style={styles.headline}>Enter verification code</Text>
              <Text style={styles.subhead}>
                Check your inbox at {email} and enter the 6-digit code with your new password.
              </Text>

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}

              <InputField
                label="6-Digit Code"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                icon="key-outline"
              />

              <InputField
                label="New Password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                icon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(v => !v)}
              />

              <InputField
                label="Confirm New Password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                icon="shield-checkmark-outline"
              />

              <Button
                label="Update Password"
                onPress={handleResetPassword}
                isLoading={isSubmitting}
                size="lg"
                style={{ width: '100%', marginTop: Spacing[2] }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

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
    alignItems: 'center',
    marginRight: 40,
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
  successView: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  successIconWrap: {
    marginBottom: Spacing[3],
  },
});
