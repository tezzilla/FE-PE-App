import "server-only";
import Stripe from "stripe";

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Fake billing lets you test paid features locally without Stripe. Never on in production. */
export function fakeBillingAllowed() {
  return !stripeEnabled() && process.env.NODE_ENV !== "production";
}

/** True when the Subscribe buttons can work: real Stripe with prices set, or local fake billing. */
export function billingReady(priceIds: (string | undefined)[]) {
  return fakeBillingAllowed() || (stripeEnabled() && priceIds.every(Boolean));
}
