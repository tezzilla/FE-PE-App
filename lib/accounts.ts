import "server-only";
import { track } from "./funnel";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";
import { sendEmail, welcomeEmail } from "./email";
import { LIMITS, blockedFor, clear, clientIp, hit, tooMany } from "./ratelimit";

export type AccountResult = { user: User } | { error: string; rateLimited?: boolean };

export function normalizeEmail(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export async function createAccount(emailIn: unknown, passwordIn: unknown, nameIn?: unknown): Promise<AccountResult> {
  const ipKey = `signup:ip:${await clientIp()}`;
  const wait = await blockedFor(ipKey, LIMITS.signupIp);
  if (wait) return { error: tooMany(wait), rateLimited: true };
  await hit(ipKey, LIMITS.signupIp);
  const email = normalizeEmail(emailIn);
  const password = String(passwordIn ?? "");
  const name = String(nameIn ?? "").trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "An account with that email already exists." };
  const user = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 12) } });
  await sendEmail(welcomeEmail(user.email));
  await track("signup", { userId: user.id });
  return { user };
}

export async function verifyCredentials(emailIn: unknown, passwordIn: unknown): Promise<AccountResult> {
  const email = normalizeEmail(emailIn);
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${await clientIp()}`;
  const wait = Math.max(await blockedFor(emailKey, LIMITS.loginEmail), await blockedFor(ipKey, LIMITS.loginIp));
  if (wait) return { error: tooMany(wait), rateLimited: true };
  await hit(ipKey, LIMITS.loginIp);

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(String(passwordIn ?? ""), user.passwordHash))) {
    await hit(emailKey, LIMITS.loginEmail);
    return { error: "Incorrect email or password." };
  }
  await clear(emailKey);
  return { user };
}
