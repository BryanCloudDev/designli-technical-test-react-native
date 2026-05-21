import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Stock = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  positive: boolean;
};

const PLACEHOLDER_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '189.30', change: '+2.14', changePercent: '+1.14%', positive: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '378.85', change: '+5.60', changePercent: '+1.50%', positive: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '140.23', change: '-1.08', changePercent: '-0.76%', positive: false },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '178.50', change: '+3.22', changePercent: '+1.84%', positive: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '485.09', change: '-8.41', changePercent: '-1.70%', positive: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '238.45', change: '+6.90', changePercent: '+2.98%', positive: true },
];

function StockRow({ stock }: { stock: Stock }) {
  const theme = useTheme();
  const changeColor = stock.positive ? theme.gain : theme.loss;

  return (
    <Pressable style={({ pressed }) => [styles.stockRow, { opacity: pressed ? 0.7 : 1, borderBottomColor: theme.border }]}>
      <View style={[styles.symbolBadge, { backgroundColor: theme.backgroundSelected }]}>
        <Text style={[styles.symbolText, { color: theme.text }]}>{stock.symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.stockInfo}>
        <Text style={[styles.stockSymbol, { color: theme.text }]}>{stock.symbol}</Text>
        <Text style={[styles.stockName, { color: theme.textSecondary }]} numberOfLines={1}>
          {stock.name}
        </Text>
      </View>
      <View style={styles.stockPricing}>
        <Text style={[styles.stockPrice, { color: theme.text }]}>${stock.price}</Text>
        <Text style={[styles.stockChange, { color: changeColor }]}>
          {stock.change} ({stock.changePercent})
        </Text>
      </View>
    </Pressable>
  );
}

export default function MarketsScreen() {
  const theme = useTheme();

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
          <View style={[styles.headerBadge, { backgroundColor: theme.gain + '20' }]}>
            <View style={[styles.liveDot, { backgroundColor: theme.gain }]} />
            <Text style={[styles.liveText, { color: theme.gain }]}>LIVE</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}
          showsVerticalScrollIndicator={false}>

          {/* Portfolio Summary */}
          <View style={[styles.portfolioCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
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

          {/* Watchlist */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Watchlist</Text>
            <Pressable>
              <Text style={[styles.sectionAction, { color: theme.accent }]}>Edit</Text>
            </Pressable>
          </View>

          <View style={[styles.stockList, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {PLACEHOLDER_STOCKS.map((stock, i) => (
              <View key={stock.symbol} style={i < PLACEHOLDER_STOCKS.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : undefined}>
                <StockRow stock={stock} />
              </View>
            ))}
          </View>

          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
            Prices are delayed 15 minutes. For entertainment purposes only.
          </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionAction: { fontSize: 14, fontWeight: '500' },
  stockList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
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
  disclaimer: { fontSize: 11, textAlign: 'center', paddingBottom: Spacing.two },
});
