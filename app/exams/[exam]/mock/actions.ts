"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { isExamId } from "@/lib/content/exams";
import { buildFullExam } from "@/lib/exam-builder";

/** Pick a full exam and save it as in progress (replacing any unfinished one for this exam). */
export async function startFullExam(form: FormData) {
  const user = await requireUser();
  const exam = String(form.get("exam"));
  if (!isExamId(exam) || !hasExamAccess(user, exam)) redirect("/pricing");
  const { sessions } = await buildFullExam(user, exam);
  await db.mockExam.deleteMany({ where: { userId: user.id, exam, status: "in_progress" } });
  await db.mockExam.create({
    data: {
      userId: user.id,
      exam,
      status: "in_progress",
      total: sessions.reduce((a, s) => a + s.length, 0),
      correct: 0,
      durationS: 0,
      sessions: JSON.stringify(sessions.map((s) => s.map((q) => q.id))),
    },
  });
  redirect(`/exams/${exam}/mock`);
}

export async function discardFullExam(form: FormData) {
  const user = await requireUser();
  const exam = String(form.get("exam"));
  await db.mockExam.deleteMany({ where: { userId: user.id, exam, status: "in_progress" } });
  redirect(`/exams/${exam}/mock`);
}
