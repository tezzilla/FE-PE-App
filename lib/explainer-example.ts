import type { Explainer } from "@/lib/content/explainers";
import { getTemplate } from "@/lib/templates";
import { templateToQuestion } from "@/lib/templates/engine";
import { approvedTemplates } from "@/lib/reviews";

/** Worked example for a formula guide: its calculation problem at a fixed seed, only once that problem is approved. */
export async function explainerExample(e: Explainer) {
  const t = getTemplate(e.templateId);
  if (!t || !(await approvedTemplates()).has(t.id)) return null;
  // A fixed seed keeps the example stable for readers and search engines.
  return templateToQuestion(t, e.exam, 4242);
}
