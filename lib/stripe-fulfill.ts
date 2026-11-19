import "server-only";
import { db } from "./db";
import { planFromPrice, stripe } from "./stripe";
import { getPlan } from "./plans";
import { grantPass } from "./passes";
import { fulfillGift } from "./gifts";
import { alertOwner } from "./alerts";

// Turning Stripe payments into access. Used by the webhook and by the daily reconciliation, which
// repairs anything a missed or failed webhook left behind. Both paths are idempotent.

export const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);

/**
 * Re-read the subscription from Stripe and mirror it onto the user.
 * Fetching (rather than trusting the event payload) keeps us correct when events arrive out of order.
 * The user is found through the Customer ID, Stripe's own ownership link, not through metadata.
 */
export async function syncSubscription(subscriptionId: string) {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end;
  const plan = await planFromPrice(item?.price);
  if (!plan) console.error(`Subscription ${sub.id} has a price no plan maps to: ${item?.price.id}`);
  const r = await db.user.updateMany({
    where: { stripeCustomerId: idOf(sub.customer) ?? "" },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      plan,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
  if (r.count === 0) console.error(`No user for Stripe customer ${idOf(sub.customer)} (subscription ${sub.id})`);
}

/**
 * Grant a one-time pass once its Checkout Session is paid. The plan comes from the Price that was
 * actually paid (not from metadata), and the user from the Stripe Customer (fallback: our user id).
 */
export async function fulfillPass(sessionId: string) {
  const s = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
  if (s.mode !== "payment" || s.payment_status !== "paid") return; // async methods: wait for async_payment_succeeded
  const planId = await planFromPrice(s.line_items?.data[0]?.price ?? undefined);
  const plan = getPlan(planId);
  if (!plan || plan.kind !== "pass") {
    console.error(`Paid session ${s.id} isn't for a pass plan (price maps to ${planId})`);
    await alertOwner("fulfill-plan", "Paid checkout didn't match a plan", [`Session ${s.id}: its price maps to ${planId ?? "no plan"}. Check the session in Stripe and grant access by hand if needed.`]);
    return;
  }
  // A gift: create a code and email it; the recipient redeems it on their own account.
  if (s.metadata?.gift === "1") {
    await fulfillGift(s, plan.id);
    return;
  }
  const customerId = idOf(s.customer);
  const user =
    (customerId && (await db.user.findUnique({ where: { stripeCustomerId: customerId } }))) ||
    (s.client_reference_id && (await db.user.findUnique({ where: { id: s.client_reference_id } })));
  if (!user) {
    console.error(`No user for paid pass session ${s.id} (customer ${customerId})`);
    await alertOwner("fulfill-user", "Paid pass with no matching account", [`Session ${s.id} (customer ${customerId}, ${s.customer_details?.email ?? "no email"}) was paid, but no CivilPrep account matches. Find the buyer and grant access, or refund.`]);
    return;
  }
  await grantPass({
    userId: user.id,
    planId: plan.id,
    checkoutSessionId: s.id,
    paymentIntentId: idOf(s.payment_intent),
    amountTotal: s.amount_total ?? 0,
  });
}
