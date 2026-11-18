import "server-only";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";
import { createHash, randomBytes } from "node:crypto";
import { LIMITS, blockedFor, clear, clientIp, hit, tooMany } from "./ratelimit";
import { passwordChangedEmail, resetEmail, sendEmail } from "./email";
import { stripe, stripeEnabled } from "./stripe";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Check the current password before a sensitive change. Rate-limited per user. */
async function confirmPassword(user: User, password: unknown): Promise<string | null> {
  const key = `account:user:${user.id}`;
  const wait = await blockedFor(key, LIMITS.accountUser);
  if (wait) return tooMany(wait);
  if (!(await bcrypt.compare(String(password ?? ""), user.passwordHash))) {
    await hit(key, LIMITS.accountUser);
    return "Current password is incorrect.";
  }
  await clear(key);
  return null;
}

export async function updateName(user: User, nameIn: unknown): Promise<Result> {
  const name = String(nameIn ?? "").trim().slice(0, 80) || null;
  await db.user.update({ where: { id: user.id }, data: { name } });
  return { ok: true };
}

/** Change password and sign out every other session (web and app). Returns the updated user. */
export async function changePassword(user: User, current: unknown, next: unknown): Promise<Result<{ user: User }>> {
  const err = await confirmPassword(user, current);
  if (err) return { ok: false, error: err };
  const password = String(next ?? "");
  if (password.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } },
  });
  await sendEmail(passwordChangedEmail(updated.email));
  return { ok: true, user: updated };
}

/**
 * Permanently delete the account: cancel any Stripe subscription immediately (so billing stops),
 * then delete the user and, by cascade, their answers, mock exams and reports.
 * Stripe keeps its own payment records, as the Privacy Policy states.
 */
export async function deleteAccount(user: User, password: unknown): Promise<Result> {
  const err = await confirmPassword(user, password);
  if (err) return { ok: false, error: err };
  if (await db.templateReview.count({ where: { reviewerId: user.id } })) {
    return { ok: false, error: "Reviewer accounts keep an audit trail of approvals. Contact support to close this account." };
  }
  const live = user.stripeSubscriptionId && !["canceled", "incomplete_expired"].includes(user.subscriptionStatus ?? "");
  if (live && stripeEnabled()) {
    try {
      await stripe().subscriptions.cancel(user.stripeSubscriptionId!);
    } catch (e) {
      // Already canceled in Stripe is fine; anything else must stop the deletion so billing doesn't continue.
      const code = (e as { code?: string }).code;
      if (code !== "resource_missing") {
        console.error("Account deletion: subscription cancel failed", e);
        return { ok: false, error: "Couldn't cancel your subscription. Try again, or cancel it under Manage billing first." };
      }
    }
  }
  await db.user.delete({ where: { id: user.id } });
  return { ok: true };
}

/** Everything we store about the user, for "download my data". */
export async function exportData(user: User) {
  const [attempts, mockExams, reports, passes] = await Promise.all([
    db.attempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, omit: { userId: true } }),
    db.mockExam.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, omit: { userId: true } }),
    db.problemReport.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, omit: { userId: true } }),
    db.pass.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, omit: { userId: true } }),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      peDepth: user.peDepth,
      feAccessUntil: user.feAccessUntil,
      peAccessUntil: user.peAccessUntil,
    },
    answers: attempts,
    mockExams,
    problemReports: reports,
    passes,
  };
}

// ---- Password reset -----------------------------------------------------------------------

const RESET_TTL_MS = 60 * 60_000;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Start a password reset. Always behaves the same whether or not the email has an account,
 * so the form can't be used to discover who is registered.
 */
export async function requestPasswordReset(emailIn: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = String(emailIn ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  const ipKey = `reset:ip:${await clientIp()}`;
  const emailKey = `reset:email:${email}`;
  const wait = Math.max(await blockedFor(ipKey, LIMITS.resetIp), await blockedFor(emailKey, LIMITS.resetEmail));
  if (wait) return { ok: false, error: tooMany(wait) };
  await hit(ipKey, LIMITS.resetIp);
  await hit(emailKey, LIMITS.resetEmail);

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });
    await sendEmail(resetEmail(user.email, token));
  }
  return { ok: true };
}

/** Check a reset token without using it (for showing the form). */
export async function resetTokenValid(token: unknown) {
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(String(token ?? "")) } });
  return !!row && !row.usedAt && row.expiresAt.getTime() > Date.now();
}

/** Set a new password from a reset link. Signs out every existing session. Returns the user. */
export async function completePasswordReset(token: unknown, passwordIn: unknown): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const password = String(passwordIn ?? "");
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(String(token ?? "")) } });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }
  // Claim the token atomically so a link can't be used twice, even concurrently.
  const claimed = await db.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count === 0) return { ok: false, error: "This reset link was already used." };
  const user = await db.user.update({
    where: { id: row.userId },
    data: { passwordHash: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } },
  });
  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await clear(`login:email:${user.email}`); // a locked-out user can sign in right away
  await sendEmail(passwordChangedEmail(user.email));
  return { ok: true, user };
}
