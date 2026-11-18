import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { EXAMS, EXAM_IDS, topicName } from "./content/exams";
import { accessSummary, hasActiveSubscription, hasExamAccess, hasPaidAccess } from "./access";
import { getPlan } from "./plans";
import { examReadiness, learnerState, missedCount, pacing, studyPlanFor } from "./adaptive/server";
import { EXAM_PACE_S } from "./adaptive/quiz";
import { dueCardCount } from "./cards";
import { extensionOffer } from "./extensions";
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
      const [r, state, sp, missed, dueCards, pace] = await Promise.all([
        examReadiness(user, id),
        learnerState(user.id, id),
        studyPlanFor(user, id),
        missedCount(user, id),
        dueCardCount(user, id),
        pacing(user, id),
      ]);
      const ext = await extensionOffer(user, id);
      return {
        id,
        name: def.name,
        realExam: def.realExam,
        access: hasExamAccess(user, id),
        missed,
        dueCards,
        // Pass ending soon (or ended): the app shows a notice; buying happens on the website.
        extension: ext ? { until: ext.until.toISOString(), daysLeft: ext.daysLeft, price: ext.plan.price } : null,
        pacing: pace.total >= 5 ? { averageS: pace.overallS, examPaceS: EXAM_PACE_S[id], answered: pace.total } : null,
        plan: sp
          ? {
              examDate: sp.saved.examDate.toISOString(),
              weeklyHours: sp.saved.weeklyHours,
              daysLeft: sp.plan.daysLeft,
              weeklyTarget: sp.plan.weeklyTarget,
              answeredLast7Days: sp.plan.answeredLast7Days,
              status: sp.plan.status,
            }
          : null,
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
