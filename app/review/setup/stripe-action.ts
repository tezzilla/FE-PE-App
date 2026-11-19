"use server";

import Stripe from "stripe";
import { requireReviewer } from "@/lib/auth";
import { clearPriceCache, stripe, stripeEnabled } from "@/lib/stripe";
import { runStripeSetup } from "@/lib/stripe-setup";
import { saveAppSecret, WEBHOOK_SECRET_PREFIX } from "@/lib/app-secrets";
import { db } from "@/lib/db";

export type StripeSetupState = { ok: boolean; mode?: "live" | "test"; log: string[]; error?: string; webhookCreated?: boolean; secretSaved?: boolean; needsManualSecret?: boolean } | null;

/**
 * Run the Stripe setup on the server with this deployment's own STRIPE_SECRET_KEY, so the key never
 * leaves the host. Live mode needs the reviewer to type LIVE. Products, prices, the webhook endpoint and
 * the Customer Portal are created or updated in place; nothing is deleted.
 */
export async function setupStripe(_prev: StripeSetupState, form: FormData): Promise<StripeSetupState> {
  await requireReviewer();
  if (!stripeEnabled()) return { ok: false, log: [], error: "STRIPE_SECRET_KEY isn't set on this deployment." };
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  if (!/^https:\/\//.test(appUrl)) return { ok: false, log: [], error: "Set APP_URL to the site's https:// address first, so the webhook and portal point at the right place." };
  const live = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
  if (live && String(form.get("confirm") ?? "").trim() !== "LIVE") {
    return { ok: false, mode: "live", log: [], error: "This deployment has a live key. Type LIVE to confirm you want to set up live mode." };
  }
  try {
    const r = await runStripeSetup(stripe(), appUrl, { allowLive: live });
    clearPriceCache();
    const mode = r.livemode ? "live" : "test";
    let secretSaved = false;
    if (r.webhookSecret && r.webhookId) {
      await saveAppSecret(`${WEBHOOK_SECRET_PREFIX}${mode}:${r.webhookId}`, r.webhookSecret);
      secretSaved = true;
    }
    const savedForMode = secretSaved || (await db.appSecret.count({ where: { name: { startsWith: `${WEBHOOK_SECRET_PREFIX}${mode}:` } } })) > 0;
    return { ok: true, mode, log: r.log, webhookCreated: r.webhookCreated, secretSaved, needsManualSecret: !savedForMode };
  } catch (e) {
    const msg = e instanceof Stripe.errors.StripeError ? `${e.type}: ${e.message}` : e instanceof Error ? e.message : String(e);
    return { ok: false, mode: live ? "live" : "test", log: [], error: msg };
  }
}
