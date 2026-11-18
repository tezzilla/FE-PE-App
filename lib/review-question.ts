import "server-only";
import type { Question } from "./content/types";
import { getQuestion } from "./content";
import { isExamId } from "./content/exams";
import { getTemplate } from "./templates";
import { parseTemplateQuestionId, templateToQuestion } from "./templates/engine";

/** Any question by id for reviewers, including variants of templates that aren't approved. */
export function questionForReview(id: string): Question | null {
  const fixed = getQuestion(id);
  if (fixed) return fixed;
  const p = parseTemplateQuestionId(id);
  const t = p && getTemplate(p.templateId);
  if (!p || !t || !isExamId(p.exam)) return null;
  return templateToQuestion(t, p.exam, p.seed);
}
