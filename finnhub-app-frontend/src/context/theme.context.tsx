import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { secureStorage } from '@/services/secure-storage';

type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'finnhub_theme_preference';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreference] = useState<ColorScheme | null>(null);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark') setPreference(val);
    });
  }, []);

  const colorScheme: ColorScheme =
    preference ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = useCallback(() => {
    const next: ColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    secureStorage.setItem(STORAGE_KEY, next);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ colorScheme, colors: Colors[colorScheme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
