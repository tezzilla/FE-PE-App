import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api, type ExamSummary } from '@/lib/api';

export default function Home() {
  const { signOut } = useSession();
  const theme = useTheme();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const { user } = data;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View>
        <ThemedText type="subtitle" testID="welcome">
          Welcome{user.name ? `, ${user.name}` : ''}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {user.active && user.plan ? `${user.plan.name} plan` : 'Free plan: sample questions in every topic'}
        </ThemedText>
      </View>

      {data.exams.map((e) => (
        <ExamCard key={e.id} exam={e} />
      ))}

      <Card>
        <ThemedText type="smallBold">Account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{user.email}</ThemedText>
        {/* Store payment rules: native builds don't link to web checkout. See mobile/README.md. */}
        {Platform.OS === 'web' && (
          <Button variant="ghost" title="Manage plan on the website" onPress={() => WebBrowser.openBrowserAsync(data.accountUrl)} />
        )}
        <Button variant="ghost" title="Log out" onPress={signOut} testID="logout" />
      </Card>
      {error && <ThemedText type="small" style={{ color: theme.bad }}>{error}</ThemedText>}
    </Screen>
  );
}

function ExamCard({ exam }: { exam: ExamSummary }) {
  const theme = useTheme();
  const r = exam.readiness;
  const pct = Math.round(r.score * 100);
  return (
    <Card>
      <Pressable
        onPress={() => router.push({ pathname: '/exam/[id]', params: { id: exam.id } })}
        accessibilityRole="button"
        testID={`exam-${exam.id}`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <ThemedText type="smallBold" style={{ fontSize: 20 }}>{exam.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {exam.access ? 'Full access' : 'Free tier'} ›
          </ThemedText>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
        <View style={{ minWidth: 84 }}>
          <ThemedText type="small" themeColor="textSecondary">Readiness</ThemedText>
          <ThemedText
            testID={`readiness-${exam.id}`}
            style={{ fontSize: 34, lineHeight: 40, fontWeight: 800, color: r.answered ? masteryColor(r.score, theme) : theme.text }}>
            {r.answered ? `${pct}%` : '–'}
          </ThemedText>
        </View>
        <View style={{ flex: 1, gap: Spacing.one }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText type="small">Exam coverage</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{Math.round(r.coverage * 100)}%</ThemedText>
          </View>
          <ProgressBar value={r.coverage} color={theme.brand} />
          {r.dueReviews > 0 && (
            <ThemedText type="small">
              {r.dueReviews} review{r.dueReviews > 1 ? 's' : ''} due
            </ThemedText>
          )}
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Focus next: <ThemedText type="small">{r.weakest.map((w) => w.name).join(', ')}</ThemedText>
      </ThemedText>
      <Button
        testID={`smart-${exam.id}`}
        title="Smart practice"
        onPress={() => router.push({ pathname: '/practice', params: { exam: exam.id, mode: 'smart' } })}
      />
    </Card>
  );
}
