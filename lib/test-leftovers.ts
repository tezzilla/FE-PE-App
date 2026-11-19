import "server-only";
import Stripe from "stripe";
import { db } from "./db";
import { recomputeAccess } from "./passes";
import { stripe } from "./stripe";

// After switching to a live Stripe key, purchases made while testing in the sandbox still grant access
// in our database. This finds them (sandbox Checkout Sessions start with cs_test_; subscriptions and
// customers are checked against the live account) and, on request, removes the access they grant.

export type Leftovers = {
  passes: { id: string; email: string; plan: string }[];
  gifts: { id: string; code: string; plan: string; redeemed: boolean }[];
  subscriptions: { userId: string; email: string; plan: string | null; status: string | null }[];
  customers: { userId: string; email: string }[];
  checked: number;
};

const MAX_API_CHECKS = 300;
const missing = (e: unknown) => e instanceof Stripe.errors.StripeInvalidRequestError && e.code === "resource_missing";

/** `checkStripe: false` skips the subscription and customer lookups (passes and gifts need no API calls). */
export async function findLeftovers({ checkStripe = true } = {}): Promise<Leftovers> {
  const testGifts = await db.giftCode.findMany({ where: { checkoutSessionId: { startsWith: "cs_test_" } } });
  const testGiftCodes = new Set(testGifts.map((g) => `gift:${g.code}`));
  const passRows = await db.pass.findMany({
    where: { revokedAt: null, OR: [{ checkoutSessionId: { startsWith: "cs_test_" } }, { checkoutSessionId: { in: [...testGiftCodes] } }] },
    include: { user: { select: { email: true } } },
  });

  let checked = 0;
  const subscriptions: Leftovers["subscriptions"] = [];
  const customers: Leftovers["customers"] = [];
  const users = !checkStripe ? [] : await db.user.findMany({
    where: { OR: [{ stripeSubscriptionId: { not: null } }, { stripeCustomerId: { not: null } }] },
    select: { id: true, email: true, plan: true, subscriptionStatus: true, stripeSubscriptionId: true, stripeCustomerId: true },
    take: MAX_API_CHECKS,
  });
  for (const u of users) {
    if (checked >= MAX_API_CHECKS) break;
    if (u.stripeSubscriptionId) {
      checked++;
      try {
        await stripe().subscriptions.retrieve(u.stripeSubscriptionId);
      } catch (e) {
        if (!missing(e)) throw e;
        subscriptions.push({ userId: u.id, email: u.email, plan: u.plan, status: u.subscriptionStatus });
      }
    }
    if (u.stripeCustomerId) {
      checked++;
      try {
        await stripe().customers.retrieve(u.stripeCustomerId);
      } catch (e) {
        if (!missing(e)) throw e;
        customers.push({ userId: u.id, email: u.email });
      }
    }
  }

  return {
    passes: passRows.map((p) => ({ id: p.id, email: p.user.email, plan: p.plan })),
    gifts: testGifts.filter((g) => !g.voidedAt).map((g) => ({ id: g.id, code: g.code, plan: g.plan, redeemed: !!g.redeemedAt })),
    subscriptions,
    customers,
    checked,
  };
}

/** Remove the access sandbox purchases grant. Nothing is deleted: passes are revoked and gifts voided. */
export async function cleanLeftovers(l: Leftovers) {
  const now = new Date();
  const touched = new Set<string>();
  for (const p of l.passes) {
    const pass = await db.pass.update({ where: { id: p.id }, data: { revokedAt: now } });
    touched.add(pass.userId);
  }
  for (const g of l.gifts) await db.giftCode.update({ where: { id: g.id }, data: { voidedAt: now } });
  for (const s of l.subscriptions) {
    await db.user.update({ where: { id: s.userId }, data: { stripeSubscriptionId: null, subscriptionStatus: null, plan: null, currentPeriodEnd: null } });
  }
  for (const c of l.customers) await db.user.update({ where: { id: c.userId }, data: { stripeCustomerId: null } });
  for (const id of touched) await recomputeAccess(id);
}
