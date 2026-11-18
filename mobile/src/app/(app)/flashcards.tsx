import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api, type DeckCard, type ExamId } from '@/lib/api';

const GRADES = ['Again', 'Hard', 'Good', 'Easy'] as const;

export default function Flashcards() {
  const { exam } = useLocalSearchParams<{ exam: ExamId }>();
  const { token } = useSession();
  const theme = useTheme();
  const { data, error, reload } = useLoad((t) => api.cards(t, exam), { reloadOnFocus: false });
  const [queue, setQueue] = useState<DeckCard[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const cards = queue ?? data.cards;
  const card = cards[0];

  const grade = async (g: 0 | 1 | 2 | 3) => {
    if (!card || !token) return;
    setBusy(true);
    setSaveError(null);
    try {
      await api.gradeCard(token, card.id, g);
      const [c, ...rest] = cards;
      setQueue(g === 0 ? [...rest, c] : rest); // "Again" comes back later this session
      setFlipped(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  if (!card) {
    return (
      <Screen>
        <Card>
          <ThemedText type="subtitle" testID="cards-done">All caught up</ThemedText>
          <ThemedText themeColor="textSecondary">Cards come back as they fall due.</ThemedText>
          <Button title="Done" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        {cards.length} left · {card.topicName} · {card.state ? 'review' : 'new'}
        {data.visible < data.total ? ` · free tier: ${data.visible} of ${data.total} cards` : ''}
      </ThemedText>
      <Pressable accessibilityRole="button" testID="card" onPress={() => setFlipped((f) => !f)}>
        <Card style={{ minHeight: 200, justifyContent: 'center' }}>
          <ThemedText type="subtitle">{card.front}</ThemedText>
          {flipped ? (
            <>
              <ThemedText style={{ fontFamily: 'monospace' }}>{card.back}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Find it on exam day: {card.ref}</ThemedText>
            </>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">Recall it, then tap to check.</ThemedText>
          )}
        </Card>
      </Pressable>
      {saveError && <ThemedText type="small" style={{ color: theme.bad }}>{saveError}</ThemedText>}
      {flipped ? (
        <View style={{ flexDirection: 'row', gap: Spacing.one }}>
          {GRADES.map((label, g) => (
            <View key={label} style={{ flex: 1 }}>
              <Button
                title={label}
                variant={g === 2 ? 'primary' : 'ghost'}
                loading={busy}
                testID={`grade-${g}`}
                onPress={() => grade(g as 0 | 1 | 2 | 3)}
              />
            </View>
          ))}
        </View>
      ) : (
        <Button title="Show answer" onPress={() => setFlipped(true)} testID="flip" />
      )}
    </Screen>
  );
}
