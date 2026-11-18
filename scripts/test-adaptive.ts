// Run: npm run test:adaptive
// Unit checks plus a simulated student to show the engine finds and targets weak areas.
import { EXAMS } from "../lib/content/exams";
import { questionsFor } from "../lib/content";
import { templatesFor } from "../lib/templates";
import { makeRng, templateQuestionId } from "../lib/templates/engine";
import {
  computeState, planSession, readiness, skillOf, topicWeights, intervalHours,
  type AttemptLite, type PoolItem,
} from "../lib/adaptive/model";

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "ok " : "✗  "} ${msg}`);
  if (!ok) failures++;
};
const H = 3600_000;

// ---- Unit checks
check(skillOf("tpl.fe-civil.rational-method.123") === "tpl:rational-method", "template variants share a skill");
check(skillOf("fe-math-001") === "fe-math-001", "fixed questions are their own skill");
check(intervalHours(0) === 0.25 && intervalHours(3) === 168 && intervalHours(99) === 1440, "review intervals");
check(intervalHours(0, false) === 24, "a missed fixed question waits a day (no verbatim repeat)");

const feW = topicWeights(EXAMS["fe-civil"]);
check(Math.abs([...feW.values()].reduce((a, b) => a + b, 0) - 1) < 1e-9, "FE weights sum to 1");
check(feW.get("water-env")! > feW.get("ethics")!, "FE water/env outweighs ethics");
const peW = topicWeights(EXAMS["pe-civil"], "water-env");
check(Math.abs(peW.get("water-env")! - 0.6) < 1e-9 && Math.abs(peW.get("structural")! - 0.1) < 1e-9, "PE depth module = 60%, others 10%");

{
  const now = new Date();
  const s = computeState([{ questionId: "tpl.fe-civil.rational-method.5", topic: "water-env", correct: false, createdAt: new Date(now.getTime() - H) }], now);
  check(s.skills.get("tpl:rational-method")!.due <= now, "a missed template is due again within the hour");
  const pl = planSession([{ skill: "q1", topic: "statics", regenerable: false }],
    computeState([{ questionId: "q1", topic: "statics", correct: true, createdAt: new Date(now.getTime() - H) }], now), feW, 10, now);
  check(pl.length === 0, "a fixed question just answered is not repeated before it is due");
  const fresh = computeState([], now);
  check(Math.abs(readiness(fresh, feW).score - 0.4) < 1e-9 && readiness(fresh, feW).coverage === 0, "new student: 40% prior, 0 coverage");
}

// ---- Simulated student
const exam = EXAMS["fe-civil"];
const realPool: PoolItem[] = [
  ...questionsFor("fe-civil").map((q) => ({ skill: q.id, topic: q.topic, regenerable: false })),
  ...templatesFor("fe-civil").map((t) => ({ skill: `tpl:${t.id}`, topic: t.topics["fe-civil"]!, regenerable: true })),
];
// Target state: every topic has templates. Two synthetic generators per topic.
const fullPool: PoolItem[] = [
  ...realPool,
  ...exam.topics.flatMap((t) => [1, 2].map((k) => ({ skill: `tpl:sim-${t.slug}-${k}`, topic: t.slug, regenerable: true }))),
];
// Alternate weak (35%) and strong (90%) topics so weight isn't confounded with ability.
const ability = new Map(exam.topics.map((t, i) => [t.slug, i % 2 ? 0.9 : 0.35]));
const weak = exam.topics.filter((_, i) => i % 2 === 0).map((t) => t.slug);
const strong = exam.topics.filter((_, i) => i % 2 === 1).map((t) => t.slug);
const SESSIONS = 40;
const start = Date.UTC(2026, 0, 1);

function simulate(pool: PoolItem[]) {
  const rng = makeRng(42);
  const attempts: AttemptLite[] = [];
  const served = new Map<string, number>();
  for (let s = 0; s < SESSIONS; s++) {
    const now = new Date(start + s * 24 * H); // one session per day
    const plan = planSession(pool, computeState(attempts, now), feW, 10, now, rng.next);
    plan.forEach((p, k) => {
      const correct = rng.next() < ability.get(p.item.topic)!;
      const qid = p.item.regenerable ? templateQuestionId("fe-civil", p.item.skill.slice(4), s * 100 + k) : p.item.skill;
      attempts.push({ questionId: qid, topic: p.item.topic, correct, createdAt: new Date(now.getTime() + k * 60_000) });
      if (s >= 5) served.set(p.item.topic, (served.get(p.item.topic) ?? 0) + 1); // after warm-up
    });
  }
  const rate = (slugs: string[]) => slugs.reduce((a, t) => a + (served.get(t) ?? 0) / feW.get(t)!, 0) / slugs.length;
  let followed = 0, total = 0;
  for (let s = 0; s < SESSIONS - 2; s++) {
    const t0 = start + s * 24 * H, t1 = t0 + 24 * H, t3 = t0 + 3 * 24 * H;
    for (const m of attempts.filter((a) => !a.correct && +a.createdAt >= t0 && +a.createdAt < t1)) {
      total++;
      if (attempts.some((a) => skillOf(a.questionId) === skillOf(m.questionId) && +a.createdAt >= t1 && +a.createdAt < t3)) followed++;
    }
  }
  const sessionSizes = attempts.length / SESSIONS;
  return { attempts, served, weakRate: rate(weak), strongRate: rate(strong), followed, total, sessionSizes };
}

const full = simulate(fullPool);
console.log(`\nSimulated ${SESSIONS} daily sessions of 10, every topic has templates (target state).`);
console.log(`Questions per unit of exam weight: weak topics ${full.weakRate.toFixed(0)}, strong topics ${full.strongRate.toFixed(0)}`);
check(full.weakRate > 1.5 * full.strongRate, "weak topics get >1.5x the practice of strong ones (weight-adjusted)");
check(strong.every((t) => (full.served.get(t) ?? 0) > 0), "strong topics still get occasional upkeep");
check(full.followed / full.total >= 0.8, `missed problem types come back within 2 days (${full.followed}/${full.total})`);

const final = computeState(full.attempts, new Date(start + SESSIONS * 24 * H));
const r = readiness(final, feW);
const truth = [...feW].reduce((a, [t, w]) => a + w * ability.get(t)!, 0);
console.log(`Readiness estimate ${(r.score * 100).toFixed(0)}% vs true weighted ability ${(truth * 100).toFixed(0)}%, coverage ${(r.coverage * 100).toFixed(0)}%`);
check(Math.abs(r.score - truth) < 0.1, "readiness estimate within 10 points of the truth");
check(r.weakest.every((w) => weak.includes(w.topic)), `top 3 "focus next" topics are all truly weak (${r.weakest.map((w) => w.topic).join(", ")})`);

const now = simulate(realPool);
console.log(`\nSame student on TODAY's content (fixed questions plus every template in lib/templates):`);
console.log(`  weak topics ${now.weakRate.toFixed(0)} vs strong ${now.strongRate.toFixed(0)} per unit weight, avg session ${now.sessionSizes.toFixed(1)} questions`);
console.log(`  (Topics without templates run out of fresh material; add templates there first.)`);

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
