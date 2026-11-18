import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { nextStep } from '@/lib/next-step';

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

      <Card>
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
                  onPress={() => router.push({ pathname: '/topic', params: { exam: exam.id, topic: w.slug } })}
                  style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small">{w.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>

      {exam.plan && exam.plan.daysLeft >= 0 ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <ThemedText type="smallBold" testID={`plan-${exam.id}`}>Exam in {exam.plan.daysLeft} days</ThemedText>
            <ThemedText type="smallBold" style={{ color: exam.plan.status === 'behind' ? theme.warn : theme.good }}>
              {exam.plan.status === 'behind' ? 'Behind' : exam.plan.status === 'ahead' ? 'Ahead' : 'On track'}
            </ThemedText>
          </View>
          <ProgressBar value={Math.min(1, exam.plan.answeredLast7Days / Math.max(1, exam.plan.weeklyTarget))} color={exam.plan.status === 'behind' ? theme.warn : theme.good} />
          <ThemedText type="small" themeColor="textSecondary">
            {exam.plan.answeredLast7Days} of {exam.plan.weeklyTarget} questions this week
          </ThemedText>
        </Card>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Set your exam date on the website to get a weekly study plan here.
        </ThemedText>
      )}

      {!exam.access && (
        <Card>
          <ThemedText type="smallBold">Free tier</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            One sample question per topic. Subscribers get the full bank, unlimited generated problems, flashcards and exam documents.
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
});
