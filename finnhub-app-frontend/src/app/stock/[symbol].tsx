import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PriceChart } from '@/components/price-chart';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth.context';
import { useTrade } from '@/hooks/use-trade';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

import { PricePoint, stocksApi, StockQuote, watchlistApi, WatchlistItem } from '@/services/api';

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StockDetailScreen() {
  const router = useRouter();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const { token } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Watchlist state
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Live trade state
  const [isLive, setIsLive] = useState(false);
  const [flashDir, setFlashDir] = useState<'up' | 'down' | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // screen padding (Spacing.four × 2) + card padding (Spacing.three × 2)
  const chartWidth = width - Spacing.four * 2 - Spacing.three * 2;

  // ── REST load ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!token || !symbol) return;
    setError(null);
    try {
      const [quoteData, historyData] = await Promise.all([
        stocksApi.getQuote(symbol, token),
        stocksApi.getPriceHistory(symbol, token),
      ]);
      setQuote(quoteData);
      setPoints(historyData.points);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load stock data');
    }
  }, [token, symbol]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  // Check if this stock is already in the watchlist
  useEffect(() => {
    if (!token || !symbol) return;
    watchlistApi.findAll(token)
      .then((items) => {
        const found = items.find((i) => i.symbol === symbol.toUpperCase()) ?? null;
        setWatchlistItem(found);
      })
      .catch(() => {});
  }, [token, symbol]);

  async function handleWatchlistToggle() {
    if (!token || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      if (watchlistItem) {
        await watchlistApi.remove(watchlistItem.id, token);
        setWatchlistItem(null);
      } else {
        const item = await watchlistApi.add(symbol, token);
        setWatchlistItem(item);
      }
    } catch {
      // silently ignore — user can retry by tapping again
    } finally {
      setWatchlistLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // ── WebSocket live trades ──────────────────────────────────────────────────

  const trade = useTrade(symbol);

  useEffect(() => {
    if (!trade) return;

    setQuote((prev) => {
      if (!prev) return prev;
      const prevClose = prev.previousClose || trade.price;
      const change = trade.price - prevClose;
      const percentChange = prevClose !== 0 ? (change / prevClose) * 100 : 0;
      return { ...prev, currentPrice: trade.price, change, percentChange };
    });

    setPoints((prev) => [...prev, { timestamp: trade.timestamp, price: trade.price }]);

    setIsLive(true);

    // Flash the price card briefly
    setFlashDir((prev) => {
      const current = quote?.currentPrice ?? trade.price;
      return trade.price >= current ? 'up' : 'down';
    });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashDir(null), 600);
  }, [trade]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup flash timer on unmount
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  // ── Derived display values ─────────────────────────────────────────────────

  const isPositive = (quote?.change ?? 0) >= 0;
  const changeColor = isPositive ? theme.gain : theme.loss;

  const flashBg =
    flashDir === 'up'
      ? theme.gain + '25'
      : flashDir === 'down'
        ? theme.loss + '25'
        : undefined;

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
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
          <Text style={[styles.headerSymbol, { color: theme.text }]}>{symbol}</Text>
          {/* LIVE badge — appears once first trade arrives */}
          <View style={styles.headerRight}>
            {isLive && (
              <View style={[styles.liveBadge, { backgroundColor: theme.gain + '20' }]}>
                <View style={[styles.liveDot, { backgroundColor: theme.gain }]} />
                <Text style={[styles.liveText, { color: theme.gain }]}>LIVE</Text>
              </View>
            )}
            <Pressable
              onPress={handleWatchlistToggle}
              disabled={watchlistLoading}
              hitSlop={8}
              style={({ pressed }) => [styles.starBtn, { opacity: pressed || watchlistLoading ? 0.5 : 1 }]}>
              {watchlistLoading ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Ionicons
                  name={watchlistItem ? 'star' : 'star-outline'}
                  size={24}
                  color={watchlistItem ? theme.accent : theme.textSecondary}
                />
              )}
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.loss }]}>{error}</Text>
            <Pressable onPress={handleRefresh} style={[styles.retryBtn, { borderColor: theme.accent }]}>
              <Text style={[styles.retryText, { color: theme.accent }]}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.accent}
              />
            }>

            {/* Price Card — flashes on each incoming trade */}
            <View
              style={[
                styles.priceCard,
                { backgroundColor: flashBg ?? theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Text style={[styles.companyName, { color: theme.textSecondary }]} numberOfLines={1}>
                {quote?.name || symbol}
              </Text>
              <Text style={[styles.price, { color: theme.text }]}>
                ${(quote?.currentPrice ?? 0).toFixed(2)}
              </Text>
              <View style={styles.changeRow}>
                <View style={[styles.changeBadge, { backgroundColor: changeColor + '20' }]}>
                  <Text style={[styles.changeText, { color: changeColor }]}>
                    {isPositive ? '+' : ''}
                    {(quote?.change ?? 0).toFixed(2)}{' '}
                    ({isPositive ? '+' : ''}
                    {(quote?.percentChange ?? 0).toFixed(2)}%)
                  </Text>
                </View>
                <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>Today</Text>
              </View>
            </View>

            {/* Chart Card */}
            <View
              style={[
                styles.chartCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: theme.textSecondary }]}>
                  Price History
                </Text>
                {isLive && (
                  <Text style={[styles.chartLiveLabel, { color: changeColor }]}>
                    · updating live
                  </Text>
                )}
              </View>
              <PriceChart
                points={points}
                color={changeColor}
                width={chartWidth}
                previousClose={quote?.previousClose}
              />
            </View>

            {/* Stats Grid */}
            {quote && (
              <>
                <Text style={[styles.statsHeader, { color: theme.text }]}>Today's Range</Text>
                <View style={styles.statsGrid}>
                  <StatTile label="Open" value={`$${(quote.open ?? 0).toFixed(2)}`} />
                  <StatTile label="Prev Close" value={`$${(quote.previousClose ?? 0).toFixed(2)}`} />
                  <StatTile label="Day High" value={`$${(quote.high ?? 0).toFixed(2)}`} />
                  <StatTile label="Day Low" value={`$${(quote.low ?? 0).toFixed(2)}`} />
                </View>
              </>
            )}

            <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
              {isLive
                ? 'Prices update in real time via WebSocket.'
                : 'Prices are delayed 15 minutes. For informational purposes only.'}
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backBtn: { minWidth: 64 },
  backText: { fontSize: 17, fontWeight: '500' },
  headerSymbol: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { minWidth: 64 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 64,
    justifyContent: 'flex-end',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
    gap: Spacing.one,
    justifyContent: 'center',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  starBtn: { padding: Spacing.one },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  errorText: { fontSize: 15, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  retryText: { fontSize: 15, fontWeight: '600' },

  // Scroll
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },

  // Price card
  priceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  companyName: { fontSize: 14 },
  price: { fontSize: 46, fontWeight: '700', letterSpacing: -1.5, marginTop: 4 },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  changeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
  changeText: { fontSize: 15, fontWeight: '600' },
  todayLabel: { fontSize: 13 },

  // Chart card
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  chartTitle: { fontSize: 13, fontWeight: '500' },
  chartLiveLabel: { fontSize: 11, fontWeight: '500' },

  // Stats
  statsHeader: { fontSize: 18, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statTile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '600' },

  disclaimer: { fontSize: 11, textAlign: 'center' },
});
