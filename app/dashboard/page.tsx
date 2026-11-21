import Link from "next/link";
import type { User } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { accessSummary, hasExamAccess, hasPaidAccess } from "@/lib/access";
import { EXAMS, EXAM_IDS } from "@/lib/content/exams";
import type { ExamId } from "@/lib/content/types";
import { PE_MODULE_SPECS } from "@/lib/content/pe-spec";
import { topicStats } from "@/lib/progress";
import { db } from "@/lib/db";
import { ReadinessCard } from "@/components/ReadinessCard";
import { StudyPlanCard } from "@/components/StudyPlanCard";
import { ExtendPassCard } from "@/components/ExtendPassCard";
import { Icon } from "@/components/Icon";
import { missedCount } from "@/lib/adaptive/server";
import { dueCardCount } from "@/lib/cards";
import { EXAM_PACE_S } from "@/lib/adaptive/quiz";

export const dynamic = "force-dynamic";

// Home for signed-in users. The exam you're studying comes first with its next steps; an exam you
// haven't started folds into one line so the page stays short.

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ subscribed?: string; reset?: string; gift?: string }> }) {
  const user = await requireUser("/dashboard");
  const { subscribed, reset, gift } = await searchParams;
  const mocks = await db.mockExam.findMany({ where: { userId: user.id, status: "completed" }, orderBy: { createdAt: "desc" }, take: 5 });

  const activity = await Promise.all(
    EXAM_IDS.map(async (id) => {
      const [answers, plans] = await Promise.all([
        db.attempt.count({ where: { userId: user.id, exam: id } }),
        db.studyPlan.count({ where: { userId: user.id, exam: id } }),
      ]);
      return { id, answers, plan: plans > 0, active: answers > 0 || plans > 0 || hasExamAccess(user, id) };
    }),
  );
  activity.sort((a, b) => Number(b.active) - Number(a.active) || Number(b.plan) - Number(a.plan) || b.answers - a.answers);
  const anyActive = activity.some((a) => a.active);
  const full = activity.filter((a) => a.active || !anyActive);
  const folded = activity.filter((a) => !full.includes(a));

  return (
    <div className="space-y-8">
      {reset && <div className="card p-4" style={{ borderColor: "#16a34a" }}>Password updated. You&apos;re signed in, and other devices were signed out.</div>}
      {gift && <div className="card p-4" style={{ borderColor: "#16a34a" }}>Gift redeemed: {gift} is now active on your account. Good luck on the exam.</div>}
      {subscribed && <div className="card p-4" style={{ borderColor: "#16a34a" }}>Payment received. Your full question bank is active. (If it still says Free tier, refresh in a few seconds.)</div>}

      <ExtendPassCard user={user} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="muted">{accessSummary(user)}</p>
        </div>
        {user.stripeCustomerId || hasPaidAccess(user) ? (
          <form action="/api/stripe/portal" method="POST"><button className="btn-ghost">Manage billing</button></form>
        ) : (
          <Link href="/pricing" className="btn">Upgrade</Link>
        )}
      </div>

      {!anyActive && (
        <p className="muted">Pick the exam you&apos;re studying for. Everything for each exam lives on its page.</p>
      )}

      {full.map((a) => <ExamSection key={a.id} user={user} exam={a.id} answers={a.answers} plan={a.plan} />)}

      {folded.map((a) => (
        <Link key={a.id} href={`/exams/${a.id}`} className="card card-link p-4 flex items-center justify-between gap-3">
          <span>
            <span className="font-semibold">Also taking the {EXAMS[a.id].shortName}?</span>
            <span className="muted text-sm block">Open {EXAMS[a.id].name} for its study tools, diagnostic and topics.</span>
          </span>
          <Icon name="arrow" />
        </Link>
      ))}

      {mocks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Recent full exams</h2>
          <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
            {mocks.map((m) => (
              <Link key={m.id} href={`/exams/${m.exam}/mock/${m.id}`} className="p-3 flex justify-between text-sm hover:underline">
                <span>{EXAMS[m.exam as ExamId]?.name ?? m.exam} · {m.createdAt.toLocaleDateString()}</span>
                <span>{m.correct}/{m.total} ({Math.round((100 * m.correct) / m.total)}%) ›</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

async function ExamSection({ user, exam, answers, plan }: { user: User; exam: ExamId; answers: number; plan: boolean }) {
  const e = EXAMS[exam];
  const base = `/exams/${exam}`;
  const access = hasExamAccess(user, exam);
  const [stats, missed, due] = await Promise.all([topicStats(user.id, exam), missedCount(user, exam), dueCardCount(user, exam)]);
  const entries = e.topics.filter((t) => stats[t.slug]);
  const topicHref = (slug: string) => (exam === "pe-civil" && PE_MODULE_SPECS[slug] ? `${base}/modules/${slug}` : `${base}/topics/${slug}`);

  const quick = [
    { href: `${base}/flashcards`, label: due ? `Flashcards (${due} due)` : "Flashcards" },
    ...(missed ? [{ href: `${base}/quiz?go=1&source=missed&count=${missed > 10 ? 20 : 10}`, label: `Review my misses (${missed})` }] : []),
    { href: `${base}/quiz`, label: "Custom quiz" },
    { href: `${base}/mock`, label: "Full exam", locked: !access },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{e.name} {access ? "" : <span className="muted text-sm">(free tier)</span>}</h2>
        <Link href={base} className="btn-ghost !py-1.5 text-sm">All {e.shortName} study tools ›</Link>
      </div>

      {answers === 0 ? (
        <div className="card p-4 flex flex-wrap items-center gap-3" style={{ borderColor: "var(--brand)" }}>
          <p className="flex-1 min-w-56">
            <span className="font-semibold">Start here.</span> A {e.topics.length * 2}-question diagnostic finds your weak topics in about{" "}
            {Math.round((e.topics.length * 2 * EXAM_PACE_S[exam]) / 60)} minutes.
          </p>
          <Link href={`${base}/diagnostic`} className="btn w-full sm:w-auto">Take the diagnostic</Link>
        </div>
      ) : (
        <ReadinessCard user={user} exam={exam} back="/dashboard" />
      )}

      <nav aria-label={`${e.shortName} shortcuts`} className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="btn-ghost !py-1.5 text-sm inline-flex items-center gap-1.5">
            {q.label}
            {"locked" in q && q.locked && <span className="muted inline-flex"><Icon name="lock" size={14} /><span className="sr-only">(full access)</span></span>}
          </Link>
        ))}
      </nav>

      {plan ? (
        <StudyPlanCard user={user} exam={exam} back="/dashboard" />
      ) : (
        <p className="text-sm"><Link href={`${base}#progress`} className="underline">Set your {e.shortName} exam date</Link> to get a weekly study plan.</p>
      )}

      {entries.length > 0 && (
        <div className="card p-4 space-y-1">
          <p className="text-sm font-semibold mb-2">By topic <span className="muted font-normal">· tap one to review or practice it</span></p>
          {entries.map((t) => {
            const s = stats[t.slug];
            const pct = Math.round((100 * s.correct) / s.attempted);
            return (
              <Link key={t.slug} href={topicHref(t.slug)} className="block rounded -mx-2 px-2 py-1.5 hover:bg-[var(--border)]/40">
                <div className="flex justify-between text-sm">
                  <span>{t.name}</span>
                  <span className="muted">{pct}% · {s.attempted} answered ›</span>
                </div>
                <div className="h-2 rounded mt-1" style={{ background: "var(--border)" }}>
                  <div className="h-2 rounded bar-fill" style={{ width: `${pct}%`, background: pct >= 70 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626" }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
