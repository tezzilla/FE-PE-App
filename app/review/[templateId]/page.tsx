import Link from "next/link";
import { notFound } from "next/navigation";
import { requireReviewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTemplate } from "@/lib/templates";
import { buildVariant, randomSeed, MATCH_TOLERANCE } from "@/lib/templates/engine";
import { REVIEW_SAMPLE_COUNT, templateReviewStatus, type ReviewSample } from "@/lib/reviews";
import { decideReview, submitSolutions } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReviewTemplate({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ session?: string; error?: string }>;
}) {
  const user = await requireReviewer();
  const { templateId } = await params;
  const { session, error } = await searchParams;
  const t = getTemplate(templateId);
  if (!t) notFound();
  const current = (await templateReviewStatus()).get(t.id)!;

  const header = (
    <div className="space-y-1">
      <Link href="/review" className="muted text-sm hover:underline">← Review queue</Link>
      <h1 className="text-2xl font-bold">{t.title} <span className="muted text-base font-normal">v{t.version}</span></h1>
      {current.status !== "needs_review" && (
        <p className="muted text-sm">
          Current decision: {current.status.replace("_", " ")} by {current.reviewerName}
          {current.decidedAt ? ` on ${current.decidedAt.toLocaleDateString()}` : ""}
          {current.notes ? `. Note: "${current.notes}"` : ""}
        </p>
      )}
    </div>
  );

  // Step 2: compare blind answers, show full problems, decide.
  if (session) {
    const review = await db.templateReview.findUnique({ where: { id: session } });
    if (!review || review.reviewerId !== user.id || review.templateId !== t.id) notFound();
    const samples: ReviewSample[] = JSON.parse(review.samples);
    const allMatch = samples.every((s) => s.match);
    const open = review.status === "in_progress";

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {header}
        <div className="card p-4" style={{ borderColor: allMatch ? "#16a34a" : "#dc2626" }}>
          {allMatch
            ? "All of your answers match the template. Now check wording, wrong answer choices, and the solution."
            : "At least one answer did not match. Either your hand calc or the template is off. Find out which before deciding."}
        </div>

        {samples.map((s, i) => {
          const v = buildVariant(t, s.seed);
          return (
            <div key={s.seed} className="card p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Sample {i + 1}</span>
                <span style={{ color: s.match ? "#16a34a" : "#dc2626" }}>
                  You: {s.given ?? "blank"} · Template: {v.answerValue.toPrecision(4)} {v.unit} · {s.match ? "match" : "MISMATCH"}
                </span>
              </div>
              <p>{v.prompt}</p>
              <ol className="space-y-1 text-sm">
                {v.choices.map((c, k) => (
                  <li key={k} style={k === v.answerIndex ? { color: "#16a34a", fontWeight: 600 } : undefined}>
                    {"ABCD"[k]}. {c} {k === v.answerIndex ? "✓" : ""}
                  </li>
                ))}
              </ol>
              <pre className="whitespace-pre-wrap text-sm rounded p-3" style={{ background: "var(--border)" }}>{v.solution}</pre>
            </div>
          );
        })}

        <details className="card p-4 text-sm">
          <summary className="cursor-pointer font-semibold">What each wrong answer represents</summary>
          <p className="muted mt-2">
            Each wrong choice comes from a specific mistake noted in the template source
            (<code>lib/templates/</code>). When two mistakes give nearly the same number, a scaled value fills in.
          </p>
        </details>

        {open ? (
          <form action={decideReview} className="card p-5 space-y-3">
            <input type="hidden" name="sessionId" value={review.id} />
            <p className="font-semibold">Decision</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <label className="flex gap-2 items-center">
              <input type="radio" name="decision" value="approved" disabled={!allMatch} />
              Approve: publish this template to students {allMatch ? "" : "(needs all answers to match)"}
            </label>
            <label className="flex gap-2 items-center">
              <input type="radio" name="decision" value="changes_requested" /> Request changes
            </label>
            <label className="flex gap-2 items-center">
              <input type="radio" name="decision" value="rejected" /> Reject
            </label>
            <textarea name="notes" className="input" rows={3} placeholder="Notes (required unless approving). What's wrong or what should change?" />
            <div className="flex gap-3">
              <button className="btn">Save decision</button>
              <Link href={`/review/${t.id}`} className="btn-ghost">Try new samples</Link>
            </div>
          </form>
        ) : (
          <p className="muted">This review session is closed ({review.status.replace("_", " ")}).</p>
        )}
      </div>
    );
  }

  // Step 1: blind solve.
  const seeds = Array.from({ length: REVIEW_SAMPLE_COUNT }, randomSeed);
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {header}
      <p className="muted text-sm">
        Solve each problem by hand. Enter just the number in the units asked (commas are fine).
        Answers within {MATCH_TOLERANCE * 100}% count as a match. Answer choices are hidden so they can&apos;t steer you.
      </p>
      <form action={submitSolutions} className="space-y-4">
        <input type="hidden" name="templateId" value={t.id} />
        {seeds.map((seed, i) => {
          const v = buildVariant(t, seed);
          return (
            <div key={seed} className="card p-5 space-y-3">
              <input type="hidden" name="seed" value={seed} />
              <p className="font-semibold text-sm">Sample {i + 1}</p>
              <p>{v.prompt}</p>
              <label className="flex items-center gap-2">
                <input name={`given_${seed}`} className="input max-w-48" inputMode="decimal" required />
                <span className="muted">{v.unit || "(dimensionless)"}</span>
              </label>
            </div>
          );
        })}
        <button className="btn">Check my answers</button>
      </form>
    </div>
  );
}
