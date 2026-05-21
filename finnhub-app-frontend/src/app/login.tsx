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
import { useAuth } from '@/context/auth.context';
import { useTheme } from '@/hooks/use-theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!emailRegex.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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

          {/* Brand */}
          <View style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: theme.gain }]}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>Finnhub</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Stock Portfolio Tracker
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.heading, { color: theme.text }]}>Welcome back</Text>
            <Text style={[styles.subheading, { color: theme.textSecondary }]}>
              Sign in to your account
            </Text>

            <View style={styles.fields}>
              <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />
              <FormInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                autoComplete="password"
                error={errors.password}
              />
            </View>

            <Pressable
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotWrapper}>
              <Text style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</Text>
            </Pressable>

            {apiError ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.loss + '20', borderColor: theme.loss }]}>
                <Text style={[styles.errorBannerText, { color: theme.loss }]}>{apiError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleLogin}
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
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={[styles.registerText, { color: theme.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={[styles.registerLink, { color: theme.gain }]}>Create one</Text>
              </Pressable>
            </View>
          </View>
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
  },
  brand: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  tagline: { fontSize: 14 },
  form: { gap: Spacing.three },
  heading: { fontSize: 24, fontWeight: '700' },
  subheading: { fontSize: 14, marginTop: -Spacing.two },
  fields: { gap: Spacing.three },
  forgotWrapper: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, fontWeight: '500' },
  errorBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing.three,
  },
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
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '600' },
});
