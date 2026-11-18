import type { ExamId } from "../content/types";
import type { Template } from "./engine";
import { WATER_RESOURCES } from "./water-resources";
import { CIVIL_CORE } from "./civil-core";
import { EXPANDED } from "./expanded";
import { PE_DEPTH } from "./pe-depth";
import { FE_CORE_2 } from "./fe-core-2";
import { SPEC_GAPS } from "./spec-gaps";
import { OPS_DESIGN } from "./ops-design";
import { NETWORKS_TIMBER } from "./networks-timber";
import { BATCH_FIVE } from "./batch-five";
import { BATCH_SIX } from "./batch-six";
import { BATCH_SEVEN } from "./batch-seven";
import { BATCH_EIGHT } from "./batch-eight";

export const TEMPLATES: Template[] = [...WATER_RESOURCES, ...CIVIL_CORE, ...EXPANDED, ...PE_DEPTH, ...FE_CORE_2, ...SPEC_GAPS, ...OPS_DESIGN, ...NETWORKS_TIMBER, ...BATCH_FIVE, ...BATCH_SIX, ...BATCH_SEVEN, ...BATCH_EIGHT];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string) {
  return BY_ID.get(id);
}

export function templatesFor(exam: ExamId, topic?: string) {
  return TEMPLATES.filter((t) => t.topics[exam] && (!topic || t.topics[exam] === topic));
}
