"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireReviewer } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";
import { answersMatch, buildVariant } from "@/lib/templates/engine";
import { REVIEW_SAMPLE_COUNT, type ReviewSample } from "@/lib/reviews";

/** Step 1: reviewer solves samples blind. Grade them against the template and open a review session. */
export async function submitSolutions(form: FormData) {
  const user = await requireReviewer();
  const t = getTemplate(String(form.get("templateId")));
  if (!t) redirect("/review");

  const seeds = form.getAll("seed").map(Number).filter(Number.isInteger).slice(0, REVIEW_SAMPLE_COUNT);
  const samples: ReviewSample[] = seeds.map((seed) => {
    const raw = String(form.get(`given_${seed}`) ?? "").replace(/,/g, "").trim();
    const given = raw === "" ? null : Number(raw);
    const correct = buildVariant(t, seed).answerValue;
    return { seed, given, correct, match: given !== null && answersMatch(given, correct) };
  });

  const review = await db.templateReview.create({
    data: {
      templateId: t.id,
      templateVersion: t.version,
      reviewerId: user.id,
      status: "in_progress",
      samples: JSON.stringify(samples),
    },
  });
  redirect(`/review/${t.id}?session=${review.id}`);
}

/** Step 2: record the decision. Approval requires every blind answer to match. */
export async function decideReview(form: FormData) {
  const user = await requireReviewer();
  const id = String(form.get("sessionId"));
  const decision = String(form.get("decision"));
  const notes = String(form.get("notes") ?? "").trim() || null;

  const review = await db.templateReview.findUnique({ where: { id } });
  if (!review || review.reviewerId !== user.id || review.status !== "in_progress") redirect("/review");
  const back = (error: string) => redirect(`/review/${review.templateId}?session=${id}&error=${encodeURIComponent(error)}`);

  if (!["approved", "rejected", "changes_requested"].includes(decision)) back("Pick a decision.");
  const t = getTemplate(review.templateId);
  if (!t || t.version !== review.templateVersion) back("This template changed since you started. Start a new review.");

  const samples: ReviewSample[] = JSON.parse(review.samples);
  if (decision === "approved" && !samples.every((s) => s.match)) {
    back("Every blind answer must match before approving. Recheck your work or request changes.");
  }
  if (decision !== "approved" && !notes) back("Add a note explaining what needs to change.");

  await db.templateReview.update({
    where: { id },
    data: { status: decision, notes, decidedAt: new Date() },
  });
  redirect("/review");
}

export async function updateReviewerProfile(form: FormData) {
  const user = await requireReviewer();
  const name = String(form.get("name") ?? "").trim() || null;
  const credential = String(form.get("credential") ?? "").trim() || null;
  await db.user.update({ where: { id: user.id }, data: { name, reviewerCredential: credential } });
  redirect("/review?saved=1");
}
