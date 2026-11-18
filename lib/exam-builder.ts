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

/**
 * Pick a full-length exam: questions per topic follow the NCEES weights (PE: the chosen depth module
 * counts for 60%). Each topic uses its fixed questions, then fresh variants of approved problem types.
 * If a topic doesn't have enough content yet, the exam is shorter and the blueprint says so.
 */
export async function buildFullExam(user: User, exam: ExamId) {
  const def = EXAMS[exam];
  const targets = allocate(topicWeights(def, exam === "pe-civil" ? user.peDepth : null), FULL_EXAM[exam].questions);
  const approved = await approvedTemplates();
  const picked: Question[] = [];
  const blueprint: Blueprint[] = [];

  for (const t of def.topics) {
    const target = targets.get(t.slug) ?? 0;
    const fixed = shuffle(questionsFor(exam, t.slug));
    const gens = shuffle(templatesFor(exam, t.slug).filter((tpl) => approved.has(tpl.id)));
    const chosen: Question[] = fixed.slice(0, target);
    // Spread generated variants evenly across problem types.
    for (let i = 0; chosen.length < target && gens.length; i++) {
      const q = templateToQuestion(gens[i % gens.length], exam, randomSeed());
      if (q) chosen.push(q);
    }
    picked.push(...chosen);
    blueprint.push({ topic: t.slug, name: t.name, target, actual: chosen.length });
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
