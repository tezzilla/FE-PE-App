import "server-only";
import Stripe from "stripe";
import { PLANS, stripePriceOverride, type PlanId } from "./plans";
import { PORTAL_CONFIG_APP } from "./stripe-portal";

/** Pinned API version. Upgrade deliberately (see .agents/skills/upgrade-stripe). */
export const STRIPE_API_VERSION = "2026-10-28.endive";

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
    // fetch-based client: works on Vercel and in environments that route traffic through an HTTPS proxy.
    httpClient: Stripe.createFetchHttpClient(),
  });
  return client;
}

/** Fake billing lets you test paid features locally without Stripe. Never on in production. */
export function fakeBillingAllowed() {
  return !stripeEnabled() && process.env.NODE_ENV !== "production";
}

/**
 * Stripe Tax on Checkout. Off until the account's Tax settings are active (head office address set).
 * Even when on, Stripe collects tax only where you have an active registration.
 */
export function automaticTaxEnabled() {
  return process.env.STRIPE_AUTOMATIC_TAX === "true";
}

// ---- Plan <-> Price mapping ----------------------------------------------------------------

let priceCache: { at: number; ids: Map<PlanId, string> } | null = null;
const PRICE_CACHE_MS = 5 * 60_000;

/** Price ID for every plan: env override, else the active Price with the plan's lookup key. */
export async function planPriceIds(): Promise<Map<PlanId, string>> {
  if (priceCache && Date.now() - priceCache.at < PRICE_CACHE_MS) return priceCache.ids;
  const ids = new Map<PlanId, string>();
  const needLookup = PLANS.filter((p) => {
    const override = stripePriceOverride(p);
    if (override) ids.set(p.id, override);
    return !override;
  });
  if (needLookup.length) {
    const prices = await stripe().prices.list({ lookup_keys: needLookup.map((p) => p.lookupKey), active: true, limit: 10 });
    for (const plan of needLookup) {
      const price = prices.data.find((pr) => pr.lookup_key === plan.lookupKey);
      if (price) ids.set(plan.id, price.id);
    }
  }
  priceCache = { at: Date.now(), ids };
  return ids;
}

/**
 * Which plan a subscription grants, from its Price (lookup key or known ID).
 * Price, not subscription metadata: the Customer Portal changes the price on a plan switch
 * but leaves metadata as it was at checkout.
 */
export async function planFromPrice(price: Stripe.Price | undefined): Promise<PlanId | null> {
  if (!price) return null;
  const byKey = PLANS.find((p) => p.lookupKey === price.lookup_key);
  if (byKey) return byKey.id;
  for (const [planId, id] of await planPriceIds()) if (id === price.id) return planId;
  return null;
}

/** True when Subscribe can work: local fake billing, or Stripe with a price found for every plan. */
export async function billingReady(): Promise<boolean> {
  if (fakeBillingAllowed()) return true;
  if (!stripeEnabled()) return false;
  try {
    return (await planPriceIds()).size === PLANS.length;
  } catch (e) {
    console.error("Stripe price lookup failed", e);
    return false;
  }
}

let portalConfig: { at: number; id: string | null } | null = null;

/** Our Customer Portal configuration (from scripts/stripe-setup.ts), or null to use the account default. */
export async function portalConfigurationId(): Promise<string | null> {
  if (portalConfig && Date.now() - portalConfig.at < PRICE_CACHE_MS) return portalConfig.id;
  const configs = await stripe().billingPortal.configurations.list({ active: true, limit: 100 });
  const id = configs.data.find((c) => c.metadata?.app === PORTAL_CONFIG_APP)?.id ?? null;
  portalConfig = { at: Date.now(), id };
  return id;
}
