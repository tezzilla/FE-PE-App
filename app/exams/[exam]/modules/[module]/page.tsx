import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { topicName } from "@/lib/content/exams";
import { PE_MODULE_SPECS, midQuestions } from "@/lib/content/pe-spec";
import { getQuestion } from "@/lib/content";
import { getTemplate } from "@/lib/templates";
import { getCurrentUser } from "@/lib/auth";
import { canSeeQuestion, hasExamAccess } from "@/lib/access";
import { approvedTemplates } from "@/lib/reviews";
import { learnerState } from "@/lib/adaptive/server";
import { setPeDepth } from "@/app/actions/prefs";

export const dynamic = "force-dynamic";

// One PE Civil module exam: every NCEES knowledge area with its question range and sub-topics, what
// CivilPrep has for it, the student's progress, and a button to practice just that area.

export async function generateMetadata({ params }: { params: Promise<{ exam: string; module: string }> }): Promise<Metadata> {
  const { exam, module } = await params;
  if (exam !== "pe-civil" || !PE_MODULE_SPECS[module]) return {};
  const name = topicName("pe-civil", module);
  return {
    title: `PE Civil: ${name} exam topics and practice | CivilPrep`,
    description: `Every NCEES knowledge area on the PE Civil: ${name} exam, with question counts, sub-topics and practice problems for each.`,
  };
}

export default async function ModulePage({ params }: { params: Promise<{ exam: string; module: string }> }) {
  const { exam, module } = await params;
  const spec = exam === "pe-civil" ? PE_MODULE_SPECS[module] : undefined;
  if (!spec) notFound();
  const name = topicName("pe-civil", module);
  const user = await getCurrentUser();
  const access = hasExamAccess(user, "pe-civil");
  const approved = await approvedTemplates();
  const state = user ? await learnerState(user.id, "pe-civil") : null;
  const isMine = user?.peDepth === module;

  const areas = spec.areas.map((a) => {
    const fixed = a.skills.flatMap((k) => (k.startsWith("pe-") ? (getQuestion(k) ?? []) : []));
    const calc = a.skills.filter((k) => !k.startsWith("pe-") && approved.has(getTemplate(k)?.id ?? ""));
    const keys = [...fixed.map((q) => q.id), ...calc.map((k) => `tpl:${k}`)];
    const seen = state ? keys.filter((k) => state.skills.has(k)) : [];
    const right = seen.filter((k) => state!.skills.get(k)!.lastCorrect).length;
    return {
      a,
      fixed: fixed.length,
      free: fixed.filter((q) => canSeeQuestion(user, q)).length,
      calc: calc.length,
      seen: seen.length,
      total: keys.length,
      right,
    };
  });
  const totalMid = spec.areas.reduce((s, a) => s + midQuestions(a.questions), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <Link href="/exams/pe-civil" className="muted text-sm hover:underline">PE Civil</Link>
        <h1 className="text-2xl sm:text-3xl font-bold">PE Civil: {name}</h1>
        <p className="muted">
          80 questions in 9 hours, computer-based, with the PE Civil Reference Handbook and this module&apos;s design
          standards. NCEES knowledge areas effective {spec.effective}.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          {user && !isMine && (
            <form action={setPeDepth}>
              <input type="hidden" name="peDepth" value={module} />
              <input type="hidden" name="back" value={`/exams/pe-civil/modules/${module}`} />
              <button className="btn">This is my exam</button>
            </form>
          )}
          {isMine && <span className="text-sm font-semibold self-center" style={{ color: "var(--good)" }}>✓ Your PE exam. Smart practice and timed exams follow this blueprint.</span>}
          {user && <Link href="/exams/pe-civil/smart" className="btn-ghost">Smart practice</Link>}
          <Link href="/exams/pe-civil/mock" className="btn-ghost">Full timed exam {access ? "" : "🔒"}</Link>
          <Link href="/exams/pe-civil/resources" className="btn-ghost">Design standards</Link>
        </div>
      </div>

      <ol className="space-y-3">
        {areas.map(({ a, fixed, free, calc, seen, total, right }) => {
          const share = Math.round((100 * midQuestions(a.questions)) / totalMid);
          const thin = fixed + calc < 3;
          return (
            <li key={a.n} className="card p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-semibold text-lg">
                  {a.n}. {a.name}
                </h2>
                <span className="muted text-sm whitespace-nowrap">{a.questions} questions · about {share}% of the exam</span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {a.items.map((it, i) => (
                  <li key={it} className="flex gap-2">
                    <span className="muted font-mono">{String.fromCharCode(65 + i)}.</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
                <p className="muted">
                  {fixed} question{fixed === 1 ? "" : "s"}
                  {calc ? ` + ${calc} calculation problem${calc === 1 ? "" : "s"} that never repeat` : ""}
                  {!access && fixed + calc > 0 ? ` · ${free} free` : ""}
                  {seen > 0 ? ` · you've practiced ${seen} of ${total}, ${Math.round((100 * right) / seen)}% right last time` : ""}
                  {thin ? " · more coming" : ""}
                </p>
                {fixed + calc > 0 && (
                  <Link href={`/exams/pe-civil/practice?topic=${module}&area=${a.n}`} className="btn-ghost !py-1.5">
                    Practice this area
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="muted text-xs">
        Knowledge area names, question ranges and sub-topics are from the NCEES PE Civil: {name} exam specification.
        Check ncees.org for the current version before your exam.
      </p>
    </div>
  );
}
