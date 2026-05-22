import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth.context';
import { useTheme } from '@/hooks/use-theme';
import { WatchlistItem, watchlistApi } from '@/services/api';

// ── Row ───────────────────────────────────────────────────────────────────────

function WatchlistRow({
  item,
  onDelete,
  isDeleting,
  onPress,
}: {
  item: WatchlistItem;
  onDelete: () => void;
  isDeleting: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      <View style={[styles.symbolBadge, { backgroundColor: theme.backgroundSelected }]}>
        <Text style={[styles.symbolText, { color: theme.text }]}>
          {item.symbol.slice(0, 2)}
        </Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowSymbol, { color: theme.text }]}>{item.symbol}</Text>
        <Text style={[styles.rowDate, { color: theme.textSecondary }]}>
          Added {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
      <Pressable
        onPress={onDelete}
        disabled={isDeleting}
        hitSlop={8}
        style={({ pressed }) => [styles.deleteBtn, { opacity: pressed || isDeleting ? 0.5 : 1 }]}>
        {isDeleting ? (
          <ActivityIndicator size="small" color={theme.loss} />
        ) : (
          <Text style={[styles.deleteIcon, { color: theme.loss }]}>✕</Text>
        )}
      </Pressable>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WatchlistsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await watchlistApi.findAll(token);
      setItems(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load watchlist');
    }
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await watchlistApi.remove(id, token);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      setError(e.message ?? 'Failed to remove stock');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Text style={[styles.backText, { color: theme.accent }]}>‹ Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Watchlist</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Watched Stocks</Text>
            {!isLoading && !error && (
              <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
                {items.length} stock{items.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.listCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            {error ? (
              <View style={styles.centeredPad}>
                <Text style={[styles.stateText, { color: theme.loss }]}>{error}</Text>
                <Pressable onPress={load}>
                  <Text style={[styles.retryText, { color: theme.accent }]}>Tap to retry</Text>
                </Pressable>
              </View>
            ) : isLoading ? (
              <View style={styles.centeredPad}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.centeredPad}>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                  No stocks yet. Tap the star on any stock detail to add it.
                </Text>
              </View>
            ) : (
              items.map((item, i) => (
                <View
                  key={item.id}
                  style={
                    i < items.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                      : undefined
                  }>
                  <WatchlistRow
                    item={item}
                    onDelete={() => handleDelete(item.id)}
                    isDeleting={deletingId === item.id}
                    onPress={() =>
                      router.push({ pathname: '/stock/[symbol]', params: { symbol: item.symbol } })
                    }
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backBtn: { minWidth: 64 },
  backText: { fontSize: 17, fontWeight: '500' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { minWidth: 64 },

  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 13 },

  listCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: { fontSize: 14, fontWeight: '700' },
  rowInfo: { flex: 1, gap: 2 },
  rowSymbol: { fontSize: 15, fontWeight: '600' },
  rowDate: { fontSize: 13 },
  chevron: { fontSize: 20, fontWeight: '300' },
  deleteBtn: { padding: Spacing.one },
  deleteIcon: { fontSize: 16, fontWeight: '600' },

  centeredPad: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  stateText: { fontSize: 14, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '600' },
});
