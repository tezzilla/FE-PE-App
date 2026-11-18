import Link from "next/link";
import type { User } from "@prisma/client";
import type { ExamId } from "@/lib/content/types";
import { EXAMS } from "@/lib/content/exams";
import { studyPlanFor } from "@/lib/adaptive/server";
import { deleteStudyPlan, saveStudyPlan } from "@/app/actions/plan";

const STATUS = {
  ahead: { text: "Ahead of plan", color: "#16a34a" },
  "on-track": { text: "On track", color: "#16a34a" },
  behind: { text: "Behind this week", color: "#ca8a04" },
} as const;

function PlanForm({ exam, back, date, hours, submit }: { exam: ExamId; back: string; date?: string; hours?: number; submit: string }) {
  return (
    <form action={saveStudyPlan} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="exam" value={exam} />
      <input type="hidden" name="back" value={back} />
      <label className="text-sm">
        Exam date
        <input type="date" name="examDate" required defaultValue={date} className="input mt-1 !w-auto" />
      </label>
      <label className="text-sm">
        Study hours per week
        <input type="number" name="weeklyHours" required min={1} max={60} defaultValue={hours ?? 10} className="input mt-1 !w-24" />
      </label>
      <button className="btn-ghost">{submit}</button>
    </form>
  );
}

export async function StudyPlanCard({ user, exam, back, error }: { user: User; exam: ExamId; back: string; error?: string }) {
  const data = await studyPlanFor(user, exam);
  const errorText = error === "date" ? "Pick an exam date in the future (within 2 years)." : error === "hours" ? "Weekly hours must be 1 to 60." : null;

  if (!data) {
    return (
      <div className="card p-5 space-y-3">
        <p className="font-semibold">Study plan</p>
        <p className="muted text-sm">Set your {EXAMS[exam].shortName} exam date and how much you can study each week. We&apos;ll pace your weeks, pick focus topics, and schedule full practice exams.</p>
        {errorText && <p className="text-red-500 text-sm">{errorText}</p>}
        <PlanForm exam={exam} back={back} submit="Create my plan" />
      </div>
    );
  }

  const { saved, plan } = data;
  const pct = Math.min(1, plan.answeredLast7Days / Math.max(1, plan.weeklyTarget));
  const st = STATUS[plan.status];
  return (
    <div className="card p-5 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">Study plan</p>
        <p className="text-sm">
          {plan.phase === "past" ? "Exam date passed" : <><strong>{plan.daysLeft}</strong> days to your exam ({saved.examDate.toLocaleDateString("en-US")})</>}
        </p>
      </div>
      <p className="text-sm">{plan.phaseLabel}</p>
      {plan.phase !== "past" && (
        <div>
          <div className="flex justify-between text-sm">
            <span>Last 7 days: {plan.answeredLast7Days} of {plan.weeklyTarget} questions ({saved.weeklyHours} h/week)</span>
            <span style={{ color: st.color }} className="font-semibold">{st.text}</span>
          </div>
          <div className="h-2 rounded mt-1" style={{ background: "var(--border)" }}>
            <div className="h-2 rounded" style={{ width: `${Math.round(pct * 100)}%`, background: st.color }} />
          </div>
        </div>
      )}
      {plan.focus.length > 0 && plan.phase !== "past" && (
        <p className="text-sm">
          <span className="muted">This week, focus on: </span>
          {plan.focus.map((f) => f.name).join(", ")}{" "}
          <Link href={`/exams/${exam}/smart`} className="underline">Smart practice</Link>
        </p>
      )}
      {plan.milestones.length > 0 && (
        <ul className="text-sm space-y-1">
          {plan.milestones.map((m) => (
            <li key={m.label}>
              {m.done ? "✓" : "○"} {m.label}: {m.date.toLocaleDateString("en-US")}
              {!m.done && m.date.getTime() <= Date.now() + 3 * 24 * 3600 * 1000 && (
                <> · <Link href={`/exams/${exam}/mock`} className="underline">take it now</Link></>
              )}
            </li>
          ))}
        </ul>
      )}
      {plan.warning && <p className="text-sm" style={{ color: "#ca8a04" }}>{plan.warning}</p>}
      {errorText && <p className="text-red-500 text-sm">{errorText}</p>}
      <details className="text-sm">
        <summary className="cursor-pointer muted">Change plan</summary>
        <div className="mt-2 space-y-2">
          <PlanForm exam={exam} back={back} date={saved.examDate.toISOString().slice(0, 10)} hours={saved.weeklyHours} submit="Save" />
          <form action={deleteStudyPlan}>
            <input type="hidden" name="exam" value={exam} />
            <input type="hidden" name="back" value={back} />
            <button className="muted underline">Remove plan</button>
          </form>
        </div>
      </details>
    </div>
  );
}
