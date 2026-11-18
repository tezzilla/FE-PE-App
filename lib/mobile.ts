import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { EXAMS, EXAM_IDS, topicName } from "./content/exams";
import { accessSummary, hasActiveSubscription, hasExamAccess, hasPaidAccess } from "./access";
import { getPlan } from "./plans";
import { examReadiness, learnerState } from "./adaptive/server";
import { topicMastery } from "./adaptive/model";

export const unauthorized = () => NextResponse.json({ error: "Sign in required" }, { status: 401 });

export function publicUser(u: User) {
  const plan = getPlan(u.plan);
  return {
    email: u.email,
    name: u.name,
    active: hasPaidAccess(u),
    plan: plan && hasActiveSubscription(u) ? { id: plan.id, name: plan.name } : null,
    // Plain-language plan line (subscription and/or pass with end date) for the app's home screen.
    summary: accessSummary(u),
    renews: u.currentPeriodEnd?.toISOString() ?? null,
    peDepth: u.peDepth,
  };
}

/** Everything the app's home screen needs in one request. */
export async function homePayload(user: User) {
  const exams = await Promise.all(
    EXAM_IDS.map(async (id) => {
      const def = EXAMS[id];
      const [r, state] = await Promise.all([examReadiness(user, id), learnerState(user.id, id)]);
      return {
        id,
        name: def.name,
        realExam: def.realExam,
        access: hasExamAccess(user, id),
        readiness: {
          score: r.score,
          coverage: r.coverage,
          dueReviews: r.dueReviews,
          answered: r.answered,
          weakest: r.weakest.map((w) => ({ slug: w.topic, name: topicName(id, w.topic), mastery: w.mastery })),
        },
        topics: def.topics.map((t) => {
          const m = topicMastery(state, t.slug);
          return { slug: t.slug, name: t.name, mastery: m.mastery, answered: m.evidence };
        }),
      };
    }),
  );
  return {
    user: publicUser(user),
    exams,
    // Subscriptions are managed on the website (see mobile/README.md on store payment rules).
    accountUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`,
  };
}
