"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { completePasswordReset, requestPasswordReset } from "@/lib/account";

export type ResetState = { error?: string; sent?: boolean } | undefined;

export async function requestReset(_: ResetState, form: FormData): Promise<ResetState> {
  const r = await requestPasswordReset(form.get("email"));
  return r.ok ? { sent: true } : { error: r.error };
}

export async function chooseNewPassword(_: ResetState, form: FormData): Promise<ResetState> {
  if (form.get("password") !== form.get("confirm")) return { error: "Passwords don't match." };
  const r = await completePasswordReset(form.get("token"), form.get("password"));
  if (!r.ok) return { error: r.error };
  await createSession(r.user);
  redirect("/dashboard?reset=1");
}
