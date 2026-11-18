// Run: npm run test:answers
// Re-solves 200 variants of every template from its prompt text with independent formulas
// (lib/templates/verify.ts). A new template needs a solver added there, or this check fails.
import { TEMPLATES } from "../lib/templates/index";
import { verifyTemplate } from "../lib/templates/verify";

let bad = 0;
for (const t of TEMPLATES) {
  const r = verifyTemplate(t, 200);
  if (!r.ok) bad++;
  console.log(`${r.ok ? "ok " : "✗  "} ${t.id.padEnd(26)} max error ${(r.worstError * 100).toFixed(3)}%  fallback-choices ${r.fallbackChoices}/200  duplicate-choices ${r.duplicateChoices}  crowded ${r.crowdedChoices}${r.ok ? "" : `  (${r.reason})\n     worst case: ${r.worstPrompt}`}`);
}
console.log(`\n${TEMPLATES.length} templates, ${bad} need attention`);
process.exit(bad ? 1 : 0);
