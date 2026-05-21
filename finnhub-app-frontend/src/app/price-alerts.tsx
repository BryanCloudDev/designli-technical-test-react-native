import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth.context';
import { useTheme } from '@/hooks/use-theme';
import { PriceAlert, priceAlertsApi } from '@/services/api';

// Mirrors the backend DTO validation (^[A-Z]{1,5}$)
const SYMBOL_REGEX = /^[A-Z]{1,5}$/;

// ── Alert Row ─────────────────────────────────────────────────────────────────

function AlertRow({
  alert,
  onDelete,
  isDeleting,
}: {
  alert: PriceAlert;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.alertRow}>
      <View style={[styles.symbolBadge, { backgroundColor: theme.backgroundSelected }]}>
        <Text style={[styles.symbolText, { color: theme.text }]}>{alert.symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.alertInfo}>
        <Text style={[styles.alertSymbol, { color: theme.text }]}>{alert.symbol}</Text>
        <Text style={[styles.alertTarget, { color: theme.textSecondary }]}>
          Target: ${Number(alert.targetPrice).toFixed(2)}
        </Text>
      </View>
      {alert.isTriggered && (
        <View style={[styles.triggeredBadge, { backgroundColor: theme.gain + '20' }]}>
          <Text style={[styles.triggeredText, { color: theme.gain }]}>Triggered</Text>
        </View>
      )}
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
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PriceAlertsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Form ───────────────────────────────────────────────────────────────────

  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await priceAlertsApi.findAll(token);
      setAlerts(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load alerts');
    }
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  // ── Create ─────────────────────────────────────────────────────────────────

  async function handleCreate() {
    setFormError(null);
    const sym = symbol.toUpperCase().trim();
    const price = parseFloat(targetPrice);

    if (!SYMBOL_REGEX.test(sym)) {
      setFormError('Symbol must be 1–5 uppercase letters (e.g. AAPL)');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setFormError('Target price must be a positive number');
      return;
    }
    if (!token) return;

    setIsSubmitting(true);
    try {
      const newAlert = await priceAlertsApi.create({ symbol: sym, targetPrice: price }, token);
      setAlerts((prev) => [newAlert, ...prev]);
      setSymbol('');
      setTargetPrice('');
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await priceAlertsApi.remove(id, token);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete alert');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Price Alerts</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Create Alert Form */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>New Alert</Text>

            <View
              style={[
                styles.inputRow,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}>
              <TextInput
                value={symbol}
                onChangeText={(t) => setSymbol(t.toUpperCase())}
                placeholder="Symbol (e.g. AAPL)"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, styles.inputSymbol, { color: theme.text }]}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={5}
                returnKeyType="next"
              />
              <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />
              <TextInput
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="Target $"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, styles.inputPrice, { color: theme.text }]}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
            </View>

            {formError && (
              <Text style={[styles.formError, { color: theme.loss }]}>{formError}</Text>
            )}

            <Pressable
              onPress={handleCreate}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: theme.accent },
                (pressed || isSubmitting) && { opacity: 0.7 },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Set Alert</Text>
              )}
            </Pressable>
          </View>

          {/* Alerts List */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Alerts</Text>
            {!isLoading && !error && (
              <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
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
            ) : alerts.length === 0 ? (
              <View style={styles.centeredPad}>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                  No alerts yet. Create one above.
                </Text>
              </View>
            ) : (
              alerts.map((alert, i) => (
                <View
                  key={alert.id}
                  style={
                    i < alerts.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                      : undefined
                  }>
                  <AlertRow
                    alert={alert}
                    onDelete={() => handleDelete(alert.id)}
                    isDeleting={deletingId === alert.id}
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { minWidth: 64 },

  // Scroll
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },

  // Create form card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: { paddingVertical: 12, paddingHorizontal: Spacing.three, fontSize: 15 },
  inputSymbol: { flex: 1 },
  inputPrice: { flex: 1.2 },
  inputDivider: { width: 1, alignSelf: 'stretch' },
  formError: { fontSize: 13 },
  createBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 13 },

  // Alerts list
  listCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  alertRow: {
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
  alertInfo: { flex: 1, gap: 2 },
  alertSymbol: { fontSize: 15, fontWeight: '600' },
  alertTarget: { fontSize: 13 },
  triggeredBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
  triggeredText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: Spacing.one },
  deleteIcon: { fontSize: 16, fontWeight: '600' },

  // States
  centeredPad: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  stateText: { fontSize: 14, textAlign: 'center' },
  retryText: { fontSize: 14, fontWeight: '600' },
});
