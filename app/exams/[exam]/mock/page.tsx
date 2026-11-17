import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { questionsFor, shuffle, toPublic } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { MockExam } from "@/components/MockExam";
import { generatedQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

const FULL_LENGTH = { "fe-civil": 110, "pe-civil": 80 } as const;

export default async function MockPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  const user = await requireUser();

  if (!hasExamAccess(user, exam)) {
    return (
      <div className="card p-6 max-w-xl mx-auto text-center space-y-3">
        <h1 className="text-2xl font-bold">Timed mock exams are for subscribers</h1>
        <p className="muted">Simulate the real {def.name} with exam pacing and a full score report.</p>
        <Link href="/pricing" className="btn">See plans</Link>
      </div>
    );
  }

  const generated = await generatedQuestions(exam, 2);
  const questions = shuffle([...questionsFor(exam), ...generated]).slice(0, FULL_LENGTH[exam]);
  const seconds = Math.round(questions.length * def.minutesPerQuestion * 60);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{def.name} mock exam</h1>
      <MockExam exam={exam} questions={questions.map(toPublic)} seconds={seconds} />
    </div>
  );
}
