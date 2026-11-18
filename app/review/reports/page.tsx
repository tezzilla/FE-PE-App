import Link from "next/link";
import type { ProblemReport } from "@prisma/client";
import { requireReviewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { questionForReview } from "@/lib/review-question";
import { EXAMS, isExamId, topicName } from "@/lib/content/exams";
import { getTemplate } from "@/lib/templates";
import { dismissReport, resolveReport } from "./actions";

export const dynamic = "force-dynamic";

const LETTERS = "ABCD";

export default async function ReportsInbox({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireReviewer();
  const { show } = await searchParams;
  const closed = show === "closed";
  const reports = await db.problemReport.findMany({
    where: closed ? { status: { not: "open" } } : { status: "open" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // One card per problem type (template) or per fixed question.
  const groups = new Map<string, ProblemReport[]>();
  for (const r of reports) {
    const key = r.templateId ? `tpl:${r.templateId}` : r.questionId;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  // Most-reported first, then oldest waiting.
  const ordered = [...groups.values()].sort(
    (a, b) => b.length - a.length || a[a.length - 1].createdAt.getTime() - b[b.length - 1].createdAt.getTime(),
  );

  const statsFor = async (r: ProblemReport) => {
    const where = r.templateId ? { questionId: { contains: `.${r.templateId}.` } } : { questionId: r.questionId };
    const [total, correct] = await Promise.all([db.attempt.count({ where }), db.attempt.count({ where: { ...where, correct: true } })]);
    return { total, correct };
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <Link href="/review" className="muted text-sm hover:underline">← Review queue</Link>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">Problem reports</h1>
        <div className="text-sm flex gap-3">
          <Link href="/review/reports" className={closed ? "muted hover:underline" : "font-semibold"}>Open</Link>
          <Link href="/review/reports?show=closed" className={closed ? "font-semibold" : "muted hover:underline"}>Closed</Link>
        </div>
      </div>
      <p className="muted text-sm">
        Grouped by question or problem type, most-reported first. For a generated problem, the numbers the most
        recent student saw are shown. If a problem type is wrong, open it and request changes so it leaves the live pool.
      </p>

      {ordered.length === 0 && <div className="card p-6 text-center muted">{closed ? "No closed reports." : "Inbox empty. Nice."}</div>}

      {await Promise.all(
        ordered.map(async (group) => {
          const latest = group[0];
          const q = questionForReview(latest.questionId);
          const s = await statsFor(latest);
          const t = latest.templateId ? getTemplate(latest.templateId) : null;
          const exam = isExamId(latest.exam) ? EXAMS[latest.exam] : null;
          return (
            <div key={latest.id} className="card p-5 space-y-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {exam?.shortName} · {isExamId(latest.exam) ? topicName(latest.exam, latest.topic) : latest.topic}
                  {t ? ` · ${t.title}` : ` · ${latest.questionId}`}
                </span>
                <span className="muted">{group.length} report{group.length === 1 ? "" : "s"}</span>
              </div>
              <ul className="space-y-2">
                {group.map((r) => {
                  const variant = questionForReview(r.questionId);
                  const picked = r.selected != null && variant ? `${LETTERS[r.selected]} (${variant.choices[r.selected]})` : "no answer";
                  return (
                    <li key={r.id} className="border-l-4 pl-3" style={{ borderColor: "var(--brand)" }}>
                      {r.message}
                      <span className="muted text-xs block">
                        {r.createdAt.toLocaleString()} · picked {picked}
                        {r.status !== "open" && ` · ${r.status}${r.resolverNote ? `: ${r.resolverNote}` : ""}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {q ? (
                <>
                  <p>{q.prompt}</p>
                  <ol className="text-sm space-y-1">
                    {q.choices.map((c, k) => (
                      <li key={k} style={k === q.answer ? { color: "#16a34a", fontWeight: 600 } : undefined}>
                        {LETTERS[k]}. {c} {k === q.answer ? "✓ key" : ""}
                      </li>
                    ))}
                  </ol>
                  <pre className="whitespace-pre-wrap text-sm rounded p-3" style={{ background: "var(--border)" }}>{q.explanation}</pre>
                </>
              ) : (
                <p className="muted">This question no longer exists in the code.</p>
              )}
              <p className="muted text-sm">
                {t ? "This problem type" : "This question"}: {s.total ? `${Math.round((100 * s.correct) / s.total)}% of ${s.total} answers correct` : "no answers yet"}
                {t && <> · <Link href={`/review/${t.id}`} className="underline">open problem type</Link></>}
              </p>
              {!closed && (
                <form action={resolveReport} className="space-y-2">
                  <input type="hidden" name="ids" value={group.map((r) => r.id).join(",")} />
                  <input name="note" className="input" placeholder="Note (optional): what you found or changed" />
                  <div className="flex flex-wrap gap-2">
                    <button className="btn !py-1.5">Resolved (fixed){group.length > 1 ? ` · ${group.length}` : ""}</button>
                    <button formAction={dismissReport} className="btn-ghost !py-1.5">Dismiss (question is correct)</button>
                  </div>
                </form>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
