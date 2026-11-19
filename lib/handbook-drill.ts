import type { ExamId } from "@/lib/content/types";
import { flashcardsFor } from "@/lib/content/flashcards";
import { shuffle } from "@/lib/content";

// "Which handbook chapter would you open?" items, built from the formula flashcards' handbook references.
// Shared by the website drill and the app.

export type DrillItem = { prompt: string; choices: string[]; answer: number };

/** "FE Reference Handbook: Mechanics of Materials (columns)" -> "Mechanics of Materials" */
const chapter = (ref: string) => ref.replace(/^.*?Handbook:\s*/i, "").replace(/\s*\(.*\)\s*$/, "").trim();

/** Items in a free sample round, drawn only from the free flashcards. */
export const SAMPLE_SIZE = 4;

/**
 * A drill round. With full access: 10 items from every formula card. Without: a short sample round from
 * the free cards only, so paid cards' names and handbook locations aren't given away.
 */
export function drillItems(exam: ExamId, full: boolean): { items: DrillItem[]; sample: boolean; totalCards: number } {
  const cards = flashcardsFor(exam).filter((c) => c.ref);
  const chapters = [...new Set(cards.map((c) => chapter(c.ref!)))];
  const source = full ? cards : cards.filter((c) => c.free);
  const items = shuffle(source)
    .slice(0, full ? 10 : SAMPLE_SIZE)
    .map((c) => {
      const right = chapter(c.ref!);
      const choices = shuffle([right, ...shuffle(chapters.filter((x) => x !== right)).slice(0, 3)]);
      return { prompt: c.front, choices, answer: choices.indexOf(right) };
    });
  return { items, sample: !full, totalCards: cards.length };
}
