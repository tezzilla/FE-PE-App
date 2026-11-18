import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { toPublic } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { missedCount, quizSession } from "@/lib/adaptive/server";
import { EXAM_PACE_S, QUIZ_COUNTS, QUIZ_SOURCES, type QuizSource } from "@/lib/adaptive/quiz";
import { Practice } from "@/components/Practice";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<QuizSource, string> = {
  all: "All problems",
  missed: "Ones I missed last time",
  unseen: "Ones I haven't tried",
};

type Search = { topic?: string | string[]; count?: string; source?: string; timed?: string; go?: string };

export default async function QuizPage({ params, searchParams }: { params: Promise<{ exam: string }>; searchParams: Promise<Search> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const sp = await searchParams;
  const user = await requireUser();
  const def = EXAMS[exam];
  const slugs = def.topics.map((t) => t.slug);
  const picked = [sp.topic ?? []].flat().filter((t) => slugs.includes(t));
  const topics = picked.length ? picked : slugs;
  const count = QUIZ_COUNTS.find((c) => String(c) === sp.count) ?? 20;
  const source: QuizSource = QUIZ_SOURCES.find((s) => s === sp.source) ?? "all";
  const timed = sp.timed === "1";
  const topicNames = Object.fromEntries(def.topics.map((t) => [t.slug, t.name]));
  const access = hasExamAccess(user, exam);

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h1 className="text-xl sm:text-2xl font-bold">{def.name}: {source === "missed" && sp.go ? "Review my misses" : "Custom quiz"}</h1>
      <Link href={`/exams/${exam}`} className="muted text-sm hover:underline whitespace-nowrap">Exam overview</Link>
    </div>
  );

  if (sp.go) {
    const questions = await quizSession(user, exam, { topics, count, source });
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {header}
        <p className="muted text-sm">
          {questions.length} question{questions.length === 1 ? "" : "s"} · {SOURCE_LABEL[source]}
          {picked.length ? ` · ${picked.map((t) => topicNames[t]).join(", ")}` : " · all topics"}
          {timed ? " · timed at exam pace" : ""}
          {" · "}<Link href={`/exams/${exam}/quiz`} className="underline">Change</Link>
        </p>
        {questions.length === 0 ? (
          <div className="card p-6 space-y-2 text-center">
            <p className="font-semibold">
              {source === "missed" ? "Nothing to review: your last answer on every problem was right." : "No problems match these settings."}
            </p>
            <Link href={`/exams/${exam}/quiz`} className="btn inline-block">Build another quiz</Link>
          </div>
        ) : (
          <Practice
            questions={questions.map(toPublic)}
            topicNames={topicNames}
            lockedCount={0}
            againLabel="New quiz, same settings"
            timeLimitS={timed ? questions.length * EXAM_PACE_S[exam] : undefined}
            paceS={EXAM_PACE_S[exam]}
          />
        )}
      </div>
    );
  }

  const misses = await missedCount(user, exam);
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {header}
      {!access && (
        <p className="text-sm">
          Free tier: quizzes draw from sample questions only. <Link href="/pricing" className="underline">Subscribe</Link> for the full bank.
        </p>
      )}
      <form className="card p-4 space-y-4" method="get">
        <input type="hidden" name="go" value="1" />
        <fieldset>
          <legend className="font-semibold">Topics</legend>
          <p className="muted text-sm">Leave all unchecked for every topic.</p>
          <div className="grid sm:grid-cols-2 gap-1 mt-2">
            {def.topics.map((t) => (
              <label key={t.slug} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="topic" value={t.slug} defaultChecked={picked.includes(t.slug)} /> {t.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">Questions</legend>
          <div className="flex gap-4 mt-1">
            {QUIZ_COUNTS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="radio" name="count" value={c} defaultChecked={c === count} /> {c}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">Which problems</legend>
          <div className="flex flex-wrap gap-4 mt-1">
            {QUIZ_SOURCES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="radio" name="source" value={s} defaultChecked={s === source} /> {SOURCE_LABEL[s]}
                {s === "missed" ? ` (${misses})` : ""}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="timed" value="1" defaultChecked={timed} />
          Timed at exam pace ({Math.round(EXAM_PACE_S[exam] / 6) / 10} min per question)
        </label>
        <button className="btn">Start quiz</button>
      </form>
    </div>
  );
}
