// Adaptive learning model. Pure functions only (no DB), so it can be unit-tested and simulated.
//
// Three ideas:
// 1. Topic mastery: recency-weighted accuracy, shrunk toward a pessimistic prior by answer count. Untested
//    topics start "weak".
// 2. Spaced repetition per skill: a skill is one template (any variant) or one fixed question.
//    Misses come back within minutes; each consecutive correct answer pushes the next review further out.
// 3. Session planning: due reviews first, then topics ranked by (exam weight × how weak you are),
//    so study time goes where it moves the score most.

import { peModuleTopicWeights } from "../content/pe-spec";
import type { ExamDef } from "../content/types";
import { parseTemplateQuestionId } from "../templates/engine";

export const HALF_LIFE_DAYS = 21; // an answer from 3 weeks ago counts half as much as one today
export const PRIOR_MEAN = 0.4; // assume "not ready yet" until shown otherwise
export const PRIOR_STRENGTH = 3; // prior is worth 3 answers
/** Review interval in hours, indexed by consecutive-correct streak. */
export const INTERVALS_H = [0.25, 24, 72, 168, 504, 1440];
/**
 * A missed template comes back in 15 min with new numbers. A missed fixed question would repeat
 * word for word, so it waits a day: long enough that the student has to re-solve it, not recall it.
 */
export const FIXED_MISS_INTERVAL_H = 24;
export const REVIEW_SHARE = 0.3; // at most 30% of a session is spaced review of items answered correctly
export const MISS_SHARE = 0.5; // missed items due for another try may take up to half a session
export const EVIDENCE_FOR_FULL_COVERAGE = 5;

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export interface AttemptLite {
  questionId: string;
  topic: string;
  correct: boolean;
  createdAt: Date;
}

export interface TopicState {
  mastery: number; // 0..1
  evidence: number; // raw number of answers
  correct: number;
}

export interface SkillState {
  topic: string;
  streak: number; // consecutive correct answers ending with the latest
  attempts: number;
  last: Date;
  lastCorrect: boolean;
  due: Date;
}

export interface LearnerState {
  topics: Map<string, TopicState>;
  skills: Map<string, SkillState>;
}

/** All variants of a template share one skill; fixed questions are their own skill. */
export function skillOf(questionId: string): string {
  const p = parseTemplateQuestionId(questionId);
  return p ? `tpl:${p.templateId}` : questionId;
}

export function isRegenerableSkill(skill: string) {
  return skill.startsWith("tpl:");
}

export function intervalHours(streak: number, regenerable = true): number {
  if (streak === 0 && !regenerable) return FIXED_MISS_INTERVAL_H;
  return INTERVALS_H[Math.min(streak, INTERVALS_H.length - 1)];
}

export function computeState(attempts: AttemptLite[], now: Date): LearnerState {
  const sorted = [...attempts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const acc = new Map<string, { w: number; wc: number; n: number; c: number }>();
  const skills = new Map<string, SkillState>();

  for (const a of sorted) {
    const ageDays = Math.max(0, (now.getTime() - a.createdAt.getTime()) / DAY);
    const w = 0.5 ** (ageDays / HALF_LIFE_DAYS);
    const t = acc.get(a.topic) ?? { w: 0, wc: 0, n: 0, c: 0 };
    t.w += w;
    t.wc += a.correct ? w : 0;
    t.n++;
    t.c += a.correct ? 1 : 0;
    acc.set(a.topic, t);

    const key = skillOf(a.questionId);
    const prev = skills.get(key);
    const streak = a.correct ? (prev?.streak ?? 0) + 1 : 0;
    skills.set(key, {
      topic: a.topic,
      streak,
      attempts: (prev?.attempts ?? 0) + 1,
      last: a.createdAt,
      lastCorrect: a.correct,
      due: new Date(a.createdAt.getTime() + intervalHours(streak, isRegenerableSkill(key)) * HOUR),
    });
  }

  const topics = new Map<string, TopicState>();
  for (const [topic, t] of acc) {
    topics.set(topic, {
      // Recency weights shape the average (recent answers count more); the raw answer count sets how far it
      // moves from the prior. Using the decayed weights for both let the prior swallow topics practiced
      // less often, so strong students read 15-25 points low on their strong topics.
      mastery: (t.n * (t.wc / t.w) + PRIOR_MEAN * PRIOR_STRENGTH) / (t.n + PRIOR_STRENGTH),
      evidence: t.n,
      correct: t.c,
    });
  }
  return { topics, skills };
}

export function topicMastery(state: LearnerState, topic: string): TopicState {
  return state.topics.get(topic) ?? { mastery: PRIOR_MEAN, evidence: 0, correct: 0 };
}

/**
 * Share of the exam each topic represents, summing to 1.
 * FE: midpoint of the NCEES question range. PE with a chosen module: that module's knowledge areas
 * (lib/content/pe-spec.ts), summed by CivilPrep topic. PE without one: the five modules equally.
 */
export function topicWeights(exam: ExamDef, peDepth?: string | null): Map<string, number> {
  const raw = new Map<string, number>();
  for (const t of exam.topics) {
    const m = /^(\d+)-(\d+)$/.exec(t.examQuestions);
    raw.set(t.slug, m ? (Number(m[1]) + Number(m[2])) / 2 : 1);
  }
  // PE Civil: since April 2024 each module is its own exam. Weight topics by that module's NCEES
  // knowledge areas (e.g. Water Resources also tests soil mechanics and project planning).
  const mod = exam.id === "pe-civil" && peDepth ? peModuleTopicWeights(peDepth) : null;
  if (mod) {
    for (const k of raw.keys()) raw.set(k, mod.get(k) ?? 0);
  }
  const total = [...raw.values()].reduce((a, b) => a + b, 0);
  return new Map([...raw].map(([k, v]) => [k, v / total]));
}

export interface Readiness {
  /** Exam-weighted mastery, 0..1. Not a pass probability. */
  score: number;
  /** How much of the exam's weight has enough answers behind it, 0..1. */
  coverage: number;
  weakest: { topic: string; mastery: number; weight: number }[];
}

export function readiness(state: LearnerState, weights: Map<string, number>): Readiness {
  let score = 0;
  let coverage = 0;
  const rows = [];
  for (const [topic, w] of weights) {
    const t = topicMastery(state, topic);
    score += w * t.mastery;
    coverage += w * Math.min(1, t.evidence / EVIDENCE_FOR_FULL_COVERAGE);
    rows.push({ topic, mastery: t.mastery, weight: w });
  }
  // "Weakest" means where improvement is worth the most: weight × gap.
  rows.sort((a, b) => b.weight * (1 - b.mastery) - a.weight * (1 - a.mastery));
  return { score, coverage, weakest: rows.slice(0, 3) };
}

// ---------- Session planning ----------

export interface PoolItem {
  skill: string;
  topic: string;
  /** Templates can produce a fresh variant every time; fixed questions repeat verbatim. */
  regenerable: boolean;
}

export type PickReason =
  | { kind: "review-missed"; since: Date }
  | { kind: "review-spaced"; since: Date }
  | { kind: "new-topic"; topic: string }
  | { kind: "focus"; topic: string; mastery: number }
  | { kind: "new-skill"; topic: string };

export interface Pick {
  item: PoolItem;
  reason: PickReason;
}

export function planSession(
  pool: PoolItem[],
  state: LearnerState,
  weights: Map<string, number>,
  size: number,
  now: Date,
  random: () => number = Math.random,
): Pick[] {
  const picks: Pick[] = [];
  const used = new Set<string>();

  // 1. Spaced review of due skills. Misses first, then the most overdue.
  const due = pool
    .map((item) => ({ item, s: state.skills.get(item.skill) }))
    .filter((x): x is { item: PoolItem; s: SkillState } => !!x.s && x.s.due <= now)
    .sort((a, b) => Number(a.s.lastCorrect) - Number(b.s.lastCorrect) || a.s.due.getTime() - b.s.due.getTime());
  // Misses are the most valuable practice, so they get a larger share than spaced reviews. Without
  // this, a big bank produces misses faster than a 30% review share can bring them back.
  const reviewCap = Math.ceil(size * MISS_SHARE), spacedCap = Math.ceil(size * REVIEW_SHARE);
  let spaced = 0;
  for (const { item, s } of due) {
    if (picks.length >= reviewCap) break;
    if (s.lastCorrect && spaced >= spacedCap) continue;
    if (s.lastCorrect) spaced++;
    picks.push({ item, reason: { kind: s.lastCorrect ? "review-spaced" : "review-missed", since: s.last } });
    used.add(item.skill);
  }

  // 2. Fill by topic priority = exam weight × (1 − mastery). Damp a topic after each pick for variety.
  const byTopic = new Map<string, PoolItem[]>();
  for (const item of pool) byTopic.set(item.topic, [...(byTopic.get(item.topic) ?? []), item]);
  const damp = new Map<string, number>();

  // Candidates in a topic, best first:
  //   0. templates the student last missed (fresh numbers, targeted repair)
  //   1. never-seen skills
  //   2. templates last answered correctly (fresh numbers, extra reps)
  // Seen fixed questions are excluded here; they only return through spaced review when due,
  // because repeating them early tests memory of the answer, not the method.
  const candidates = (topic: string) => {
    const items = (byTopic.get(topic) ?? []).filter(
      (i) => !used.has(i.skill) && (i.regenerable || !state.skills.has(i.skill)),
    );
    const rank = (i: PoolItem) => {
      const s = state.skills.get(i.skill);
      return !s ? 1 : s.lastCorrect ? 2 : 0;
    };
    return items.sort((a, b) => rank(a) - rank(b) || random() - 0.5);
  };

  while (picks.length < size) {
    const scored = [...byTopic.keys()]
      .map((topic) => {
        const c = candidates(topic);
        const t = topicMastery(state, topic);
        const w = weights.get(topic) ?? 0;
        const p = w * (1 - t.mastery + 0.05) * (damp.get(topic) ?? 1);
        return { topic, c, t, p };
      })
      .filter((x) => x.c.length > 0 && x.p > 0);
    if (!scored.length) break;

    // Sample proportional to priority (not argmax) so strong topics still get occasional upkeep.
    const total = scored.reduce((a, x) => a + x.p, 0);
    let r = random() * total;
    const chosen = scored.find((x) => (r -= x.p) <= 0) ?? scored[scored.length - 1];

    const item = chosen.c[0];
    const skill = state.skills.get(item.skill);
    const reason: PickReason =
      chosen.t.evidence === 0
        ? { kind: "new-topic", topic: chosen.topic }
        : !skill
          ? { kind: "new-skill", topic: chosen.topic }
          : !skill.lastCorrect
            ? { kind: "review-missed", since: skill.last }
            : { kind: "focus", topic: chosen.topic, mastery: chosen.t.mastery };
    picks.push({ item, reason });
    used.add(item.skill);
    damp.set(chosen.topic, (damp.get(chosen.topic) ?? 1) * 0.6);
  }

  // Interleave: mixing topics within a session beats blocking them for retention.
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks;
}

export function describeReason(r: PickReason, topicName: (slug: string) => string, now = new Date()): string {
  const ago = (d: Date) => {
    const h = (now.getTime() - d.getTime()) / HOUR;
    if (h < 1) return "a few minutes ago";
    if (h < 24) return `${Math.round(h)} hr ago`;
    return `${Math.round(h / 24)} days ago`;
  };
  switch (r.kind) {
    case "review-missed":
      return `Review: you missed this kind of problem ${ago(r.since)}`;
    case "review-spaced":
      return `Spaced review: last answered correctly ${ago(r.since)}`;
    case "new-topic":
      return `New topic: ${topicName(r.topic)}`;
    case "new-skill":
      return `New problem in ${topicName(r.topic)}`;
    case "focus":
      return `Focus area: ${topicName(r.topic)}, ${Math.round(r.mastery * 100)}% mastery`;
  }
}
