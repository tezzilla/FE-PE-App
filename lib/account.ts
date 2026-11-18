import "server-only";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";
import { LIMITS, blockedFor, clear, hit, tooMany } from "./ratelimit";
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
