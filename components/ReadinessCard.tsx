import Link from "next/link";
import type { User } from "@prisma/client";
import type { ExamId } from "@/lib/content/types";
import { EXAMS, topicName } from "@/lib/content/exams";
import { examReadiness } from "@/lib/adaptive/server";
import { setPeDepth } from "@/app/actions/prefs";

export async function ReadinessCard({ user, exam, back }: { user: User; exam: ExamId; back: string }) {
  const r = await examReadiness(user, exam);
  const pct = Math.round(r.score * 100);
  const cov = Math.round(r.coverage * 100);
  const color = pct >= 70 ? "#16a34a" : pct >= 55 ? "#ca8a04" : "#dc2626";

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <p className="muted text-sm">Readiness</p>
          <p className="text-4xl font-extrabold" style={{ color: r.answered ? color : undefined }}>
            {r.answered ? `${pct}%` : "–"}
          </p>
          <p className="muted text-xs">exam-weighted mastery</p>
        </div>
        <div className="flex-1 min-w-56 space-y-2">
          <div>
            <div className="flex justify-between text-sm"><span>Exam coverage</span><span className="muted">{cov}%</span></div>
            <div className="h-2 rounded mt-1" style={{ background: "var(--border)" }}>
              <div className="h-2 rounded bar-fill" style={{ width: `${cov}%`, background: "var(--brand)" }} />
            </div>
          </div>
          <p className="text-sm">
            <span className="muted">Focus next: </span>
            {r.weakest.map((w) => topicName(exam, w.topic)).join(", ")}
          </p>
          {r.dueReviews > 0 && <p className="text-sm">{r.dueReviews} problem type{r.dueReviews > 1 ? "s" : ""} due for review</p>}
        </div>
        <Link href={`/exams/${exam}/smart`} className="btn self-center w-full sm:w-auto">Smart practice</Link>
      </div>

      {exam === "pe-civil" && (
        <form action={setPeDepth} className="flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="back" value={back} />
          <span className="muted">Your depth module:</span>
          <select name="peDepth" defaultValue={user.peDepth ?? ""} className="input !w-auto !py-1">
            <option value="">Not chosen (equal weights)</option>
            {EXAMS["pe-civil"].topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
          <button className="btn-ghost !py-1">Save</button>
        </form>
      )}

      <p className="muted text-xs">
        {r.answered === 0
          ? "Answer a few questions and this fills in. Unpracticed topics count as weak until you show otherwise."
          : "Readiness weights each topic by its share of the exam and favors recent answers. It measures progress, not a guaranteed pass."}
      </p>
    </div>
  );
}
