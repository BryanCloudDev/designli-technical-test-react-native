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
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

type Fields = { name: string; lastName: string; email: string; password: string };
type Errors = Partial<Record<keyof Fields, string>>;

export default function RegisterScreen() {
  const theme = useTheme();
  const { register } = useAuth();

  const [fields, setFields] = useState<Fields>({
    name: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key: keyof Fields) {
    return (value: string) => setFields((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Errors = {};
    if (fields.name.trim().length < 2) e.name = 'At least 2 characters';
    if (fields.lastName.trim().length < 2) e.lastName = 'At least 2 characters';
    if (!emailRegex.test(fields.email.trim())) e.email = 'Enter a valid email address';
    if (fields.password.length < 8) {
      e.password = 'At least 8 characters';
    } else if (!passwordRegex.test(fields.password)) {
      e.password = 'Must include uppercase, lowercase, number & special character';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await register({
        name: fields.name.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
            </Pressable>
            <View style={[styles.logoCircle, { backgroundColor: theme.gain }]}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={[styles.heading, { color: theme.text }]}>Create account</Text>
            <Text style={[styles.subheading, { color: theme.textSecondary }]}>
              Start tracking your portfolio
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <FormInput
                  label="First Name"
                  value={fields.name}
                  onChangeText={set('name')}
                  placeholder="John"
                  autoCapitalize="words"
                  autoComplete="given-name"
                  error={errors.name}
                />
              </View>
              <View style={styles.nameField}>
                <FormInput
                  label="Last Name"
                  value={fields.lastName}
                  onChangeText={set('lastName')}
                  placeholder="Doe"
                  autoCapitalize="words"
                  autoComplete="family-name"
                  error={errors.lastName}
                />
              </View>
            </View>

            <FormInput
              label="Email"
              value={fields.email}
              onChangeText={set('email')}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <FormInput
              label="Password"
              value={fields.password}
              onChangeText={set('password')}
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
              onPress={handleRegister}
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
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => router.replace('/login')}>
                <Text style={[styles.loginLink, { color: theme.gain }]}>Sign in</Text>
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
  header: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  backText: { fontSize: 16, fontWeight: '500' },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  heading: { fontSize: 24, fontWeight: '700' },
  subheading: { fontSize: 14, marginTop: -Spacing.two },
  form: { gap: Spacing.three },
  nameRow: { flexDirection: 'row', gap: Spacing.two },
  nameField: { flex: 1 },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '600' },
});
