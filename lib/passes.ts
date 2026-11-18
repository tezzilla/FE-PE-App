import "server-only";
import type { ExamId } from "./content/types";
import { db } from "./db";
import { getPlan } from "./plans";

const DAY = 24 * 3600 * 1000;

/**
 * Record a paid pass and extend the user's access. Idempotent per Checkout Session: Stripe can
 * deliver the same event more than once, and a repeat must not add days again.
 * Passes stack: buying another pass while one is active extends from its end date.
 */
export async function grantPass(args: {
  userId: string;
  planId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  amountTotal: number;
}) {
  const plan = getPlan(args.planId);
  if (!plan || plan.kind !== "pass" || !plan.days) throw new Error(`Not a pass plan: ${args.planId}`);
  if (await db.pass.findUnique({ where: { checkoutSessionId: args.checkoutSessionId } })) return false;

  const user = await db.user.findUniqueOrThrow({ where: { id: args.userId } });
  const now = Date.now();
  // Start after any access this pass would overlap with, for the pass's main exam.
  const current = plan.exam === "pe-civil" ? user.peAccessUntil : user.feAccessUntil;
  const start = new Date(Math.max(now, current?.getTime() ?? 0));
  const expires = new Date(start.getTime() + plan.days * DAY);

  try {
    await db.pass.create({
      data: {
        userId: user.id,
        plan: plan.id,
        checkoutSessionId: args.checkoutSessionId,
        paymentIntentId: args.paymentIntentId,
        amountTotal: args.amountTotal,
        startsAt: start,
        expiresAt: expires,
      },
    });
  } catch (e) {
    // A concurrent delivery of the same event created it first.
    if ((e as { code?: string }).code === "P2002") return false;
    throw e;
  }
  await recomputeAccess(user.id);
  return true;
}

/** Revoke the pass bought with this PaymentIntent (e.g. after a full refund). */
export async function revokePassByPaymentIntent(paymentIntentId: string) {
  const pass = await db.pass.findUnique({ where: { paymentIntentId } });
  if (!pass || pass.revokedAt) return null;
  await db.pass.update({ where: { id: pass.id }, data: { revokedAt: new Date() } });
  await recomputeAccess(pass.userId);
  return pass;
}

/** Per-exam access end = latest expiry among the user's unrevoked passes that cover that exam. */
export async function recomputeAccess(userId: string) {
  const passes = await db.pass.findMany({ where: { userId, revokedAt: null } });
  const until = (exam: ExamId) => {
    const ends = passes.filter((p) => getPlan(p.plan)?.exams.includes(exam)).map((p) => p.expiresAt.getTime());
    return ends.length ? new Date(Math.max(...ends)) : null;
  };
  await db.user.update({
    where: { id: userId },
    data: { feAccessUntil: until("fe-civil"), peAccessUntil: until("pe-civil") },
  });
}
