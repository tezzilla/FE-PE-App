import type { ExamId } from "../content/types";
import type { Template } from "./engine";
import { WATER_RESOURCES } from "./water-resources";

export const TEMPLATES: Template[] = [...WATER_RESOURCES];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string) {
  return BY_ID.get(id);
}

export function templatesFor(exam: ExamId, topic?: string) {
  return TEMPLATES.filter((t) => t.topics[exam] && (!topic || t.topics[exam] === topic));
}
