import type { ExamId } from "./content/types";

export type PlanId = "fe-civil" | "pe-civil" | "all-access";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // USD, display only. Real price lives in Stripe.
  exams: ExamId[];
  features: string[];
  /** Stripe Price lookup key. The code finds the price by this key, so no price IDs need copying. */
  lookupKey: string;
  /** Optional env var that overrides the lookup key with an explicit price ID. */
  stripePriceEnv: string;
}

export const PLANS: Plan[] = [
  {
    id: "fe-civil",
    name: "FE Civil",
    priceMonthly: 29,
    exams: ["fe-civil"],
    features: ["Full FE Civil question bank", "Timed mock exams", "Progress by topic", "Cancel anytime"],
    lookupKey: "civilprep_fe_civil_monthly",
    stripePriceEnv: "STRIPE_PRICE_FE_CIVIL",
  },
  {
    id: "pe-civil",
    name: "PE Civil",
    priceMonthly: 49,
    exams: ["pe-civil"],
    features: ["Full PE Civil question bank", "All 5 depth modules", "Timed mock exams", "Cancel anytime"],
    lookupKey: "civilprep_pe_civil_monthly",
    stripePriceEnv: "STRIPE_PRICE_PE_CIVIL",
  },
  {
    id: "all-access",
    name: "All Access",
    priceMonthly: 59,
    exams: ["fe-civil", "pe-civil"],
    features: ["Everything in FE and PE Civil", "New disciplines as they launch", "Cancel anytime"],
    lookupKey: "civilprep_all_access_monthly",
    stripePriceEnv: "STRIPE_PRICE_ALL_ACCESS",
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Explicit price ID override from the environment, if set. Normally prices are found by lookup key. */
export function stripePriceOverride(plan: Plan): string | undefined {
  return process.env[plan.stripePriceEnv] || undefined;
}
