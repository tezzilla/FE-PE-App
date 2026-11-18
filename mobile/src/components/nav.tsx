import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExam } from '@/exam-ctx';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** FE / PE toggle. `compact` is the version in the tab header, always visible while scrolling. */
export function ExamSwitcher({ compact = false }: { compact?: boolean }) {
  const { exam, setExam } = useExam();
  const theme = useTheme();
  const options = [
    { id: 'fe-civil', label: compact ? 'FE' : 'FE Civil' },
    { id: 'pe-civil', label: compact ? 'PE' : 'PE Civil' },
  ] as const;
  return (
    <View
      style={[styles.switcher, compact && styles.compact, { backgroundColor: theme.backgroundSelected }]}
      accessibilityRole="tablist"
      accessibilityLabel="Exam">
      {options.map((o) => {
        const on = o.id === exam;
        return (
          <Pressable
            key={o.id}
            testID={`switch-${o.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
            onPress={() => setExam(o.id)}
            style={[styles.segment, compact && styles.compactSegment, on && { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={{ color: on ? theme.text : theme.textSecondary }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** One tappable row in a grouped list: icon, title, subtitle, optional badge and chevron. */
export function ListRow({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  testID,
  locked,
  external,
  disabled,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  badge?: number | string | null;
  onPress: () => void;
  testID?: string;
  locked?: boolean;
  external?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }, disabled && { opacity: 0.45 }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={20} color={theme.brand} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText style={{ fontWeight: 600 }}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.brand }]}>
          <ThemedText type="smallBold" style={{ color: theme.onBrand, fontSize: 13 }}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
      <Ionicons
        name={locked ? 'lock-closed' : external ? 'open-outline' : 'chevron-forward'}
        size={18}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

/** A titled group of ListRows on one card, separated by hairlines. */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme();
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  return (
    <View style={{ gap: Spacing.one }}>
      {title ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.groupTitle}>
          {title.toUpperCase()}
        </ThemedText>
      ) : null}
      <View style={[styles.group, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {items.map((c, i) => (
          <View key={i} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border } : undefined}>
            {c}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  compact: { padding: 3, marginRight: Spacing.three, borderRadius: 10 },
  compactSegment: { flex: 0, paddingVertical: 5, paddingHorizontal: 14, borderRadius: 8 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12, paddingHorizontal: Spacing.three, minHeight: 56 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  groupTitle: { letterSpacing: 0.6, marginLeft: Spacing.one, fontSize: 12 },
});
