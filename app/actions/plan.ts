"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isExamId } from "@/lib/content/exams";
import { parsePlanInput } from "@/lib/study-plan-input";

const safeBack = (v: FormDataEntryValue | null, exam: string) => {
  const b = String(v ?? "");
  return b.startsWith("/") && !b.startsWith("//") ? b : `/exams/${exam}`;
};

export async function saveStudyPlan(form: FormData) {
  const user = await requireUser();
  const exam = String(form.get("exam"));
  if (!isExamId(exam)) redirect("/dashboard");
  const back = safeBack(form.get("back"), exam);
  const input = parsePlanInput(form.get("examDate"), form.get("weeklyHours"));
  if (!input.ok) redirect(`${back}${back.includes("?") ? "&" : "?"}planError=${input.error}`);
  const { examDate: date, weeklyHours: hours } = input.value;
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
