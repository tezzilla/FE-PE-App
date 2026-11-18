"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireReviewer } from "@/lib/auth";

async function closeReport(form: FormData, status: "resolved" | "dismissed") {
  await requireReviewer();
  // A card groups every open report about one question or problem type; close them together.
  const ids = String(form.get("ids") ?? "").split(",").filter(Boolean).slice(0, 200);
  const note = String(form.get("note") ?? "").trim() || null;
  await db.problemReport.updateMany({
    where: { id: { in: ids }, status: "open" },
    data: { status, resolverNote: note, resolvedAt: new Date() },
  });
  revalidatePath("/review/reports");
  revalidatePath("/review");
}

// One action per button: a shared action can't rely on the clicked button's value being submitted.
export async function resolveReport(form: FormData) {
  await closeReport(form, "resolved");
}

export async function dismissReport(form: FormData) {
  await closeReport(form, "dismissed");
}
