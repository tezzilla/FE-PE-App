// Run: npm run test:cards
import { deck, scheduleCard, MAX_INTERVAL_DAYS, type CardState } from "../lib/adaptive/cards";
import { FLASHCARDS, cardTopic, flashcardsFor } from "../lib/content/flashcards";
import { EXAMS } from "../lib/content/exams";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "ok " : "✗  "} ${msg}`); if (!ok) failures++; };
const now = new Date(Date.UTC(2026, 10, 18, 12));
const DAY = 864e5;
const days = (s: CardState) => (s.due.getTime() - now.getTime()) / DAY;

const g1 = scheduleCard(null, 2, now);
check(g1.reps === 1 && days(g1) === 1, "new card, Good: back in 1 day");
const g2 = scheduleCard(g1, 2, now);
check(days(g2) === 3, "second Good: 3 days");
const g3 = scheduleCard(g2, 2, now);
check(days(g3) === 7.5, "third Good: interval × ease (3 × 2.5)");
const again = scheduleCard(g3, 0, now);
check(again.reps === 0 && again.lapses === 1 && again.ease === 2.3 && (again.due.getTime() - now.getTime()) === 10 * 60_000, "Again: 10 minutes, a lapse, lower ease");
check(scheduleCard(null, 0, now).lapses === 0, "missing a brand-new card isn't a lapse");
check(days(scheduleCard(null, 3, now)) === 4 && scheduleCard(null, 3, now).ease === 2.65, "new card, Easy: 4 days, ease up");
check(scheduleCard(g2, 1, now).interval === 3.6 && scheduleCard(g2, 1, now).ease === 2.35, "Hard: 1.2× interval, ease down");
let s: CardState = g1;
for (let k = 0; k < 20; k++) s = scheduleCard(s, 3, now);
check(s.interval === MAX_INTERVAL_DAYS, "interval capped at 180 days");
let low: CardState = g1;
for (let k = 0; k < 20; k++) low = scheduleCard(low, 1, now);
check(low.ease === 1.3, "ease floor 1.3");

const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
const reviews = new Map<string, CardState>([
  ["a", { ...g1, due: new Date(now.getTime() - DAY) }],
  ["b", { ...g1, due: new Date(now.getTime() + DAY) }],
  ["c", { ...g1, due: new Date(now.getTime() - 2 * DAY) }],
]);
const d = deck(cards, reviews, now, 5);
check(d.due.map((c) => c.id).join() === "c,a" && d.fresh.map((c) => c.id).join() === "d", "deck: overdue first, not-yet-due skipped, then new");
check(deck(cards, new Map(), now, 2).fresh.length === 2, "deck: new-card limit");

// Content checks
check(new Set(FLASHCARDS.map((c) => c.id)).size === FLASHCARDS.length, "card ids unique");
for (const exam of ["fe-civil", "pe-civil"] as const) {
  const slugs = new Set(EXAMS[exam].topics.map((t) => t.slug));
  const bad = flashcardsFor(exam).filter((c) => !slugs.has(cardTopic(c, exam)));
  check(bad.length === 0, `${exam}: every card maps to a real topic${bad.length ? ` (bad: ${bad.map((c) => c.id)})` : ""}`);
  const covered = new Set(flashcardsFor(exam).map((c) => cardTopic(c, exam)));
  const missing = [...slugs].filter((t) => !covered.has(t));
  check(missing.length === 0, `${exam}: every topic has cards${missing.length ? ` (missing: ${missing})` : ""}`);
  check(flashcardsFor(exam).some((c) => c.free), `${exam}: some free cards`);
}
check(FLASHCARDS.every((c) => c.front.trim() && c.back.trim() && c.ref.trim()), "every card has front, back and a handbook pointer");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
