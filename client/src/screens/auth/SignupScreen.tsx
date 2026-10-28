/**
 * SignupScreen – Secure registration with Clerk authentication.
 * Features:
 *  1. Clerk password registration + email verification code.
 *  2. Clerk Social Sign In (Google) via useSSO.
 *  3. Strict route protection: No bypass button.
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
import { useSignUp, useSSO, useClerk } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { InputField, Button } from '../../components/ui/primitives';
import {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
} from '../../utils/helpers';
import { UserService } from '../../services/api';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMMON_ALLERGIES = ['Penicillin', 'Peanuts', 'Latex', 'Sulfa', 'Aspirin', 'Pollen', 'Shellfish'];
const COMMON_CONDITIONS = ['Asthma', 'Diabetes', 'Hypertension', 'Cardiac History', 'Migraine'];

// ─── Error Formatter ──────────────────────────────────────────────────────────

function formatClerkSignupError(err: any): string {
  if (!err) return 'An error occurred during registration.';
  const code = err.code || err.errors?.[0]?.code;
  if (code === 'form_identifier_exists') {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (code === 'form_password_pwned') {
    return 'This password is too common. Please choose a more secure password.';
  }
  if (code === 'form_password_length_too_short') {
    return 'Password must be at least 8 characters long.';
  }
  if (code === 'form_code_incorrect') {
    return 'The verification code entered is incorrect. Please recheck your email.';
  }
  if (code === 'verification_expired') {
    return 'This code has expired. Tap "Resend" below to receive a new code.';
  }
  if (code === 'too_many_attempts') {
    return 'Too many attempts. Please pause for a moment before trying again.';
  }
  return (
    err.longMessage ||
    err.message ||
    err.errors?.[0]?.longMessage ||
    err.errors?.[0]?.message ||
    'Unable to create account. Please verify your details.'
  );
}

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, fetchStatus } = useSignUp();
  const { setActive } = useClerk();
  const { isClerkEnabled, signup: fallbackSignup } = useAuth();
  const { startSSOFlow } = useSSO();

  // Step 1: Account credentials
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Step 2: Health Profile & Medical ID (Requirement 4)
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Family');

  // Email verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const strength = getPasswordStrength(password);
  const strengthColor =
    strength === 'strong'
      ? Colors.sage.main
      : strength === 'medium'
      ? Colors.ochre.main
      : Colors.primary[500];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
    if (!isValidPassword(password)) {
      e.password = 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number.';
    }
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceedToStep2 = () => {
    setAuthError(null);
    if (validate()) {
      setStep(2);
    }
  };

  const handleSignup = async () => {
    setAuthError(null);
    setIsSubmitting(true);

    const profileData = {
      bloodGroup,
      allergies,
      medicalHistory: conditions,
      emergencyContact: {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relation: emergencyRelation.trim() || 'Family',
      },
    };

    try {
      if (isClerkEnabled && signUp) {
        await AsyncStorage.setItem('@mediconnect_pending_profile', JSON.stringify(profileData));

        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error } = await signUp.password({
          emailAddress: email.trim().toLowerCase(),
          password,
          firstName,
          lastName,
        });

        if (error) {
          setAuthError(formatClerkSignupError(error));
          return;
        }

        const { error: sendCodeError } = await signUp.verifications.sendEmailCode();
        if (sendCodeError) {
          setAuthError(formatClerkSignupError(sendCodeError));
          return;
        }

        setPendingVerification(true);
      } else {
        await fallbackSignup(name.trim(), email.trim().toLowerCase(), password, phone.trim(), profileData);
      }
    } catch (err: any) {
      setAuthError(formatClerkSignupError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setAuthError(null);
    if (!verificationCode.trim()) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    if (!signUp) return;

    setIsSubmitting(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (error) {
        setAuthError(formatClerkSignupError(error));
        return;
      }

      if (signUp.status === 'complete') {
        try {
          const pendingProfileStr = await AsyncStorage.getItem('@mediconnect_pending_profile');
          if (pendingProfileStr && signUp.createdUserId) {
            await AsyncStorage.setItem(`@mediconnect_profile_${signUp.createdUserId}`, pendingProfileStr);
            const parsed = JSON.parse(pendingProfileStr);
            await UserService.syncUser({
              id: signUp.createdUserId,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              ...parsed,
            });
          }
        } catch (syncErr: any) {
          console.warn('[Signup] Profile sync on verification:', syncErr.message);
        }

        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setAuthError(formatClerkSignupError(finalizeError));
        }
      } else {
        setAuthError(`Verification status: ${signUp.status}. Additional step required.`);
      }
    } catch (err: any) {
      setAuthError(formatClerkSignupError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    setAuthError(null);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        setAuthError(formatClerkSignupError(error));
      } else {
        setResendSuccess(true);
      }
    } catch (err: any) {
      setAuthError(formatClerkSignupError(err));
    } finally {
      setIsResending(false);
    }
  };

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
      }
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.code === 'popup_closed_by_user') {
        return;
      }
      setAuthError(formatClerkSignupError(err));
    } finally {
      setSocialLoading(null);
    }
  };

  // ── Verification UI ────────────────────────────────────────────────────────
  if (pendingVerification) {
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
              onPress={() => setPendingVerification(false)}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
            </TouchableOpacity>
            <View style={styles.badgeWrap}>
              <Text style={styles.brandTitle}>Verify Email</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.verifyInfoBox}>
              <Ionicons name="mail" size={22} color={Colors.primary[500]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifyInfoTitle}>Confirmation code sent to</Text>
                <Text style={styles.verifyInfoEmail}>{email}</Text>
              </View>
            </View>

            {authError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            )}

            {resendSuccess && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.sage.main} />
                <Text style={styles.successText}>New verification code sent!</Text>
              </View>
            )}

            <InputField
              label="Verification Code"
              placeholder="e.g. 123456"
              value={verificationCode}
              onChangeText={text => {
                setVerificationCode(text);
                if (authError) setAuthError(null);
              }}
              keyboardType="numeric"
              autoCapitalize="none"
              icon="key-outline"
            />

            <Button
              label="Verify & Complete"
              onPress={handleVerifyCode}
              isLoading={isSubmitting || fetchStatus === 'fetching'}
              size="lg"
              style={{ width: '100%', marginTop: Spacing[2] }}
            />

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending}
              style={styles.resendBtn}
            >
              <Text style={styles.resendText}>
                {isResending ? 'Sending code…' : "Didn't receive code? Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Standard Registration Form ──────────────────────────────────────────────
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
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.neutral[800]} />
          </TouchableOpacity>
          <View style={styles.badgeWrap}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="heart" size={20} color={Colors.primary[500]} />
            </View>
            <Text style={styles.brandTitle}>MediConnect</Text>
          </View>
        </View>

        <View style={styles.card}>
          {step === 1 ? (
            <>
              <View style={styles.stepIndicatorRow}>
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>Step 1 of 2: Account Details</Text>
              </View>

              <Text style={styles.headline}>Create your account</Text>
              <Text style={styles.subhead}>
                Join MediConnect to access world-class travel health and board-certified doctors.
              </Text>

              {/* Social Sign Up (Google) */}
              <View style={styles.socialGroup}>
                <TouchableOpacity
                  style={[styles.socialBtn, styles.googleBtn]}
                  onPress={() => handleSocialSignIn('oauth_google')}
                  disabled={Boolean(socialLoading) || isSubmitting}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.socialBtnText}>
                    {socialLoading === 'oauth_google' ? 'Connecting to Google…' : 'Sign up with Google'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or register with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {authError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              )}

              <InputField
                label="Full Name"
                placeholder="Jane Doe"
                value={name}
                onChangeText={text => {
                  setName(text);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  if (authError) setAuthError(null);
                }}
                icon="person-outline"
                error={errors.name}
              />

              <InputField
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  if (authError) setAuthError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
                error={errors.email}
              />

              <InputField
                label="Phone Number"
                placeholder="+1 415 555 0101"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="call-outline"
                error={errors.phone}
              />

              <InputField
                label="Password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  if (authError) setAuthError(null);
                }}
                secureTextEntry={!showPass}
                icon="lock-closed-outline"
                rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPass(v => !v)}
                error={errors.password}
              />

              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width:
                            strength === 'strong'
                              ? '100%'
                              : strength === 'medium'
                              ? '60%'
                              : '30%',
                          backgroundColor: strengthColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                    {strength.charAt(0).toUpperCase() + strength.slice(1)}
                  </Text>
                </View>
              )}

              <InputField
                label="Confirm Password"
                placeholder="Repeat password"
                value={confirm}
                onChangeText={text => {
                  setConfirm(text);
                  if (errors.confirm) setErrors(prev => ({ ...prev, confirm: '' }));
                  if (authError) setAuthError(null);
                }}
                secureTextEntry={!showPass}
                icon="shield-checkmark-outline"
                error={errors.confirm}
              />

              <Button
                label="Next: Health Profile & Medical ID"
                onPress={handleProceedToStep2}
                size="lg"
                style={{ width: '100%', marginTop: Spacing[2] }}
              />
            </>
          ) : (
            <>
              {/* Step 2: Health Profile Setup */}
              <View style={styles.stepIndicatorRow}>
                <View style={[styles.stepDot, styles.stepDotDone]} />
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <Text style={styles.stepText}>Step 2 of 2: Medical ID & Travel Profile</Text>
              </View>

              <Text style={styles.headline}>Travel Medical Profile</Text>
              <Text style={styles.subhead}>
                These essential details populate your emergency health passport and travel medical ID.
              </Text>

              {authError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              )}

              {/* Blood Group Picker */}
              <Text style={styles.profileSectionLabel}>Blood Group</Text>
              <View style={styles.bloodRow}>
                {BLOOD_GROUPS.map(bg => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodPill, bloodGroup === bg && styles.bloodPillActive]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[styles.bloodPillText, bloodGroup === bg && styles.bloodPillTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Known Allergies */}
              <Text style={styles.profileSectionLabel}>Known Allergies</Text>
              <View style={styles.chipsWrap}>
                {COMMON_ALLERGIES.map(item => {
                  const isSelected = allergies.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      onPress={() => {
                        setAllergies(isSelected ? allergies.filter(a => a !== item) : [...allergies, item]);
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {isSelected ? '✓ ' : ''}{item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.inlineAddRow}>
                <InputField
                  label=""
                  placeholder="Other allergy (e.g. Shellfish, Dust)"
                  value={customAllergy}
                  onChangeText={setCustomAllergy}
                  icon="add-circle-outline"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
                      setAllergies([...allergies, customAllergy.trim()]);
                      setCustomAllergy('');
                    }
                  }}
                >
                  <Text style={styles.addSmallBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Medical Conditions */}
              <Text style={styles.profileSectionLabel}>Pre-existing Conditions</Text>
              <View style={styles.chipsWrap}>
                {COMMON_CONDITIONS.map(item => {
                  const isSelected = conditions.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      onPress={() => {
                        setConditions(isSelected ? conditions.filter(c => c !== item) : [...conditions, item]);
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {isSelected ? '✓ ' : ''}{item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.inlineAddRow}>
                <InputField
                  label=""
                  placeholder="Other condition (e.g. Epilepsy, Thyroid)"
                  value={customCondition}
                  onChangeText={setCustomCondition}
                  icon="add-circle-outline"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    if (customCondition.trim() && !conditions.includes(customCondition.trim())) {
                      setConditions([...conditions, customCondition.trim()]);
                      setCustomCondition('');
                    }
                  }}
                >
                  <Text style={styles.addSmallBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Emergency Contact */}
              <Text style={styles.profileSectionLabel}>Emergency Contact</Text>
              <InputField
                label="Contact Name"
                placeholder="e.g. Maria Johnson"
                value={emergencyName}
                onChangeText={setEmergencyName}
                icon="person-outline"
              />
              <InputField
                label="Relationship"
                placeholder="e.g. Spouse, Parent, Sibling, Friend"
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
                icon="heart-outline"
              />
              <InputField
                label="Emergency Phone Number"
                placeholder="+1 415 555 0202"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <Button
                label="Complete Registration & Create Profile"
                onPress={handleSignup}
                isLoading={isSubmitting || fetchStatus === 'fetching'}
                size="lg"
                style={{ width: '100%', marginTop: Spacing[3] }}
              />

              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.neutral[600]} />
                <Text style={styles.backStepText}>Back to Account Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

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

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.sage.light,
    borderRadius: BorderRadius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  successText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.sage.dark,
  },

  verifyInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[100],
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  verifyInfoTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
  },
  verifyInfoEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    marginTop: 2,
  },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: -Spacing[2],
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[1],
  },
  strengthBar: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.neutral[150],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  strengthLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
  },

  resendBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
    marginTop: Spacing[2],
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[600],
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[5],
  },
  loginPrompt: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  loginLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing[3],
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[200],
  },
  stepDotActive: {
    backgroundColor: Colors.primary[600],
    width: 22,
  },
  stepDotDone: {
    backgroundColor: Colors.sage.main,
  },
  stepText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[700],
    marginLeft: 4,
  },
  profileSectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  bloodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing[2],
  },
  bloodPill: {
    width: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  bloodPillActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  bloodPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[800],
  },
  bloodPillTextActive: {
    color: Colors.white,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing[2],
  },
  chipPill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  chipPillActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
  },
  chipTextActive: {
    color: Colors.primary[700],
    fontFamily: Typography.fontFamily.bold,
  },
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing[3],
  },
  addSmallBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
  },
  addSmallBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing[3],
    marginTop: Spacing[1],
  },
  backStepText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
});
