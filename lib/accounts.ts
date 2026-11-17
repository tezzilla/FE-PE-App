import "server-only";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";

export type AccountResult = { user: User } | { error: string };

export function normalizeEmail(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export async function createAccount(emailIn: unknown, passwordIn: unknown, nameIn?: unknown): Promise<AccountResult> {
  const email = normalizeEmail(emailIn);
  const password = String(passwordIn ?? "");
  const name = String(nameIn ?? "").trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "An account with that email already exists." };
  const user = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 12) } });
  return { user };
}

export async function verifyCredentials(emailIn: unknown, passwordIn: unknown): Promise<AccountResult> {
  const user = await db.user.findUnique({ where: { email: normalizeEmail(emailIn) } });
  if (!user || !(await bcrypt.compare(String(passwordIn ?? ""), user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  return { user };
}
