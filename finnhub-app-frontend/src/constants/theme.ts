/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0A0F',
    background: '#F2F2F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E5E5EA',
    textSecondary: '#636366',
    gain: '#00A878',
    loss: '#DC2626',
    accent: '#2563EB',
    border: '#C6C6C8',
    card: '#FFFFFF',
    inputBg: '#F2F2F7',
  },
  dark: {
    text: '#FFFFFF',
    background: '#050509',
    backgroundElement: '#0F0F1A',
    backgroundSelected: '#1A1A2E',
    textSecondary: '#8A8A9E',
    gain: '#00D09C',
    loss: '#FF4D6A',
    accent: '#4F8EF7',
    border: '#1F1F32',
    card: '#0F0F1A',
    inputBg: '#0F0F1A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
