import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const exam = data.exams.find((e) => e.id === id);
  if (!exam) return <ErrorView message="Unknown exam." onRetry={() => router.back()} />;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Stack.Screen options={{ title: exam.name }} />
      <ThemedText themeColor="textSecondary">{exam.realExam}</ThemedText>
      <Button
        title="Smart practice"
        onPress={() => router.push({ pathname: '/practice', params: { exam: exam.id, mode: 'smart' } })}
      />
      {!exam.access && (
        <ThemedText type="small" themeColor="textSecondary">
          Free tier: one sample question per topic. Subscribers get the full bank and unlimited generated problems.
        </ThemedText>
      )}
      <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>Topics</ThemedText>
      {exam.topics.map((t) => (
        <Pressable
          key={t.slug}
          testID={`topic-${t.slug}`}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/practice', params: { exam: exam.id, mode: 'topic', topic: t.slug } })}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two }}>
              <ThemedText style={{ flex: 1 }}>{t.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.answered ? `${Math.round(t.mastery * 100)}% mastery` : 'Not started'}
              </ThemedText>
            </View>
            <ProgressBar value={t.answered ? t.mastery : 0} color={masteryColor(t.mastery, theme)} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
