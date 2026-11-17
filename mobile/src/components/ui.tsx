import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({
  children,
  refreshing,
  onRefresh,
}: PropsWithChildren<{ refreshing?: boolean; onRefresh?: () => void }>) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: theme.brand }
          : { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.backgroundElement },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? theme.onBrand : theme.text} />
      ) : (
        <ThemedText type="smallBold" style={{ color: primary ? theme.onBrand : theme.text, fontSize: 16 }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Centered({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.centered, { backgroundColor: theme.background }]}>{children}</View>;
}

export function Loading() {
  return (
    <Centered>
      <ActivityIndicator size="large" />
    </Centered>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Centered>
      <ThemedText style={{ textAlign: 'center', marginBottom: Spacing.three }}>{message}</ThemedText>
      <Button title="Try again" onPress={onRetry} />
    </Centered>
  );
}

const styles = StyleSheet.create({
  screen: { padding: Spacing.three, paddingBottom: Spacing.six, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  card: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  button: { minHeight: 48, borderRadius: 10, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
});
