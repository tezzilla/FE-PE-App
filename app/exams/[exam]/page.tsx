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
import { Icon } from "@/components/Icon";
import { missedCount } from "@/lib/adaptive/server";
import { dueCardCount } from "@/lib/cards";

// The hub for one exam: every study tool (with what it is for), then the student's progress, then
// the topics. The tab row from the exam layout repeats the tools on every page of the exam.

type Tool = { href: string; icon: string; title: string; text: string; locked?: boolean; primary?: boolean; badge?: string };

export default async function ExamPage({ params, searchParams }: { params: Promise<{ exam: string }>; searchParams: Promise<{ planError?: string }> }) {
  const { exam } = await params;
  const { planError } = await searchParams;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  const user = await getCurrentUser();
  const access = hasExamAccess(user, exam);
  const isPe = exam === "pe-civil";
  const [stats, bank, missed, due, gens] = await Promise.all([
    user ? topicStats(user.id, exam) : Promise.resolve({} as Awaited<ReturnType<typeof topicStats>>),
    bankStats(exam),
    user ? missedCount(user, exam) : Promise.resolve(0),
    user ? dueCardCount(user, exam) : Promise.resolve(0),
    Promise.all(def.topics.map((t) => approvedTemplateCount(exam, t.slug))),
  ]);
  const base = `/exams/${exam}`;

  const tools: Tool[] = [
    { href: `${base}/smart`, icon: "target", title: "Smart practice", text: "10 questions picked from your weak spots and due reviews", primary: true },
    { href: `${base}/practice`, icon: "shuffle", title: "Mixed practice", text: "Questions from every topic, with worked solutions" },
    { href: `${base}/quiz`, icon: "list", title: "Custom quiz", text: "Pick topics, length and timing" },
    ...(missed > 0 ? [{ href: `${base}/quiz?go=1&source=missed&count=${missed > 10 ? 20 : 10}`, icon: "undo", title: "Review my misses", text: "Retry questions you got wrong", badge: String(missed) }] : []),
    { href: `${base}/diagnostic`, icon: "compass", title: "Diagnostic", text: `About ${def.topics.length * 2} questions to find your weak topics` },
    { href: `${base}/mock`, icon: "timer", title: "Full timed exam", text: "Exam-length, weighted like the real thing", locked: !access },
    { href: `${base}/flashcards`, icon: "cards", title: "Formula flashcards", text: "Spaced repetition, with where each formula lives", badge: due ? `${due} due` : undefined },
    { href: `${base}/handbook-drill`, icon: "search", title: "Handbook hunt", text: "Timed drill: which chapter would you open?", locked: !access },
    { href: "/learn", icon: "book", title: "Formula guides", text: "Free write-ups of the most-tested formulas" },
    { href: `${base}/resources`, icon: "doc", title: isPe ? "Documents and standards" : "Exam documents", text: isPe ? "Official links and each module's design standards" : "Official links: handbook, specs, exam-day rules", locked: !access },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">{def.name}</h1>
        <p className="muted mt-1">{def.realExam}</p>
        <p className="text-sm mt-1 muted">
          {bank.fixed} written questions{bank.generators ? ` + ${bank.generators} calculation problem${bank.generators === 1 ? "" : "s"} that never repeat` : ""}
        </p>
        <p className="text-sm mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span className="muted">Jump to:</span>
          <a href="#tools" className="underline">Study tools</a>
          {user && <a href="#progress" className="underline">Your progress</a>}
          <a href="#topics" className="underline">{isPe ? "Modules" : "Topics"}</a>
        </p>
      </div>

      {!access && user && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-56">You&apos;re on the free tier: one sample question per topic. Subscribe for the full bank, timed exams and flashcards.</p>
          <Link href="/pricing" className="btn w-full sm:w-auto">Get full {def.shortName} access</Link>
        </div>
      )}
      {!user && (
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

      <section id="tools" className="space-y-3 scroll-mt-20">
        <h2 className="text-xl font-semibold">Study tools</h2>
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {tools.map((t) => (
            <li key={t.title}>
              <Link
                href={t.href}
                className="card card-link p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 h-full"
                style={t.primary ? { borderColor: "var(--brand)" } : undefined}
              >
                <span className="shrink-0" style={{ color: t.primary ? "var(--brand-text)" : "var(--muted)" }}><Icon name={t.icon} size={22} /></span>
                <span className="min-w-0">
                  <span className="font-semibold text-sm sm:text-base flex flex-wrap items-center gap-x-1.5">
                    {t.title}
                    {t.badge && <span className="text-xs font-semibold px-1.5 rounded" style={{ background: "var(--brand)", color: "white" }}>{t.badge}</span>}
                    {t.locked && <span className="muted"><Icon name="lock" size={14} /><span className="sr-only"> (subscribers)</span></span>}
                  </span>
                  <span className="muted text-xs sm:text-sm block mt-0.5">{t.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {user && (
        <section id="progress" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-semibold">Your progress</h2>
          <ReadinessCard user={user} exam={exam} back={base} />
          <StudyPlanCard user={user} exam={exam} back={base} error={planError} />
          <PacingCard user={user} exam={exam} />
        </section>
      )}

      <section id="topics" className="space-y-3 scroll-mt-20">
        <div>
          <h2 className="text-xl font-semibold">{isPe ? "Modules" : "Topics"}</h2>
          <p className="muted text-sm">
            {isPe
              ? "You take one module. Open yours to see every NCEES knowledge area and practice each one."
              : "Each topic has review notes, key formulas and its own practice set."}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {def.topics.map((t, i) => {
            const qs = questionsFor(exam, t.slug);
            const available = access ? qs.length : qs.filter((q) => q.free).length;
            const s = stats[t.slug];
            const home = isPe && PE_MODULE_SPECS[t.slug] ? `${base}/modules/${t.slug}` : `${base}/topics/${t.slug}`;
            const mine = isPe && user?.peDepth === t.slug;
            return (
              <div key={t.slug} className="card p-4 flex flex-col" style={mine ? { borderColor: "var(--brand)" } : undefined}>
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold">
                    <Link href={home} className="hover:underline">{t.name}</Link>
                    {mine && <span className="text-xs font-semibold ml-2" style={{ color: "var(--brand-text)" }}>Your module</span>}
                  </h3>
                  {!isPe && <span className="muted text-sm whitespace-nowrap">{t.examQuestions}{/\d/.test(t.examQuestions) ? " on exam" : ""}</span>}
                </div>
                <p className="muted text-sm mt-1">
                  {available} of {qs.length} questions available
                  {s ? ` · ${Math.round((100 * s.correct) / s.attempted)}% correct (${s.attempted} done)` : ""}
                </p>
                {gens[i] > 0 && (
                  <p className="text-sm mt-1 muted">
                    + {gens[i]} calculation problem{gens[i] > 1 ? "s" : ""} that never repeat{access ? null : <span className="muted inline-flex align-[-2px] ml-1"><Icon name="lock" size={14} /><span className="sr-only">(full access)</span></span>}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-auto pt-3">
                  {isPe && PE_MODULE_SPECS[t.slug] ? (
                    <Link href={home} className="btn-ghost !py-1.5 !px-3 text-sm">{PE_MODULE_SPECS[t.slug].areas.length} knowledge areas</Link>
                  ) : (
                    <Link href={home} className="btn-ghost !py-1.5 !px-3 text-sm">Review notes</Link>
                  )}
                  <Link href={`${base}/practice?topic=${t.slug}`} className="btn-ghost !py-1.5 !px-3 text-sm">Practice</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
