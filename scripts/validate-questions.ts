// Run: npm run test:content
import { ALL_QUESTIONS } from "../lib/content";
import { EXAMS } from "../lib/content/exams";

let errors = 0;
const ids = new Set<string>();
const fail = (id: string, msg: string) => {
  errors++;
  console.error(`✗ ${id}: ${msg}`);
};

for (const q of ALL_QUESTIONS) {
  if (ids.has(q.id)) fail(q.id, "duplicate id");
  ids.add(q.id);
  if (!EXAMS[q.exam].topics.some((t) => t.slug === q.topic)) fail(q.id, `unknown topic "${q.topic}"`);
  if (q.choices.length < 2) fail(q.id, "needs at least 2 choices");
  if (new Set(q.choices).size !== q.choices.length) fail(q.id, "duplicate choices");
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) fail(q.id, "answer index out of range");
  if (!q.explanation.trim()) fail(q.id, "missing explanation");
  const prov = q.provenance ?? { type: "original" };
  if (!["original", "public-domain", "cc-by", "cc-by-sa"].includes(prov.type)) fail(q.id, `provenance "${prov.type}" isn't allowed`);
  if (prov.type !== "original" && !("source" in prov && prov.source)) fail(q.id, `${prov.type} content must cite its source`);
}

for (const exam of Object.values(EXAMS)) {
  for (const t of exam.topics) {
    const n = ALL_QUESTIONS.filter((q) => q.exam === exam.id && q.topic === t.slug);
    if (!n.some((q) => q.free)) fail(`${exam.id}/${t.slug}`, "topic has no free sample question");
  }
}

console.log(`${ALL_QUESTIONS.length} questions checked, ${errors} error(s)`);
process.exit(errors ? 1 : 0);
