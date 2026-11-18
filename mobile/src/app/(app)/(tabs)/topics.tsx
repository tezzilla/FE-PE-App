import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

export default function Topics() {
  const theme = useTheme();
  const { exam: examId } = useExam();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const exam = data.exams.find((e) => e.id === examId) ?? data.exams[0];
  const weak = new Set(exam.readiness.answered ? exam.readiness.weakest.map((w) => w.slug) : []);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ThemedText type="small" themeColor="textSecondary">
        Tap a topic for key formulas, common traps and a worked example, then practice it.
      </ThemedText>
      <View style={[styles.group, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {exam.topics.map((t, i) => (
          <Pressable
            key={t.slug}
            testID={`topic-${t.slug}`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/topic', params: { exam: exam.id, topic: t.slug } })}
            style={({ pressed }) => [
              styles.row,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
              pressed && { backgroundColor: theme.backgroundSelected },
            ]}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <ThemedText style={{ flex: 1, fontWeight: 600 }}>{t.name}</ThemedText>
                {weak.has(t.slug) && (
                  <ThemedText type="smallBold" style={{ color: theme.warn, fontSize: 12 }}>FOCUS</ThemedText>
                )}
                <ThemedText type="small" themeColor="textSecondary">
                  {t.answered ? `${Math.round(t.mastery * 100)}%` : 'New'}
                </ThemedText>
              </View>
              <ProgressBar value={t.answered ? t.mastery : 0} color={masteryColor(t.mastery, theme)} />
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 14, paddingHorizontal: Spacing.three },
});
