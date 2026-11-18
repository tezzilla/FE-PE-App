"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { changePassword, deleteAccount, updateName } from "@/lib/account";
import { db } from "@/lib/db";

export type FormState = { error?: string; done?: string } | undefined;

export async function saveName(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  await updateName(user, form.get("name"));
  revalidatePath("/account");
  return { done: "Saved." };
}

export async function savePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (form.get("next") !== form.get("confirm")) return { error: "New passwords don't match." };
  const r = await changePassword(user, form.get("current"), form.get("next"));
  if (!r.ok) return { error: r.error };
  await createSession(r.user); // keep this browser signed in with a fresh token
  return { done: "Password changed. You've been signed out on your other devices." };
}

export async function removeAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (String(form.get("confirm")).trim().toUpperCase() !== "DELETE") return { error: 'Type DELETE to confirm.' };
  const r = await deleteAccount(user, form.get("password"));
  if (!r.ok) return { error: r.error };
  await destroySession();
  redirect("/?deleted=1");
}

export async function setWeeklyEmail(form: FormData) {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { weeklyEmail: form.get("weeklyEmail") === "on" } });
  revalidatePath("/account");
}
