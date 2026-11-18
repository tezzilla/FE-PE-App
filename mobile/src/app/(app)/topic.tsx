import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api, type ExamId } from '@/lib/api';

const letter = (i: number) => String.fromCharCode(65 + i);

/** Topic review: summary, where to look in the handbook, key formulas, common traps, a worked example. */
export default function Topic() {
  const { exam, topic } = useLocalSearchParams<{ exam: ExamId; topic: string }>();
  const theme = useTheme();
  const { data, error, reload } = useLoad((t) => api.topic(t, exam, topic), { reloadOnFocus: false });
  const [showSolution, setShowSolution] = useState(false);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const mono = { fontFamily: 'monospace' as const };

  return (
    <Screen>
      <Stack.Screen options={{ title: data.name }} />
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="small" themeColor="textSecondary">
          {data.examQuestions}{/\d/.test(data.examQuestions) ? ' questions on the exam' : ''}
          {data.mastery ? ` · your mastery ${Math.round(data.mastery.value * 100)}% (${data.mastery.answered} answers)` : ''}
        </ThemedText>
        <ThemedText>{data.summary}</ThemedText>
        <ThemedText type="small">
          <ThemedText type="smallBold">Where to look on exam day: </ThemedText>
          {data.handbook}
        </ThemedText>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <View style={{ flex: 1 }}>
          <Button title="Practice" testID="topic-practice" onPress={() => router.push({ pathname: '/practice', params: { exam, mode: 'topic', topic } })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="ghost" title="10-question quiz" onPress={() => router.push({ pathname: '/practice', params: { exam, mode: 'quiz', topic, count: '10' } })} />
        </View>
      </View>

      {data.formulas.length + (data.lockedFormulas ?? 0) > 0 && (
        <>
          <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>Key formulas</ThemedText>
          {!!data.lockedFormulas && (
            <ThemedText type="small" themeColor="textSecondary">
              {data.lockedFormulas} {data.formulas.length ? 'more ' : ''}formula card{data.lockedFormulas > 1 ? 's' : ''} included with full access.
            </ThemedText>
          )}
          {data.formulas.map((f) => (
            <Card key={f.front}>
              <ThemedText type="smallBold">{f.front}</ThemedText>
              <ThemedText style={mono}>{f.back}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{f.ref}</ThemedText>
            </Card>
          ))}
        </>
      )}

      <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>Common traps</ThemedText>
      <Card>
        {data.traps.map((t) => (
          <ThemedText key={t}>• {t}</ThemedText>
        ))}
      </Card>

      {data.example && (
        <>
          <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>Worked example</ThemedText>
          <Card>
            <ThemedText>{data.example.prompt}</ThemedText>
            {data.example.choices.map((c, i) => (
              <ThemedText key={i}>
                <ThemedText type="smallBold">{letter(i)}. </ThemedText>
                {c}
              </ThemedText>
            ))}
            {showSolution ? (
              <View style={{ gap: Spacing.one }} testID="solution">
                <ThemedText type="smallBold" style={{ color: theme.good }}>
                  Answer: {letter(data.example.answer)}. {data.example.choices[data.example.answer]}
                </ThemedText>
                <ThemedText>{data.example.explanation}</ThemedText>
                {data.example.reference && <ThemedText type="small" themeColor="textSecondary">{data.example.reference}</ThemedText>}
                {data.reviewedBy && <ThemedText type="small" themeColor="textSecondary">Checked by {data.reviewedBy}</ThemedText>}
              </View>
            ) : (
              <Button variant="ghost" title="Show solution" testID="show-solution" onPress={() => setShowSolution(true)} />
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
