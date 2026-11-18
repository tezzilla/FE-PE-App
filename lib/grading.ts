import "server-only";
import type { User } from "@prisma/client";
import { canSeeQuestion } from "./access";
import { db } from "./db";
import { resolveQuestion } from "./questions";

export type GradeResult =
  | { status: 200; body: { correct: boolean; answer: number; explanation: string; reference?: string; reviewedBy?: string } }
  | { status: 400 | 403; body: { error: string } };

/** Grade one practice answer and record it. Shared by the web and mobile APIs. */
/** Time on a question, in ms. Ignore values outside 1 s to 30 min (tab left open, clock skew). */
export function cleanTimeMs(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1000 && n <= 30 * 60_000 ? Math.round(n) : null;
}

export async function gradeAnswer(user: User | null, questionId: unknown, selectedIn: unknown, timeMsIn?: unknown): Promise<GradeResult> {
  const resolved = await resolveQuestion(String(questionId ?? ""));
  const q = resolved?.q;
  const selected = Number(selectedIn);
  if (!q || !Number.isInteger(selected) || selected < 0 || selected >= q.choices.length) {
    return { status: 400, body: { error: "Bad request" } };
  }
  if (!canSeeQuestion(user, q)) return { status: 403, body: { error: "Subscription required" } };

  const correct = selected === q.answer;
  if (user) {
    await db.attempt.create({
      data: { userId: user.id, questionId: q.id, exam: q.exam, topic: q.topic, selected, correct, timeMs: cleanTimeMs(timeMsIn) },
    });
  }
  const r = resolved!.review;
  return {
    status: 200,
    body: {
      correct,
      answer: q.answer,
      explanation: q.explanation,
      reference: q.reference,
      reviewedBy: r ? [r.reviewerName, r.credential].filter(Boolean).join(", ") : undefined,
    },
  };
}
