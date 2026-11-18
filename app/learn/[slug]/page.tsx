import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXPLAINERS, getExplainer } from "@/lib/content/explainers";
import { EXAMS, topicName } from "@/lib/content/exams";
import { getTemplate } from "@/lib/templates";
import { templateToQuestion } from "@/lib/templates/engine";
import { approvedTemplates } from "@/lib/reviews";

// Public explainer page for one formula: what it is, variables, when to use it, mistakes, where it is
// in the handbook, and a worked example. Statically generated and revalidated hourly.

export const revalidate = 3600;

export function generateStaticParams() {
  return EXPLAINERS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getExplainer((await params).slug);
  if (!e) return {};
  return {
    title: `${e.title}: formula, variables and a worked example | CivilPrep`,
    description: `${e.summary} With the formula, common mistakes, where it is in the reference handbook, and a worked FE/PE Civil example.`,
    alternates: { canonical: `/learn/${e.slug}` },
  };
}

const letter = (i: number) => String.fromCharCode(65 + i);

export default async function ExplainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = getExplainer((await params).slug);
  if (!e) notFound();
  const approved = await approvedTemplates();
  const t = getTemplate(e.templateId);
  // A fixed seed keeps the example stable for readers and search engines.
  const example = t && approved.has(t.id) ? templateToQuestion(t, e.exam, 4242) : null;
  const related = EXPLAINERS.filter((x) => x.slug !== e.slug && x.topic === e.topic).slice(0, 4);

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Link href="/learn" className="muted text-sm hover:underline">Formula guides</Link>
        <h1 className="text-3xl font-bold tracking-tight">{e.title}</h1>
        <p className="muted text-lg">{e.summary}</p>
      </div>

      <section className="card p-5 space-y-3">
        <p className="eyebrow">Formula</p>
        <p className="font-mono text-lg break-words">{e.formula}</p>
        <dl className="grid sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {e.variables.map(([v, d]) => (
            <div key={v} className="contents">
              <dt className="font-mono font-semibold">{v}</dt>
              <dd className="muted">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">When to use it</h2>
        <p>{e.whenToUse}</p>
        <p className="text-sm"><span className="muted">Where to find it on exam day:</span> {e.handbook}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Common mistakes</h2>
        <ul className="list-disc pl-5 space-y-1">{e.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
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
              </div>
            </details>
          </div>
        </section>
      )}

      <section className="navy-section rounded-2xl p-6 space-y-3">
        <h2 className="text-xl font-semibold">Practice it with new numbers every time</h2>
        <p className="muted">
          CivilPrep has unlimited versions of this problem and hundreds more for the {EXAMS[e.exam].name} exam, with worked solutions and
          smart practice that targets your weak topics.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/exams/${e.exam}/practice?topic=${e.topic}`} className="btn">Practice {topicName(e.exam, e.topic)}</Link>
          <Link href="/signup" className="btn-ghost">Create a free account</Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Related formulas</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {related.map((r) => (
              <li key={r.slug}><Link href={`/learn/${r.slug}`} className="card card-link p-3 block text-sm"><span className="font-medium">{r.title}</span><span className="muted block">{r.summary}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
