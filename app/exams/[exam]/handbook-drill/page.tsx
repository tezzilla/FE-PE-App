import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { flashcardsFor } from "@/lib/content/flashcards";
import { shuffle } from "@/lib/content";
import { HandbookDrill, type DrillItem } from "@/components/HandbookDrill";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Handbook hunt drill | CivilPrep" };

/** "FE Reference Handbook: Mechanics of Materials (columns)" -> "Mechanics of Materials" */
const chapter = (ref: string) => ref.replace(/^.*?Handbook:\s*/i, "").replace(/\s*\(.*\)\s*$/, "").trim();

export default async function HandbookDrillPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const cards = flashcardsFor(exam).filter((c) => c.ref);
  const chapters = [...new Set(cards.map((c) => chapter(c.ref!)))];
  const items: DrillItem[] = shuffle(cards)
    .slice(0, 10)
    .map((c) => {
      const right = chapter(c.ref!);
      const choices = shuffle([right, ...shuffle(chapters.filter((x) => x !== right)).slice(0, 3)]);
      return { prompt: c.front, choices, answer: choices.indexOf(right) };
    });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">{EXAMS[exam].name}: handbook hunt</h1>
        <Link href={`/exams/${exam}`} className="muted text-sm hover:underline">Back to {EXAMS[exam].shortName}</Link>
      </div>
      <p className="muted text-sm">
        Ten formulas and rules. Pick the handbook chapter you&apos;d open for each, as fast as you can. Practicing lookups
        builds the speed you need with the electronic handbook on exam day.
      </p>
      {/* A new key each render, so "New round" (router.refresh) starts fresh. */}
      <HandbookDrill key={crypto.randomUUID()} items={items} />
    </div>
  );
}
