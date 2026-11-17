import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan, stripePriceId } from "@/lib/plans";
import { fakeBillingAllowed, stripe } from "@/lib/stripe";

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const form = await req.formData();
  const plan = getPlan(String(form.get("plan")));
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  if (fakeBillingAllowed()) {
    // Local dev only: activate instantly so paid features can be tested without Stripe.
    const end = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await db.user.update({
      where: { id: user.id },
      data: { plan: plan.id, subscriptionStatus: "active", currentPeriodEnd: end },
    });
    return NextResponse.redirect(new URL("/dashboard?subscribed=1", req.url), 303);
  }

  const price = stripePriceId(plan);
  if (!price) return NextResponse.json({ error: `Missing ${plan.stripePriceEnv}` }, { status: 500 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, plan: plan.id },
    subscription_data: { metadata: { userId: user.id, plan: plan.id } },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/dashboard?subscribed=1`,
    cancel_url: `${appUrl()}/pricing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
