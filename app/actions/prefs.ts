"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EXAMS } from "@/lib/content/exams";

export async function setPeDepth(form: FormData) {
  const user = await requireUser();
  const depth = String(form.get("peDepth") ?? "");
  const valid = EXAMS["pe-civil"].topics.some((t) => t.slug === depth);
  await db.user.update({ where: { id: user.id }, data: { peDepth: valid ? depth : null } });
  const back = String(form.get("back") ?? "/exams/pe-civil");
  redirect(back.startsWith("/") && !back.startsWith("//") && !back.startsWith("/\\") ? back : "/exams/pe-civil");
}
