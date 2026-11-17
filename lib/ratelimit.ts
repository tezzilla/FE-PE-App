import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

// Database-backed fixed windows, so limits hold across Vercel's many serverless instances.
export const LIMITS = {
  // Failed logins per account: stops password guessing against one person.
  loginEmail: { max: 8, windowMs: 15 * 60_000 },
  // Login attempts per IP: stops one source trying many accounts. Generous because a campus
  // network can put many students behind one address.
  loginIp: { max: 100, windowMs: 15 * 60_000 },
  // New accounts per IP.
  signupIp: { max: 20, windowMs: 60 * 60_000 },
} as const;
type Limit = (typeof LIMITS)[keyof typeof LIMITS];

/** Client IP. On Vercel, x-forwarded-for is set by Vercel's edge, not trusted from the client. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Minutes until the key may try again, or 0 if it is under its limit. Does not count an attempt. */
export async function blockedFor(key: string, limit: Limit): Promise<number> {
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row) return 0;
  const reset = row.windowStart.getTime() + limit.windowMs;
  if (Date.now() >= reset || row.count < limit.max) return 0;
  return Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
}

/** Count one attempt against key, starting a new window if the old one expired. */
export async function hit(key: string, limit: Limit) {
  const now = new Date();
  const windowFloor = new Date(now.getTime() - limit.windowMs);
  const bumped = await db.rateLimit.updateMany({
    where: { key, windowStart: { gt: windowFloor } },
    data: { count: { increment: 1 } },
  });
  if (bumped.count === 0) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
  }
  // Occasionally clear long-expired rows so the table stays small.
  if (Math.random() < 0.02) {
    await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 3600_000) } } });
  }
}

export async function clear(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

export const tooMany = (minutes: number) =>
  `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
