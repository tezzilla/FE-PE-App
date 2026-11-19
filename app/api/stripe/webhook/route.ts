import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { track } from "@/lib/funnel";
import { appSecretsWithPrefix, WEBHOOK_SECRET_PREFIX } from "@/lib/app-secrets";
import { stripe } from "@/lib/stripe";
import { revokePassByPaymentIntent } from "@/lib/passes";
import { voidGiftByPaymentIntent } from "@/lib/gifts";
import { fulfillPass, idOf, syncSubscription } from "@/lib/stripe-fulfill";
import { alertOwner, describeError } from "@/lib/alerts";

// Handles the events listed in lib/stripe-events.ts.




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
  // Signing secrets: the one the setup button saved (newest first), then STRIPE_WEBHOOK_SECRET.
  const secrets = [...(await appSecretsWithPrefix(WEBHOOK_SECRET_PREFIX)), process.env.STRIPE_WEBHOOK_SECRET].filter((s): s is string => !!s);
  const sig = req.headers.get("stripe-signature");
  if (!secrets.length || !sig) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event | null = null;
  for (const secret of secrets) {
    try {
      event = stripe().webhooks.constructEvent(body, sig, secret);
      break;
    } catch {
      // try the next secret
    }
  }
  if (!event) {
    // Only headers shaped like Stripe's (timestamp + 64-hex signature) alert; random probes don't.
    if (/(^|,)t=\d+,v1=[0-9a-f]{64}/.test(sig)) await alertOwner("webhook-signature", "Stripe webhook signature didn't verify", [
      "A request to /api/stripe/webhook carried a Stripe signature that none of the saved signing secrets accept.",
      "If this repeats, payments aren't unlocking accounts. Re-run \"Set up Stripe\" on the setup page, or update STRIPE_WEBHOOK_SECRET.",
    ]);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        if (s.payment_status === "paid" || s.payment_status === "no_payment_required") {
          await track("purchase", { userId: s.client_reference_id ?? s.metadata?.userId ?? null, plan: s.metadata?.gift ? `gift:${s.metadata?.plan}` : (s.metadata?.plan ?? null), dedupeId: s.id });
        }
        if (s.mode === "subscription" && s.subscription) await syncSubscription(idOf(s.subscription)!);
        if (s.mode === "payment") await fulfillPass(s.id);
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
        // A fully refunded pass stops granting access. (Partial refunds keep the pass.)
        if (c.refunded && idOf(c.payment_intent)) {
          await voidGiftByPaymentIntent(idOf(c.payment_intent)!); // unredeemed gift codes stop working
          const revoked = await revokePassByPaymentIntent(idOf(c.payment_intent)!);
          if (revoked) console.warn(JSON.stringify({ stripeEvent: "pass.revoked", pass: revoked.id, user: revoked.userId }));
        }
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
    await alertOwner("webhook-failed", `Stripe webhook failed: ${event.type}`, [
      `Event ${event.id} (${event.type}) failed. Stripe will retry it, and the daily reconciliation repairs missed payments.`,
      describeError(e),
    ]);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
