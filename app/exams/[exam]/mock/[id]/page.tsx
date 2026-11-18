import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Saved score report for a completed full exam. */
export default async function MockReport({ params }: { params: Promise<{ exam: string; id: string }> }) {
  const { exam, id } = await params;
  if (!isExamId(exam)) notFound();
  const user = await requireUser();
  const m = await db.mockExam.findUnique({ where: { id } });
  if (!m || m.userId !== user.id || m.exam !== exam || m.status !== "completed") notFound();

  const names = Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name]));
  const breakdown: Record<string, [number, number]> = m.breakdown ? JSON.parse(m.breakdown) : {};
  const rows = Object.entries(breakdown).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]);
  const pct = Math.round((100 * m.correct) / Math.max(1, m.total));
  const h = Math.floor(m.durationS / 3600), min = Math.floor((m.durationS % 3600) / 60);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Crumbs items={[{ href: `/exams/${exam}`, label: EXAMS[exam].name }, { href: `/exams/${exam}/mock`, label: "Full exams" }, { label: "Score report" }]} />
      <div className="card p-6 text-center space-y-1">
        <p className="muted text-sm">{EXAMS[exam].name} · {(m.completedAt ?? m.createdAt).toLocaleDateString("en-US")}</p>
        <p className="text-4xl font-extrabold">{pct}%</p>
        <p className="muted">{m.correct} of {m.total} correct · time used {h}h {min}m</p>
      </div>
      {rows.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold mb-2">By topic (weakest first)</h2>
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([topic, [c, t]]) => (
                <tr key={topic} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-1.5">{names[topic] ?? topic}</td>
                  <td className="py-1.5 text-right">{c}/{t}</td>
                  <td className="py-1.5 text-right w-16 font-semibold">{Math.round((100 * c) / t)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href={`/exams/${exam}/smart`} className="btn">Practice weak topics</Link>
    </div>
  );
}
