// Run: npm run test:templates
// Generates many variants per template and checks they are well-formed.
import { TEMPLATES } from "../lib/templates";
import { buildVariant } from "../lib/templates/engine";
import { EXAMS } from "../lib/content/exams";

const N = 2000;
let errors = 0;
const ids = new Set<string>();

for (const t of TEMPLATES) {
  if (ids.has(t.id)) { console.error(`✗ ${t.id}: duplicate id`); errors++; }
  ids.add(t.id);
  for (const [exam, topic] of Object.entries(t.topics)) {
    if (!EXAMS[exam as keyof typeof EXAMS]?.topics.some((x) => x.slug === topic)) {
      console.error(`✗ ${t.id}: unknown topic ${exam}/${topic}`); errors++;
    }
  }
  let fallbacks = 0;
  const prompts = new Set<string>();
  for (let seed = 1; seed <= N; seed++) {
    const v = buildVariant(t, seed);
    const bad = (msg: string) => { if (errors < 50) console.error(`✗ ${t.id} seed ${seed}: ${msg}`); errors++; };
    if (!Number.isFinite(v.answerValue) || v.answerValue <= 0) bad(`answer ${v.answerValue}`);
    if (v.choices.length !== 4) bad(`${v.choices.length} choices`);
    if (new Set(v.choices).size !== v.choices.length) bad("duplicate choices");
    if (v.answerIndex < 0) bad("answer missing from choices");
    if (/NaN|Infinity|undefined/.test(v.prompt + v.solution + v.choices.join())) bad("bad text");
    if (v.usedFallback) fallbacks++;
    prompts.add(v.prompt);
  }
  console.log(`${t.id.padEnd(26)} ${prompts.size} unique problems / ${N}, fallback distractors in ${((100 * fallbacks) / N).toFixed(1)}%`);
}
console.log(`${TEMPLATES.length} templates, ${errors} error(s)`);
process.exit(errors ? 1 : 0);
