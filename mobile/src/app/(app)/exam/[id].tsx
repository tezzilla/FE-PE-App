import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, api } from '@/lib/api';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s)}s`;
}

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const exam = data.exams.find((e) => e.id === id);
  if (!exam) return <ErrorView message="Unknown exam." onRetry={() => router.back()} />;
  const go = (params: Record<string, string>) => router.push({ pathname: '/practice', params: { exam: exam.id, ...params } });
  const half = (a: React.ReactNode, b: React.ReactNode) => (
    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
      <View style={{ flex: 1 }}>{a}</View>
      <View style={{ flex: 1 }}>{b}</View>
    </View>
  );

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Stack.Screen options={{ title: exam.name }} />
      <ThemedText themeColor="textSecondary">{exam.realExam}</ThemedText>

      <Button title="Smart practice" testID="smart" onPress={() => go({ mode: 'smart' })} />
      {exam.readiness.answered === 0 && (
        <Button variant="ghost" title="Take the diagnostic (about 2 per topic)" testID="diagnostic-first" onPress={() => go({ mode: 'diagnostic' })} />
      )}
      {half(
        <Button variant="ghost" title={`Review misses${exam.missed ? ` (${exam.missed})` : ''}`} testID="missed" disabled={!exam.missed} onPress={() => go({ mode: 'missed', count: (exam.missed ?? 0) > 10 ? '20' : '10' })} />,
        <Button variant="ghost" title={`Flashcards${exam.dueCards ? ` (${exam.dueCards})` : ''}`} testID="flashcards" onPress={() => router.push({ pathname: '/flashcards', params: { exam: exam.id } })} />,
      )}
      {half(
        <Button variant="ghost" title="20-question quiz" testID="quiz" onPress={() => go({ mode: 'quiz', count: '20' })} />,
        <Button variant="ghost" title={`Documents${exam.access ? '' : ' 🔒'}`} testID="resources" onPress={() => router.push({ pathname: '/resources', params: { exam: exam.id } })} />,
      )}
      {exam.readiness.answered > 0 && (
        <Button variant="ghost" title="Diagnostic" testID="diagnostic" onPress={() => go({ mode: 'diagnostic' })} />
      )}
      <ThemedText
        type="small"
        style={{ color: theme.brand, textAlign: 'center' }}
        onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/exams/${exam.id}/mock`)}>
        Full-length timed exam: open on the website ↗
      </ThemedText>

      {!exam.access && (
        <ThemedText type="small" themeColor="textSecondary">
          Free tier: one sample question per topic. Subscribers get the full bank and unlimited generated problems.
        </ThemedText>
      )}

      {exam.pacing && (
        <Card>
          <ThemedText type="smallBold">Pacing</ThemedText>
          <ThemedText type="small">
            Your average {fmt(exam.pacing.averageS)} per question · exam pace {fmt(exam.pacing.examPaceS)}
          </ThemedText>
          {exam.pacing.averageS > exam.pacing.examPaceS * 1.25 && (
            <ThemedText type="small" style={{ color: theme.bad }}>
              You're well over exam pace. Try the 20-question quiz and keep moving.
            </ThemedText>
          )}
        </Card>
      )}

      <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>Topics</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">Tap a topic for formulas, common traps and a worked example.</ThemedText>
      {exam.topics.map((t) => (
        <Pressable
          key={t.slug}
          testID={`topic-${t.slug}`}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/topic', params: { exam: exam.id, topic: t.slug } })}>
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
