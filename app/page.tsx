import Link from "next/link";
import { EXAMS } from "@/lib/content/exams";
import { SOLD_PLANS } from "@/lib/plans";

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const cheapest = Math.min(...SOLD_PLANS.filter((p) => p.kind === "subscription").map((p) => p.price));
  return (
    <div className="space-y-16">
      {deleted && <div className="card p-4 text-center">Your account has been deleted.</div>}
      <section className="text-center py-10 space-y-5">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Pass the FE and PE Civil <br className="hidden sm:block" />
          without the $1,000 course.
        </h1>
        <p className="muted text-lg max-w-2xl mx-auto">
          Exam-style practice problems with full worked solutions, timed mock exams, and topic-by-topic
          progress tracking. From ${cheapest}/month. Cancel anytime.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/signup" className="btn">Start free</Link>
          <Link href="/pricing" className="btn-ghost">See pricing</Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-6">
        {Object.values(EXAMS).map((e) => (
          <Link key={e.id} href={`/exams/${e.id}`} className="card p-6 hover:shadow-md transition">
            <h2 className="text-xl font-bold">{e.name}</h2>
            <p className="muted mt-2">{e.description}</p>
            <p className="text-sm mt-3">{e.topics.length} topic areas · {e.realExam}</p>
          </Link>
        ))}
      </section>

      <section className="grid sm:grid-cols-3 gap-6">
        {[
          ["Worked solutions", "Every problem shows the method, the equation, and where to find it in the reference handbook."],
          ["Real exam pacing", "Mock exams use the same minutes-per-question as the real computer-based test."],
          ["Know your weak spots", "Accuracy by topic tells you exactly what to study next."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="muted text-sm mt-1">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
