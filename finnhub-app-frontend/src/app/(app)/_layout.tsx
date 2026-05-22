import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { useAppTheme } from '@/context/theme.context';
import AppTabs from '@/components/app-tabs';

export default function AppLayout() {
  const { colorScheme } = useAppTheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
