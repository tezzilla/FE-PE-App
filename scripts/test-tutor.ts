// Run: npm run test:tutor
import { buildTutorSystem, cleanHistory } from "../lib/tutor-prompt";
import { getQuestion } from "../lib/content";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "ok " : "✗  "} ${msg}`); if (!ok) failures++; };
const u = (text: string) => ({ role: "user", text });
const a = (text: string) => ({ role: "assistant", text });

check(cleanHistory([u("why?")])?.length === 1, "one student question is valid");
check(cleanHistory([u("why?"), a("because"), u("units?")])?.length === 3, "alternating turns ending with the student");
check(cleanHistory([a("hi")]) === null, "must start with the student");
check(cleanHistory([u("a"), a("b")]) === null, "must end with the student");
check(cleanHistory([u("a"), u("b")]) === null, "turns must alternate");
check(cleanHistory([u("x".repeat(1501))]) === null, "student message length capped");
check(cleanHistory(Array.from({ length: 13 }, (_, i) => (i % 2 ? a("b") : u("a")))) === null, "conversation length capped");
check(cleanHistory("nope") === null && cleanHistory([]) === null, "non-arrays and empty rejected");

const q = getQuestion("fe-math-001")!;
const wrong = (q.answer + 1) % q.choices.length;
const s = buildTutorSystem(q, wrong);
check(s.includes(q.explanation) && s.includes(q.prompt), "prompt includes the problem and verified explanation");
check(s.includes(`picked ${String.fromCharCode(65 + wrong)}`), "prompt says which wrong choice the student picked");
check(buildTutorSystem(q, q.answer).includes("correctly") && !buildTutorSystem(q, q.answer).includes("picked"), "correct answers say so");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
