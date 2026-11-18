import "server-only";
import type { User } from "@prisma/client";
import type { Question } from "./content/types";
import { PE_MODULE_SPECS, midQuestions, type KnowledgeArea } from "./content/pe-spec";
import { topicName } from "./content/exams";
import { getQuestion } from "./content";
import { getTemplate } from "./templates";
import { randomSeed, templateToQuestion, type Template } from "./templates/engine";
import { canSeeQuestion, hasExamAccess } from "./access";
import { approvedTemplates } from "./reviews";
import { learnerState } from "./adaptive/server";

// PE module exams, shared by the website (/exams/pe-civil/modules/...) and the app (/api/mobile/module).

function areaContent(area: KnowledgeArea, approved: Set<string> | Map<string, unknown>) {
  const fixed = area.skills.flatMap((k) => (k.startsWith("pe-") ? (getQuestion(k) ?? []) : []));
  const templates = area.skills.flatMap((k): Template[] => {
    const t = k.startsWith("pe-") ? undefined : getTemplate(k);
    return t && approved.has(t.id) ? [t] : [];
  });
  return { fixed, templates };
}

/** One module: every knowledge area with its sub-topics, content counts and the student's progress. */
export async function moduleOverview(user: User | null, module: string) {
  const spec = PE_MODULE_SPECS[module];
  if (!spec) return null;
  const approved = await approvedTemplates();
  const state = user ? await learnerState(user.id, "pe-civil") : null;
  const totalMid = spec.areas.reduce((s, a) => s + midQuestions(a.questions), 0);
  const areas = spec.areas.map((a) => {
    const { fixed, templates } = areaContent(a, approved);
    const keys = [...fixed.map((q) => q.id), ...templates.map((t) => `tpl:${t.id}`)];
    const seen = state ? keys.filter((k) => state.skills.has(k)) : [];
    return {
      n: a.n,
      name: a.name,
      questions: a.questions,
      share: Math.round((100 * midQuestions(a.questions)) / totalMid),
      items: a.items,
      fixed: fixed.length,
      free: fixed.filter((q) => canSeeQuestion(user, q)).length,
      calc: templates.length,
      seen: seen.length,
      total: keys.length,
      right: seen.filter((k) => state!.skills.get(k)!.lastCorrect).length,
    };
  });
  return {
    module,
    name: topicName("pe-civil", module),
    effective: spec.effective,
    isMine: user?.peDepth === module,
    access: hasExamAccess(user, "pe-civil"),
    areas,
  };
}

/** Questions for one knowledge area: visible fixed questions plus fresh calculation problems (3 each). */
export async function areaPractice(user: User | null, module: string, n: number) {
  const area = PE_MODULE_SPECS[module]?.areas.find((a) => a.n === n);
  if (!area) return null;
  const { fixed, templates } = areaContent(area, await approvedTemplates());
  const access = hasExamAccess(user, "pe-civil");
  const visible = fixed.filter((q) => canSeeQuestion(user, q));
  const generated: Question[] = access
    ? templates.flatMap((t) => [0, 1, 2].flatMap(() => templateToQuestion(t, "pe-civil", randomSeed()) ?? []))
    : [];
  return { area, all: fixed, visible, generated, generators: templates.length };
}
