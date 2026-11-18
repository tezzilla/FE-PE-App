import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { requireUser } from "@/lib/auth";
import { cardDeck } from "@/lib/cards";
import { Flashcards } from "@/components/Flashcards";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage({ params, searchParams }: { params: Promise<{ exam: string }>; searchParams: Promise<{ topic?: string }> }) {
  const { exam } = await params;
  const { topic } = await searchParams;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  if (topic && !def.topics.some((t) => t.slug === topic)) notFound();
  const user = await requireUser(`/exams/${exam}/flashcards`);
  const d = await cardDeck(user, exam, topic);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-xl sm:text-2xl font-bold">
          {def.name}: Formula flashcards{topic ? ` · ${def.topics.find((t) => t.slug === topic)!.name}` : ""}
        </h1>
      </div>
      <p className="muted text-sm">
        {d.dueCount} due · {d.newCount} new today · {d.learned} of {d.visible} learned. Knowing where a formula lives in the
        handbook saves minutes per problem; each card says where to look.
      </p>
      {d.visible < d.total && (
        <p className="text-sm">
          Free tier: {d.visible} of {d.total} cards. <Link href="/pricing" className="underline">Subscribe</Link> for the full deck.
        </p>
      )}
      <Flashcards cards={d.cards} />
    </div>
  );
}
