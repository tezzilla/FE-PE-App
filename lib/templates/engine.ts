import type { ExamId, Question } from "../content/types";

/** Deterministic RNG (mulberry32) so a seed always reproduces the same problem. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;
  return {
    next,
    /** Uniform value on [min, max] in increments of step, rounded cleanly. */
    range(min: number, max: number, step: number): number {
      const n = Math.round((max - min) / step);
      const k = Math.floor(next() * (n + 1));
      return Number((min + k * step).toFixed(decimals(step)));
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
  };
}
export type Rng = ReturnType<typeof makeRng>;

/** Format to 3 significant figures with thousands separators. */
export function f(x: number, sig = 3): string {
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: sig }).format(x);
}
/** Format an input value exactly as generated. */
export function n(x: number): string {
  return x.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export interface Generated {
  prompt: string;
  /** Correct numeric answer, full precision. */
  answer: number;
  unit: string;
  /** Wrong answers built from common mistakes, full precision. */
  distractors: number[];
  solution: string;
  /** Significant figures for the answer choices (default 3). Use more for e.g. elevations (487.23 ft). */
  sig?: number;
  /** Minimum relative gap between a distractor and the answer (default 0.03). */
  minGap?: number;
}

/**
 * Where a problem comes from. Only content we may sell is allowed:
 * - original: written for CivilPrep. `basis` cites any public method it uses (formulas and methods
 *   aren't copyrightable; specific problem text and presentation are).
 * - public-domain: e.g. US federal government works (17 U.S.C. 105). Cite the document.
 * - cc-by / cc-by-sa: openly licensed for commercial use; attribution required (and share-alike for -sa).
 * NonCommercial (NC) and NoDerivatives (ND) licenses are not allowed. scripts/validate-* enforce this.
 */
export type Provenance =
  | { type: "original"; basis?: string }
  | { type: "public-domain" | "cc-by" | "cc-by-sa"; source: string; url?: string; license?: string };

export interface Template {
  id: string;
  /** Bump when the math or wording changes. Approval is per version, so a bump sends it back to review. */
  version: number;
  title: string;
  /** Topic slug for each exam this template appears in. */
  topics: Partial<Record<ExamId, string>>;
  reference?: string;
  /** Defaults to { type: "original" }. */
  provenance?: Provenance;
  generate(r: Rng): Generated;
}

const MIN_GAP = 0.03; // distractors must differ from the answer by at least 3%
const FALLBACK = [1.5, 0.5, 2, 0.75, 1.25, 3, 0.33];

export interface BuiltVariant {
  prompt: string;
  choices: string[];
  answerIndex: number;
  answerValue: number;
  unit: string;
  solution: string;
  usedFallback: boolean;
}

export function buildVariant(t: Template, seed: number): BuiltVariant {
  const g = t.generate(makeRng(seed));
  const label = (v: number) => f(v, g.sig ?? 3);
  const minGap = g.minGap ?? MIN_GAP;
  const seen = new Set([label(g.answer)]);
  let usedFallback = false;

  // Choices are listed ascending, the way the computer-based exams present numbers. To keep the answer
  // from always sitting in the middle, pick its slot first (A to D with equal odds, from the seed so a
  // problem always looks the same), then choose how many wrong answers go below and above it.
  const slot = Math.floor(makeRng((seed ^ 0x5bd1e995) >>> 0).next() * 4);
  const want = { below: slot, above: 3 - slot };

  const usable = (v: number) =>
    Number.isFinite(v) && v > 0 && Math.abs(v - g.answer) / Math.abs(g.answer) >= minGap && !seen.has(label(v));
  const below: number[] = [];
  const above: number[] = [];
  const take = (v: number) => {
    if (!usable(v)) return;
    const side = v < g.answer ? below : above;
    if (side.length >= (v < g.answer ? want.below : want.above)) return;
    seen.add(label(v));
    side.push(v);
  };

  // 1. Realistic wrong answers from named mistakes, in the order the template lists them.
  g.distractors.forEach(take);
  // 2. Fill whichever side is short with nearby values scaled to the problem's precision.
  if (below.length < want.below || above.length < want.above) {
    usedFallback = true;
    const integral = Number.isInteger(g.answer) && g.distractors.every((d) => Number.isInteger(d));
    const step = Math.max(minGap * 4, 0.08);
    for (let k = 1; k <= 12 && (below.length < want.below || above.length < want.above); k++) {
      const lo = g.answer * (1 - step * k * 0.6);
      const hi = g.answer * (1 + step * k);
      take(integral ? Math.round(lo) : lo);
      take(integral ? Math.round(hi) : hi);
    }
    FALLBACK.forEach((m) => take(integral ? Math.round(g.answer * m) : g.answer * m));
  }
  // 3. If one side still can't be filled (e.g. no positive values below a tiny answer), use the other.
  const picked = [...below, ...above];
  if (picked.length < 3) {
    for (const v of [...g.distractors, ...FALLBACK.map((m) => g.answer * m)]) {
      if (picked.length >= 3) break;
      if (usable(v)) { seen.add(label(v)); picked.push(v); }
    }
  }

  const values = [g.answer, ...picked].sort((a, b) => a - b);
  // Currency goes in front ($61,500); other units after (61.4 kN).
  const withUnit = (v: number) => (g.unit === "$" ? "$" + label(v) : g.unit ? `${label(v)} ${g.unit}` : label(v));
  return {
    prompt: g.prompt,
    choices: values.map(withUnit),
    answerIndex: values.indexOf(g.answer),
    answerValue: g.answer,
    unit: g.unit,
    solution: g.solution,
    usedFallback,
  };
}

// Question ids for generated problems: tpl.<exam>.<templateId>.<seed>
export function templateQuestionId(exam: ExamId, templateId: string, seed: number) {
  return `tpl.${exam}.${templateId}.${seed}`;
}

export function parseTemplateQuestionId(id: string) {
  const m = /^tpl\.([a-z-]+)\.([a-z0-9-]+)\.(\d{1,10})$/.exec(id);
  if (!m) return null;
  return { exam: m[1], templateId: m[2], seed: Number(m[3]) };
}

export function templateToQuestion(t: Template, exam: ExamId, seed: number): Question | null {
  const topic = t.topics[exam];
  if (!topic) return null;
  const v = buildVariant(t, seed);
  return {
    id: templateQuestionId(exam, t.id, seed),
    exam,
    topic,
    prompt: v.prompt,
    choices: v.choices,
    answer: v.answerIndex,
    explanation: v.solution,
    reference: t.reference,
    templateId: t.id,
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Reviewer's hand answer counts as a match within this relative tolerance. */
export const MATCH_TOLERANCE = 0.02;
export function answersMatch(given: number, correct: number) {
  return Number.isFinite(given) && Math.abs(given - correct) <= MATCH_TOLERANCE * Math.abs(correct);
}
