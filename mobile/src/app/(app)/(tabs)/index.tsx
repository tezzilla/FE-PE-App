import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ReadinessTrend } from '@/components/readiness-trend';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, api } from '@/lib/api';
import { nextStep } from '@/lib/next-step';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

export default function Home() {
  const theme = useTheme();
  const { exam: examId } = useExam();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const { user } = data;
  const exam = data.exams.find((e) => e.id === examId) ?? data.exams[0];
  const r = exam.readiness;
  const step = nextStep(exam);
  const start = () =>
    step.action.screen === 'flashcards'
      ? router.push({ pathname: '/flashcards', params: { exam: exam.id } })
      : router.push({ pathname: '/practice', params: step.action.params });

  const isPe = exam.id === 'pe-civil';
  const due = exam.dueCards ?? 0;
  const shortcuts: { title: string; icon: React.ComponentProps<typeof Ionicons>['name']; badge?: string; testID: string; onPress: () => void }[] = [
    step.title === 'Smart practice'
      ? { title: 'Quick quiz', icon: 'timer-outline', testID: 'tile-quiz', onPress: () => router.push({ pathname: '/practice', params: { exam: exam.id, mode: 'quiz', count: '10' } }) }
      : { title: 'Smart practice', icon: 'flash-outline', testID: 'tile-smart', onPress: () => router.push({ pathname: '/practice', params: { exam: exam.id, mode: 'smart' } }) },
    { title: 'Flashcards', icon: 'albums-outline', badge: due ? `${due} due` : undefined, testID: 'tile-cards', onPress: () => router.push({ pathname: '/flashcards', params: { exam: exam.id } }) },
    { title: isPe ? 'PE modules' : 'Topics', icon: 'library-outline', testID: 'tile-topics', onPress: () => router.navigate('/topics') },
    { title: 'Formula guides', icon: 'calculator-outline', testID: 'tile-learn', onPress: () => router.push('/learn') },
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View>
        <ThemedText type="subtitle" testID="welcome">
          {user.name ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome back'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {user.active ? (user.summary ?? user.plan?.name) : 'Free plan: sample questions in every topic'}
        </ThemedText>
      </View>

      {exam.extension && (
        <Card style={{ borderColor: theme.brand }}>
          <ThemedText type="smallBold" testID="pass-ending">
            {exam.extension.daysLeft > 0
              ? `Your ${exam.name} pass ends ${shortDate(exam.extension.until)} (${exam.extension.daysLeft} day${exam.extension.daysLeft === 1 ? '' : 's'} left).`
              : `Your ${exam.name} pass ended ${shortDate(exam.extension.until)}.`}
          </ThemedText>
          {/* Store rules: native builds don't link to web checkout. See mobile/README.md. */}
          {Platform.OS === 'web' ? (
            <Button
              title={`Extend 30 days for $${exam.extension.price}`}
              testID="extend"
              onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/dashboard#extend`)}
            />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Exam later than that? You can extend your access from your account on the CivilPrep website. Your progress stays put.
            </ThemedText>
          )}
        </Card>
      )}

      {/* The one thing to do next */}
      <Pressable testID="next-step" accessibilityRole="button" onPress={start} style={({ pressed }) => [styles.next, { backgroundColor: theme.brand, opacity: pressed ? 0.9 : 1 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Ionicons name={step.icon} size={22} color={theme.onBrand} />
          <ThemedText type="small" style={{ color: theme.onBrand, opacity: 0.85, letterSpacing: 0.6 }}>NEXT UP</ThemedText>
        </View>
        <ThemedText style={{ color: theme.onBrand, fontSize: 22, fontWeight: 800 }}>{step.title}</ThemedText>
        <ThemedText type="small" style={{ color: theme.onBrand, opacity: 0.92 }}>{step.why}</ThemedText>
        <View style={[styles.go, { backgroundColor: theme.onBrand }]}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>Start</ThemedText>
          <Ionicons name="arrow-forward" size={16} color={theme.brand} />
        </View>
      </Pressable>

      <View style={styles.tiles} accessibilityLabel="Shortcuts">
        {shortcuts.map((t) => (
          <Pressable
            key={t.title}
            testID={t.testID}
            accessibilityRole="button"
            accessibilityLabel={t.badge ? `${t.title}, ${t.badge}` : t.title}
            onPress={t.onPress}
            style={({ pressed }) => [styles.tile, { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Ionicons name={t.icon} size={22} color={theme.brand} />
              {t.badge ? (
                <View style={[styles.badge, { backgroundColor: theme.brand }]}>
                  <ThemedText type="smallBold" style={{ color: theme.onBrand, fontSize: 12 }}>{t.badge}</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText type="smallBold">{t.title}</ThemedText>
          </Pressable>
        ))}
      </View>

      <Card>
        <ThemedText type="smallBold" testID="readiness-title">{exam.name} readiness</ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
          <View style={{ minWidth: 84 }}>
            <ThemedText type="small" themeColor="textSecondary">Readiness</ThemedText>
            <ThemedText
              testID={`readiness-${exam.id}`}
              style={{ fontSize: 34, lineHeight: 40, fontWeight: 800, color: r.answered ? masteryColor(r.score, theme) : theme.text }}>
              {r.answered ? `${Math.round(r.score * 100)}%` : '–'}
            </ThemedText>
          </View>
          <View style={{ flex: 1, gap: Spacing.one }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText type="small">Exam coverage</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{Math.round(r.coverage * 100)}%</ThemedText>
            </View>
            <ProgressBar value={r.coverage} color={theme.brand} />
            <ThemedText type="small" themeColor="textSecondary">{r.answered} questions answered</ThemedText>
          </View>
        </View>
        {r.answered > 0 && r.weakest.length > 0 && (
          <View style={{ gap: Spacing.one }}>
            <ThemedText type="small" themeColor="textSecondary">Weakest topics</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
              {r.weakest.map((w) => (
                <Pressable
                  key={w.slug}
                  onPress={() =>
                    exam.id === 'pe-civil'
                      ? router.push({ pathname: '/module', params: { module: w.slug } })
                      : router.push({ pathname: '/topic', params: { exam: exam.id, topic: w.slug } })
                  }
                  style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small">{w.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {(exam.history?.length ?? 0) >= 2 && <ReadinessTrend points={exam.history!} />}
        <ThemedText type="small" style={{ color: theme.brand }} accessibilityRole="link" onPress={() => router.navigate('/topics')} testID="all-topics">
          {exam.id === 'pe-civil' ? 'See all modules ›' : 'See all topics ›'}
        </ThemedText>
      </Card>

      {exam.plan && exam.plan.daysLeft >= 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Study plan" onPress={() => router.push('/plan')} testID="plan-card">
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <ThemedText type="smallBold" testID={`plan-${exam.id}`}>Exam in {exam.plan.daysLeft} days</ThemedText>
            <ThemedText type="smallBold" style={{ color: exam.plan.status === 'behind' ? theme.warn : theme.good }}>
              {exam.plan.status === 'behind' ? 'Behind' : exam.plan.status === 'ahead' ? 'Ahead' : 'On track'}
            </ThemedText>
          </View>
          <ProgressBar value={Math.min(1, exam.plan.answeredLast7Days / Math.max(1, exam.plan.weeklyTarget))} color={exam.plan.status === 'behind' ? theme.warn : theme.good} />
          <ThemedText type="small" themeColor="textSecondary">
            {exam.plan.answeredLast7Days} of {exam.plan.weeklyTarget} questions this week · Edit plan ›
          </ThemedText>
        </Card>
        </Pressable>
      ) : (
        <Card>
          <ThemedText type="smallBold">When is your {exam.name} exam?</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Set the date and your weekly hours to get a weekly target and focus topics.</ThemedText>
          <Button variant="ghost" title="Set my exam date" onPress={() => router.push('/plan')} testID="set-plan" />
        </Card>
      )}

      {!exam.access && (
        <Card>
          <ThemedText type="smallBold">Free tier</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            One sample question per topic. Subscribers get the full bank, calculation problems that never repeat, flashcards and exam documents.
          </ThemedText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  next: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  go: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: Spacing.one },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
