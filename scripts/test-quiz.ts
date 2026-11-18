// Run: npm run test:quiz
import { computeState, type PoolItem } from "../lib/adaptive/model";
import { EXAM_PACE_S, paceRows, pickDiagnostic, pickQuiz } from "../lib/adaptive/quiz";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "ok " : "✗  "} ${msg}`); if (!ok) failures++; };
const now = new Date();
const ago = (h: number) => new Date(now.getTime() - h * 3600_000);

const items: PoolItem[] = [
  { skill: "fe-a-1", topic: "a", regenerable: false },
  { skill: "fe-a-2", topic: "a", regenerable: false },
  { skill: "tpl:a-gen", topic: "a", regenerable: true },
  { skill: "fe-b-1", topic: "b", regenerable: false },
  { skill: "fe-b-2", topic: "b", regenerable: false },
  { skill: "fe-c-1", topic: "c", regenerable: false },
];
const state = computeState(
  [
    { questionId: "fe-a-1", topic: "a", correct: false, createdAt: ago(5) },
    { questionId: "fe-b-1", topic: "b", correct: false, createdAt: ago(5) },
    { questionId: "fe-b-1", topic: "b", correct: true, createdAt: ago(1) }, // fixed since
    { questionId: "tpl.fe-civil.a-gen.42", topic: "a", correct: false, createdAt: ago(2) },
  ],
  now,
);

const all = pickQuiz(items, state, { topics: ["a", "b", "c"], count: 10, source: "all" });
check(all.length === 10, "all: fills to 10 by repeating the problem type");
check(all.filter((i) => !i.regenerable).length === 5 && new Set(all.filter((i) => !i.regenerable).map((i) => i.skill)).size === 5, "all: each fixed question at most once");

const fixedOnly = pickQuiz(items.filter((i) => !i.regenerable), state, { topics: ["a", "b", "c"], count: 3, source: "all" });
check(new Set(fixedOnly.map((i) => i.topic)).size === 3, "all: spreads across topics before repeating a topic");

const missed = pickQuiz(items, state, { topics: ["a", "b", "c"], count: 10, source: "missed" });
check(missed.every((i) => i.skill === "fe-a-1" || i.skill === "tpl:a-gen"), "missed: only skills whose last answer was wrong");
check(!missed.some((i) => i.skill === "fe-b-1"), "missed: a fixed miss you later got right is excluded");
check(missed.filter((i) => i.skill === "fe-a-1").length === 1, "missed: fixed question once, problem type repeats");

const unseen = pickQuiz(items, state, { topics: ["a", "b", "c"], count: 10, source: "unseen" });
check(unseen.length === 3 && unseen.every((i) => ["fe-a-2", "fe-b-2", "fe-c-1"].includes(i.skill)), "unseen: only untried, no repeats");

check(pickQuiz(items, state, { topics: ["c"], count: 10, source: "all" }).length === 1, "topic filter respected");

const diag = pickDiagnostic(items, state, ["a", "b", "c"], 2);
check(diag.length === 5, "diagnostic: 2 per topic, fewer if a topic has fewer");
check(diag.some((i) => i.skill === "fe-a-2") && diag.some((i) => i.skill === "fe-b-2"), "diagnostic: prefers unseen problems");

check(EXAM_PACE_S["fe-civil"] === 175 && EXAM_PACE_S["pe-civil"] === 360, "exam pace FE 175 s, PE 360 s");
const rows = paceRows("fe-civil", [{ topic: "a", avgMs: 350_000, n: 4 }, { topic: "b", avgMs: 100_000, n: 9 }, { topic: "c", avgMs: 900_000, n: 1 }]);
check(rows.length === 2 && rows[0].topic === "a" && Math.abs(rows[0].ratio - 2) < 0.01, "pace rows: slowest first, needs 3+ answers");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
