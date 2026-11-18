"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { createAccount, verifyCredentials } from "@/lib/accounts";

export type AuthState = { error?: string } | undefined;

/** Only same-site paths ("/redeem?code=…"), never another site ("//evil.com", "https://…"). */
function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/dashboard";
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const r = await createAccount(form.get("email"), form.get("password"), form.get("name"));
  if ("error" in r) return { error: r.error };
  await createSession(r.user);
  redirect(safeNext(form.get("next")));
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const r = await verifyCredentials(form.get("email"), form.get("password"));
  if ("error" in r) return { error: r.error };
  await createSession(r.user);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
