import "server-only";
import { db } from "./db";
import { TEMPLATES } from "./templates";

/** Blind problems a reviewer solves per review session. */
export const REVIEW_SAMPLE_COUNT = 3;

export type ReviewStatus = "needs_review" | "approved" | "rejected" | "changes_requested";

export interface ReviewInfo {
  status: ReviewStatus;
  reviewerName?: string;
  credential?: string | null;
  decidedAt?: Date | null;
  notes?: string | null;
}

/** Latest decision for each template's current version. A version bump resets it to needs_review. */
export async function templateReviewStatus(): Promise<Map<string, ReviewInfo>> {
  const decided = await db.templateReview.findMany({
    where: { status: { in: ["approved", "rejected", "changes_requested"] } },
    orderBy: { decidedAt: "desc" },
    include: { reviewer: { select: { name: true, reviewerCredential: true } } },
  });
  const out = new Map<string, ReviewInfo>();
  for (const t of TEMPLATES) {
    const r = decided.find((d) => d.templateId === t.id && d.templateVersion === t.version);
    out.set(
      t.id,
      r
        ? {
            status: r.status as ReviewStatus,
            // Never fall back to email: this text is shown to students.
            reviewerName: r.reviewer.name || "CivilPrep reviewer",
            credential: r.reviewer.reviewerCredential,
            decidedAt: r.decidedAt,
            notes: r.notes,
          }
        : { status: "needs_review" },
    );
  }
  return out;
}

export async function approvedTemplates(): Promise<Map<string, ReviewInfo>> {
  const all = await templateReviewStatus();
  return new Map([...all].filter(([, v]) => v.status === "approved"));
}

export interface ReviewSample {
  seed: number;
  given: number | null;
  correct: number;
  match: boolean;
}
