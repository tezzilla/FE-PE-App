import "server-only";
import type { User } from "@prisma/client";
import { db } from "../db";
import type { ExamId, Question } from "../content/types";
import { EXAMS, topicName } from "../content/exams";
import { questionsFor } from "../content";
import { canSeeQuestion, hasExamAccess } from "../access";
import { getTemplate, templatesFor } from "../templates";
import { randomSeed, templateToQuestion } from "../templates/engine";
import { approvedTemplates } from "../reviews";
import {
  computeState, describeReason, planSession, readiness, topicWeights,
  type LearnerState, type PoolItem, type Readiness,
} from "./model";
import { buildPlan } from "./plan";
import { missedSkills, paceRows, pickDiagnostic, pickQuiz, type QuizOptions } from "./quiz";

export async function learnerState(userId: string, exam: ExamId, now = new Date()): Promise<LearnerState> {
  const attempts = await db.attempt.findMany({
    where: { userId, exam },
    select: { questionId: true, topic: true, correct: true, createdAt: true },
  });
  return computeState(attempts, now);
}

export function weightsFor(user: User, exam: ExamId) {
  return topicWeights(EXAMS[exam], exam === "pe-civil" ? user.peDepth : null);
}

/** Everything this user is allowed to practice right now, as skills. */
export async function pool(user: User, exam: ExamId): Promise<PoolItem[]> {
  const items: PoolItem[] = questionsFor(exam)
    .filter((q) => canSeeQuestion(user, q))
    .map((q) => ({ skill: q.id, topic: q.topic, regenerable: false }));
  if (hasExamAccess(user, exam)) {
    const approved = await approvedTemplates();
    for (const t of templatesFor(exam)) {
      if (approved.has(t.id)) items.push({ skill: `tpl:${t.id}`, topic: t.topics[exam]!, regenerable: true });
    }
  }
  return items;
}

/** A concrete question for a pool item. Problem types get fresh numbers every time. */
function itemQuestion(item: PoolItem, exam: ExamId): Question | undefined {
  if (!item.regenerable) return questionsFor(exam).find((x) => x.id === item.skill);
  const t = getTemplate(item.skill.slice(4));
  return t ? (templateToQuestion(t, exam, randomSeed()) ?? undefined) : undefined;
}

export async function smartSession(user: User, exam: ExamId, size = 10) {
  const now = new Date();
  const [state, items] = await Promise.all([learnerState(user.id, exam, now), pool(user, exam)]);
  const picks = planSession(items, state, weightsFor(user, exam), size, now);
  const questions: Question[] = [];
  const reasons: Record<string, string> = {};
  for (const p of picks) {
    const q = itemQuestion(p.item, exam);
    if (!q) continue;
    questions.push(q);
    reasons[q.id] = describeReason(p.reason, (t) => topicName(exam, t), now);
  }
  return { questions, reasons };
}

export async function examReadiness(user: User, exam: ExamId): Promise<Readiness & { dueReviews: number; answered: number }> {
  const now = new Date();
  const [state, items] = await Promise.all([learnerState(user.id, exam, now), pool(user, exam)]);
  const available = new Set(items.map((i) => i.skill));
  const dueReviews = [...state.skills].filter(([k, s]) => available.has(k) && s.due <= now).length;
  const answered = [...state.topics.values()].reduce((a, t) => a + t.evidence, 0);
  return { ...readiness(state, weightsFor(user, exam)), dueReviews, answered };
}

/** The user's study plan for an exam, computed from their saved date/hours and live progress. */
export async function studyPlanFor(user: User, exam: ExamId) {
  const saved = await db.studyPlan.findUnique({ where: { userId_exam: { userId: user.id, exam } } });
  if (!saved) return null;
  const now = new Date();
  const [state, answeredLast7Days, fullExams] = await Promise.all([
    learnerState(user.id, exam, now),
    db.attempt.count({ where: { userId: user.id, exam, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 3600 * 1000) } } }),
    db.mockExam.findMany({ where: { userId: user.id, exam, status: "completed" }, select: { completedAt: true, createdAt: true } }),
  ]);
  const r = readiness(state, weightsFor(user, exam));
  const plan = buildPlan({
    exam,
    today: now,
    examDate: saved.examDate,
    weeklyHours: saved.weeklyHours,
    answeredLast7Days,
    focus: r.weakest.map((w) => ({ topic: w.topic, name: topicName(exam, w.topic), mastery: w.mastery })),
    fullExamsDone: fullExams.map((m) => m.completedAt ?? m.createdAt),
  });
  return { saved, plan };
}

/** A custom quiz (topics, size, source). */
export async function quizSession(user: User, exam: ExamId, opts: QuizOptions) {
  const [state, items] = await Promise.all([learnerState(user.id, exam), pool(user, exam)]);
  return pickQuiz(items, state, opts).flatMap((i) => itemQuestion(i, exam) ?? []);
}

/** About 2 questions per topic to find a starting point. */
export async function diagnosticSession(user: User, exam: ExamId, perTopic = 2) {
  const [state, items] = await Promise.all([learnerState(user.id, exam), pool(user, exam)]);
  const topics = EXAMS[exam].topics.map((t) => t.slug);
  return pickDiagnostic(items, state, topics, perTopic).flatMap((i) => itemQuestion(i, exam) ?? []);
}

/** Problems whose last answer was wrong and that the student can still practice. */
export async function missedCount(user: User, exam: ExamId) {
  const [state, items] = await Promise.all([learnerState(user.id, exam), pool(user, exam)]);
  const missed = missedSkills(state);
  return items.filter((i) => missed.has(i.skill)).length;
}

/** Average answer time per topic against exam pace (timed practice answers from the last 90 days). */
export async function pacing(user: User, exam: ExamId) {
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const groups = await db.attempt.groupBy({
    by: ["topic"],
    where: { userId: user.id, exam, timeMs: { not: null }, createdAt: { gte: since } },
    _avg: { timeMs: true },
    _count: { timeMs: true },
  });
  const rows = paceRows(
    exam,
    groups.map((g) => ({ topic: g.topic, avgMs: g._avg.timeMs ?? 0, n: g._count.timeMs })),
  );
  const total = groups.reduce((a, g) => a + g._count.timeMs, 0);
  const overallMs = total ? groups.reduce((a, g) => a + (g._avg.timeMs ?? 0) * g._count.timeMs, 0) / total : 0;
  return { rows: rows.map((r) => ({ ...r, name: topicName(exam, r.topic) })), total, overallS: Math.round(overallMs / 1000) };
}

/** Readiness at the end of each of the last `weeks` weeks (oldest first), from the first week with answers. */
export async function readinessHistory(user: User, exam: ExamId, weeks = 8) {
  const attempts = await db.attempt.findMany({
    where: { userId: user.id, exam },
    select: { questionId: true, topic: true, correct: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  if (!attempts.length) return [];
  const w = weightsFor(user, exam);
  const now = Date.now();
  const out: { date: string; score: number; answered: number }[] = [];
  for (let k = weeks - 1; k >= 0; k--) {
    const at = new Date(now - k * 7 * 24 * 3600 * 1000);
    const upTo = attempts.filter((a) => a.createdAt <= at);
    if (!upTo.length) continue;
    out.push({ date: at.toISOString(), score: readiness(computeState(upTo, at), w).score, answered: upTo.length });
  }
  return out;
}
