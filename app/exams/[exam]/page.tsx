import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { questionsFor } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { topicStats } from "@/lib/progress";
import { approvedTemplateCount, bankStats } from "@/lib/questions";
import { ReadinessCard } from "@/components/ReadinessCard";

export default async function ExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  const user = await getCurrentUser();
  const access = hasExamAccess(user, exam);
  const stats = user ? await topicStats(user.id, exam) : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{def.name}</h1>
        <p className="muted mt-1">{def.realExam}</p>
        {(async () => {
          const b = await bankStats(exam);
          return (
            <p className="text-sm mt-1" style={{ color: "var(--brand)" }}>
              {b.fixed} worked problems{b.generators ? ` + ${b.generators} problem types with unlimited variations` : ""}
            </p>
          );
        })()}
      </div>

      {!access && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-56">You are on the free tier: one sample question per topic. Subscribe for the full bank and mock exams.</p>
          <Link href="/pricing" className="btn w-full sm:w-auto">Unlock {def.name}</Link>
        </div>
      )}

      {user ? (
        <ReadinessCard user={user} exam={exam} back={`/exams/${exam}`} />
      ) : (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <p className="flex-1">Smart practice learns what you&apos;re weak at and targets it. Free account required.</p>
          <Link href="/signup" className="btn">Create free account</Link>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/exams/${exam}/practice`} className="btn-ghost">Mixed practice</Link>
        <Link href={`/exams/${exam}/mock`} className="btn-ghost">Full exam (timed) {access ? "" : "🔒"}</Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(await Promise.all(def.topics.map(async (t) => ({ t, gens: await approvedTemplateCount(exam, t.slug) })))).map(({ t, gens }) => {
          const qs = questionsFor(exam, t.slug);
          const available = access ? qs.length : qs.filter((q) => q.free).length;
          const s = stats[t.slug];
          return (
            <Link key={t.slug} href={`/exams/${exam}/practice?topic=${t.slug}`} className="card p-4 hover:shadow-md transition">
              <div className="flex justify-between gap-2">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="muted text-sm whitespace-nowrap">{t.examQuestions}{/\d/.test(t.examQuestions) ? " on exam" : ""}</span>
              </div>
              <p className="muted text-sm mt-1">
                {available} of {qs.length} questions available
                {s ? ` · ${Math.round((100 * s.correct) / s.attempted)}% correct (${s.attempted} done)` : ""}
              </p>
              {gens > 0 && (
                <p className="text-sm mt-1" style={{ color: "var(--brand)" }}>
                  + unlimited problems from {gens} engineer-reviewed generator{gens > 1 ? "s" : ""}{access ? "" : " 🔒"}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
