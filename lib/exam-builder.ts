import "server-only";
import type { User } from "@prisma/client";
import type { ExamId, Question } from "./content/types";
import { EXAMS } from "./content/exams";
import { questionsFor, shuffle } from "./content";
import { topicWeights } from "./adaptive/model";
import { approvedTemplates } from "./reviews";
import { templatesFor } from "./templates";
import { randomSeed, templateToQuestion } from "./templates/engine";
import { resolveQuestion } from "./questions";
import { getQuestion } from "./content";
import { getTemplate } from "./templates";
import { midQuestions, peModuleSpec } from "./content/pe-spec";
import type { Template } from "./templates/engine";

/** Real exam sizes and seat time (exam time, excluding the break), split into two sessions. */
export const FULL_EXAM = {
  "fe-civil": { questions: 110, minutes: 320 },
  "pe-civil": { questions: 80, minutes: 480 },
} as const;

/** Split `total` across topics by weight, rounding with the largest-remainder method so it sums exactly. */
export function allocate(weights: Map<string, number>, total: number): Map<string, number> {
  const raw = [...weights].map(([t, w]) => ({ t, exact: w * total }));
  const out = new Map(raw.map((r) => [r.t, Math.floor(r.exact)]));
  let left = total - [...out.values()].reduce((a, b) => a + b, 0);
  for (const r of raw.sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left-- <= 0) break;
    out.set(r.t, out.get(r.t)! + 1);
  }
  return out;
}

export interface Blueprint {
  topic: string;
  name: string;
  target: number;
  actual: number;
}

/** One row of a full exam's blueprint: what it should hold and the content that can fill it. */
export interface PlanRow {
  key: string;
  name: string;
  target: number;
  fixed: Question[];
  gens: Template[];
}

/**
 * The blueprint for a full exam. FE: NCEES topic weights. PE with a chosen module: that module's NCEES
 * knowledge areas, each filled from the content mapped to it in lib/content/pe-spec.ts. PE without a
 * module: the five modules weighted equally.
 */
export async function examPlan(user: User, exam: ExamId): Promise<PlanRow[]> {
  const def = EXAMS[exam];
  const approved = await approvedTemplates();
  const spec = exam === "pe-civil" ? peModuleSpec(user.peDepth) : undefined;
  if (spec) {
    const sum = spec.areas.reduce((t, a) => t + midQuestions(a.questions), 0);
    const targets = allocate(new Map(spec.areas.map((a) => [String(a.n), midQuestions(a.questions) / sum])), FULL_EXAM[exam].questions);
    return spec.areas.map((a) => ({
      key: `area-${a.n}`,
      name: `${a.n}. ${a.name}`,
      target: targets.get(String(a.n)) ?? 0,
      fixed: a.skills.flatMap((k) => (k.startsWith("pe-") ? (getQuestion(k) ?? []) : [])),
      gens: a.skills.flatMap((k) => {
        const t = k.startsWith("pe-") ? undefined : getTemplate(k);
        return t && approved.has(t.id) ? [t] : [];
      }),
    }));
  }
  const targets = allocate(topicWeights(def, null), FULL_EXAM[exam].questions);
  return def.topics.map((t) => ({
    key: t.slug,
    name: t.name,
    target: targets.get(t.slug) ?? 0,
    fixed: questionsFor(exam, t.slug),
    gens: templatesFor(exam, t.slug).filter((tpl) => approved.has(tpl.id)),
  }));
}

/**
 * Pick a full-length exam from the blueprint. Each row uses its fixed questions, then fresh variants of
 * approved calculation problems. If a row doesn't have enough content yet, the exam is shorter and the
 * blueprint says so. A fixed question is used at most once even if it serves several areas.
 */
export async function buildFullExam(user: User, exam: ExamId) {
  const plan = await examPlan(user, exam);
  const picked: Question[] = [];
  const blueprint: Blueprint[] = [];
  const used = new Set<string>();

  for (const row of plan) {
    const target = row.target;
    const fixed = shuffle(row.fixed.filter((q) => !used.has(q.id)));
    const gens = shuffle(row.gens);
    const chosen: Question[] = fixed.slice(0, target);
    chosen.forEach((q) => used.add(q.id));
    // Spread generated variants evenly across problem types.
    for (let i = 0; chosen.length < target && gens.length; i++) {
      const q = templateToQuestion(gens[i % gens.length], exam, randomSeed());
      if (q) chosen.push(q);
    }
    picked.push(...chosen);
    blueprint.push({ topic: row.key, name: row.name, target, actual: chosen.length });
  }

  const order = shuffle(picked);
  const half = Math.ceil(order.length / 2);
  const sessions = [order.slice(0, half), order.slice(half)].filter((s) => s.length);
  return { sessions, blueprint };
}

/** Seconds allowed for a session, scaled from real exam pacing. */
export function sessionSeconds(exam: ExamId, count: number) {
  const { questions, minutes } = FULL_EXAM[exam];
  return Math.round((count / questions) * minutes * 60);
}

/** Resolve stored question ids back into questions (templates regenerate from their seeds). */
export async function loadSessions(sessionsJson: string): Promise<Question[][]> {
  const ids: string[][] = JSON.parse(sessionsJson);
  return Promise.all(
    ids.map(async (s) => (await Promise.all(s.map(resolveQuestion))).flatMap((r) => (r ? [r.q] : []))),
  );
}
