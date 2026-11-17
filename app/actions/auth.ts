"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type AuthState = { error?: string } | undefined;

function readCreds(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  return { email, password };
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const { email, password } = readCreds(form);
  const name = String(form.get("name") ?? "").trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "An account with that email already exists." };

  const user = await db.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 12) },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const { email, password } = readCreds(form);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
