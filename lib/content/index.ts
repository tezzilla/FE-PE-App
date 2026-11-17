import type { ExamId, PublicQuestion, Question } from "./types";
import { FE_CIVIL } from "./fe-civil";
import { PE_CIVIL } from "./pe-civil";

export const ALL_QUESTIONS: Question[] = [...FE_CIVIL, ...PE_CIVIL];

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
