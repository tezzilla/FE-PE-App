import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

/** "Report a problem" under a solution. Reports go to the reviewers' inbox on the website. */
export function ReportProblem({ questionId, selected }: { questionId: string; selected: number | null }) {
  const { token } = useSession();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (state === 'sent') {
    return <ThemedText type="small" themeColor="textSecondary">Thanks. A reviewer will look at this question.</ThemedText>;
  }
  if (!open) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.link} onPress={() => setOpen(true)} testID="report-open">
        Report a problem with this question
      </ThemedText>
    );
  }

  const send = async () => {
    if (!token) return;
    setState('sending');
    setError(null);
    try {
      await api.report(token, questionId, selected, message.trim());
      setState('sent');
    } catch (e) {
      setState('idle');
      setError(e instanceof Error ? e.message : "Couldn't send. Try again.");
    }
  };

  return (
    <View style={{ gap: Spacing.two }}>
      <TextInput
        testID="report-message"
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        placeholder="What's wrong? Wrong answer, typo, unclear wording..."
        placeholderTextColor={theme.textSecondary}
        multiline
        maxLength={1000}
        value={message}
        onChangeText={setMessage}
      />
      {error && <ThemedText type="small" style={{ color: theme.bad }}>{error}</ThemedText>}
      <Button title="Send report" onPress={send} loading={state === 'sending'} disabled={message.trim().length < 5} testID="report-send" />
      <Button variant="ghost" title="Cancel" onPress={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  link: { textDecorationLine: 'underline' },
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, minHeight: 80, fontSize: 16, textAlignVertical: 'top' },
});
