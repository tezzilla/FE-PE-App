import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { ListGroup, ListRow } from '@/components/nav';
import { ThemedText } from '@/components/themed-text';
import { Card, ErrorView, Loading, Screen } from '@/components/ui';
import { useSession } from '@/ctx';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, api, type ExamId } from '@/lib/api';

export default function Account() {
  const { signOut, token } = useSession();
  const { exam } = useExam();
  const theme = useTheme();
  const { data, error, refreshing, reload } = useLoad(api.home);
  const [sampleError, setSampleError] = useState<string | null>(null);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const { user } = data;
  const open = (path: string) => WebBrowser.openBrowserAsync(`${API_URL}${path}`);
  const openSampleSet = async (which: ExamId) => {
    if (!token) return;
    setSampleError(null);
    try {
      const { url } = await api.sampleSet(token, which);
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      setSampleError(e instanceof Error ? e.message : "Couldn't open the problem set.");
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Card>
        <ThemedText type="smallBold" style={{ fontSize: 18 }}>{user.name ?? 'Your account'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{user.email}</ThemedText>
        <ThemedText type="small">{user.active ? (user.summary ?? user.plan?.name) : 'Free plan'}</ThemedText>
      </Card>

      <ListGroup title="Free resources">
        <ListRow icon="print-outline" title="FE Civil problem set" subtitle="Printable practice problems with solutions (PDF)" external testID="sample-fe" onPress={() => openSampleSet('fe-civil')} />
        <ListRow icon="print-outline" title="PE Civil problem set" subtitle="Printable practice problems with solutions (PDF)" external testID="sample-pe" onPress={() => openSampleSet('pe-civil')} />
      </ListGroup>
      {sampleError && <ThemedText type="small" style={{ color: theme.bad }}>{sampleError}</ThemedText>}

      {/* Store payment rules: native builds don't link to web checkout or unlock content with codes.
          Gifts, redeeming and the comparison pages (which link to pricing) are web-only. See mobile/README.md. */}
      {Platform.OS === 'web' ? (
        <ListGroup title="Gifts">
          <ListRow icon="gift-outline" title="Give CivilPrep as a gift" subtitle="An FE or PE pass for someone else" external testID="gift" onPress={() => open('/gift')} />
          <ListRow icon="ticket-outline" title="Redeem a gift code" testID="redeem" onPress={() => router.push('/redeem')} />
        </ListGroup>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Have a gift code? Redeem it on the CivilPrep website, then it works here too.
        </ThemedText>
      )}

      <ListGroup title="On the website">
        {Platform.OS === 'web' ? (
          <ListRow icon="card-outline" title="Manage plan" subtitle="Subscriptions and passes" external onPress={() => WebBrowser.openBrowserAsync(data.accountUrl)} />
        ) : null}
        {Platform.OS === 'web' ? (
          <ListRow icon="git-compare-outline" title="How CivilPrep compares" subtitle="vs PPI2Pass, School of PE and PrepFE" external testID="compare" onPress={() => open('/compare')} />
        ) : null}
        <ListRow icon="calendar-outline" title="Study plan" subtitle="Set your exam date and weekly hours" external onPress={() => open(`/exams/${exam}`)} />
        <ListRow icon="document-lock-outline" title="Terms" external onPress={() => open('/terms')} />
        <ListRow icon="shield-checkmark-outline" title="Privacy" external onPress={() => open('/privacy')} />
      </ListGroup>

      <ListGroup>
        <ListRow icon="log-out-outline" title="Log out" testID="logout" onPress={signOut} />
      </ListGroup>

      <View>
        <ThemedText
          type="small"
          style={{ color: theme.bad, textAlign: 'center' }}
          onPress={() => router.push('/delete-account')}
          testID="delete-account">
          Delete account
        </ThemedText>
      </View>
    </Screen>
  );
}
