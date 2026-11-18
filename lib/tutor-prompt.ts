// Tutor prompt building and input checks. Pure (no SDK, no DB) so it can be tested.

import type { Question } from "./content/types";

export const TUTOR_LIMITS = {
  /** Tutor questions per rolling 24 h window. */
  paid: { max: 30, windowMs: 24 * 3600_000 },
  free: { max: 3, windowMs: 24 * 3600_000 },
} as const;

export const MAX_TURNS = 12; // 6 exchanges
export const MAX_CHARS = 1500;

export interface TutorTurn {
  role: "user" | "assistant";
  text: string;
}

/** Validate the conversation the client sends: alternating turns, starts and ends with the student. */
export function cleanHistory(v: unknown): TutorTurn[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_TURNS) return null;
  const out: TutorTurn[] = [];
  for (const [i, t] of v.entries()) {
    const role = i % 2 === 0 ? "user" : "assistant";
    if (!t || t.role !== role || typeof t.text !== "string") return null;
    const text = t.text.trim();
    if (!text || text.length > (role === "user" ? MAX_CHARS : 6000)) return null;
    out.push({ role, text });
  }
  return out[out.length - 1].role === "user" ? out : null;
}

const letter = (i: number) => String.fromCharCode(65 + i);

export function buildTutorSystem(q: Question, selected: number): string {
  const choices = q.choices.map((c, i) => `${letter(i)}. ${c}`).join("\n");
  const got = selected === q.answer ? "correctly" : `incorrectly (picked ${letter(selected)})`;
  return `You are a tutor on CivilPrep, a study site for the NCEES FE Civil and PE Civil exams. A student has just answered the problem below ${got} and wants help understanding it.

<problem>
${q.prompt}

${choices}
</problem>

<verified_solution>
Correct answer: ${letter(q.answer)}. ${q.choices[q.answer]}
${q.explanation}
${q.reference ? `Reference: ${q.reference}` : ""}
</verified_solution>

How to help:
- Base your explanation on the verified solution, which has been checked for accuracy. Don't contradict it. If you believe it contains an error, say so plainly and suggest the student use "Report a problem" so a reviewer can check it.
- If the student answered incorrectly, figure out the likely mistake behind their choice (unit slip, wrong formula, sign error, misread given) and address it directly.
- Show the key steps with units. Point to where the formula lives in the FE Reference Handbook or the relevant design standard, by section name, so they can find it on exam day.
- Keep it short: a few short paragraphs or a short numbered list. Write math in plain text (e.g. Q = (1.49/n) A R^(2/3) S^(1/2)), not LaTeX.
- Stay on this problem and the concepts it tests. For anything unrelated, say briefly that you can only help with this problem.
- Don't claim to be a licensed engineer, and don't give advice for real projects; this is exam practice.`;
}
