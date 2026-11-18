"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { createAccount, verifyCredentials } from "@/lib/accounts";

export type AuthState = { error?: string } | undefined;

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const r = await createAccount(form.get("email"), form.get("password"), form.get("name"));
  if ("error" in r) return { error: r.error };
  await createSession(r.user);
  redirect("/dashboard");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const r = await verifyCredentials(form.get("email"), form.get("password"));
  if ("error" in r) return { error: r.error };
  await createSession(r.user);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
