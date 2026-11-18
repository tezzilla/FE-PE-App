// Custom quizzes, "review my misses" and the diagnostic. Pure selection (no DB) so it can be tested.

import type { ExamId } from "../content/types";
import type { LearnerState, PoolItem } from "./model";

export type QuizSource = "all" | "missed" | "unseen";
export const QUIZ_SOURCES: QuizSource[] = ["all", "missed", "unseen"];
export const QUIZ_COUNTS = [10, 20, 40] as const;

/** Real exam pace in seconds per question: FE 320 min / 110, PE 480 min / 80. */
export const EXAM_PACE_S: Record<ExamId, number> = { "fe-civil": Math.round((320 * 60) / 110), "pe-civil": (480 * 60) / 80 };

export interface QuizOptions {
  topics: string[];
  count: number;
  source: QuizSource;
}

/** Skills whose most recent answer was wrong. */
export function missedSkills(state: LearnerState): Set<string> {
  return new Set([...state.skills].filter(([, s]) => !s.lastCorrect).map(([k]) => k));
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Choose up to `count` skills, spread evenly across the chosen topics (round robin).
 * Fixed questions appear at most once; problem types (regenerable) may repeat with new numbers
 * once every eligible skill has been used, except in "unseen" mode.
 */
export function pickQuiz(items: PoolItem[], state: LearnerState, opts: QuizOptions, rand = Math.random): PoolItem[] {
  const topics = new Set(opts.topics);
  const missed = missedSkills(state);
  const eligible = items.filter(
    (i) =>
      topics.has(i.topic) &&
      (opts.source === "all" || (opts.source === "missed" ? missed.has(i.skill) : !state.skills.has(i.skill))),
  );
  const byTopic = new Map<string, PoolItem[]>();
  for (const i of shuffled(eligible, rand)) byTopic.set(i.topic, [...(byTopic.get(i.topic) ?? []), i]);
  const queues = shuffled([...byTopic.values()], rand);

  const out: PoolItem[] = [];
  // First pass: every eligible skill once, round robin across topics.
  for (let round = 0; out.length < opts.count; round++) {
    const before = out.length;
    for (const q of queues) if (round < q.length && out.length < opts.count) out.push(q[round]);
    if (out.length === before) break;
  }
  // Second pass: repeat problem types with fresh numbers.
  if (opts.source !== "unseen") {
    const regen = queues.map((q) => q.filter((i) => i.regenerable)).filter((q) => q.length);
    for (let round = 0; regen.length && out.length < opts.count; round++) {
      for (const q of regen) if (out.length < opts.count) out.push(q[round % q.length]);
    }
  }
  return shuffled(out, rand);
}

/**
 * Diagnostic: `perTopic` questions from every topic, preferring problems the student hasn't seen.
 */
export function pickDiagnostic(items: PoolItem[], state: LearnerState, topics: string[], perTopic = 2, rand = Math.random): PoolItem[] {
  const out: PoolItem[] = [];
  for (const t of topics) {
    const inTopic = shuffled(items.filter((i) => i.topic === t), rand);
    const fresh = inTopic.filter((i) => !state.skills.has(i.skill));
    const seen = inTopic.filter((i) => state.skills.has(i.skill));
    out.push(...[...fresh, ...seen].slice(0, perTopic));
  }
  return shuffled(out, rand);
}

export interface PaceRow {
  topic: string;
  avgS: number;
  answered: number;
  /** Average time relative to exam pace (1 = exactly on pace). */
  ratio: number;
}

/** Per-topic average time against exam pace, slowest first. Needs at least `min` timed answers per topic. */
export function paceRows(exam: ExamId, rows: { topic: string; avgMs: number; n: number }[], min = 3): PaceRow[] {
  const pace = EXAM_PACE_S[exam];
  return rows
    .filter((r) => r.n >= min)
    .map((r) => ({ topic: r.topic, avgS: Math.round(r.avgMs / 1000), answered: r.n, ratio: r.avgMs / 1000 / pace }))
    .sort((a, b) => b.ratio - a.ratio);
}
