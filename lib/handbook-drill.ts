import type { ExamId } from "@/lib/content/types";
import { flashcardsFor } from "@/lib/content/flashcards";
import { shuffle } from "@/lib/content";

// "Which handbook chapter would you open?" items, built from the formula flashcards' handbook references.
// Shared by the website drill and the app.

export type DrillItem = { prompt: string; choices: string[]; answer: number };

/** "FE Reference Handbook: Mechanics of Materials (columns)" -> "Mechanics of Materials" */
const chapter = (ref: string) => ref.replace(/^.*?Handbook:\s*/i, "").replace(/\s*\(.*\)\s*$/, "").trim();

/**
 * A drill round: 10 items from every formula card. Subscribers only (it reveals every card's name and
 * where it lives in the handbook); without access the round is empty and `locked` is set.
 */
export function drillItems(exam: ExamId, access: boolean): { items: DrillItem[]; locked: boolean; totalCards: number } {
  const cards = flashcardsFor(exam).filter((c) => c.ref);
  if (!access) return { items: [], locked: true, totalCards: cards.length };
  const chapters = [...new Set(cards.map((c) => chapter(c.ref!)))];
  const items = shuffle(cards)
    .slice(0, 10)
    .map((c) => {
      const right = chapter(c.ref!);
      const choices = shuffle([right, ...shuffle(chapters.filter((x) => x !== right)).slice(0, 3)]);
      return { prompt: c.front, choices, answer: choices.indexOf(right) };
    });
  return { items, locked: false, totalCards: cards.length };
}
