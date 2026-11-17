import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId, topicName } from "@/lib/content/exams";
import { questionsFor, shuffle, toPublic } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { canSeeQuestion } from "@/lib/access";
import { Practice } from "@/components/Practice";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const { exam } = await params;
  const { topic } = await searchParams;
  if (!isExamId(exam)) notFound();
  if (topic && !EXAMS[exam].topics.some((t) => t.slug === topic)) notFound();

  const user = await getCurrentUser();
  const all = questionsFor(exam, topic);
  const visible = all.filter((q) => canSeeQuestion(user, q));
  const locked = all.length - visible.length;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {EXAMS[exam].name}: {topic ? topicName(exam, topic) : "Mixed practice"}
        </h1>
        <Link href={`/exams/${exam}`} className="muted text-sm hover:underline">All topics</Link>
      </div>
      {!user && (
        <p className="muted text-sm">
          <Link href="/signup" className="underline">Create a free account</Link> to save your progress.
        </p>
      )}
      <Practice
        questions={shuffle(visible).map(toPublic)}
        topicNames={Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name]))}
        lockedCount={locked}
      />
    </div>
  );
}
