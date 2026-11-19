import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertOwner, describeError } from "@/lib/alerts";
import { customerIdFor, fakeBillingAllowed, portalConfigurationId, stripe } from "@/lib/stripe";

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  if (fakeBillingAllowed()) {
    // Local dev stand-in for the Stripe portal: cancel the fake subscription.
    await db.user.update({ where: { id: user.id }, data: { subscriptionStatus: "canceled", plan: null } });
    return NextResponse.redirect(new URL("/pricing", req.url), 303);
  }

  try {
    const customer = await customerIdFor(user, false);
    if (!customer) return NextResponse.redirect(new URL("/pricing", req.url), 303);
    const configuration = await portalConfigurationId();
    const session = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${appUrl()}/dashboard`,
      ...(configuration ? { configuration } : {}),
    });
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("Billing portal failed", e);
    await alertOwner("portal-failed", "Billing portal failed to open", ["A customer clicked Manage billing and was sent back to Pricing.", describeError(e)]);
    return NextResponse.redirect(new URL("/pricing?error=checkout", req.url), 303);
  }
}
