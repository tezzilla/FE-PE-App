"use server";

import { redirect } from "next/navigation";
import { requestSampleSet } from "@/lib/leads";

export type LeadState = { error?: string } | undefined;

export async function requestSample(_: LeadState, form: FormData): Promise<LeadState> {
  const r = await requestSampleSet(form.get("email"), form.get("exam"), form.get("optIn") === "on");
  if ("error" in r) return { error: r.error };
  redirect(r.url.replace(/^https?:\/\/[^/]+/, ""));
}
