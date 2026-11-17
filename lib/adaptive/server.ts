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
async function pool(user: User, exam: ExamId): Promise<PoolItem[]> {
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

export async function smartSession(user: User, exam: ExamId, size = 10) {
  const now = new Date();
  const [state, items] = await Promise.all([learnerState(user.id, exam, now), pool(user, exam)]);
  const picks = planSession(items, state, weightsFor(user, exam), size, now);
  const questions: Question[] = [];
  const reasons: Record<string, string> = {};
  for (const p of picks) {
    const q = p.item.regenerable
      ? templateToQuestion(getTemplate(p.item.skill.slice(4))!, exam, randomSeed()) // fresh numbers every time
      : questionsFor(exam).find((x) => x.id === p.item.skill);
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
