import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

/**
 * Redeem a gift code. Web version of the app only: store rules don't let native apps unlock paid
 * content with their own codes, so native builds point people to the website instead.
 */
export default function Redeem() {
  const { token } = useSession();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <Card>
          <ThemedText>Redeem gift codes on the CivilPrep website. Once redeemed, your access works here too.</ThemedText>
        </Card>
      </Screen>
    );
  }

  const submit = async () => {
    if (!token || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.redeem(token, code.trim());
      setDone(r.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't redeem that code.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <Card>
          <ThemedText type="subtitle" testID="redeemed">Gift redeemed</ThemedText>
          <ThemedText>{done} is now active on your account. Good luck on the exam!</ThemedText>
          <Button title="Start practicing" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <ThemedText type="smallBold">Gift code</ThemedText>
        <TextInput
          testID="gift-code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="CP-XXXX-XXXX-XXXX"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        />
        {error && <ThemedText type="small" style={{ color: theme.bad }}>{error}</ThemedText>}
        <Button title="Redeem gift" onPress={submit} loading={busy} disabled={!code.trim()} testID="redeem-submit" />
        <ThemedText type="small" themeColor="textSecondary">Access starts as soon as you redeem it.</ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, fontSize: 18, letterSpacing: 1.5 },
});
