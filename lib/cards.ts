import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import type { ExamId } from "./content/types";
import { EXAMS } from "./content/exams";
import { cardTopic, flashcardsFor, getFlashcard, type Flashcard } from "./content/flashcards";
import { hasExamAccess } from "./access";
import { deck, scheduleCard, type CardGrade, type CardState } from "./adaptive/cards";
import { learnerState, weightsFor } from "./adaptive/server";
import { topicMastery } from "./adaptive/model";

export interface DeckCard {
  id: string;
  topic: string;
  topicName: string;
  front: string;
  back: string;
  ref: string;
  /** Scheduling state, or null for a new card. Dates as ISO strings for the client. */
  state: (Omit<CardState, "due"> & { due: string }) | null;
}

function canSeeCard(user: User | null, c: Flashcard) {
  return !!c.free || c.exams.some((e) => hasExamAccess(user, e));
}

async function reviewsFor(userId: string, ids: string[]) {
  const rows = await db.cardReview.findMany({ where: { userId, cardId: { in: ids } } });
  return new Map<string, CardState>(rows.map((r) => [r.cardId, { interval: r.interval, ease: r.ease, reps: r.reps, lapses: r.lapses, due: r.due }]));
}

/** Today's flashcards: due reviews, then new cards from the topics where the student is weakest. */
export async function cardDeck(user: User, exam: ExamId, topic?: string) {
  const all = flashcardsFor(exam, topic);
  // On a given exam's deck, access follows that exam (a shared card is graded the same either way).
  const visible = all.filter((c) => c.free || hasExamAccess(user, exam));
  const [reviews, state] = await Promise.all([reviewsFor(user.id, visible.map((c) => c.id)), learnerState(user.id, exam)]);
  const weights = weightsFor(user, exam);
  const priority = (c: Flashcard) => {
    const t = cardTopic(c, exam);
    return (weights.get(t) ?? 0) * (1 - topicMastery(state, t).mastery);
  };
  const ordered = [...visible].sort((a, b) => priority(b) - priority(a));
  const now = new Date();
  const { due, fresh } = deck(ordered, reviews, now);
  const names = Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name]));
  const toDeck = (c: Flashcard): DeckCard => {
    const r = reviews.get(c.id);
    const t = cardTopic(c, exam);
    return { id: c.id, topic: t, topicName: names[t] ?? t, front: c.front, back: c.back, ref: c.ref, state: r ? { ...r, due: r.due.toISOString() } : null };
  };
  return {
    cards: [...due, ...fresh].map(toDeck),
    dueCount: due.length,
    newCount: fresh.length,
    total: all.length,
    visible: visible.length,
    learned: [...reviews.values()].filter((r) => r.reps > 0).length,
  };
}

/** Cards due now, for badges on the exam page and dashboard. */
export async function dueCardCount(user: User, exam: ExamId) {
  const ids = flashcardsFor(exam).filter((c) => c.free || hasExamAccess(user, exam)).map((c) => c.id);
  return db.cardReview.count({ where: { userId: user.id, cardId: { in: ids }, due: { lte: new Date() } } });
}

export async function gradeCard(user: User, cardIdIn: unknown, gradeIn: unknown) {
  const card = getFlashcard(String(cardIdIn ?? ""));
  const grade = Number(gradeIn);
  if (!card || ![0, 1, 2, 3].includes(grade)) return { status: 400 as const, body: { error: "Bad request" } };
  if (!canSeeCard(user, card)) return { status: 403 as const, body: { error: "Subscription required" } };
  const prev = await db.cardReview.findUnique({ where: { userId_cardId: { userId: user.id, cardId: card.id } } });
  const next = scheduleCard(prev, grade as CardGrade, new Date());
  await db.cardReview.upsert({
    where: { userId_cardId: { userId: user.id, cardId: card.id } },
    create: { userId: user.id, cardId: card.id, ...next },
    update: next,
  });
  return { status: 200 as const, body: { due: next.due.toISOString(), interval: next.interval } };
}
