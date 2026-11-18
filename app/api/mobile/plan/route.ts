import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isExamId } from "@/lib/content/exams";
import { parsePlanInput, PLAN_ERRORS } from "@/lib/study-plan-input";
import { unauthorized } from "@/lib/mobile";

// POST { exam, examDate: "YYYY-MM-DD", weeklyHours } -> save the study plan for that exam.
export async function POST(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const exam = String(body?.exam ?? "");
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  const input = parsePlanInput(body?.examDate, body?.weeklyHours);
  if (!input.ok) return NextResponse.json({ error: PLAN_ERRORS[input.error] }, { status: 400 });
  await db.studyPlan.upsert({
    where: { userId_exam: { userId: user.id, exam } },
    create: { userId: user.id, exam, ...input.value },
    update: input.value,
  });
  return NextResponse.json({ ok: true });
}

// DELETE ?exam=fe-civil -> remove the study plan.
export async function DELETE(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const exam = new URL(req.url).searchParams.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  await db.studyPlan.deleteMany({ where: { userId: user.id, exam } });
  return NextResponse.json({ ok: true });
}
