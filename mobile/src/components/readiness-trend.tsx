import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Readiness over the last weeks, matching the website's chart: one series (no legend; the heading
// names it), 2px line, end dot with a surface ring and a direct label, hairline grid at 0/50/100%.
// Touch and drag to read any week; a table view carries the same numbers for screen readers.

type Point = { date: string; score: number; answered: number };

const H = 140;
// SVG text defaults to a serif face on the web build; native already uses the system font.
const FONT = Platform.select({ web: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', default: undefined });
const PAD = { l: 34, r: 40, t: 10, b: 22 };
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const pct = (s: number) => `${Math.round(s * 100)}%`;

export function ReadinessTrend({ points }: { points: Point[] }) {
  const theme = useTheme();
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  if (points.length < 2) return null;

  const x = (i: number) => PAD.l + (i * (w - PAD.l - PAD.r)) / (points.length - 1);
  const y = (s: number) => PAD.t + (1 - s) * (H - PAD.t - PAD.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const change = Math.round((last.score - points[0].score) * 100);
  const pick = (e: GestureResponderEvent) => {
    const px = e.nativeEvent.locationX;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };
  const shown = hover ?? points.length - 1;
  const h = points[shown];

  return (
    <View style={{ gap: Spacing.one }}>
      <View style={styles.headRow}>
        <ThemedText type="smallBold">Readiness, last {points.length} weeks</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {change === 0 ? 'No change' : `${change > 0 ? 'Up' : 'Down'} ${Math.abs(change)} pts`}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" testID="trend-readout">
        {hover === null ? 'This week' : `Week ending ${fmt(h.date)}`}: {pct(h.score)} · {h.answered} answers total
      </ThemedText>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: H }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Readiness went from ${pct(points[0].score)} to ${pct(last.score)} over ${points.length} weeks`}
        testID="readiness-trend"
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={pick}
        onResponderMove={pick}
        onResponderRelease={() => setHover(null)}
        onResponderTerminate={() => setHover(null)}>
        {w > 0 && (
          <Svg width={w} height={H}>
            {[0, 0.5, 1].map((g) => (
              <Line key={g} x1={PAD.l} x2={w - PAD.r} y1={y(g)} y2={y(g)} stroke={theme.chartGrid} strokeWidth={1} />
            ))}
            {[0, 0.5, 1].map((g) => (
              <SvgText fontFamily={FONT} key={`t${g}`} x={PAD.l - 6} y={y(g) + 4} fontSize={11} fill={theme.textSecondary} textAnchor="end">
                {`${g * 100}%`}
              </SvgText>
            ))}
            <SvgText fontFamily={FONT} x={PAD.l} y={H - 6} fontSize={11} fill={theme.textSecondary}>{fmt(points[0].date)}</SvgText>
            <SvgText fontFamily={FONT} x={w - PAD.r} y={H - 6} fontSize={11} fill={theme.textSecondary} textAnchor="end">This week</SvgText>
            <Path d={`${d} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={theme.chartLine} opacity={0.1} />
            <Path d={d} fill="none" stroke={theme.chartLine} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && <Line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke={theme.textSecondary} strokeWidth={1} />}
            {[...new Set([shown, points.length - 1])].map((i) => (
              <Circle key={i} cx={x(i)} cy={y(points[i].score)} r={4} fill={theme.chartLine} stroke={theme.backgroundElement} strokeWidth={2} />
            ))}
            <SvgText fontFamily={FONT} x={x(points.length - 1) + 8} y={y(last.score) + 4} fontSize={12} fontWeight="700" fill={theme.text}>
              {pct(last.score)}
            </SvgText>
          </Svg>
        )}
      </View>
      <Pressable accessibilityRole="button" onPress={() => setTable((v) => !v)} hitSlop={8}>
        <ThemedText type="small" themeColor="textSecondary">{table ? '▾ Hide table' : '▸ Show as table'}</ThemedText>
      </Pressable>
      {table && (
        <View>
          {points.map((p) => (
            <View key={p.date} style={[styles.row, { borderTopColor: theme.border }]}>
              <ThemedText type="small" style={{ flex: 1 }}>{fmt(p.date)}</ThemedText>
              <ThemedText type="small" style={{ width: 56, textAlign: 'right' }}>{pct(p.score)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ width: 90, textAlign: 'right' }}>{p.answered} answers</ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth },
});
