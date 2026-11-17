// Creates or updates CivilPrep's Stripe configuration from the code: products and prices for every
// plan, the webhook endpoint, and the Customer Portal. Safe to re-run (it updates in place).
//
//   STRIPE_SECRET_KEY=sk_test_... APP_URL=https://your-site npx tsx scripts/stripe-setup.ts
//
// Live mode requires --live. The webhook signing secret is never printed: reveal it in the
// Stripe Dashboard (Developers > Webhooks > your endpoint) and put it in STRIPE_WEBHOOK_SECRET.
import Stripe from "stripe";
import { PLANS } from "../lib/plans";
import { HANDLED_EVENTS } from "../lib/stripe-events";
import { PORTAL_CONFIG_APP } from "../lib/stripe-portal";

const API_VERSION = "2026-10-28.endive";
// "Training Services - Self-study Web-based". Chosen by the owner from Stripe's tax code list
// (docs.stripe.com/tax/tax-codes). Confirm with a tax advisor before changing.
const TAX_CODE = "txcd_20060058";
// Prices are shown before tax; Stripe adds tax at checkout where you're registered.
const TAX_BEHAVIOR = "exclusive" as const;

const key = process.env.STRIPE_SECRET_KEY;
const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
if (!key || !/^https:\/\//.test(appUrl)) {
  console.error("Set STRIPE_SECRET_KEY and APP_URL (https://...) first.");
  process.exit(1);
}
// fetch-based client: works everywhere, including environments where outbound traffic goes through an
// HTTPS proxy (run with NODE_USE_ENV_PROXY=1 there).
const stripe = new Stripe(key, { apiVersion: API_VERSION, httpClient: Stripe.createFetchHttpClient() });

async function main() {
  const balance = await stripe.balance.retrieve();
  console.log(`Mode: ${balance.livemode ? "LIVE" : "test/sandbox"}`);
  if (balance.livemode && !process.argv.includes("--live")) {
    console.error("This is a live key. Re-run with --live if you really mean to change live mode.");
    process.exit(1);
  }

  // 1. One Product per plan, one monthly Price each, found again later by lookup key.
  const portalProducts: { product: string; prices: string[] }[] = [];
  const allProducts: Stripe.Product[] = [];
  for await (const p of stripe.products.list({ limit: 100 })) allProducts.push(p);
  for (const plan of PLANS) {
    const name = `CivilPrep ${plan.name}`;
    // Prefer the product that owns the current lookup-key price; otherwise any product tagged for this
    // plan. Listing (not Search) because Search indexes new objects with a delay.
    const keyed = (await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 })).data[0];
    const tagged = allProducts.filter((p) => p.metadata?.civilprep_plan === plan.id);
    const existing = tagged.find((p) => p.id === keyed?.product) ?? tagged.find((p) => p.active) ?? tagged[0];
    const product = existing
      ? await stripe.products.update(existing.id, { name, tax_code: TAX_CODE, active: true })
      : await stripe.products.create({ name, tax_code: TAX_CODE, metadata: { civilprep_plan: plan.id } });

    const amount = plan.priceMonthly * 100;
    let price = (await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 })).data[0];
    const matches =
      price &&
      price.product === product.id &&
      price.unit_amount === amount &&
      price.currency === "usd" &&
      price.recurring?.interval === "month" &&
      price.tax_behavior === TAX_BEHAVIOR;
    if (!matches) {
      // Prices are immutable: create a new one and move the lookup key to it.
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: amount,
        recurring: { interval: "month" },
        tax_behavior: TAX_BEHAVIOR,
        lookup_key: plan.lookupKey,
        transfer_lookup_key: true,
        nickname: `${plan.name} monthly`,
      });
      console.log(`  created price ${price.id} for ${name}`);
    }
    if (product.default_price !== price.id) await stripe.products.update(product.id, { default_price: price.id });
    console.log(`Plan ${plan.id}: product ${product.id}, price ${price.id} ($${plan.priceMonthly}/mo, lookup key ${plan.lookupKey})`);
    portalProducts.push({ product: product.id, prices: [price.id] });
  }

  // 2. Webhook endpoint.
  const url = `${appUrl}/api/stripe/webhook`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const hook = endpoints.data.find((w) => w.url === url);
  if (hook) {
    await stripe.webhookEndpoints.update(hook.id, { enabled_events: [...HANDLED_EVENTS], disabled: false });
    console.log(`Webhook ${hook.id} updated (API version ${hook.api_version}; to change it, create a new endpoint).`);
  } else {
    const created = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [...HANDLED_EVENTS],
      api_version: API_VERSION,
      description: "CivilPrep subscriptions",
    });
    console.log(`Webhook ${created.id} created for ${url}. Reveal its signing secret in the Dashboard.`);
  }

  // 3. Customer Portal: cancel at period end, switch plans, update card/address/tax ID, invoice history.
  const portal: Stripe.BillingPortal.ConfigurationCreateParams = {
    name: "CivilPrep",
    business_profile: { privacy_policy_url: `${appUrl}/privacy`, terms_of_service_url: `${appUrl}/terms` },
    default_return_url: `${appUrl}/dashboard`,
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "other"] } },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: portalProducts,
      },
    },
    metadata: { app: PORTAL_CONFIG_APP },
  };
  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
  const mine = configs.data.find((c) => c.metadata?.app === PORTAL_CONFIG_APP);
  const cfg = mine
    ? await stripe.billingPortal.configurations.update(mine.id, portal)
    : await stripe.billingPortal.configurations.create(portal);
  console.log(`Customer Portal configuration ${cfg.id} ${mine ? "updated" : "created"}.`);

  // 4. Tax status (read-only: registrations are legal decisions and are never created here).
  const tax = await stripe.tax.settings.retrieve();
  const regs = await stripe.tax.registrations.list({ status: "active", limit: 100 });
  console.log(`Stripe Tax: settings ${tax.status}, ${regs.data.length} active registration(s).`);
  if (tax.status !== "active") console.log("  Set your head office address in Dashboard > Tax > Settings to activate Stripe Tax.");
  if (!regs.data.length) console.log("  No registrations: Stripe will collect no tax until you add one where you're registered.");
}

main().catch((e) => {
  console.error(e instanceof Stripe.errors.StripeError ? `${e.type}: ${e.message}` : e);
  process.exit(1);
});
