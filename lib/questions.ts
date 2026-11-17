import "server-only";
import type { ExamId, Question } from "./content/types";
import { getQuestion, shuffle } from "./content";
import { isExamId } from "./content/exams";
import { getTemplate, templatesFor } from "./templates";
import { parseTemplateQuestionId, randomSeed, templateToQuestion } from "./templates/engine";
import { approvedTemplates, type ReviewInfo } from "./reviews";

/**
 * Resolve any question id (static bank or generated) for grading.
 * Generated problems resolve only if their template's current version is approved.
 */
export async function resolveQuestion(id: string): Promise<{ q: Question; review?: ReviewInfo } | null> {
  const fixed = getQuestion(id);
  if (fixed) return { q: fixed };
  const p = parseTemplateQuestionId(id);
  if (!p || !isExamId(p.exam)) return null;
  const t = getTemplate(p.templateId);
  if (!t) return null;
  const review = (await approvedTemplates()).get(t.id);
  if (!review) return null;
  const q = templateToQuestion(t, p.exam, p.seed);
  return q ? { q, review } : null;
}

/** Fresh generated problems from approved templates. */
export async function generatedQuestions(exam: ExamId, perTemplate: number, topic?: string): Promise<Question[]> {
  const approved = await approvedTemplates();
  const out: Question[] = [];
  for (const t of templatesFor(exam, topic)) {
    if (!approved.has(t.id)) continue;
    for (let k = 0; k < perTemplate; k++) {
      const q = templateToQuestion(t, exam, randomSeed());
      if (q) out.push(q);
    }
  }
  return shuffle(out);
}

export async function approvedTemplateCount(exam: ExamId, topic?: string) {
  const approved = await approvedTemplates();
  return templatesFor(exam, topic).filter((t) => approved.has(t.id)).length;
}
