"use server";

import Stripe from "stripe";
import { requireReviewer } from "@/lib/auth";
import { keyMode } from "@/lib/stripe";
import { cleanLeftovers, findLeftovers, type Leftovers } from "@/lib/test-leftovers";

export type LeftoversState = { found?: Leftovers; cleaned?: boolean; error?: string } | null;

/** "check": list sandbox purchases still granting access. "clean": find them again and revoke them. */
export async function leftoversAction(_prev: LeftoversState, form: FormData): Promise<LeftoversState> {
  await requireReviewer();
  if (!keyMode(process.env.STRIPE_SECRET_KEY)?.endsWith("live")) {
    return { error: "This only runs with a live key. In test mode, sandbox purchases are the real data." };
  }
  try {
    const found = await findLeftovers();
    if (form.get("op") === "clean") {
      await cleanLeftovers(found);
      return { found, cleaned: true };
    }
    return { found };
  } catch (e) {
    return { error: e instanceof Stripe.errors.StripeError ? `${e.type}: ${e.message}` : e instanceof Error ? e.message : String(e) };
  }
}
