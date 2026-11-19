import "server-only";
import { db } from "./db";

// Funnel counts: signup -> pricing view -> checkout start -> purchase. Stored in our own database so it
// works on any Vercel plan, with no cookies, IPs or user agents.

export const FUNNEL_STEPS = ["pricing_view", "signup", "checkout_start", "purchase"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

/** Record a funnel step. Never throws: tracking must not break signup or checkout. */
export async function track(name: FunnelStep, opts: { userId?: string | null; plan?: string | null; dedupeId?: string } = {}) {
  try {
    const data = { name, userId: opts.userId ?? null, plan: opts.plan ?? null };
    // dedupeId (e.g. the Checkout Session) makes repeated webhook deliveries count once.
    if (opts.dedupeId) await db.funnelEvent.upsert({ where: { id: `${name}:${opts.dedupeId}` }, create: { id: `${name}:${opts.dedupeId}`, ...data }, update: {} });
    else await db.funnelEvent.create({ data });
  } catch (e) {
    console.error("funnel track failed", e);
  }
}

/** Counts per step since `since`, plus purchases by plan. */
export async function funnelReport(since: Date) {
  const rows = await db.funnelEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since } }, _count: { _all: true } });
  const counts = Object.fromEntries(FUNNEL_STEPS.map((s) => [s, rows.find((r) => r.name === s)?._count._all ?? 0])) as Record<FunnelStep, number>;
  const byPlan = await db.funnelEvent.groupBy({ by: ["plan"], where: { name: "purchase", createdAt: { gte: since } }, _count: { _all: true } });
  return { counts, byPlan: byPlan.map((r) => ({ plan: r.plan ?? "unknown", n: r._count._all })) };
}
