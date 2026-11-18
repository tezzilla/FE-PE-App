// Flashcard scheduling: a simplified SM-2. Pure functions so they can be tested.

export type CardGrade = 0 | 1 | 2 | 3; // again, hard, good, easy
export const GRADE_LABELS = ["Again", "Hard", "Good", "Easy"] as const;

export interface CardState {
  interval: number; // days
  ease: number;
  reps: number;
  lapses: number;
  due: Date;
}

const DAY = 24 * 3600 * 1000;
const MIN = 60 * 1000;
export const MAX_INTERVAL_DAYS = 180;
export const NEW_PER_SESSION = 15;
export const NEW_CARD: Omit<CardState, "due"> = { interval: 0, ease: 2.5, reps: 0, lapses: 0 };

/** Next state after a review. "Again" brings the card back in 10 minutes. */
export function scheduleCard(prev: Omit<CardState, "due"> | null, grade: CardGrade, now: Date): CardState {
  const p = prev ?? NEW_CARD;
  if (grade === 0) {
    return { interval: 0, ease: Math.max(1.3, p.ease - 0.2), reps: 0, lapses: p.lapses + (p.reps > 0 ? 1 : 0), due: new Date(now.getTime() + 10 * MIN) };
  }
  let interval: number;
  let ease = p.ease;
  if (grade === 1) {
    interval = p.reps === 0 ? 1 : Math.max(1, p.interval * 1.2);
    ease = Math.max(1.3, ease - 0.15);
  } else if (grade === 2) {
    interval = p.reps === 0 ? 1 : p.reps === 1 ? 3 : p.interval * ease;
  } else {
    interval = p.reps === 0 ? 4 : Math.max(4, p.interval * ease * 1.3);
    ease += 0.15;
  }
  interval = Math.min(MAX_INTERVAL_DAYS, Math.round(interval * 10) / 10);
  return { interval, ease: Math.round(ease * 100) / 100, reps: p.reps + 1, lapses: p.lapses, due: new Date(now.getTime() + interval * DAY) };
}

/** Human label for when a grade would bring the card back, shown on the grade buttons. */
export function nextLabel(prev: Omit<CardState, "due"> | null, grade: CardGrade, now = new Date()): string {
  const s = scheduleCard(prev, grade, now);
  const ms = s.due.getTime() - now.getTime();
  if (ms < DAY) return `${Math.round(ms / MIN)} min`;
  const d = Math.round(ms / DAY);
  return d < 30 ? `${d} d` : `${Math.round(d / 30)} mo`;
}

/**
 * Today's deck: due reviews first (most overdue first), then up to `newLimit` new cards in the order
 * given (callers put weak topics first).
 */
export function deck<T extends { id: string }>(
  cards: T[],
  reviews: Map<string, CardState>,
  now: Date,
  newLimit = NEW_PER_SESSION,
): { due: T[]; fresh: T[] } {
  const due = cards
    .filter((c) => reviews.has(c.id) && reviews.get(c.id)!.due <= now)
    .sort((a, b) => reviews.get(a.id)!.due.getTime() - reviews.get(b.id)!.due.getTime());
  const fresh = cards.filter((c) => !reviews.has(c.id)).slice(0, newLimit);
  return { due, fresh };
}
