import "server-only";
import type { User } from "@prisma/client";
import type { ExamId } from "./content/types";
import { db } from "./db";
import { extensionFor, getPlan, type Plan } from "./plans";
import { hasActiveSubscription } from "./access";

const DAY = 24 * 3600 * 1000;
/** Offer the extension once a pass has this many days or fewer left (and any time after it ends). */
export const OFFER_WITHIN_DAYS = 21;

export interface ExtensionOffer {
  plan: Plan;
  exam: ExamId;
  /** When pass access ends (or ended). */
  until: Date;
  daysLeft: number;
}

/** True if the user has ever bought a pass whose main exam is this one (extensions are for pass holders). */
export async function hadPassFor(userId: string, exam: ExamId) {
  const passes = await db.pass.findMany({ where: { userId, revokedAt: null }, select: { plan: true } });
  return passes.some((p) => getPlan(p.plan)?.exam === exam);
}

/** The extension to offer this user for an exam, or null. Subscribers don't need one. */
export async function extensionOffer(user: User, exam: ExamId): Promise<ExtensionOffer | null> {
  const plan = extensionFor(exam);
  if (!plan) return null;
  if (hasActiveSubscription(user) && getPlan(user.plan)?.exams.includes(exam)) return null;
  const until = exam === "pe-civil" ? user.peAccessUntil : user.feAccessUntil;
  if (!until || !(await hadPassFor(user.id, exam))) return null;
  const daysLeft = Math.ceil((until.getTime() - Date.now()) / DAY);
  if (daysLeft > OFFER_WITHIN_DAYS) return null;
  return { plan, exam, until, daysLeft };
}
