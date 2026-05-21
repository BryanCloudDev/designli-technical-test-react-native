import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth.context';
import { useTheme } from '@/hooks/use-theme';
import { StockQuote, StockSearchResult, stocksApi } from '@/services/api';

// ── Sub-components ────────────────────────────────────────────────────────────

function StockRow({
  symbol,
  name,
  currentPrice,
  change,
  percentChange,
  onPress,
}: StockQuote & { onPress: () => void }) {
  const theme = useTheme();
  // Finnhub returns null for change/percentChange when market is closed
  const safeChange = change ?? 0;
  const safePercent = percentChange ?? 0;
  const safePrice = currentPrice ?? 0;
  const isPositive = safeChange >= 0;
  const changeColor = isPositive ? theme.gain : theme.loss;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.stockRow, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.symbolBadge, { backgroundColor: theme.backgroundSelected }]}>
        <Text style={[styles.symbolText, { color: theme.text }]}>{symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.stockInfo}>
        <Text style={[styles.stockSymbol, { color: theme.text }]}>{symbol}</Text>
        <Text style={[styles.stockName, { color: theme.textSecondary }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.stockPricing}>
        <Text style={[styles.stockPrice, { color: theme.text }]}>
          ${safePrice.toFixed(2)}
        </Text>
        <Text style={[styles.stockChange, { color: changeColor }]}>
          {isPositive ? '+' : ''}
          {safeChange.toFixed(2)} ({isPositive ? '+' : ''}
          {safePercent.toFixed(2)}%)
        </Text>
      </View>
    </Pressable>
  );
}

function SearchResultRow({
  result,
  onPress,
}: {
  result: StockSearchResult;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.stockRow, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.symbolBadge, { backgroundColor: theme.backgroundSelected }]}>
        <Text style={[styles.symbolText, { color: theme.text }]}>{result.symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.stockInfo}>
        <Text style={[styles.stockSymbol, { color: theme.text }]}>{result.symbol}</Text>
        <Text style={[styles.stockName, { color: theme.textSecondary }]} numberOfLines={1}>
          {result.name}
        </Text>
      </View>
      <Text style={[styles.stockType, { color: theme.textSecondary }]}>{result.type}</Text>
    </Pressable>
  );
}

function SkeletonRow() {
  const theme = useTheme();
  return (
    <View style={styles.stockRow}>
      <View style={[styles.symbolBadge, { backgroundColor: theme.backgroundSelected }]} />
      <View style={styles.stockInfo}>
        <View style={[styles.skeletonLine, { width: 56, backgroundColor: theme.backgroundSelected }]} />
        <View
          style={[
            styles.skeletonLine,
            { width: 110, marginTop: 6, backgroundColor: theme.backgroundSelected },
          ]}
        />
      </View>
      <View style={styles.stockPricing}>
        <View style={[styles.skeletonLine, { width: 64, backgroundColor: theme.backgroundSelected }]} />
        <View
          style={[
            styles.skeletonLine,
            { width: 88, marginTop: 6, backgroundColor: theme.backgroundSelected },
          ]}
        />
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MarketsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuth();

  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStocks = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await stocksApi.getStockList(token);
      setStocks(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load stocks');
    }
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    loadStocks().finally(() => setIsLoading(false));
  }, [loadStocks]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadStocks();
    setRefreshing(false);
  }

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      if (!token) return;
      setIsSearching(true);
      try {
        const results = await stocksApi.searchSymbol(text.trim(), token);
        // Finnhub can return the same symbol on multiple exchanges — keep first occurrence
        const seen = new Set<string>();
        const unique = results.filter((r) => !seen.has(r.symbol) && seen.add(r.symbol));
        setSearchResults(unique);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }

  function navigateToStock(symbol: string) {
    // @ts-ignore — typed routes regenerate after `npx expo export`
    router.push({ pathname: '/stock/[symbol]', params: { symbol } });
  }

  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Markets</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Live market overview
            </Text>
          </View>
          {!isSearchMode && (
            <View style={[styles.headerBadge, { backgroundColor: theme.gain + '20' }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.gain }]} />
              <Text style={[styles.liveText, { color: theme.gain }]}>LIVE</Text>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            !isSearchMode ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.accent}
              />
            ) : undefined
          }>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}>
            <Text style={[styles.searchIcon, { color: theme.textSecondary }]}>⌕</Text>
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search markets..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="characters"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearchChange('')} hitSlop={8}>
                <Text style={[styles.searchClear, { color: theme.textSecondary }]}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* ── Search mode ── */}
          {isSearchMode && (
            <>
              {isSearching ? (
                <View style={styles.centeredRow}>
                  <ActivityIndicator color={theme.accent} />
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.centeredRow}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No results for "{searchQuery}"
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.stockList,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  {searchResults.map((r, i) => (
                    <View
                      key={r.symbol}
                      style={
                        i < searchResults.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                          : undefined
                      }>
                      <SearchResultRow result={r} onPress={() => navigateToStock(r.symbol)} />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── Normal mode ── */}
          {!isSearchMode && (
            <>
              {/* Portfolio Summary */}
              <View
                style={[
                  styles.portfolioCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]}>
                  Portfolio Value
                </Text>
                <Text style={[styles.portfolioValue, { color: theme.text }]}>$0.00</Text>
                <View style={styles.portfolioChangeRow}>
                  <Text style={[styles.portfolioChange, { color: theme.textSecondary }]}>
                    Connect your brokerage to see live data
                  </Text>
                </View>
              </View>

              {/* Watchlist header */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Watchlist</Text>
                {!isLoading && !error && (
                  <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
                    {stocks.length} stocks
                  </Text>
                )}
              </View>

              {/* Watchlist */}
              <View
                style={[
                  styles.stockList,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                {error ? (
                  <View style={styles.centeredPad}>
                    <Text style={[styles.errorText, { color: theme.loss }]}>{error}</Text>
                    <Pressable onPress={handleRefresh}>
                      <Text style={[styles.retryText, { color: theme.accent }]}>Tap to retry</Text>
                    </Pressable>
                  </View>
                ) : isLoading ? (
                  [0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={
                        i < 3
                          ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                          : undefined
                      }>
                      <SkeletonRow />
                    </View>
                  ))
                ) : (
                  stocks.map((stock, i) => (
                    <View
                      key={stock.symbol}
                      style={
                        i < stocks.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                          : undefined
                      }>
                      <StockRow {...stock} onPress={() => navigateToStock(stock.symbol)} />
                    </View>
                  ))
                )}
              </View>

              <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
                Prices are delayed 15 minutes. For entertainment purposes only.
              </Text>
            </>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
    gap: Spacing.one,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.four },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  searchIcon: { fontSize: 20 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  searchClear: { fontSize: 14 },

  // Portfolio card
  portfolioCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  portfolioLabel: { fontSize: 13, fontWeight: '500' },
  portfolioValue: { fontSize: 40, fontWeight: '700', letterSpacing: -1 },
  portfolioChangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.one },
  portfolioChange: { fontSize: 13 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 13 },

  // Stock list
  stockList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  stockRow: {
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
  stockInfo: { flex: 1, gap: 2 },
  stockSymbol: { fontSize: 15, fontWeight: '600' },
  stockName: { fontSize: 13 },
  stockPricing: { alignItems: 'flex-end', gap: 2 },
  stockPrice: { fontSize: 15, fontWeight: '600' },
  stockChange: { fontSize: 13 },
  stockType: { fontSize: 12 },

  // Skeleton
  skeletonLine: { height: 13, borderRadius: 6 },

  // States
  centeredRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  centeredPad: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  emptyText: { fontSize: 14 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '600' },
  disclaimer: { fontSize: 11, textAlign: 'center', paddingBottom: Spacing.two },
});
