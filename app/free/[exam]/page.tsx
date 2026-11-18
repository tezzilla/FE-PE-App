import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { sampleSet } from "@/lib/leads";
import { LeadForm } from "@/components/LeadForm";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ exam: string }> }): Promise<Metadata> {
  const { exam } = await params;
  if (!isExamId(exam)) return {};
  return {
    title: `Free ${EXAMS[exam].name} practice problems (PDF) | CivilPrep`,
    description: `Free ${EXAMS[exam].name} exam-style practice problems with worked solutions and handbook references. Print it or save it as a PDF.`,
  };
}

export default async function FreeSample({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  const count = (await sampleSet(exam)).length;

  return (
    <div className="grid md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto md:pt-6">
      <div className="space-y-5">
        <p className="eyebrow">Free download</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {count} free {def.name} practice problems with worked solutions
        </h1>
        <ul className="space-y-3">
          {[
            `Spread across the ${def.topics.length} ${def.shortName} topic areas`,
            "Step-by-step solutions with the handbook section to look in",
            "Print it or save it as a PDF to work offline",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 shrink-0" style={{ color: "var(--good)" }}><Icon name="check" /></span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="card elevated p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-1">Where should we send it?</h2>
        <p className="muted text-sm mb-4">You&apos;ll see the problems right away.</p>
        <LeadForm exam={exam} />
      </div>
    </div>
  );
}
