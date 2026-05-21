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

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export default function ResetPasswordScreen() {
  const theme = useTheme();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ token?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!token.trim()) e.token = 'Reset token is required';
    if (password.length < 8) {
      e.password = 'At least 8 characters';
    } else if (!passwordRegex.test(password)) {
      e.password = 'Must include uppercase, lowercase, number & special character';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Reset failed. Please try again.');
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
            <View style={[styles.iconCircle, { backgroundColor: theme.gain + '20' }]}>
              <Text style={styles.iconEmoji}>🔒</Text>
            </View>
          </View>

          <Text style={[styles.heading, { color: theme.text }]}>Reset Password</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>
            Enter your reset token and choose a new password.
          </Text>

          {success ? (
            <View style={styles.successSection}>
              <View
                style={[
                  styles.successBanner,
                  { backgroundColor: theme.gain + '20', borderColor: theme.gain },
                ]}>
                <Text style={[styles.successText, { color: theme.gain }]}>
                  Password updated successfully!
                </Text>
              </View>
              <Pressable
                onPress={() => router.replace('/login')}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.gain },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <FormInput
                label="Reset Token"
                value={token}
                onChangeText={setToken}
                placeholder="Paste your reset token"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.token}
              />

              <FormInput
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 chars, A-Z, 0-9, !@#"
                secureTextEntry
                autoComplete="new-password"
                error={errors.password}
              />

              {apiError ? (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: theme.loss + '20', borderColor: theme.loss },
                  ]}>
                  <Text style={[styles.errorBannerText, { color: theme.loss }]}>{apiError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleReset}
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
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.replace('/login')} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                  Back to Sign In
                </Text>
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
