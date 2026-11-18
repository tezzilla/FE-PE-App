import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { grantPass } from "@/lib/passes";
import { automaticTaxEnabled, fakeBillingAllowed, planPriceIds, stripe } from "@/lib/stripe";

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

// Tags these sessions in the Stripe Dashboard so this checkout flow can be tracked and compared.
const INTEGRATION_ID = "civilprep-web-subscribe-qhzkdmwa";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const form = await req.formData();
  const plan = getPlan(String(form.get("plan")));
  if (!plan || plan.legacy) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

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

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create(
      { email: user.email, name: user.name ?? undefined, metadata: { userId: user.id } },
      { idempotencyKey: `customer-${user.id}` }, // a double-click can't create two customers
    );
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

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
  return NextResponse.redirect(session.url!, 303);
}
