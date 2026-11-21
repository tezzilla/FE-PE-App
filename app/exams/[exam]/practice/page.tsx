import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId, topicName } from "@/lib/content/exams";
import { questionsFor, shuffle, toPublic } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { canSeeQuestion, hasExamAccess } from "@/lib/access";
import { approvedTemplateCount, generatedQuestions } from "@/lib/questions";
import { areaPractice } from "@/lib/pe-modules";
import type { Question } from "@/lib/content/types";
import { Practice } from "@/components/Practice";
import { tutorEnabled } from "@/lib/tutor";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: string }>;
  searchParams: Promise<{ topic?: string; area?: string }>;
}) {
  const { exam } = await params;
  const { topic, area: areaParam } = await searchParams;
  if (!isExamId(exam)) notFound();
  if (topic && !EXAMS[exam].topics.some((t) => t.slug === topic)) notFound();

  // PE module knowledge area (e.g. ?topic=water-env&area=5): only the content mapped to that area.
  const user = await getCurrentUser();
  const ap = exam === "pe-civil" && topic && areaParam ? await areaPractice(user, topic, Number(areaParam)) : null;
  if (areaParam && !ap) notFound();
  const area = ap?.area;
  const access = hasExamAccess(user, exam);
  let all: Question[], generated: Question[], generators: number;
  if (ap) {
    ({ all, generated, generators } = ap);
  } else {
    all = questionsFor(exam, topic);
    // Subscribers also get fresh problems from every approved template, 3 per template per session.
    generated = access ? await generatedQuestions(exam, 3, topic) : [];
    generators = await approvedTemplateCount(exam, topic);
  }
  const visible = all.filter((q) => canSeeQuestion(user, q));
  const locked = all.length - visible.length + (access ? 0 : generators * 3);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold">
          {EXAMS[exam].name}: {topic ? topicName(exam, topic) : "Mixed practice"}
          {area && <span className="block text-base font-semibold muted mt-1">{area.n}. {area.name}</span>}
        </h1>
        {area ? (
          <Link href={`/exams/${exam}/modules/${topic}`} className="muted text-sm hover:underline whitespace-nowrap">‹ All {topicName(exam, topic!)} areas</Link>
        ) : topic ? (
          <Link href={`/exams/${exam}/${exam === "pe-civil" ? "modules" : "topics"}/${topic}`} className="muted text-sm hover:underline whitespace-nowrap">
            {exam === "pe-civil" ? `‹ ${topicName(exam, topic)} knowledge areas` : `‹ ${topicName(exam, topic)} review notes`}
          </Link>
        ) : null}
      </div>
      {!user && (
        <p className="muted text-sm">
          <Link href="/signup" className="underline">Create a free account</Link> to save your progress.
        </p>
      )}
      {area && visible.length + generated.length === 0 ? (
        <div className="card p-6 text-center space-y-3">
          <p className="font-semibold">This knowledge area is part of full access</p>
          <p className="muted text-sm">
            {all.length} question{all.length === 1 ? "" : "s"}
            {generators ? ` and ${generators} calculation problem${generators === 1 ? "" : "s"} that never repeat` : ""} cover it.
            You can try free sample questions from the PE Civil page.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/pricing" className="btn">See plans</Link>
            <Link href={`/exams/${exam}/modules/${topic}`} className="btn-ghost">Back to knowledge areas</Link>
          </div>
        </div>
      ) : (
      <Practice
        questions={shuffle([...visible, ...generated]).map(toPublic)}
        topicNames={Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name]))}
        lockedCount={locked}
        tutor={tutorEnabled() && !!user}
      />
      )}
    </div>
  );
}
