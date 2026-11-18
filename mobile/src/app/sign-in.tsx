import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '@/lib/api';

// Legal pages live on the website. On the web build API_URL can be '' (same origin).
const siteUrl = (path: string) =>
  `${API_URL || (typeof window !== 'undefined' ? window.location.origin : '')}${path}`;

export default function SignIn() {
  const { signIn } = useSession();
  const theme = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(mode, email.trim(), password);
      // The Stack.Protected guard in the root layout switches to the app.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={[styles.flex, styles.center]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
            Civil<ThemedText type="subtitle" style={{ color: theme.brand }}>Prep</ThemedText>
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
            FE and PE Civil practice that adapts to you.
          </ThemedText>
          <Card>
            <TextInput
              testID="email"
              style={input}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              testID="password"
              style={input}
              placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />
            {error && (
              <ThemedText type="small" style={{ color: theme.bad }} testID="auth-error">
                {error}
              </ThemedText>
            )}
            <Button
              testID="submit"
              title={mode === 'signup' ? 'Create free account' : 'Log in'}
              onPress={submit}
              loading={busy}
              disabled={!email || !password}
            />
            {mode === 'signup' && (
              <ThemedText type="small" themeColor="textSecondary" testID="consent">
                By creating an account you agree to the{' '}
                <ThemedText type="small" style={{ color: theme.brand }} onPress={() => WebBrowser.openBrowserAsync(siteUrl('/terms'))}>
                  Terms of Service
                </ThemedText>{' '}
                and{' '}
                <ThemedText type="small" style={{ color: theme.brand }} onPress={() => WebBrowser.openBrowserAsync(siteUrl('/privacy'))}>
                  Privacy Policy
                </ThemedText>
                .
              </ThemedText>
            )}
          </Card>
          {mode === 'login' && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={{ textAlign: 'center', textDecorationLine: 'underline' }}
              onPress={() => WebBrowser.openBrowserAsync(siteUrl('/forgot-password'))}
              testID="forgot-password">
              Forgot password?
            </ThemedText>
          )}
          <Button
            variant="ghost"
            testID="toggle-mode"
            title={mode === 'signup' ? 'Have an account? Log in' : 'New here? Create a free account'}
            onPress={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError(null);
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, fontSize: 16 },
});
