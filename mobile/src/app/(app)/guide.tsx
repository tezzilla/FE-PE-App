import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ListGroup, ListRow } from '@/components/nav';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

const letter = (i: number) => String.fromCharCode(65 + i);
const mono = { fontFamily: 'monospace' as const };

/** One formula guide: formula, variables, when to use it, handbook location, mistakes, worked example. */
export default function GuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const { data, error, reload } = useLoad((t) => api.guide(t, slug), { reloadOnFocus: false });
  const [showSolution, setShowSolution] = useState(false);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data || data.slug !== slug) return <Loading />;

  return (
    <Screen>
      <Stack.Screen options={{ title: data.title }} />
      <ThemedText themeColor="textSecondary">{data.summary}</ThemedText>

      <Card>
        <ThemedText type="small" style={{ color: theme.brand, letterSpacing: 0.6 }}>FORMULA</ThemedText>
        <ThemedText style={[mono, { fontSize: 16 }]} testID="guide-formula">{data.formula}</ThemedText>
        <View style={{ gap: 4 }}>
          {data.variables.map(([sym, meaning]) => (
            <ThemedText key={sym} type="small">
              <ThemedText type="smallBold" style={mono}>{sym}  </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{meaning}</ThemedText>
            </ThemedText>
          ))}
        </View>
      </Card>

      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">When to use it</ThemedText>
        <ThemedText>{data.whenToUse}</ThemedText>
        <ThemedText type="small">
          <ThemedText type="smallBold">Where to find it on exam day: </ThemedText>
          {data.handbook}
        </ThemedText>
      </View>

      <ThemedText type="smallBold">Common mistakes</ThemedText>
      <Card>
        {data.mistakes.map((m) => (
          <ThemedText key={m}>• {m}</ThemedText>
        ))}
      </Card>

      {data.example && (
        <>
          <ThemedText type="smallBold">Worked example</ThemedText>
          <Card>
            <ThemedText>{data.example.prompt}</ThemedText>
            {data.example.choices.map((c, i) => (
              <ThemedText key={i}>
                <ThemedText type="smallBold">{letter(i)}. </ThemedText>
                {c}
              </ThemedText>
            ))}
            {showSolution ? (
              <View style={{ gap: Spacing.one }} testID="guide-solution">
                <ThemedText type="smallBold" style={{ color: theme.good }}>
                  Answer: {letter(data.example.answer)}. {data.example.choices[data.example.answer]}
                </ThemedText>
                <ThemedText>{data.example.explanation}</ThemedText>
              </View>
            ) : (
              <Button variant="ghost" title="Show solution" onPress={() => setShowSolution(true)} />
            )}
          </Card>
        </>
      )}

      <Button
        title={`Practice ${data.topicName}`}
        testID="guide-practice"
        onPress={() => router.push({ pathname: '/practice', params: { exam: data.exam, mode: 'topic', topic: data.topic } })}
      />

      {data.related.length > 0 && (
        <ListGroup title="Related formulas">
          {data.related.map((r) => (
            <ListRow key={r.slug} icon="calculator-outline" title={r.title} onPress={() => router.push({ pathname: '/guide', params: { slug: r.slug } })} />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}
