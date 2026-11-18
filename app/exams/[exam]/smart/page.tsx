import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { toPublic } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { smartSession } from "@/lib/adaptive/server";
import { Practice } from "@/components/Practice";
import { tutorEnabled } from "@/lib/tutor";

export const dynamic = "force-dynamic";

export default async function SmartPractice({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const user = await requireUser(`/exams/${exam}/smart`);
  const { questions, reasons } = await smartSession(user, exam, 10);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl sm:text-2xl font-bold">{EXAMS[exam].name}: Smart practice</h1>
      </div>
      <p className="muted text-sm">
        10 questions picked for you: problems you missed, topics where you&apos;re weakest relative to how much
        they count on the exam, and spaced reviews so you don&apos;t forget what you&apos;ve learned.
      </p>
      {!hasExamAccess(user, exam) && (
        <p className="text-sm">
          Free tier: smart practice draws from sample questions only.{" "}
          <Link href="/pricing" className="underline">Subscribe</Link> to practice every calculation problem, with new values each time.
        </p>
      )}
      <Practice
        questions={questions.map(toPublic)}
        topicNames={Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name]))}
        lockedCount={0}
        tutor={tutorEnabled()}
        reasons={reasons}
        againLabel="Next smart session"
      />
    </div>
  );
}
