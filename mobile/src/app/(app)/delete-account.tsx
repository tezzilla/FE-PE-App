import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

// In-app account deletion. Required by the App Store for apps that let people create accounts.
export default function DeleteAccount() {
  const { token, signOut } = useSession();
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteAccount(token, password);
      signOut(); // the root layout's guard returns to the sign-in screen
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }];
  return (
    <Screen>
      <Card>
        <ThemedText type="smallBold" style={{ fontSize: 18 }}>Permanently delete your account</ThemedText>
        <ThemedText>
          This deletes your account, answers, readiness history and mock exams on the app and the website. Any
          subscription is canceled right away and you won&apos;t be charged again.
        </ThemedText>
        <TextInput
          testID="delete-password"
          style={input}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          testID="delete-confirm"
          style={input}
          placeholder="Type DELETE to confirm"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          value={confirm}
          onChangeText={setConfirm}
        />
        {error && <ThemedText type="small" style={{ color: theme.bad }} testID="delete-error">{error}</ThemedText>}
        <Button
          testID="delete-submit"
          title="Delete my account"
          onPress={submit}
          loading={busy}
          disabled={!password || confirm.trim().toUpperCase() !== 'DELETE'}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, fontSize: 16 },
});
