import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormInput } from '@/components/form-input';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authApi } from '@/services/api';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  async function handleSubmit() {
    if (!emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError('');
    setApiError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      setResetToken(res.resetToken ?? '');
      setSent(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
          </Pressable>

          <View style={styles.iconWrap}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accent + '20' }]}>
              <Text style={[styles.iconEmoji]}>🔑</Text>
            </View>
          </View>

          <Text style={[styles.heading, { color: theme.text }]}>Forgot Password?</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>
            Enter your email address and we'll send you a reset link.
          </Text>

          {sent ? (
            <View style={styles.successSection}>
              <View style={[styles.successBanner, { backgroundColor: theme.gain + '20', borderColor: theme.gain }]}>
                <Text style={[styles.successText, { color: theme.gain }]}>
                  Reset instructions sent! Check your email.
                </Text>
              </View>

              {resetToken ? (
                <View style={[styles.devBanner, { backgroundColor: theme.border, borderColor: theme.border }]}>
                  <Text style={[styles.devLabel, { color: theme.textSecondary }]}>
                    Dev token (remove in production):
                  </Text>
                  <Text style={[styles.devToken, { color: theme.text }]} selectable>
                    {resetToken}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => router.push('/reset-password')}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.primaryBtnText}>Enter Reset Token</Text>
              </Pressable>

              <Pressable onPress={() => router.replace('/login')} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: theme.textSecondary }]}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
              />

              {apiError ? (
                <View style={[styles.errorBanner, { backgroundColor: theme.loss + '20', borderColor: theme.loss }]}>
                  <Text style={[styles.errorBannerText, { color: theme.loss }]}>{apiError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.gain },
                  pressed && styles.pressed,
                  loading && styles.btnDisabled,
                ]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.replace('/login')} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: theme.textSecondary }]}>Back to Sign In</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.four,
  },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  backText: { fontSize: 16, fontWeight: '500' },
  iconWrap: { alignItems: 'center', marginTop: Spacing.five, marginBottom: Spacing.four },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 32 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: Spacing.two },
  subheading: { fontSize: 14, lineHeight: 22, marginBottom: Spacing.four },
  form: { gap: Spacing.three },
  successSection: { gap: Spacing.three },
  successBanner: { borderRadius: 10, borderWidth: 1, padding: Spacing.three },
  successText: { fontSize: 14, fontWeight: '500' },
  devBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  devLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  devToken: { fontSize: 13, fontFamily: 'monospace' },
  errorBanner: { borderRadius: 10, borderWidth: 1, padding: Spacing.three },
  errorBannerText: { fontSize: 14 },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.6 },
  linkBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  linkText: { fontSize: 14 },
});
