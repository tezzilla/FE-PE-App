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
import { BATCH_NINE } from "./batch-nine";
import { BATCH_TEN } from "./batch-ten";
import { BATCH_ELEVEN } from "./batch-eleven";
import { BATCH_TWELVE } from "./batch-twelve";
import { BATCH_THIRTEEN } from "./batch-thirteen";
import { BATCH_FOURTEEN } from "./batch-fourteen";
import { BATCH_FIFTEEN } from "./batch-fifteen";
import { BATCH_SIXTEEN } from "./batch-sixteen";
import { BATCH_SEVENTEEN } from "./batch-seventeen";
import { BATCH_EIGHTEEN } from "./batch-eighteen";
import { BATCH_NINETEEN } from "./batch-nineteen";
import { BATCH_TWENTY } from "./batch-twenty";

export const TEMPLATES: Template[] = [...WATER_RESOURCES, ...CIVIL_CORE, ...EXPANDED, ...PE_DEPTH, ...FE_CORE_2, ...SPEC_GAPS, ...OPS_DESIGN, ...NETWORKS_TIMBER, ...BATCH_FIVE, ...BATCH_SIX, ...BATCH_SEVEN, ...BATCH_EIGHT, ...BATCH_NINE, ...BATCH_TEN, ...BATCH_ELEVEN, ...BATCH_TWELVE, ...BATCH_THIRTEEN, ...BATCH_FOURTEEN, ...BATCH_FIFTEEN, ...BATCH_SIXTEEN, ...BATCH_SEVENTEEN, ...BATCH_EIGHTEEN, ...BATCH_NINETEEN, ...BATCH_TWENTY];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string) {
  return BY_ID.get(id);
}

export function templatesFor(exam: ExamId, topic?: string) {
  return TEMPLATES.filter((t) => t.topics[exam] && (!topic || t.topics[exam] === topic));
}
