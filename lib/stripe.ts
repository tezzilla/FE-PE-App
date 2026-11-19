import "server-only";
import Stripe from "stripe";
import { PLANS, SOLD_PLANS, stripePriceOverride, type PlanId } from "./plans";
import { PORTAL_CONFIG_APP } from "./stripe-portal";
import { db } from "./db";

import { STRIPE_API_VERSION } from "./stripe-version";
export { STRIPE_API_VERSION };

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
/** Forget cached price IDs, e.g. right after setup created new prices. */
export function clearPriceCache() {
  priceCache = null;
}

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
    const prices = await stripe().prices.list({ lookup_keys: needLookup.map((p) => p.lookupKey), active: true, limit: 100 });
    for (const plan of needLookup) {
      const price = prices.data.find((pr) => pr.lookup_key === plan.lookupKey);
      if (price) ids.set(plan.id, price.id);
    }
  }
  priceCache = { at: Date.now(), ids };
  return ids;
}

const productPlanCache = new Map<string, PlanId | null>();

/**
 * Which plan a subscription grants, from its Price: lookup key, known price ID, or finally the
 * Product's civilprep_plan tag. The Product fallback keeps grandfathered subscribers working after a
 * price change (the new price takes the lookup key; old subscriptions stay on the old price).
 * Price, not subscription metadata: the Customer Portal changes the price on a plan switch
 * but leaves metadata as it was at checkout.
 */
export async function planFromPrice(price: Stripe.Price | undefined): Promise<PlanId | null> {
  if (!price) return null;
  const byKey = PLANS.find((p) => p.lookupKey === price.lookup_key);
  if (byKey) return byKey.id;
  for (const [planId, id] of await planPriceIds()) if (id === price.id) return planId;
  const productId = typeof price.product === "string" ? price.product : price.product?.id;
  if (!productId) return null;
  if (!productPlanCache.has(productId)) {
    const product = await stripe().products.retrieve(productId);
    const tag = "deleted" in product ? undefined : product.metadata?.civilprep_plan;
    productPlanCache.set(productId, PLANS.find((p) => p.id === tag)?.id ?? null);
  }
  return productPlanCache.get(productId) ?? null;
}

/** True when Subscribe can work: local fake billing, or Stripe with a price found for every plan. */
export async function billingReady(): Promise<boolean> {
  return (await billingStatus()).ready;
}

export interface BillingStatus {
  ready: boolean;
  /** Plain-language problems, for the site owner (shown to reviewers only). Never contains secrets. */
  problems: string[];
  /** test / live / restricted-test / restricted-live, from the key prefix only. */
  keyMode: string | null;
  /** Names (not values) of environment variables containing "STRIPE". */
  stripeEnvNames: string[];
}

export function keyMode(key: string | undefined) {
  const m = /^(sk|rk)_(test|live)_/.exec(key ?? "");
  return m ? `${m[1] === "rk" ? "restricted-" : ""}${m[2]}` : key ? "unrecognized" : null;
}

/** Why Subscribe is or isn't available, so the owner can fix configuration without reading logs. */
export async function billingStatus(): Promise<BillingStatus> {
  // Only variables that actually have a value; empty ones count as missing.
  const stripeEnvNames = Object.keys(process.env).filter((k) => k.includes("STRIPE") && process.env[k]).sort();
  const mode = keyMode(process.env.STRIPE_SECRET_KEY);
  const base = { keyMode: mode, stripeEnvNames };
  if (fakeBillingAllowed()) return { ready: true, problems: [], ...base };

  const problems: string[] = [];
  const savedWebhook = await db.appSecret.count({ where: { name: { startsWith: `stripe_webhook_secret:${mode?.endsWith("live") ? "live" : "test"}:` } } }).catch(() => 0);
  if (!process.env.STRIPE_WEBHOOK_SECRET && !savedWebhook) {
    problems.push("No webhook signing secret, so paid subscriptions won't unlock content. Run \"Set up Stripe\" on this page (it saves the secret when it creates the endpoint), or copy it from Stripe > Developers > Webhooks into STRIPE_WEBHOOK_SECRET.");
  }
  if (!stripeEnabled()) {
    problems.unshift(
      "STRIPE_SECRET_KEY" in process.env
        ? "STRIPE_SECRET_KEY exists but is empty. Paste your secret key (sk_test_... or sk_live_...) as its value, then redeploy."
        : stripeEnvNames.length
        ? `No variable named exactly STRIPE_SECRET_KEY. Stripe-related variables found: ${stripeEnvNames.join(", ")}. Add STRIPE_SECRET_KEY with your secret key (it may be under one of those names).`
        : "No STRIPE_SECRET_KEY environment variable. Add it in Vercel > Settings > Environment Variables, then redeploy.",
    );
    return { ready: false, problems, ...base };
  }
  if (mode === "unrecognized") problems.unshift("STRIPE_SECRET_KEY doesn't look like a Stripe key (expected sk_test_, sk_live_, rk_test_ or rk_live_).");
  try {
    const ids = await planPriceIds();
    const missing = SOLD_PLANS.filter((p) => !ids.has(p.id)).map((p) => p.lookupKey);
    if (missing.length) {
      problems.unshift(
        `This Stripe account (${mode} mode) has no active price with lookup key ${missing.join(", ")}. Run "npm run stripe:setup" with this same key, or the key belongs to a different Stripe account or sandbox than the one set up.`,
      );
      return { ready: false, problems, ...base };
    }
  } catch (e) {
    const msg = e instanceof Stripe.errors.StripeError ? e.message : String(e);
    console.error("Stripe price lookup failed", e);
    problems.unshift(`Stripe rejected the request: ${msg.replace(/(sk|rk)_(test|live)_\w+/g, "[key]")}`);
    return { ready: false, problems, ...base };
  }
  return { ready: true, problems, ...base };
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

let foundingCache: { at: number; remaining: Map<string, number> } | null = null;

/**
 * Founding-member promotion codes that can still be redeemed, with spots left.
 * Empty when Stripe isn't configured or the codes are used up, so the offer simply disappears.
 */
export async function foundingSpots(): Promise<Map<string, number>> {
  if (!stripeEnabled()) return new Map();
  if (foundingCache && Date.now() - foundingCache.at < PRICE_CACHE_MS) return foundingCache.remaining;
  const remaining = new Map<string, number>();
  try {
    for (const plan of PLANS.filter((p) => p.founding && !p.legacy)) {
      const code = (await stripe().promotionCodes.list({ code: plan.founding!.code, active: true, limit: 1 })).data[0];
      if (!code) continue;
      const left = code.max_redemptions == null ? Infinity : code.max_redemptions - code.times_redeemed;
      if (left > 0) remaining.set(plan.founding!.code, left);
    }
  } catch (e) {
    console.error("Founding code lookup failed", e);
  }
  foundingCache = { at: Date.now(), remaining };
  return remaining;
}
