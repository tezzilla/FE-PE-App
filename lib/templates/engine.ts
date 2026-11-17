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
}

export interface Template {
  id: string;
  /** Bump when the math or wording changes. Approval is per version, so a bump sends it back to review. */
  version: number;
  title: string;
  /** Topic slug for each exam this template appears in. */
  topics: Partial<Record<ExamId, string>>;
  reference?: string;
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
  const label = (v: number) => f(v);
  const correct = label(g.answer);
  const seen = new Set([correct]);
  const picked: number[] = [];
  let usedFallback = false;

  const tryAdd = (v: number) => {
    if (picked.length >= 3 || !Number.isFinite(v) || v <= 0) return;
    if (Math.abs(v - g.answer) / Math.abs(g.answer) < MIN_GAP) return;
    const s = label(v);
    if (seen.has(s)) return;
    seen.add(s);
    picked.push(v);
  };
  g.distractors.forEach(tryAdd);
  if (picked.length < 3) usedFallback = true;
  FALLBACK.forEach((m) => tryAdd(g.answer * m));

  // Numeric choices are listed ascending, the way the computer-based exams present them.
  const values = [g.answer, ...picked].sort((a, b) => a - b);
  const unit = g.unit ? ` ${g.unit}` : "";
  return {
    prompt: g.prompt,
    choices: values.map((v) => label(v) + unit),
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
