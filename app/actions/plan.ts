"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isExamId } from "@/lib/content/exams";

const safeBack = (v: FormDataEntryValue | null, exam: string) => {
  const b = String(v ?? "");
  return b.startsWith("/") && !b.startsWith("//") ? b : `/exams/${exam}`;
};

export async function saveStudyPlan(form: FormData) {
  const user = await requireUser();
  const exam = String(form.get("exam"));
  if (!isExamId(exam)) redirect("/dashboard");
  const back = safeBack(form.get("back"), exam);
  const date = new Date(`${String(form.get("examDate"))}T12:00:00`);
  const hours = Math.round(Number(form.get("weeklyHours")));
  const now = Date.now();
  if (Number.isNaN(date.getTime()) || date.getTime() < now || date.getTime() > now + 2 * 365 * 24 * 3600 * 1000) {
    redirect(`${back}${back.includes("?") ? "&" : "?"}planError=date`);
  }
  if (!Number.isFinite(hours) || hours < 1 || hours > 60) redirect(`${back}${back.includes("?") ? "&" : "?"}planError=hours`);
  await db.studyPlan.upsert({
    where: { userId_exam: { userId: user.id, exam } },
    create: { userId: user.id, exam, examDate: date, weeklyHours: hours },
    update: { examDate: date, weeklyHours: hours },
  });
  redirect(back);
}

export async function deleteStudyPlan(form: FormData) {
  const user = await requireUser();
  const exam = String(form.get("exam"));
  await db.studyPlan.deleteMany({ where: { userId: user.id, exam } });
  redirect(safeBack(form.get("back"), exam));
}
