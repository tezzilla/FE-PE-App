import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { topicGuide } from "@/lib/content/topic-guides";
import { getCurrentUser } from "@/lib/auth";
import { topicReview } from "@/lib/topic-review";

type Params = Promise<{ exam: string; topic: string }>;

function lookup(exam: string, topic: string) {
  if (!isExamId(exam)) return null;
  const t = EXAMS[exam].topics.find((x) => x.slug === topic);
  const guide = topicGuide(exam, topic);
  return t && guide ? { exam, t, guide } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { exam, topic } = await params;
  const f = lookup(exam, topic);
  return f ? { title: `${f.t.name} review: ${EXAMS[f.exam].name} | CivilPrep`, description: f.guide.summary } : {};
}

const letter = (i: number) => String.fromCharCode(65 + i);

export default async function TopicReview({ params }: { params: Params }) {
  const { exam: examIn, topic } = await params;
  const f = lookup(examIn, topic);
  if (!f) notFound();
  const { exam } = f;
  const user = await getCurrentUser();
  const r = (await topicReview(user, exam, topic))!;
  const { topic: t, guide, cards, example, mastery } = r;
  const review = r.reviewedBy ? { reviewerName: r.reviewedBy, credential: null } : undefined;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href={`/exams/${exam}`} className="muted text-sm hover:underline">{EXAMS[exam].name}</Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t.name}</h1>
        <p className="muted text-sm">{t.examQuestions}{/\d/.test(t.examQuestions) ? " questions on the exam" : ""}</p>
        {mastery && mastery.evidence > 0 && (
          <p className="text-sm mt-1">Your mastery: <strong>{Math.round(mastery.mastery * 100)}%</strong> from {mastery.evidence} answers</p>
        )}
      </div>

      <p>{guide.summary}</p>
      <p className="text-sm"><span className="muted">Where to look on exam day:</span> {guide.handbook}</p>

      {cards.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Key formulas</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.id} className="card p-3">
                <p className="font-medium text-sm">{c.front}</p>
                <p className="whitespace-pre-line font-mono text-sm mt-1">{c.back}</p>
                <p className="muted text-xs mt-1">{c.ref}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Common traps</h2>
        <ul className="list-disc pl-5 space-y-1">
          {guide.traps.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </section>

      {example && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Worked example</h2>
          <div className="card p-4 space-y-3">
            <p className="whitespace-pre-line">{example.prompt}</p>
            <ol className="space-y-1">
              {example.choices.map((c, i) => <li key={i}><span className="font-semibold">{letter(i)}.</span> {c}</li>)}
            </ol>
            <details>
              <summary className="cursor-pointer font-medium" style={{ color: "var(--brand-text)" }}>Show solution</summary>
              <div className="mt-2 space-y-2">
                <p><strong>Answer: {letter(example.answer)}.</strong> {example.choices[example.answer]}</p>
                <p className="whitespace-pre-line">{example.explanation}</p>
                {example.reference && <p className="muted text-sm">{example.reference}</p>}
                {review?.reviewerName && (
                  <p className="muted text-xs">Problem type reviewed by {[review.reviewerName, review.credential].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </details>
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-3">
        <Link href={`/exams/${exam}/practice?topic=${topic}`} className="btn">Practice {t.name}</Link>
        {user && <Link href={`/exams/${exam}/quiz?go=1&count=10&timed=1&topic=${topic}`} className="btn-ghost">Timed 10-question quiz</Link>}
        {user && cards.length > 0 && <Link href={`/exams/${exam}/flashcards?topic=${topic}`} className="btn-ghost">Flashcards</Link>}
        {!user && <Link href="/signup" className="btn-ghost">Create a free account to track progress</Link>}
      </section>
    </div>
  );
}
