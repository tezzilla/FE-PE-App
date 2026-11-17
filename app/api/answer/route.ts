import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canSeeQuestion } from "@/lib/access";
import { getQuestion } from "@/lib/content";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const q = body && getQuestion(String(body.questionId));
  const selected = Number(body?.selected);
  if (!q || !Number.isInteger(selected) || selected < 0 || selected >= q.choices.length) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!canSeeQuestion(user, q)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const correct = selected === q.answer;
  if (user) {
    await db.attempt.create({
      data: { userId: user.id, questionId: q.id, exam: q.exam, topic: q.topic, selected, correct },
    });
  }
  return NextResponse.json({ correct, answer: q.answer, explanation: q.explanation, reference: q.reference });
}
