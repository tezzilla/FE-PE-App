import Link from "next/link";
import type { User } from "@prisma/client";
import type { ExamId } from "@/lib/content/types";
import { pacing } from "@/lib/adaptive/server";
import { EXAM_PACE_S } from "@/lib/adaptive/quiz";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(Math.round(s % 60)).padStart(2, "0")}` : `${Math.round(s)}s`;
}

/** Average time per question against exam pace, by topic. Hidden until there are timed answers. */
export async function PacingCard({ user, exam }: { user: User; exam: ExamId }) {
  const p = await pacing(user, exam);
  if (p.total < 5) return null;
  const pace = EXAM_PACE_S[exam];
  const slow = p.rows.filter((r) => r.ratio > 1.25);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Pacing</h2>
        <p className="text-sm">
          Your average <strong>{fmt(p.overallS)}</strong> per question · exam pace <strong>{fmt(pace)}</strong>
        </p>
      </div>
      {p.rows.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="muted text-left"><th className="font-normal">Topic</th><th className="font-normal text-right">Avg</th><th className="font-normal text-right">Answered</th></tr>
          </thead>
          <tbody>
            {p.rows.map((r) => (
              <tr key={r.topic}>
                <td>{r.name}</td>
                <td className="text-right" style={{ color: r.ratio > 1.25 ? "#dc2626" : r.ratio > 1 ? "#ca8a04" : "#16a34a" }}>{fmt(r.avgS)}</td>
                <td className="text-right muted">{r.answered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted text-xs">
        Practice answers only, last 90 days, including time spent reading the problem.
        {slow.length > 0 && (
          <>
            {" "}You&apos;re well over exam pace in {slow.map((r) => r.name).join(", ")}.{" "}
            <Link
              href={`/exams/${exam}/quiz?go=1&timed=1&count=10&${slow.map((r) => `topic=${r.topic}`).join("&")}`}
              className="underline"
            >
              Try a timed quiz
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
