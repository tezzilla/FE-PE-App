import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { accessSummary, hasExamAccess, hasPaidAccess } from "@/lib/access";
import { EXAMS } from "@/lib/content/exams";
import { topicStats } from "@/lib/progress";
import { db } from "@/lib/db";
import { ReadinessCard } from "@/components/ReadinessCard";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ subscribed?: string }> }) {
  const user = await requireUser();
  const { subscribed } = await searchParams;
  const mocks = await db.mockExam.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });

  return (
    <div className="space-y-8">
      {subscribed && <div className="card p-4" style={{ borderColor: "#16a34a" }}>Payment received. Full question bank unlocked. (If it still says Free tier, refresh in a few seconds.)</div>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome{user.name ? `, ${user.name}` : ""}</h1>
          <p className="muted">
            {accessSummary(user)}
          </p>
        </div>
        {user.stripeCustomerId || hasPaidAccess(user) ? (
          <form action="/api/stripe/portal" method="POST"><button className="btn-ghost">Manage billing</button></form>
        ) : (
          <Link href="/pricing" className="btn">Upgrade</Link>
        )}
      </div>

      {await Promise.all(
        Object.values(EXAMS).map(async (e) => {
          const stats = await topicStats(user.id, e.id);
          const entries = e.topics.filter((t) => stats[t.slug]);
          return (
            <section key={e.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{e.name} {hasExamAccess(user, e.id) ? "" : <span className="muted text-sm">(free tier)</span>}</h2>
                <Link href={`/exams/${e.id}`} className="hover:underline text-sm">Study →</Link>
              </div>
              <ReadinessCard user={user} exam={e.id} back="/dashboard" />
              {entries.length === 0 ? (
                <p className="muted text-sm">No questions answered yet.</p>
              ) : (
                <div className="card p-4 space-y-3">
                  {entries.map((t) => {
                    const s = stats[t.slug];
                    const pct = Math.round((100 * s.correct) / s.attempted);
                    return (
                      <div key={t.slug}>
                        <div className="flex justify-between text-sm">
                          <span>{t.name}</span>
                          <span className="muted">{pct}% · {s.attempted} answered</span>
                        </div>
                        <div className="h-2 rounded mt-1" style={{ background: "var(--border)" }}>
                          <div className="h-2 rounded" style={{ width: `${pct}%`, background: pct >= 70 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        }),
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent mock exams</h2>
        {mocks.length === 0 ? (
          <p className="muted text-sm">None yet.</p>
        ) : (
          <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
            {mocks.map((m) => (
              <div key={m.id} className="p-3 flex justify-between text-sm">
                <span>{EXAMS[m.exam as keyof typeof EXAMS]?.name ?? m.exam} · {m.createdAt.toLocaleDateString()}</span>
                <span>{m.correct}/{m.total} ({Math.round((100 * m.correct) / m.total)}%)</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
