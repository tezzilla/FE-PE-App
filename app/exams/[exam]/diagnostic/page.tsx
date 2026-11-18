import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { toPublic } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { diagnosticSession } from "@/lib/adaptive/server";
import { EXAM_PACE_S } from "@/lib/adaptive/quiz";
import { Practice } from "@/components/Practice";

export const dynamic = "force-dynamic";

export default async function Diagnostic({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const user = await requireUser();
  const def = EXAMS[exam];
  const questions = await diagnosticSession(user, exam, 2);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl sm:text-2xl font-bold">{def.name}: Diagnostic</h1>
        <Link href={`/exams/${exam}`} className="muted text-sm hover:underline whitespace-nowrap">Exam overview</Link>
      </div>
      <p className="muted text-sm">
        About 2 questions from each of the {def.topics.length} topics. Your answers set a starting point for smart
        practice and your readiness score. Don&apos;t look anything up you wouldn&apos;t have on exam day.
      </p>
      <Practice
        questions={questions.map(toPublic)}
        topicNames={Object.fromEntries(def.topics.map((t) => [t.slug, t.name]))}
        lockedCount={0}
        againLabel="Another diagnostic round"
        paceS={EXAM_PACE_S[exam]}
      />
      <p className="text-sm">
        Done? See your weakest topics on the <Link href={`/exams/${exam}`} className="underline">exam overview</Link>, then start{" "}
        <Link href={`/exams/${exam}/smart`} className="underline">smart practice</Link>.
      </p>
    </div>
  );
}
