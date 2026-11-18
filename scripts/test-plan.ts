// Run: npm run test:plan
import { buildPlan, milestonesFor, phaseFor } from "../lib/adaptive/plan";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "ok " : "✗  "} ${msg}`); if (!ok) failures++; };
const DAY = 864e5;
const today = new Date(Date.UTC(2026, 10, 18, 12));
const days = (n: number) => new Date(today.getTime() + n * DAY);
const focus = [{ topic: "geotechnical", name: "Geotechnical", mastery: 0.4 }, { topic: "structural", name: "Structural", mastery: 0.5 }];

check(phaseFor(90) === "learn" && phaseFor(30) === "practice" && phaseFor(10) === "final" && phaseFor(3) === "exam-week" && phaseFor(-1) === "past", "phases by days left");

const p = buildPlan({ exam: "fe-civil", today, examDate: days(84), weeklyHours: 10, answeredLast7Days: 150, focus, fullExamsDone: [] });
check(p.daysLeft === 84 && p.weeksLeft === 12, "84 days = 12 weeks");
check(p.weeklyTarget === 150 && p.status === "on-track", "FE: 10 h/week = 150 questions; 150 done = on track");
check(buildPlan({ exam: "fe-civil", today, examDate: days(84), weeklyHours: 10, answeredLast7Days: 60, focus, fullExamsDone: [] }).status === "behind", "60 of 150 = behind");
check(buildPlan({ exam: "fe-civil", today, examDate: days(84), weeklyHours: 10, answeredLast7Days: 200, focus, fullExamsDone: [] }).status === "ahead", "200 of 150 = ahead");
check(buildPlan({ exam: "pe-civil", today, examDate: days(84), weeklyHours: 10, answeredLast7Days: 0, focus, fullExamsDone: [] }).weeklyTarget === 80, "PE: 10 h/week = 80 questions");
check(p.milestones.length === 3 && p.milestones.every((m) => !m.done), "3 full-exam milestones when there's time, none done yet");
check(milestonesFor(today, days(30), []).length === 2, "2 milestones when the exam is 30 days away");
// Exam on day 84: milestones at day 42 (midpoint), 70 (2 weeks out), 77 (1 week out).
const ms = milestonesFor(today, days(84), [days(69)]);
check(ms[1].done && !ms[0].done && !ms[2].done, "an exam the day before the 2-week milestone counts for it only; skipped midpoint stays open");
check(milestonesFor(today, days(84), [days(42), days(71), days(78)]).every((m) => m.done), "three exams on schedule complete all three");
const short = buildPlan({ exam: "fe-civil", today, examDate: days(21), weeklyHours: 5, answeredLast7Days: 0, focus, fullExamsDone: [] });
check(!!short.warning, "warns when only ~15 hours remain and mastery is low");
check(buildPlan({ exam: "fe-civil", today, examDate: days(-2), weeklyHours: 5, answeredLast7Days: 0, focus, fullExamsDone: [] }).phase === "past", "past exam date detected");

console.log(`\n${failures} failure(s)`);
process.exit(failures ? 1 : 0);
