/**
 * SignupScreen – new user registration with name, email, phone, password.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { InputField, Button } from '../../components/ui/primitives';
import { isValidEmail, isValidPassword, getPasswordStrength } from '../../utils/helpers';
import { i18n } from '../../localization/i18n';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'> };

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup, isLoading, error, clearError } = useAuth();

  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);
  const strengthColor =
    strength === 'strong' ? Colors.success.main :
    strength === 'medium' ? Colors.warning.main :
    Colors.error.main;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (!isValidPassword(password)) e.password = 'Min 8 chars, one uppercase, one number.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    clearError();
    if (!validate()) return;
    await signup(name.trim(), email.trim().toLowerCase(), password, phone.trim());
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.neutral[50] }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary[700], Colors.primary[500]]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <Ionicons name="person-add" size={36} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join MediConnect today</Text>
        </LinearGradient>

        {/* Form */}
        <View style={styles.card}>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error.dark} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <InputField label={i18n.t('auth.fullName')} placeholder="Dr. Jane Doe" value={name} onChangeText={setName} icon="person-outline" error={errors.name} />
          <InputField label={i18n.t('auth.email')} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" error={errors.email} />
          <InputField label={i18n.t('auth.phone')} placeholder="+1 415 555 0101" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" error={errors.phone} />
          <InputField
            label={i18n.t('auth.password')}
            placeholder="Min 8 chars…"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            icon="lock-closed-outline"
            rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPass(v => !v)}
            error={errors.password}
          />

          {/* Password strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, {
                  width: strength === 'strong' ? '100%' : strength === 'medium' ? '60%' : '30%',
                  backgroundColor: strengthColor,
                }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                {strength.charAt(0).toUpperCase() + strength.slice(1)}
              </Text>
            </View>
          )}

          <InputField
            label={i18n.t('auth.confirmPassword')}
            placeholder="Repeat password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPass}
            icon="shield-checkmark-outline"
            error={errors.confirm}
          />

          <Button label={i18n.t('auth.signup')} onPress={handleSignup} isLoading={isLoading} size="lg" style={{ width: '100%', marginTop: Spacing[2] }} />
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>{i18n.t('auth.hasAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>{i18n.t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: Spacing[5], gap: Spacing[2], alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: Spacing[5], padding: Spacing[2] },
  logoWrap: { width: 64, height: 64, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.white },
  headerSub: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: 'rgba(255,255,255,0.7)' },
  card: { marginHorizontal: Spacing[5], marginTop: -24, backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing[6], shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: Colors.error.light, borderRadius: BorderRadius.lg, padding: Spacing[3], marginBottom: Spacing[4] },
  errorText: { flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.error.dark },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: -Spacing[2], marginBottom: Spacing[3] },
  strengthBar: { flex: 1, height: 4, backgroundColor: Colors.neutral[200], borderRadius: BorderRadius.full, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: BorderRadius.full },
  strengthLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, width: 50, textAlign: 'right' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing[6] },
  loginPrompt: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.neutral[500] },
  loginLink: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary[500] },
});

export default SignupScreen;
