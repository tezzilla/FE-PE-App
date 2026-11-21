import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { toPublic } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { FullExam } from "@/components/FullExam";
import { FULL_EXAM, examPlan, loadSessions, sessionSeconds } from "@/lib/exam-builder";
import { discardFullExam, startFullExam } from "./actions";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600 * 1000;

export default async function MockPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  const user = await requireUser(`/exams/${exam}/mock`);

  if (!hasExamAccess(user, exam)) {
    return (
      <div className="card p-6 max-w-xl mx-auto text-center space-y-3">
        <h1 className="text-2xl font-semibold">Full-length exams are for subscribers</h1>
        <p className="muted">Simulate the real {def.name}: {FULL_EXAM[exam].questions} questions weighted like the exam, two timed sessions, and a score report by topic.</p>
        <Link href="/pricing" className="btn">See plans</Link>
      </div>
    );
  }

  const topicNames = Object.fromEntries(def.topics.map((t) => [t.slug, t.name]));
  const inProgress = await db.mockExam.findFirst({
    where: { userId: user.id, exam, status: "in_progress", createdAt: { gt: new Date(Date.now() - DAY) } },
    orderBy: { createdAt: "desc" },
  });

  if (inProgress?.sessions) {
    const sessions = await loadSessions(inProgress.sessions);
    return (
      <div className="max-w-6xl mx-auto space-y-4" data-exam-running>
        <h1 className="text-2xl font-semibold">{def.name} full exam</h1>
        <FullExam
          discard={
            <form action={discardFullExam}>
              <input type="hidden" name="exam" value={exam} />
              <button className="muted text-sm underline">Discard and start over</button>
            </form>
          }
          mockId={inProgress.id}
          exam={exam}
          sessions={sessions.map((s) => s.map(toPublic))}
          sessionSeconds={sessions.map((s) => sessionSeconds(exam, s.length))}
          topicNames={topicNames}
        />
      </div>
    );
  }

  // Intro: show the blueprint and warn if some topics don't have enough content yet.
  const rows = (await examPlan(user, exam)).map((r) => ({
    name: r.name,
    target: r.target,
    available: r.gens.length ? Infinity : r.fixed.length,
  }));
  const total = rows.reduce((a, r) => a + Math.min(r.target, r.available), 0);
  const past = await db.mockExam.findMany({
    where: { userId: user.id, exam, status: "completed" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">{def.name} full exam</h1>
      <div className="card p-5 space-y-3">
        <p>
          {FULL_EXAM[exam].questions} questions weighted like the real exam, in two timed sessions
          ({Math.round(FULL_EXAM[exam].minutes / 60 * 10) / 10} hours of exam time) with an optional 25-minute break.
          {exam === "pe-civil" && !user.peDepth && " Choose your PE module on the exam page to build the exam from that module's NCEES knowledge areas."}
        </p>
        {total < FULL_EXAM[exam].questions && (
          <p className="text-sm" style={{ color: "#ca8a04" }}>
            Some topics don&apos;t have enough reviewed questions yet, so this exam will have {total} questions.
          </p>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer">{exam === "pe-civil" && user.peDepth ? "Questions per knowledge area" : "Questions per topic"}</summary>
          <table className="w-full mt-2">
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-1">{r.name}</td>
                  <td className="py-1 text-right">{Math.min(r.target, r.available)}{r.available < r.target ? ` of ${r.target}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <form action={startFullExam}>
          <input type="hidden" name="exam" value={exam} />
          <button className="btn">Start full exam</button>
        </form>
      </div>
      {past.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Past exams</h2>
          {past.map((m) => (
            <Link key={m.id} href={`/exams/${exam}/mock/${m.id}`} className="flex justify-between text-sm py-1.5 border-t hover:underline" style={{ borderColor: "var(--border)" }}>
              <span>{m.createdAt.toLocaleDateString("en-US")}</span>
              <span>{m.correct}/{m.total} ({Math.round((100 * m.correct) / Math.max(1, m.total))}%)</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
