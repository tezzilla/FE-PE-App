import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { QuestionView } from '@/components/question-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api, type ExamId, type Feedback } from '@/lib/api';

export default function Practice() {
  const params = useLocalSearchParams<{ exam: ExamId; mode: 'smart' | 'topic'; topic?: string }>();
  const smart = params.mode === 'smart';
  const { token } = useSession();
  const theme = useTheme();
  // Load once per visit: reloading on focus would replace the set mid-session.
  const { data, error, reload } = useLoad(
    (t) => (smart ? api.smart(t, params.exam) : api.practice(t, params.exam, params.topic)),
    { reloadOnFocus: false },
  );
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState({ done: 0, correct: 0 });
  const [busy, setBusy] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const title = smart ? 'Smart practice' : (data?.topicNames[params.topic ?? ''] ?? 'Practice');
  const header = <Stack.Screen options={{ title }} />;

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const q = data.questions[i];

  const check = async () => {
    if (selected === null || !q || !token) return;
    setBusy(true);
    setCheckError(null);
    try {
      const fb = await api.answer(token, q.id, selected);
      setFeedback(fb);
      setScore((s) => ({ done: s.done + 1, correct: s.correct + (fb.correct ? 1 : 0) }));
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : 'Could not check answer.');
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setI((n) => n + 1);
    setSelected(null);
    setFeedback(null);
  };

  const restart = () => {
    setI(0);
    setSelected(null);
    setFeedback(null);
    setScore({ done: 0, correct: 0 });
    reload();
  };

  if (!q) {
    return (
      <Screen>
        {header}
        <Card>
          <ThemedText type="subtitle" testID="session-complete">Set complete</ThemedText>
          {score.done > 0 ? (
            <ThemedText>
              {score.correct} of {score.done} correct ({Math.round((100 * score.correct) / score.done)}%)
            </ThemedText>
          ) : (
            <ThemedText themeColor="textSecondary">
              Nothing new to practice right now. Reviews come back as they fall due.
            </ThemedText>
          )}
          {smart && score.done > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Your readiness and review schedule have been updated.
            </ThemedText>
          )}
          <Button title={smart ? 'Next smart session' : 'Practice again'} onPress={restart} testID="again" />
          <Button variant="ghost" title="Done" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const reason = data.reasons?.[q.id];
  return (
    <Screen>
      {header}
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="small" themeColor="textSecondary" testID="progress">
          Question {i + 1} of {data.questions.length} · {data.topicNames[q.topic]} · Score {score.correct}/{score.done}
        </ThemedText>
        {reason && (
          <ThemedText type="smallBold" style={{ color: theme.brand }} testID="reason">
            Why this question: {reason}
          </ThemedText>
        )}
      </View>
      <QuestionView question={q} selected={selected} onSelect={setSelected} feedback={feedback} />
      {checkError && <ThemedText type="small" style={{ color: theme.bad }}>{checkError}</ThemedText>}
      {feedback ? (
        <Button title={i + 1 < data.questions.length ? 'Next question' : 'Finish'} onPress={next} testID="next" />
      ) : (
        <Button title="Check answer" onPress={check} disabled={selected === null} loading={busy} testID="check" />
      )}
    </Screen>
  );
}
