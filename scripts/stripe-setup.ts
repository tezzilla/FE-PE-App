// Run CivilPrep's Stripe setup from the command line (see lib/stripe-setup.ts):
//
//   STRIPE_SECRET_KEY=sk_test_... APP_URL=https://your-site npx tsx scripts/stripe-setup.ts
//
// Live mode requires --live. In production, prefer the "Set up Stripe" button on /review/setup, which
// runs on the server with the deployment's key. The webhook signing secret is never printed.
import Stripe from "stripe";
import { runStripeSetup } from "../lib/stripe-setup";
import { STRIPE_API_VERSION } from "../lib/stripe-version";

const key = process.env.STRIPE_SECRET_KEY;
const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
if (!key || !/^https:\/\//.test(appUrl)) {
  console.error("Set STRIPE_SECRET_KEY and APP_URL (https://...) first.");
  process.exit(1);
}
// fetch-based client: works behind an HTTPS proxy (run with NODE_USE_ENV_PROXY=1 there).
const stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION, httpClient: Stripe.createFetchHttpClient() });

runStripeSetup(stripe, appUrl, { allowLive: process.argv.includes("--live") })
  .then((r) => {
    r.log.forEach((l) => console.log(l));
    if (r.webhookCreated) console.log("Reveal the new webhook's signing secret in the Dashboard (Developers > Webhooks) and save it as STRIPE_WEBHOOK_SECRET.");
  })
  .catch((e) => {
    console.error(e instanceof Stripe.errors.StripeError ? `${e.type}: ${e.message}` : e instanceof Error ? e.message : e);
    process.exit(1);
  });
