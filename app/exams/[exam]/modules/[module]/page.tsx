import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { topicName } from "@/lib/content/exams";
import { PE_MODULE_SPECS } from "@/lib/content/pe-spec";
import { getCurrentUser } from "@/lib/auth";
import { moduleOverview } from "@/lib/pe-modules";
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
  const user = await getCurrentUser();
  const o = exam === "pe-civil" ? await moduleOverview(user, module) : null;
  if (!o) notFound();
  const { name, access, isMine, areas } = o;
  const spec = { effective: o.effective };

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
        {areas.map((a) => {
          const { fixed, free, calc, seen, total, right, share } = a;
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
              {seen > 0 && (
                <div className="flex items-center gap-3 text-xs" aria-label={`${Math.round((100 * right) / seen)}% right on the ${seen} items practiced`}>
                  <div className="h-1.5 rounded flex-1 max-w-48" style={{ background: "var(--chart-grid)" }}>
                    <div className="h-1.5 rounded bar-fill" style={{ width: `${Math.round((100 * right) / seen)}%`, background: "var(--chart-line)" }} />
                  </div>
                  <span className="muted">{Math.round((100 * seen) / total)}% of this area practiced</span>
                </div>
              )}
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
