import type { ExamId } from "./content/types";

// Launch pricing (see docs/PRICING-RESEARCH.md). Display prices live here; charged prices live in
// Stripe and are created from this file by scripts/stripe-setup.ts.

export type PlanId = "fe-civil" | "fe-pass-3mo" | "pe-civil" | "pe-pass-6mo" | "all-access";

export interface Plan {
  id: PlanId;
  name: string;
  /** Exam the plan is sold under on the pricing page. */
  exam: ExamId;
  /** Monthly subscription, or a one-time pass for a fixed number of days. */
  kind: "subscription" | "pass";
  /** USD. Per month for subscriptions, total for passes. Display only; Stripe holds the real price. */
  price: number;
  /** Pass length in days. */
  days?: number;
  /** Exams this plan unlocks. PE plans include FE content for refreshing fundamentals. */
  exams: ExamId[];
  features: string[];
  /** Stripe Price lookup key. The code finds the price by this key, so no price IDs need copying. */
  lookupKey: string;
  /** Optional env var that overrides the lookup key with an explicit price ID. */
  stripePriceEnv?: string;
  /** Founding-member promotion code (first 100 redemptions) and the resulting monthly price. */
  founding?: { code: string; price: number };
  /** No longer sold. Kept so existing subscribers keep their access. */
  legacy?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "fe-civil",
    name: "FE Civil monthly",
    exam: "fe-civil",
    kind: "subscription",
    price: 29,
    exams: ["fe-civil"],
    features: ["Full FE Civil question bank", "Unlimited generated problems", "Smart practice and full-length timed exams", "Cancel anytime"],
    lookupKey: "civilprep_fe_civil_monthly",
    stripePriceEnv: "STRIPE_PRICE_FE_CIVIL",
    founding: { code: "FOUNDINGFE", price: 19 },
  },
  {
    id: "fe-pass-3mo",
    name: "FE Civil 3-month pass",
    exam: "fe-civil",
    kind: "pass",
    price: 69,
    days: 90,
    exams: ["fe-civil"],
    features: ["Everything in FE Civil monthly", "90 days of access, one payment", "No renewal to cancel"],
    lookupKey: "civilprep_fe_pass_3mo",
  },
  {
    id: "pe-civil",
    name: "PE Civil monthly",
    exam: "pe-civil",
    kind: "subscription",
    price: 59,
    exams: ["pe-civil", "fe-civil"],
    features: ["Full PE Civil question bank, all 5 depth modules", "FE Civil content included", "Smart practice and full-length timed exams", "Cancel anytime"],
    lookupKey: "civilprep_pe_civil_monthly",
    stripePriceEnv: "STRIPE_PRICE_PE_CIVIL",
    founding: { code: "FOUNDINGPE", price: 39 },
  },
  {
    id: "pe-pass-6mo",
    name: "PE Civil 6-month pass",
    exam: "pe-civil",
    kind: "pass",
    price: 249,
    days: 180,
    exams: ["pe-civil", "fe-civil"],
    features: ["Everything in PE Civil monthly", "180 days of access, one payment", "No renewal to cancel"],
    lookupKey: "civilprep_pe_pass_6mo",
  },
  {
    id: "all-access",
    name: "All Access",
    exam: "pe-civil",
    kind: "subscription",
    price: 59,
    exams: ["fe-civil", "pe-civil"],
    features: [],
    lookupKey: "civilprep_all_access_monthly",
    stripePriceEnv: "STRIPE_PRICE_ALL_ACCESS",
    legacy: true,
  },
];

/** Plans currently for sale. */
export const SOLD_PLANS = PLANS.filter((p) => !p.legacy);

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Explicit price ID override from the environment, if set. Normally prices are found by lookup key. */
export function stripePriceOverride(plan: Plan): string | undefined {
  return plan.stripePriceEnv ? process.env[plan.stripePriceEnv] || undefined : undefined;
}

export function priceLabel(plan: Plan) {
  return plan.kind === "pass" ? `$${plan.price} once` : `$${plan.price}/mo`;
}
