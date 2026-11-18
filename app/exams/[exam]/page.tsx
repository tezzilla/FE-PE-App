import { PE_MODULE_SPECS } from "@/lib/content/pe-spec";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { questionsFor } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { topicStats } from "@/lib/progress";
import { approvedTemplateCount, bankStats } from "@/lib/questions";
import { ReadinessCard } from "@/components/ReadinessCard";
import { StudyPlanCard } from "@/components/StudyPlanCard";
import { PacingCard } from "@/components/PacingCard";
import { missedCount } from "@/lib/adaptive/server";
import { dueCardCount } from "@/lib/cards";

export default async function ExamPage({ params, searchParams }: { params: Promise<{ exam: string }>; searchParams: Promise<{ planError?: string }> }) {
  const { exam } = await params;
  const { planError } = await searchParams;
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
            <p className="text-sm mt-1" style={{ color: "var(--brand-text)" }}>
              {b.fixed} written questions{b.generators ? ` + ${b.generators} calculation problem${b.generators === 1 ? "" : "s"} that never repeat` : ""}
            </p>
          );
        })()}
      </div>

      {!access && user && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-56">You&apos;re on the free tier: one sample question per topic. Subscribe for the full bank, timed exams and flashcards.</p>
          <Link href="/pricing" className="btn w-full sm:w-auto">Unlock {def.name}</Link>
        </div>
      )}

      {user ? (
        <>
          <StudyPlanCard user={user} exam={exam} back={`/exams/${exam}`} error={planError} />
          <ReadinessCard user={user} exam={exam} back={`/exams/${exam}`} />
          <PacingCard user={user} exam={exam} />
        </>
      ) : (
        <div className="card elevated p-5 sm:p-6 flex flex-wrap items-center gap-4" style={{ borderColor: "var(--brand)" }}>
          <div className="flex-1 min-w-56">
            <p className="font-semibold text-lg">Try a free sample question in every topic</p>
            <p className="muted text-sm">A free account adds the diagnostic, smart practice and your readiness score.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/signup" className="btn flex-1 sm:flex-none">Create free account</Link>
            <Link href="/pricing" className="btn-ghost flex-1 sm:flex-none">Pricing</Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/exams/${exam}/practice`} className="btn-ghost">Mixed practice</Link>
        {user && (
          <>
            <Link href={`/exams/${exam}/quiz`} className="btn-ghost">Build a quiz</Link>
            {(async () => {
              const n = await missedCount(user, exam);
              return n > 0 ? (
                <Link href={`/exams/${exam}/quiz?go=1&source=missed&count=${n > 10 ? 20 : 10}`} className="btn-ghost">
                  Review my misses ({n})
                </Link>
              ) : null;
            })()}
            <Link href={`/exams/${exam}/diagnostic`} className="btn-ghost">Diagnostic</Link>
            {(async () => {
              const n = await dueCardCount(user, exam);
              return <Link href={`/exams/${exam}/flashcards`} className="btn-ghost">Flashcards{n ? ` (${n} due)` : ""}</Link>;
            })()}
          </>
        )}
        <Link href={`/exams/${exam}/handbook-drill`} className="btn-ghost">Handbook hunt</Link>
        <Link href={`/exams/${exam}/mock`} className="btn-ghost">Full exam (timed) {access ? "" : "🔒"}</Link>
        <Link href={`/exams/${exam}/resources`} className="btn-ghost">Exam documents {access ? "" : "🔒"}</Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(await Promise.all(def.topics.map(async (t) => ({ t, gens: await approvedTemplateCount(exam, t.slug) })))).map(({ t, gens }) => {
          const qs = questionsFor(exam, t.slug);
          const available = access ? qs.length : qs.filter((q) => q.free).length;
          const s = stats[t.slug];
          return (
            <div key={t.slug} className="card p-4">
              <div className="flex justify-between gap-2">
                <h2 className="font-semibold">
                  <Link href={exam === "pe-civil" ? `/exams/${exam}/modules/${t.slug}` : `/exams/${exam}/topics/${t.slug}`} className="hover:underline">
                    {exam === "pe-civil" ? `PE Civil: ${t.name}` : t.name}
                  </Link>
                </h2>
                {exam !== "pe-civil" && <span className="muted text-sm whitespace-nowrap">{t.examQuestions}{/\d/.test(t.examQuestions) ? " on exam" : ""}</span>}
              </div>
              <p className="muted text-sm mt-1">
                {available} of {qs.length} questions available
                {s ? ` · ${Math.round((100 * s.correct) / s.attempted)}% correct (${s.attempted} done)` : ""}
              </p>
              {gens > 0 && (
                <p className="text-sm mt-1" style={{ color: "var(--brand-text)" }}>
                  + {gens} calculation problem{gens > 1 ? "s" : ""} that never repeat{access ? "" : " 🔒"}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                {exam === "pe-civil" && PE_MODULE_SPECS[t.slug] && (
                  <Link href={`/exams/${exam}/modules/${t.slug}`} className="underline font-semibold">
                    {PE_MODULE_SPECS[t.slug].areas.length} knowledge areas
                  </Link>
                )}
                <Link href={`/exams/${exam}/topics/${t.slug}`} className="underline">Review</Link>
                <Link href={`/exams/${exam}/practice?topic=${t.slug}`} className="underline">Practice</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
