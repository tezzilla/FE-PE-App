import type { ExamId, PublicQuestion, Question } from "./types";
import { FE_CIVIL } from "./fe-civil";
import { PE_CIVIL } from "./pe-civil";
import { FE_CONCEPTS, PE_CONCEPTS } from "./concepts";

/** FNV-1a hash of a string, for stable per-question randomness. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/**
 * Questions are written with the right answer wherever the author put it, which clustered at B and C.
 * Show each question's choices in a fixed shuffled order instead: the right answer lands on A, B, C or D
 * with equal odds, and the order never changes between visits (it depends only on the question id).
 * The whole list is shuffled, so no single out-of-order value gives the answer away.
 */
export function balanceChoices(q: Question): Question {
  const h = hash(q.id);
  const target = h % q.choices.length;
  const others = q.choices.map((c, i) => ({ c, i })).filter((x) => x.i !== q.answer);
  // Deterministic shuffle of the wrong answers (mulberry-style step on the hash).
  let a = h;
  for (let i = others.length - 1; i > 0; i--) {
    a = (Math.imul(a ^ (a >>> 15), 0x2c1b3c6d) + 0x297a2d39) >>> 0;
    const j = a % (i + 1);
    [others[i], others[j]] = [others[j], others[i]];
  }
  const choices: string[] = [];
  let k = 0;
  for (let slot = 0; slot < q.choices.length; slot++) choices.push(slot === target ? q.choices[q.answer] : others[k++].c);
  return { ...q, choices, answer: target };
}

export const ALL_QUESTIONS: Question[] = [...FE_CIVIL, ...FE_CONCEPTS, ...PE_CIVIL, ...PE_CONCEPTS].map(balanceChoices);

const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}

export function questionsFor(exam: ExamId, topic?: string): Question[] {
  return ALL_QUESTIONS.filter((q) => q.exam === exam && (!topic || q.topic === topic));
}

export function toPublic(q: Question): PublicQuestion {
  const { answer: _a, explanation: _e, ...rest } = q;
  return rest;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
