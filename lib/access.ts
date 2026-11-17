import type { User } from "@prisma/client";
import type { ExamId, Question } from "./content/types";
import { getPlan } from "./plans";

const ACTIVE = new Set(["active", "trialing"]);

export function hasActiveSubscription(user: User | null): boolean {
  return !!user && !!user.subscriptionStatus && ACTIVE.has(user.subscriptionStatus);
}

export function hasExamAccess(user: User | null, exam: ExamId): boolean {
  if (!hasActiveSubscription(user)) return false;
  return getPlan(user!.plan)?.exams.includes(exam) ?? false;
}

export function canSeeQuestion(user: User | null, q: Question): boolean {
  return !!q.free || hasExamAccess(user, q.exam);
}
