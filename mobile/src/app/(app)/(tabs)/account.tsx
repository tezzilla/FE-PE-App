import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform, View } from 'react-native';

import { ListGroup, ListRow } from '@/components/nav';
import { ThemedText } from '@/components/themed-text';
import { Card, ErrorView, Loading, Screen } from '@/components/ui';
import { useSession } from '@/ctx';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, api } from '@/lib/api';

export default function Account() {
  const { signOut } = useSession();
  const { exam } = useExam();
  const theme = useTheme();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const { user } = data;
  const open = (path: string) => WebBrowser.openBrowserAsync(`${API_URL}${path}`);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Card>
        <ThemedText type="smallBold" style={{ fontSize: 18 }}>{user.name ?? 'Your account'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{user.email}</ThemedText>
        <ThemedText type="small">{user.active ? (user.summary ?? user.plan?.name) : 'Free plan'}</ThemedText>
      </Card>

      <ListGroup title="On the website">
        {/* Store payment rules: native builds don't link to web checkout. See mobile/README.md. */}
        {Platform.OS === 'web' ? (
          <ListRow icon="card-outline" title="Manage plan" subtitle="Subscriptions and passes" external onPress={() => WebBrowser.openBrowserAsync(data.accountUrl)} />
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
