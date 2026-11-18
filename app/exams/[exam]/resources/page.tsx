import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { getCurrentUser } from "@/lib/auth";
import { hasExamAccess } from "@/lib/access";
import { RESOURCES_CHECKED, resourcesFor } from "@/lib/content/resources";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = await params;
  if (!isExamId(exam)) notFound();
  const def = EXAMS[exam];
  const user = await getCurrentUser();
  const access = hasExamAccess(user, exam);
  const sections = resourcesFor(exam);
  // On the PE page, show the student's own PE module first.
  const depth = exam === "pe-civil" ? user?.peDepth : null;
  const ordered = depth ? [...sections].sort((a, b) => Number(b.id === depth) - Number(a.id === depth)) : sections;
  const total = sections.reduce((n, s) => n + s.links.length, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Exam documents and resources</h1>
        <p className="muted mt-1">
          Every official document you need for the {def.shortName}, plus {exam === "pe-civil" ? "each PE module's design standards, marked free or paid" : "registration and exam-day rules"}. Links go to NCEES, publishers and government sites; we don&apos;t host these documents.
        </p>
      </div>

      {!access ? (
        <div className="card p-6 space-y-3">
          <p className="font-semibold">🔒 Premium feature</p>
          <p>
            {total} curated links in {sections.length} sections: {sections.map((s) => s.title.replace("Design standards: ", "")).join(", ")}.
          </p>
          <p className="muted text-sm">Includes which standards you can download free from FHWA, OSHA, USACE and others, and which ones you'd need to buy.</p>
          {user ? (
            <Link href="/pricing" className="btn inline-block">Unlock with a {def.shortName} plan</Link>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" className="btn">See plans</Link>
              <Link href="/login" className="btn-ghost">Log in</Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {ordered.map((s) => (
            <section key={s.id} className="space-y-2">
              <h2 className="text-xl font-semibold">
                {s.title}
                {s.id === depth && <span className="text-sm font-normal" style={{ color: "var(--brand-text)" }}> · your PE module</span>}
              </h2>
              {s.intro && <p className="muted text-sm">{s.intro}</p>}
              <ul className="card divide-y" style={{ borderColor: "var(--border)" }}>
                {s.links.map((l) => (
                  <li key={l.title} className="p-3 space-y-0.5" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {l.title} <span aria-hidden>↗</span>
                      </a>
                      {l.cost && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                          style={l.cost === "free" ? { background: "#15803d", color: "#fff" } : { border: "1px solid var(--border)" }}
                        >
                          {l.cost === "free" ? "Free" : "Purchase"}
                        </span>
                      )}
                    </div>
                    {l.note && <p className="muted text-sm">{l.note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="muted text-xs">
            Links checked {RESOURCES_CHECKED}. NCEES updates specifications and design standards about 6 months before they take effect; the NCEES exam page is always the final word. See a broken link? Use Report a problem on any question or email us.
          </p>
        </>
      )}
    </div>
  );
}
