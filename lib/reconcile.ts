import "server-only";
import type Stripe from "stripe";
import { db } from "./db";
import { stripe, stripeEnabled } from "./stripe";
import { fulfillPass, idOf, syncSubscription } from "./stripe-fulfill";

// Daily safety net for webhooks: every Checkout Session Stripe completed in the last few days must have
// unlocked something here (a pass, a gift code, or a subscription on the buyer's account). Anything
// missing is repaired with the same code the webhook uses; anything that can't be repaired is reported.

const LOOKBACK_DAYS = 3;

export type ReconcileResult = { checked: number; repaired: string[]; problems: string[] };

async function unlocked(s: { id: string; mode: string | null; subscription: unknown; metadata: Record<string, string> | null }) {
  if (s.mode === "subscription") {
    const sub = idOf(s.subscription as string | { id: string } | null);
    return !!sub && (await db.user.count({ where: { stripeSubscriptionId: sub } })) > 0;
  }
  if (s.metadata?.gift === "1") return (await db.giftCode.count({ where: { checkoutSessionId: s.id } })) > 0;
  return (await db.pass.count({ where: { checkoutSessionId: s.id } })) > 0;
}

/** `client` is for tests; production uses the configured Stripe client. */
export async function reconcilePayments(now = new Date(), client?: Pick<Stripe, "checkout">): Promise<ReconcileResult> {
  const result: ReconcileResult = { checked: 0, repaired: [], problems: [] };
  if (!client && !stripeEnabled()) return result;
  const since = Math.floor(now.getTime() / 1000) - LOOKBACK_DAYS * 86400;
  for await (const s of (client ?? stripe()).checkout.sessions.list({ created: { gte: since }, status: "complete", limit: 100 })) {
    // Unpaid sessions (e.g. a bank transfer still pending) are handled when the payment succeeds.
    if (s.payment_status !== "paid" && s.payment_status !== "no_payment_required") continue;
    result.checked++;
    if (await unlocked(s)) continue;
    const what = `${s.mode} session ${s.id} (${s.customer_details?.email ?? "no email"}, $${((s.amount_total ?? 0) / 100).toFixed(2)})`;
    try {
      if (s.mode === "subscription") {
        const sub = idOf(s.subscription);
        if (sub) await syncSubscription(sub);
      } else {
        await fulfillPass(s.id);
      }
      if (await unlocked(s)) result.repaired.push(what);
      else result.problems.push(`${what}: still not unlocked; no matching account was found`);
    } catch (e) {
      result.problems.push(`${what}: repair failed (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  return result;
}
