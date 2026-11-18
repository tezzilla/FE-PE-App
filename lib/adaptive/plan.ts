// Study plan from an exam date and weekly hours. Pure functions (no DB) so they can be tested.
//
// Pacing assumptions (planning guidance, not NCEES rules):
// - Practice pace including reading the solution: FE about 4 min per question (15/hour),
//   PE about 7.5 min per question (8/hour).
// - Typical total prep: FE 200 to 300 hours, PE about 300 hours.

import type { ExamId } from "../content/types";

const DAY = 24 * 3600 * 1000;
export const QUESTIONS_PER_HOUR: Record<ExamId, number> = { "fe-civil": 15, "pe-civil": 8 };
export const TYPICAL_HOURS: Record<ExamId, number> = { "fe-civil": 200, "pe-civil": 300 };

export type Phase = "learn" | "practice" | "final" | "exam-week" | "past";

export interface PlanInput {
  exam: ExamId;
  today: Date;
  examDate: Date;
  weeklyHours: number;
  /** Questions answered in the last 7 days (practice, quizzes and exams). */
  answeredLast7Days: number;
  /** Topic priorities, highest first: weight × (1 − mastery). */
  focus: { topic: string; name: string; mastery: number }[];
  /** Completion dates of full exams. */
  fullExamsDone: Date[];
}

export interface Milestone {
  label: string;
  date: Date;
  done: boolean;
}

export interface Plan {
  daysLeft: number;
  weeksLeft: number;
  phase: Phase;
  phaseLabel: string;
  weeklyTarget: number;
  answeredLast7Days: number;
  status: "ahead" | "on-track" | "behind";
  focus: { topic: string; name: string; mastery: number }[];
  milestones: Milestone[];
  hoursLeft: number;
  /** Set when the remaining time looks short for this exam. */
  warning: string | null;
}

export function phaseFor(daysLeft: number): Phase {
  if (daysLeft < 0) return "past";
  if (daysLeft <= 7) return "exam-week";
  if (daysLeft <= 14) return "final";
  if (daysLeft <= 42) return "practice";
  return "learn";
}

const PHASE_LABEL: Record<Phase, string> = {
  learn: "Build skills: smart practice across all topics, focus on weak ones",
  practice: "Practice under exam conditions: full exams plus targeted weak-topic practice",
  final: "Final review: missed problems, flashcards, one last full exam",
  "exam-week": "Exam week: light review, rest, and check your exam-day logistics",
  past: "Your exam date has passed. Update it if you're retaking.",
};

/**
 * Full exams: one about halfway through (if there's time), one 2 weeks out, one 1 week out.
 * A milestone counts as done if a full exam was completed within 4 days before or any time after it.
 */
export function milestonesFor(today: Date, examDate: Date, done: Date[]): Milestone[] {
  const daysLeft = Math.floor((examDate.getTime() - today.getTime()) / DAY);
  const dates: { label: string; date: Date }[] = [];
  if (daysLeft > 42) dates.push({ label: "Full exam (midpoint check)", date: new Date(today.getTime() + Math.floor(daysLeft / 2) * DAY) });
  dates.push({ label: "Full exam (2 weeks out)", date: new Date(examDate.getTime() - 14 * DAY) });
  dates.push({ label: "Full exam (1 week out)", date: new Date(examDate.getTime() - 7 * DAY) });
  // Each milestone owns the window from 4 days before it until 4 days before the next one, so a late
  // exam counts toward the milestone it was nearest, and a skipped earlier one stays not done.
  return dates.map((m, i) => {
    const start = m.date.getTime() - 4 * DAY;
    const end = i + 1 < dates.length ? dates[i + 1].date.getTime() - 4 * DAY : Infinity;
    return { ...m, done: done.some((d) => d.getTime() >= start && d.getTime() < end) };
  });
}

export function buildPlan(input: PlanInput): Plan {
  const daysLeft = Math.ceil((input.examDate.getTime() - input.today.getTime()) / DAY);
  const weeksLeft = Math.max(0, Math.ceil(daysLeft / 7));
  const phase = phaseFor(daysLeft);
  const weeklyTarget = Math.round(input.weeklyHours * QUESTIONS_PER_HOUR[input.exam]);
  const ratio = weeklyTarget ? input.answeredLast7Days / weeklyTarget : 1;
  const status = ratio >= 1.2 ? "ahead" : ratio >= 0.8 ? "on-track" : "behind";
  const hoursLeft = Math.max(0, (daysLeft / 7) * input.weeklyHours);
  const avgMastery = input.focus.length ? input.focus.reduce((a, f) => a + f.mastery, 0) / input.focus.length : 0;
  const typical = TYPICAL_HOURS[input.exam];
  const warning =
    phase === "past" || phase === "exam-week"
      ? null
      : hoursLeft < typical * 0.5 && avgMastery < 0.7
        ? `About ${Math.round(hoursLeft)} study hours remain before your exam; most candidates plan ${typical}+ hours. Consider adding weekly hours or a later exam date.`
        : null;
  return {
    daysLeft,
    weeksLeft,
    phase,
    phaseLabel: PHASE_LABEL[phase],
    weeklyTarget,
    answeredLast7Days: input.answeredLast7Days,
    status,
    focus: input.focus.slice(0, 3),
    milestones: daysLeft >= 7 ? milestonesFor(input.today, input.examDate, input.fullExamsDone) : [],
    hoursLeft,
    warning,
  };
}
