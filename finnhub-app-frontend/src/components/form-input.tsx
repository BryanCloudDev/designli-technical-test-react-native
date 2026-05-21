import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormInputProps = {
  label: string;
  error?: string;
} & Omit<TextInputProps, 'style'>;

export function FormInput({ label, error, secureTextEntry, ...props }: FormInputProps) {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.loss : isFocused ? theme.accent : theme.border,
          },
        ]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={false}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
            <Text style={[styles.eyeText, { color: theme.textSecondary }]}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={[styles.error, { color: theme.loss }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  label: { fontSize: 13, fontWeight: '500', paddingLeft: 2 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '400' },
  eyeButton: { padding: Spacing.one },
  eyeText: { fontSize: 13, fontWeight: '500' },
  error: { fontSize: 12, paddingLeft: 2 },
});
