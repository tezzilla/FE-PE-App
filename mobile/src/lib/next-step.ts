import type { ExamSummary } from '@/lib/api';

export interface NextStep {
  title: string;
  why: string;
  /** Route params for /practice, or a named screen. */
  action: { screen: 'practice'; params: Record<string, string> } | { screen: 'flashcards' };
  icon: 'compass-outline' | 'refresh' | 'albums-outline' | 'flash-outline';
}

/** The single most useful thing to do next, from the student's own data. */
export function nextStep(e: ExamSummary): NextStep {
  const missed = e.missed ?? 0;
  const due = e.dueCards ?? 0;
  if (e.readiness.answered === 0) {
    return {
      title: 'Take the diagnostic',
      why: `About 2 questions per topic (${e.topics.length * 2} total). It finds your weak spots so practice starts in the right place.`,
      action: { screen: 'practice', params: { exam: e.id, mode: 'diagnostic' } },
      icon: 'compass-outline',
    };
  }
  if (missed >= 3) {
    return {
      title: `Review ${missed} missed problems`,
      why: 'New versions of problems you got wrong last time. Fixing misses is the fastest way to raise your score.',
      action: { screen: 'practice', params: { exam: e.id, mode: 'missed', count: missed > 10 ? '20' : '10' } },
      icon: 'refresh',
    };
  }
  if (due >= 5) {
    return {
      title: `${due} flashcards due`,
      why: 'A few minutes on formulas keeps them fresh and saves time hunting in the handbook.',
      action: { screen: 'flashcards' },
      icon: 'albums-outline',
    };
  }
  const weakest = e.readiness.weakest.map((w) => w.name).slice(0, 2).join(' and ');
  return {
    title: 'Smart practice',
    why: e.readiness.dueReviews
      ? `${e.readiness.dueReviews} review${e.readiness.dueReviews > 1 ? 's' : ''} due, plus your weakest topics${weakest ? ` (${weakest})` : ''}.`
      : `10 questions aimed at your weakest topics${weakest ? `: ${weakest}` : ''}.`,
    action: { screen: 'practice', params: { exam: e.id, mode: 'smart' } },
    icon: 'flash-outline',
  };
}
