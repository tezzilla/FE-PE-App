import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { track } from "@/lib/funnel";
import { alertOwner, describeError } from "@/lib/alerts";
import { grantPass } from "@/lib/passes";
import { hadPassFor } from "@/lib/extensions";
import { automaticTaxEnabled, customerIdFor, fakeBillingAllowed, planPriceIds, stripe } from "@/lib/stripe";

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

// Tags these sessions in the Stripe Dashboard so this checkout flow can be tracked and compared.
const INTEGRATION_ID = "civilprep-web-subscribe-qhzkdmwa";

async function startCheckout(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const form = await req.formData();
  const plan = getPlan(String(form.get("plan")));
  if (!plan || plan.legacy) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  // Discounted extensions are only for people who have bought a pass for that exam.
  if (plan.extension && !(await hadPassFor(user.id, plan.exam))) {
    return NextResponse.redirect(new URL("/pricing?error=extension", req.url), 303);
  }

  if (fakeBillingAllowed()) {
    // Local dev only: activate instantly so paid features can be tested without Stripe.
    if (plan.kind === "pass") {
      await grantPass({ userId: user.id, planId: plan.id, checkoutSessionId: `fake_${Date.now()}`, paymentIntentId: null, amountTotal: plan.price * 100 });
    } else {
      const end = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      await db.user.update({ where: { id: user.id }, data: { plan: plan.id, subscriptionStatus: "active", currentPeriodEnd: end } });
    }
    return NextResponse.redirect(new URL("/dashboard?subscribed=1", req.url), 303);
  }

  const price = (await planPriceIds()).get(plan.id);
  if (!price) {
    console.error(`No active Stripe price with lookup key ${plan.lookupKey}`);
    return NextResponse.redirect(new URL("/pricing?error=unavailable", req.url), 303);
  }

  const customerId = (await customerIdFor(user, true))!;

  const tax = automaticTaxEnabled();
  const common = {
    customer: customerId,
    // No payment_method_types: Stripe picks eligible methods from Dashboard settings.
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, plan: plan.id },
    // Founding-member codes (and any other promotion codes) are entered on the Checkout page.
    allow_promotion_codes: true,
    // Lets firms paying for an employee add their business name and tax ID to the invoice.
    tax_id_collection: { enabled: true },
    // Save the name/address entered at checkout to the Customer (required for tax ID collection,
    // and the address Stripe Tax uses).
    customer_update: { name: "auto", address: "auto" },
    ...(tax ? { automatic_tax: { enabled: true }, billing_address_collection: "required" as const } : {}),
    integration_identifier: INTEGRATION_ID,
    custom_text: {
      submit: {
        message:
          plan.kind === "pass"
            ? `One-time payment for ${plan.days} days of access; it doesn't renew. Refund policy: ${appUrl()}/refunds`
            : `Renews monthly until you cancel. Cancel anytime from your dashboard and keep access through the paid month. Refund policy: ${appUrl()}/refunds`,
      },
    },
    success_url: `${appUrl()}/dashboard?subscribed=1`,
    cancel_url: `${appUrl()}/pricing`,
  } satisfies Partial<Stripe.Checkout.SessionCreateParams>;

  const params: Stripe.Checkout.SessionCreateParams =
    plan.kind === "pass"
      ? {
          ...common,
          mode: "payment",
          // A real invoice (PDF, in the invoice history) for one-time passes, e.g. for reimbursement.
          invoice_creation: { enabled: true, invoice_data: { description: `${plan.name}: ${plan.days} days of access` } },
          payment_intent_data: { metadata: { userId: user.id, plan: plan.id } },
        }
      : { ...common, mode: "subscription", subscription_data: { metadata: { userId: user.id } } };

  const session = await stripe().checkout.sessions.create(params);
  await track("checkout_start", { userId: user.id, plan: plan.id });
  return NextResponse.redirect(session.url!, 303);
}

export async function POST(req: Request) {
  try {
    return await startCheckout(req);
  } catch (e) {
    // Never show a raw error page (phones save it as a download); send the buyer back with a message.
    console.error("Checkout failed", e);
    await alertOwner("checkout-failed", "Checkout failed to start", ["A customer clicked Subscribe or Buy and was sent back to Pricing.", describeError(e)]);
    return NextResponse.redirect(new URL("/pricing?error=checkout", req.url), 303);
  }
}
