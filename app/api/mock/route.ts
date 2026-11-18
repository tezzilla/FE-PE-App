import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { isExamId } from "@/lib/content/exams";
import { loadSessions } from "@/lib/exam-builder";
import { db } from "@/lib/db";

/**
 * Submit a full exam. Grades the question list saved when the exam started (not anything the client
 * sends), records each answer as an attempt for the adaptive engine, and saves a per-topic breakdown.
 * POST { mockId, answers: { [questionId]: choice }, flags?: string[], durationS }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const mock = await db.mockExam.findUnique({ where: { id: String(body?.mockId ?? "") } });
  if (!mock || mock.userId !== user.id || !mock.sessions || !isExamId(mock.exam)) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }
  if (mock.status !== "in_progress") return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  if (!hasExamAccess(user, mock.exam)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const questions = (await loadSessions(mock.sessions)).flat();
  const raw: Record<string, unknown> = body?.answers ?? {};
  const answers: Record<string, number> = {};
  const results: Record<string, { correct: boolean; answer: number; explanation: string; reference?: string }> = {};
  const breakdown: Record<string, [number, number]> = {};
  const attempts = [];
  let correct = 0;
  for (const q of questions) {
    const sel = raw[q.id];
    const answered = typeof sel === "number" && Number.isInteger(sel) && sel >= 0 && sel < q.choices.length;
    const ok = answered && sel === q.answer;
    if (answered) answers[q.id] = sel as number;
    if (ok) correct++;
    const b = (breakdown[q.topic] ??= [0, 0]);
    b[1]++;
    if (ok) b[0]++;
    results[q.id] = { correct: ok, answer: q.answer, explanation: q.explanation, reference: q.reference };
    if (answered) attempts.push({ userId: user.id, questionId: q.id, exam: mock.exam, topic: q.topic, selected: sel as number, correct: ok });
  }
  const flags = Array.isArray(body?.flags) ? body.flags.map(String).slice(0, 200) : [];
  const durationS = Math.max(0, Math.min(Number(body?.durationS) || 0, 24 * 3600));

  // Claim the in-progress row so a double submit can't record attempts twice.
  const claimed = await db.mockExam.updateMany({
    where: { id: mock.id, status: "in_progress" },
    data: {
      status: "completed",
      completedAt: new Date(),
      total: questions.length,
      correct,
      durationS,
      breakdown: JSON.stringify(breakdown),
      answers: JSON.stringify({ answers, flags }),
    },
  });
  if (claimed.count === 0) return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  await db.attempt.createMany({ data: attempts });
  return NextResponse.json({ mockId: mock.id, total: questions.length, correct, breakdown, results });
}
