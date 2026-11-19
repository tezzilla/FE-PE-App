import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import type { Metadata } from "next";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { drillItems } from "@/lib/handbook-drill";
import { HandbookDrill } from "@/components/HandbookDrill";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Handbook hunt drill | CivilPrep" };

export default async function HandbookDrillPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const user = await getCurrentUser();
  const { items, locked, totalCards } = drillItems(exam, hasExamAccess(user, exam));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{EXAMS[exam].name}: handbook hunt</h1>
      <p className="muted text-sm">
        Ten formulas and rules at a time. Pick the handbook chapter you&apos;d open for each, as fast as you can. Practicing
        lookups builds the speed you need with the electronic handbook on exam day.
      </p>
      {locked ? (
        <div className="card p-6 space-y-3 text-center">
          <p className="text-lg font-semibold">Handbook hunt is part of full access</p>
          <p className="muted text-sm">
            Drill all {totalCards} {EXAMS[exam].shortName} formulas against the clock, with a new set every round and your
            average lookup time at the end.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/pricing" className="btn">See plans</Link>
            {!user && <Link href={`/login?next=${encodeURIComponent(`/exams/${exam}/handbook-drill`)}`} className="btn-ghost">Log in</Link>}
          </div>
        </div>
      ) : (
        /* A new key each render, so "New round" (router.refresh) starts fresh. */
        <HandbookDrill key={crypto.randomUUID()} items={items} />
      )}
    </div>
  );
}
