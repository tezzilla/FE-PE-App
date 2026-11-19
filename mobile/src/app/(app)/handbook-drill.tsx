import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

// Timed "which handbook chapter would you open?" drill. Exam day rewards finding the right chapter fast.

const TARGET_S = 15;

export default function HandbookDrill() {
  const { exam } = useExam();
  const theme = useTheme();
  const { data, error, reload } = useLoad((t) => api.handbookDrill(t, exam), { reloadOnFocus: false });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ ok: boolean; s: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);

  useEffect(() => {
    start.current = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - start.current) / 1000), 250);
    return () => clearInterval(t);
  }, [i, data]);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const header = <Stack.Screen options={{ title: 'Handbook hunt' }} />;
  const items = data.items;

  if (i >= items.length) {
    const right = results.filter((r) => r.ok).length;
    const avg = results.reduce((a, r) => a + r.s, 0) / Math.max(1, results.length);
    const again = () => {
      setI(0);
      setPicked(null);
      setResults([]);
      setElapsed(0);
      reload();
    };
    return (
      <Screen>
        {header}
        <Card>
          <ThemedText style={{ fontSize: 40, lineHeight: 48, fontWeight: 800, textAlign: 'center' }} testID="drill-score">
            {right}/{items.length}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Average {avg.toFixed(1)} s per lookup {avg <= TARGET_S ? '(nice pace)' : `(aim for under ${TARGET_S} s)`}
          </ThemedText>
          {data.sample && (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              That was the free sample. Full access covers all {data.totalCards} formulas.
            </ThemedText>
          )}
          <Button title="New round" onPress={again} testID="drill-again" />
          <Button variant="ghost" title="Done" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const q = items[i];
  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    setResults((r) => [...r, { ok: k === q.answer, s: (Date.now() - start.current) / 1000 }]);
  };

  return (
    <Screen>
      {header}
      <View style={{ gap: Spacing.one }}>
        <ProgressBar value={(i + (picked !== null ? 1 : 0)) / items.length} color={theme.brand} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText type="small" themeColor="textSecondary" testID="drill-progress">{i + 1} of {items.length}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {picked === null ? `${elapsed.toFixed(0)} s` : `${results[results.length - 1].s.toFixed(1)} s`}
          </ThemedText>
        </View>
      </View>
      {data.sample && i === 0 && picked === null && (
        <ThemedText type="small" themeColor="textSecondary" testID="drill-sample">
          A free {items.length}-question sample round. Full access drills all {data.totalCards} formulas, ten at a time.
        </ThemedText>
      )}
      <ThemedText type="small" themeColor="textSecondary">Which handbook chapter would you open for:</ThemedText>
      <ThemedText style={{ fontSize: 18, fontWeight: 700 }}>{q.prompt}</ThemedText>
      <View style={{ gap: Spacing.two }}>
        {q.choices.map((c, k) => {
          const state = picked === null ? null : k === q.answer ? 'right' : k === picked ? 'wrong' : null;
          return (
            <Pressable
              key={c}
              testID={`drill-choice-${k}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: picked !== null, selected: picked === k }}
              disabled={picked !== null}
              onPress={() => choose(k)}
              style={({ pressed }) => [
                styles.choice,
                { borderColor: state === 'right' ? theme.good : state === 'wrong' ? theme.bad : theme.border, backgroundColor: theme.backgroundElement },
                state && { borderWidth: 2 },
                pressed && { backgroundColor: theme.backgroundSelected },
              ]}>
              <ThemedText>{c}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      {picked !== null && (
        <>
          <ThemedText type="smallBold" style={{ color: picked === q.answer ? theme.good : theme.bad }} accessibilityLiveRegion="polite">
            {picked === q.answer ? 'Correct.' : `It's in ${q.choices[q.answer]}.`}
          </ThemedText>
          <Button title={i + 1 === items.length ? 'See results' : 'Next'} onPress={() => { setPicked(null); setElapsed(0); setI((v) => v + 1); }} testID="drill-next" />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  choice: { borderWidth: 1, borderRadius: 12, padding: Spacing.three },
});
