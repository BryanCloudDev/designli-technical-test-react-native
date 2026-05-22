import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth.context';
import { useAppTheme } from '@/context/theme.context';
import { useTheme } from '@/hooks/use-theme';
import { priceAlertsApi, watchlistApi } from '@/services/api';

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Price Alerts', icon: 'trending-up' },
  { label: 'Watchlists', icon: 'star' },
];

export default function AccountScreen() {
  const theme = useTheme();
  const { colorScheme, toggleTheme } = useAppTheme();
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [alertsCount, setAlertsCount] = useState<number | null>(null);
  const [watchlistCount, setWatchlistCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      priceAlertsApi.findAll(token)
        .then((alerts) => setAlertsCount(alerts.length))
        .catch(() => setAlertsCount(0));
      watchlistApi.findAll(token)
        .then((items) => setWatchlistCount(items.length))
        .catch(() => setWatchlistCount(0));
    }, [token]),
  );

  function getMenuItemPress(label: string) {
    if (label === 'Price Alerts') return () => router.push('/price-alerts');
    if (label === 'Watchlists') return () => router.push('/watchlists');
    return undefined;
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Account</Text>
          <Pressable
            onPress={toggleTheme}
            hitSlop={8}
            style={({ pressed }) => [styles.themeBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Ionicons
              name={colorScheme === 'dark' ? 'sunny' : 'moon'}
              size={22}
              color={theme.text}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}
          showsVerticalScrollIndicator={false}>

          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.gain }]}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{user ? `${user.name} ${user.lastName}` : ''}</Text>
              <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
                Premium Account
              </Text>
            </View>
            <View style={[styles.planBadge, { backgroundColor: theme.accent + '20' }]}>
              <Text style={[styles.planText, { color: theme.accent }]}>PRO</Text>
            </View>
          </View>

          {/* Portfolio Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Watchlist', value: watchlistCount === null ? '…' : String(watchlistCount) },
              { label: 'Alerts', value: alertsCount === null ? '…' : String(alertsCount) },
              { label: 'Portfolios', value: '1' },
            ].map((stat) => (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Menu */}
          <View style={[styles.menuCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {MENU_ITEMS.map((item, i) => (
              <View key={item.label}>
                <Pressable
                  onPress={getMenuItemPress(item.label)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <Ionicons name={item.icon} size={20} color={theme.text} style={styles.menuIcon} />
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </Pressable>
                {i < MENU_ITEMS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              { backgroundColor: theme.loss + '15', borderColor: theme.loss },
              pressed && { opacity: 0.7 },
              loggingOut && { opacity: 0.5 },
            ]}>
            {loggingOut ? (
              <ActivityIndicator color={theme.loss} />
            ) : (
              <Text style={[styles.signOutText, { color: theme.loss }]}>Sign Out</Text>
            )}
          </Pressable>

          <Text style={[styles.version, { color: theme.textSecondary }]}>Finnhub v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '700' },
  themeBtn: { padding: Spacing.one },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '600' },
  profileSub: { fontSize: 13, marginTop: 2 },
  planBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
  planText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  menuIcon: { width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, marginLeft: 52 + Spacing.three * 2 },
  signOutBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '600' },
  version: { fontSize: 12, textAlign: 'center', paddingBottom: Spacing.two },
});
