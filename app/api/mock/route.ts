import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { resolveQuestion } from "@/lib/questions";
import type { Question } from "@/lib/content/types";
import { isExamId } from "@/lib/content/exams";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const exam = String(body?.exam ?? "");
  if (!isExamId(exam)) return NextResponse.json({ error: "Bad exam" }, { status: 400 });
  if (!hasExamAccess(user, exam)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const ids: string[] = Array.isArray(body.questionIds) ? [...new Set<string>(body.questionIds.map(String))] : [];
  const questions = (await Promise.all(ids.map(resolveQuestion)))
    .map((r) => r?.q)
    .filter((q): q is Question => !!q && q.exam === exam);
  if (!questions.length || questions.length !== ids.length || ids.length > 200) {
    return NextResponse.json({ error: "Bad questions" }, { status: 400 });
  }
  const answers: Record<string, unknown> = body.answers ?? {};

  const results: Record<string, { correct: boolean; answer: number; explanation: string; reference?: string }> = {};
  const attempts = [];
  let correct = 0;
  for (const q of questions) {
    const sel = answers[q.id];
    const answered = typeof sel === "number" && Number.isInteger(sel) && sel >= 0 && sel < q.choices.length;
    const ok = answered && sel === q.answer;
    if (ok) correct++;
    results[q.id] = { correct: ok, answer: q.answer, explanation: q.explanation, reference: q.reference };
    if (answered) {
      attempts.push({ userId: user.id, questionId: q.id, exam, topic: q.topic, selected: sel as number, correct: ok });
    }
  }

  const durationS = Math.max(0, Math.min(Number(body.durationS) || 0, 24 * 3600));
  await db.$transaction([
    db.attempt.createMany({ data: attempts }),
    db.mockExam.create({ data: { userId: user.id, exam, total: questions.length, correct, durationS } }),
  ]);

  return NextResponse.json({ total: questions.length, correct, results });
}
