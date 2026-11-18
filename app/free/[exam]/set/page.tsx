import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXAMS, isExamId, topicName } from "@/lib/content/exams";
import { sampleSet, verifySampleToken } from "@/lib/leads";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const letter = (i: number) => String.fromCharCode(65 + i);

export default async function SampleSetPage({ params, searchParams }: { params: Promise<{ exam: string }>; searchParams: Promise<{ t?: string }> }) {
  const { exam } = await params;
  const { t } = await searchParams;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  if (!t || !(await verifySampleToken(t, exam))) {
    return (
      <div className="card p-6 max-w-lg mx-auto text-center space-y-3">
        <h1 className="text-xl font-bold">This link has expired</h1>
        <p className="muted">Request the free problem set again and we&apos;ll send a fresh link.</p>
        <Link href={`/free/${exam}`} className="btn">Get the free problem set</Link>
      </div>
    );
  }
  const qs = await sampleSet(exam);

  return (
    <article className="max-w-3xl mx-auto space-y-8 print-sheet">
      <header className="space-y-2">
        <p className="eyebrow">CivilPrep free problem set</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{def.name}: {qs.length} practice problems</h1>
        <p className="muted">
          Work each problem with the NCEES reference handbook open, then check the answer key at the end. Aim for about{" "}
          {exam === "pe-civil" ? "6" : "3"} minutes per problem, the real exam pace.
        </p>
        <div className="no-print flex flex-wrap gap-3 pt-2">
          <PrintButton />
          <Link href="/signup" className="btn-ghost">Practice online with smart practice</Link>
        </div>
      </header>

      <ol className="space-y-6">
        {qs.map((q, i) => (
          <li key={q.id} className="card p-5 space-y-3 avoid-break">
            <p className="muted text-xs font-semibold">Problem {i + 1} · {topicName(exam, q.topic)}</p>
            <p className="leading-relaxed whitespace-pre-line">{q.prompt}</p>
            <ol className="space-y-1">
              {q.choices.map((c, k) => (
                <li key={k}><span className="font-semibold">{letter(k)}.</span> {c}</li>
              ))}
            </ol>
          </li>
        ))}
      </ol>

      <section className="space-y-4 page-break-before">
        <h2 className="text-2xl font-bold">Answer key and solutions</h2>
        <ol className="space-y-5">
          {qs.map((q, i) => (
            <li key={q.id} className="avoid-break space-y-1">
              <p className="font-semibold">Problem {i + 1}: {letter(q.answer)}. {q.choices[q.answer]}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{q.explanation}</p>
              {q.reference && <p className="muted text-xs">{q.reference}</p>}
            </li>
          ))}
        </ol>
      </section>

      <footer className="card p-6 text-center space-y-2 avoid-break">
        <p className="font-semibold text-lg">Want problems picked for your weak spots?</p>
        <p className="muted text-sm">
          CivilPrep&apos;s smart practice finds your weakest topics, gives you practice problems that never repeat, and tracks your
          readiness. Start free at getcivilprep.com.
        </p>
        <Link href="/signup" className="btn no-print">Start free</Link>
        <p className="muted text-xs pt-2">© CivilPrep. For personal study. CivilPrep is not affiliated with NCEES.</p>
      </footer>
    </article>
  );
}
