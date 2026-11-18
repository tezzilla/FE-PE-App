import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { ExamNav } from "@/components/ExamNav";

export default async function ExamLayout({ children, params }: { children: React.ReactNode; params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  return (
    <>
      <ExamNav exam={exam} name={EXAMS[exam].name} />
      {children}
    </>
  );
}
