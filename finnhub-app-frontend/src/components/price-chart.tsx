import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PricePoint } from '@/services/api';

// ── Layout ────────────────────────────────────────────────────────────────────
const CHART_H = 190;
const LABEL_W = 54;
const PAD_TOP = 10;
const PAD_RIGHT = 6;
const XLABEL_H = 22;
const PLOT_H = CHART_H - PAD_TOP - XLABEL_H;

// ── Periods ───────────────────────────────────────────────────────────────────
const PERIODS = ['1D', '5D', '1M', '6M', '1Y'] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_MS: Record<Period, number> = {
  '1D': 1 * 24 * 60 * 60 * 1000,
  '5D': 5 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '6M': 180 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(price: number): string {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 100) return `$${price.toFixed(1)}`;
  return `$${price.toFixed(2)}`;
}

function fmtLabel(ts: number, period: Period): string {
  const d = new Date(ts);
  if (period === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (period === '5D') {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  if (period === '1M') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  // 6M / 1Y
  return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  points: PricePoint[];
  color: string;
  width: number;
  previousClose?: number;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function PriceChart({ points, color, width, previousClose }: Props) {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('1D');

  const plotW = width - LABEL_W - PAD_RIGHT;
  const gradId = 'priceAreaGrad';

  // Filter points to the selected time window
  const filtered = useMemo(() => {
    const cutoff = Date.now() - PERIOD_MS[period];
    return points.filter((p) => p.timestamp >= cutoff);
  }, [points, period]);

  // Build all SVG geometry from the filtered slice
  const chart = useMemo(() => {
    if (filtered.length < 2) return null;

    const prices = filtered.map((p) => p.price);
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const pad = (rawMax - rawMin) * 0.12 || rawMin * 0.02 || 1;
    const minP = rawMin - pad;
    const maxP = rawMax + pad;
    const rangeP = maxP - minP;

    const toX = (i: number) => LABEL_W + (i / (filtered.length - 1)) * plotW;
    const toY = (price: number) => PAD_TOP + (1 - (price - minP) / rangeP) * PLOT_H;

    const linePath = filtered
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`)
      .join(' ');

    const bottomY = (PAD_TOP + PLOT_H).toFixed(1);
    const areaPath =
      linePath +
      ` L${toX(filtered.length - 1).toFixed(1)},${bottomY}` +
      ` L${LABEL_W.toFixed(1)},${bottomY} Z`;

    const Y_STEPS = 4;
    const yLevels = Array.from({ length: Y_STEPS + 1 }, (_, i) => {
      const price = minP + (rangeP * i) / Y_STEPS;
      return { price, y: toY(price), label: fmtPrice(price) };
    });

    const X_COUNT = 4;
    const xLabels = Array.from({ length: X_COUNT }, (_, i) => {
      const idx = Math.round((i / (X_COUNT - 1)) * (filtered.length - 1));
      return { x: toX(idx), label: fmtLabel(filtered[idx].timestamp, period), i };
    });

    const prevLine =
      previousClose && previousClose >= minP && previousClose <= maxP
        ? { y: toY(previousClose), label: fmtPrice(previousClose) }
        : null;

    return { linePath, areaPath, yLevels, xLabels, prevLine };
  }, [filtered, plotW, previousClose, period]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View>
      {/* Period tabs */}
      <View style={styles.tabs}>
        {PERIODS.map((p) => {
          const active = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.tab, active && { backgroundColor: color + '22' }]}>
              <Text
                style={[
                  styles.tabText,
                  { color: active ? color : theme.textSecondary },
                  active && styles.tabTextActive,
                ]}>
                {p}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* No data for this window yet */}
      {filtered.length < 2 ? (
        <View style={[styles.empty, { height: CHART_H, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No {period} data yet — data accumulates as the server runs
          </Text>
        </View>
      ) : (
        <Svg width={width} height={CHART_H}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <Stop offset="85%" stopColor={color} stopOpacity="0.05" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Y-axis grid lines + labels */}
          {chart?.yLevels.map(({ y, label }, i) => (
            <React.Fragment key={i}>
              <Line
                x1={LABEL_W} y1={y} x2={width - PAD_RIGHT} y2={y}
                stroke={theme.border} strokeWidth="1" strokeDasharray="3,5" opacity="0.8"
              />
              <SvgText x={LABEL_W - 6} y={y + 4} textAnchor="end" fontSize="10" fill={theme.textSecondary}>
                {label}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Previous-close reference line */}
          {chart?.prevLine && (
            <>
              <Line
                x1={LABEL_W} y1={chart.prevLine.y} x2={width - PAD_RIGHT} y2={chart.prevLine.y}
                stroke={theme.textSecondary} strokeWidth="1" strokeDasharray="5,4" opacity="0.7"
              />
              <SvgText
                x={width - PAD_RIGHT - 2} y={chart.prevLine.y - 4}
                textAnchor="end" fontSize="9" fill={theme.textSecondary}>
                prev {chart.prevLine.label}
              </SvgText>
            </>
          )}

          {/* Area fill */}
          {chart && <Path d={chart.areaPath} fill={`url(#${gradId})`} />}

          {/* Price line */}
          {chart && (
            <Path
              d={chart.linePath}
              stroke={color} strokeWidth="2" fill="none"
              strokeLinejoin="round" strokeLinecap="round"
            />
          )}

          {/* X-axis labels */}
          {chart?.xLabels.map(({ x, label, i }) => (
            <SvgText
              key={i} x={x} y={CHART_H - 5}
              textAnchor={i === 0 ? 'start' : i === chart.xLabels.length - 1 ? 'end' : 'middle'}
              fontSize="10" fill={theme.textSecondary}>
              {label}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: Spacing.one, marginBottom: Spacing.two },
  tab: { paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.one, borderRadius: 8 },
  tabText: { fontSize: 13, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  empty: {
    borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four,
  },
  emptyText: { fontSize: 12, textAlign: 'center' },
});
