import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

type Turn = { role: 'user' | 'assistant'; text: string };
const STARTERS = ['Why is my answer wrong?', 'Walk me through the steps'];

/** Ask the AI tutor about a problem the student just answered. */
export function Tutor({ questionId }: { questionId: string }) {
  const { token } = useSession();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy || !token) return;
    const history: Turn[] = [...turns, { role: 'user', text: q }];
    setTurns(history);
    setDraft('');
    setBusy(true);
    setError(null);
    try {
      const r = await api.tutor(token, questionId, history);
      setTurns([...history, { role: 'assistant', text: r.reply }]);
      setLeft(r.left);
    } catch (e) {
      setTurns(turns);
      setDraft(q);
      setError(e instanceof Error ? e.message : "The tutor couldn't answer.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <Button variant="ghost" title="Ask the AI tutor" onPress={() => setOpen(true)} testID="tutor-open" />;

  return (
    <Card>
      <ThemedText type="smallBold">AI tutor{left !== null ? ` · ${left} left today` : ''}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Explains the engineer-verified solution. AI can make mistakes; the verified solution is the authority.
      </ThemedText>
      {turns.map((t, i) => (
        <ThemedText key={i} type={t.role === 'user' ? 'smallBold' : 'default'}>
          {t.role === 'user' ? `You: ${t.text}` : t.text}
        </ThemedText>
      ))}
      {error && <ThemedText type="small" style={{ color: theme.bad }}>{error}</ThemedText>}
      {turns.length === 0 && (
        <View style={{ gap: Spacing.one }}>
          {STARTERS.map((s) => <Button key={s} variant="ghost" title={s} onPress={() => ask(s)} disabled={busy} />)}
        </View>
      )}
      {turns.length < 12 && (
        <>
          <TextInput
            testID="tutor-input"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Ask about this problem"
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={1500}
            value={draft}
            onChangeText={setDraft}
          />
          <Button title="Ask" onPress={() => ask(draft)} loading={busy} disabled={!draft.trim()} testID="tutor-ask" />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, minHeight: 60, fontSize: 16, textAlignVertical: 'top' },
});
