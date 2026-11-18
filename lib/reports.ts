import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import { resolveQuestion } from "./questions";
import { canSeeQuestion } from "./access";
import { LIMITS, blockedFor, hit, tooMany } from "./ratelimit";

export const REPORT_MAX_LENGTH = 1000;

export type ReportResult = { ok: true } | { ok: false; status: 400 | 401 | 403 | 429; error: string };

/** Record a student's report about a question. Shared by the website and the mobile API. */
export async function submitReport(user: User | null, body: unknown): Promise<ReportResult> {
  if (!user) return { ok: false, status: 401, error: "Sign in to report a problem." };
  const b = (body ?? {}) as Record<string, unknown>;
  const message = String(b.message ?? "").trim();
  if (message.length < 5) return { ok: false, status: 400, error: "Tell us briefly what's wrong (5+ characters)." };
  if (message.length > REPORT_MAX_LENGTH) return { ok: false, status: 400, error: `Keep it under ${REPORT_MAX_LENGTH} characters.` };

  const resolved = await resolveQuestion(String(b.questionId ?? ""));
  if (!resolved) return { ok: false, status: 400, error: "Unknown question." };
  const q = resolved.q;
  if (!canSeeQuestion(user, q)) return { ok: false, status: 403, error: "Subscription required." };

  const key = `report:user:${user.id}`;
  const wait = await blockedFor(key, LIMITS.reportUser);
  if (wait) return { ok: false, status: 429, error: tooMany(wait) };
  await hit(key, LIMITS.reportUser);

  const sel = Number(b.selected);
  await db.problemReport.create({
    data: {
      userId: user.id,
      questionId: q.id,
      exam: q.exam,
      topic: q.topic,
      templateId: q.templateId ?? null,
      selected: Number.isInteger(sel) && sel >= 0 && sel < q.choices.length ? sel : null,
      message,
    },
  });
  return { ok: true };
}
