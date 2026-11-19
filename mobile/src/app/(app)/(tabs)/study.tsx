import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { ListGroup, ListRow } from '@/components/nav';
import { ThemedText } from '@/components/themed-text';
import { Card, ErrorView, Loading, Screen } from '@/components/ui';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, api } from '@/lib/api';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s)}s`;
}

export default function Study() {
  const theme = useTheme();
  const { exam: examId } = useExam();
  const { data, error, refreshing, reload } = useLoad(api.home);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const exam = data.exams.find((e) => e.id === examId) ?? data.exams[0];
  const go = (params: Record<string, string>) => router.push({ pathname: '/practice', params: { exam: exam.id, ...params } });
  const missed = exam.missed ?? 0;
  const due = exam.dueCards ?? 0;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ListGroup title="Practice">
        <ListRow icon="flash-outline" title="Smart practice" subtitle="10 questions picked for your weak spots" testID="smart" onPress={() => go({ mode: 'smart' })} />
        <ListRow
          icon="refresh"
          title="Review my misses"
          subtitle={missed ? 'New versions of problems you got wrong' : 'Nothing missed yet'}
          badge={missed || null}
          disabled={!missed}
          testID="missed"
          onPress={() => go({ mode: 'missed', count: missed > 10 ? '20' : '10' })}
        />
        <ListRow icon="timer-outline" title="Quick quiz" subtitle="10 questions, all topics" testID="quiz-10" onPress={() => go({ mode: 'quiz', count: '10' })} />
        <ListRow icon="list-outline" title="Long quiz" subtitle="20 questions, all topics" testID="quiz" onPress={() => go({ mode: 'quiz', count: '20' })} />
        <ListRow icon="compass-outline" title="Diagnostic" subtitle="About 2 questions per topic" testID="diagnostic" onPress={() => go({ mode: 'diagnostic' })} />
        <ListRow
          icon="library-outline"
          title={exam.id === 'pe-civil' ? 'Practice by module' : 'Practice by topic'}
          subtitle={exam.id === 'pe-civil' ? 'Knowledge areas for each PE module' : 'Review notes and practice for each topic'}
          testID="by-topic"
          onPress={() => router.navigate('/topics')}
        />
      </ListGroup>

      <ListGroup title="Memorize formulas">
        <ListRow
          icon="albums-outline"
          title="Formula flashcards"
          subtitle={due ? `${due} due for review` : 'Spaced review of key formulas'}
          badge={due || null}
          testID="flashcards"
          onPress={() => router.push({ pathname: '/flashcards', params: { exam: exam.id } })}
        />
        <ListRow
          icon="search-outline"
          title="Handbook hunt"
          subtitle="Timed drill: which chapter would you open?"
          testID="handbook-drill"
          locked={!exam.access}
          onPress={() => router.push('/handbook-drill')}
        />
        <ListRow
          icon="calculator-outline"
          title="Formula guides"
          subtitle="The most-tested formulas, with worked examples"
          testID="learn"
          onPress={() => router.push('/learn')}
        />
      </ListGroup>

      <ListGroup title="Exam day">
        <ListRow
          icon="hourglass-outline"
          title="Full-length timed exam"
          subtitle={`${exam.id === 'pe-civil' ? '80 questions, 8 hours' : '110 questions, 5 h 20 min'} · opens on the website`}
          external
          locked={!exam.access}
          testID="full-exam"
          onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/exams/${exam.id}/mock`)}
        />
        <ListRow
          icon="document-text-outline"
          title="Exam documents"
          subtitle={exam.id === 'pe-civil' ? 'Handbook, specs and design standards' : 'Handbook, specs and exam-day rules'}
          locked={!exam.access}
          testID="resources"
          onPress={() => router.push({ pathname: '/resources', params: { exam: exam.id } })}
        />
        <ListRow
          icon="calendar-outline"
          title="Study plan"
          subtitle={exam.plan ? `Exam in ${exam.plan.daysLeft} days · ${exam.plan.weeklyTarget} questions a week` : 'Set your exam date for a weekly target'}
          testID="study-plan"
          onPress={() => router.push('/plan')}
        />
      </ListGroup>

      {exam.pacing && (
        <Card>
          <ThemedText type="smallBold">Your pace</ThemedText>
          <ThemedText type="small">
            {fmt(exam.pacing.averageS)} per question · exam pace {fmt(exam.pacing.examPaceS)}
          </ThemedText>
          {exam.pacing.averageS > exam.pacing.examPaceS * 1.25 && (
            <ThemedText type="small" style={{ color: theme.bad }}>Well over exam pace. Use quizzes to practice moving on.</ThemedText>
          )}
        </Card>
      )}
    </Screen>
  );
}
