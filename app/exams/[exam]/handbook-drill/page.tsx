import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { drillItems } from "@/lib/handbook-drill";
import { HandbookDrill } from "@/components/HandbookDrill";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Handbook hunt drill | CivilPrep" };

export default async function HandbookDrillPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const items = drillItems(exam);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{EXAMS[exam].name}: handbook hunt</h1>
      <p className="muted text-sm">
        Ten formulas and rules. Pick the handbook chapter you&apos;d open for each, as fast as you can. Practicing lookups
        builds the speed you need with the electronic handbook on exam day.
      </p>
      {/* A new key each render, so "New round" (router.refresh) starts fresh. */}
      <HandbookDrill key={crypto.randomUUID()} items={items} />
    </div>
  );
}
