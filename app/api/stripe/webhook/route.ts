import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { planFromPrice, stripe } from "@/lib/stripe";

// Handles the events listed in lib/stripe-events.ts.


const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);

/**
 * Re-read the subscription from Stripe and mirror it onto the user.
 * Fetching (rather than trusting the event payload) keeps us correct when events arrive out of order.
 * The user is found through the Customer ID, Stripe's own ownership link, not through metadata.
 */
async function syncSubscription(subscriptionId: string) {
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

function subscriptionIdOfInvoice(inv: Stripe.Invoice): string | null {
  return inv.parent?.type === "subscription_details" ? idOf(inv.parent.subscription_details?.subscription) : null;
}

/**
 * Subscriptions behind a PaymentIntent, via invoice payments (API 2025-03-31.basil and later).
 * See docs.stripe.com/billing/subscriptions/webhooks#refund-events.
 */
async function subscriptionsForPaymentIntent(paymentIntentId: string): Promise<string[]> {
  const subs = new Set<string>();
  for await (const ip of stripe().invoicePayments.list({
    payment: { type: "payment_intent", payment_intent: paymentIntentId },
    status: "paid",
    limit: 100,
  })) {
    const invoice = await stripe().invoices.retrieve(idOf(ip.invoice)!);
    const sub = subscriptionIdOfInvoice(invoice);
    if (sub) subs.add(sub);
  }
  return [...subs];
}

async function paymentIntentOf(paymentIntent: string | Stripe.PaymentIntent | null | undefined, charge: string | Stripe.Charge) {
  return idOf(paymentIntent) ?? idOf((await stripe().charges.retrieve(idOf(charge)!)).payment_intent);
}

/**
 * Refunds, disputes and fraud warnings: resolve the subscription and the user and log it, so it shows
 * in the host's logs. Stripe also emails the account owner about disputes. Respond to disputes in the
 * Stripe Dashboard; for early fraud warnings, consider refunding and canceling to avoid a dispute.
 */
async function flagRisk(kind: string, objectId: string, paymentIntentId: string | null) {
  const subs = paymentIntentId ? await subscriptionsForPaymentIntent(paymentIntentId) : [];
  const users = subs.length
    ? await db.user.findMany({ where: { stripeSubscriptionId: { in: subs } }, select: { id: true } })
    : [];
  console.warn(JSON.stringify({ stripeRisk: kind, objectId, paymentIntentId, subscriptions: subs, users: users.map((u) => u.id) }));
  for (const s of subs) await syncSubscription(s); // e.g. a refund may come with a cancellation
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.mode === "subscription" && s.subscription) await syncSubscription(idOf(s.subscription)!);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id);
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        // Renewals and failed payments: the subscription's status (active / past_due) decides access.
        const sub = subscriptionIdOfInvoice(event.data.object);
        if (sub) await syncSubscription(sub);
        if (event.type === "invoice.payment_failed") {
          console.warn(JSON.stringify({ stripeEvent: event.type, invoice: event.data.object.id, subscription: sub }));
        }
        break;
      }
      case "charge.refunded": {
        const c = event.data.object;
        await flagRisk(event.type, c.id, idOf(c.payment_intent));
        break;
      }
      case "charge.dispute.created":
      case "radar.early_fraud_warning.created": {
        const o = event.data.object;
        await flagRisk(event.type, o.id, await paymentIntentOf(o.payment_intent, o.charge));
        break;
      }
    }
  } catch (e) {
    // A 500 makes Stripe retry the event later, so a transient failure doesn't lose a payment update.
    console.error(`Stripe webhook ${event.type} ${event.id} failed`, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
