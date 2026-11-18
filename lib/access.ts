import type { User } from "@prisma/client";
import type { ExamId, Question } from "./content/types";
import { getPlan } from "./plans";

const ACTIVE = new Set(["active", "trialing"]);

export function hasActiveSubscription(user: User | null): boolean {
  return !!user && !!user.subscriptionStatus && ACTIVE.has(user.subscriptionStatus);
}

/** End of pass-based access for an exam, if it's still in the future. */
export function passAccessUntil(user: User | null, exam: ExamId): Date | null {
  const until = exam === "fe-civil" ? user?.feAccessUntil : user?.peAccessUntil;
  return until && until.getTime() > Date.now() ? until : null;
}

/** Access comes from an active subscription that covers the exam, or an unexpired pass. */
export function hasExamAccess(user: User | null, exam: ExamId): boolean {
  if (!user) return false;
  if (hasActiveSubscription(user) && getPlan(user.plan)?.exams.includes(exam)) return true;
  return !!passAccessUntil(user, exam);
}

/** Any paid access at all (subscription or pass). */
export function hasPaidAccess(user: User | null): boolean {
  return hasExamAccess(user, "fe-civil") || hasExamAccess(user, "pe-civil");
}

/** One-line description of what the user has, for dashboards and the app. */
export function accessSummary(user: User): string {
  const parts: string[] = [];
  const plan = getPlan(user.plan);
  if (hasActiveSubscription(user) && plan) {
    parts.push(`${plan.name}${user.currentPeriodEnd ? `, renews ${user.currentPeriodEnd.toLocaleDateString("en-US")}` : ""}`);
  }
  const pe = passAccessUntil(user, "pe-civil");
  const fe = passAccessUntil(user, "fe-civil");
  if (pe) parts.push(`PE Civil pass until ${pe.toLocaleDateString("en-US")}`);
  if (fe && (!pe || fe.getTime() > pe.getTime())) parts.push(`FE Civil pass until ${fe.toLocaleDateString("en-US")}`);
  if (!parts.length && user.subscriptionStatus === "past_due") return "Payment past due. Update your card to keep access.";
  return parts.join(" · ") || "Free tier";
}

export function canSeeQuestion(user: User | null, q: Question): boolean {
  return !!q.free || hasExamAccess(user, q.exam);
}
