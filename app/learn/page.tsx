import Link from "next/link";
import type { Metadata } from "next";
import { EXPLAINERS } from "@/lib/content/explainers";
import { EXAMS, topicName } from "@/lib/content/exams";

export const metadata: Metadata = {
  title: "FE and PE Civil formula guides | CivilPrep",
  description: "Free guides to the formulas that show up most on the FE and PE Civil exams: what each one means, common mistakes, where it is in the handbook, and a worked example.",
  alternates: { canonical: "/learn" },
};

export default function LearnIndex() {
  const groups = new Map<string, typeof EXPLAINERS>();
  for (const e of EXPLAINERS) {
    const key = topicName(e.exam, e.topic);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <p className="eyebrow">Free formula guides</p>
        <h1 className="text-3xl font-semibold tracking-tight">The formulas that show up most on the FE and PE Civil</h1>
        <p className="muted">Each guide covers the formula and its variables, when to use it, the mistakes that cost points, where it is in the reference handbook, and a worked example.</p>
      </div>
      {[...groups].map(([group, list]) => (
        <section key={group} className="space-y-3">
          <h2 className="text-lg font-semibold">{group}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {list.map((e) => (
              <li key={e.slug}>
                <Link href={`/learn/${e.slug}`} className="card card-link p-4 block h-full">
                  <span className="font-semibold">{e.title}</span>
                  <span className="muted text-sm block mt-1">{e.summary}</span>
                  <span className="text-xs block mt-2" style={{ color: "var(--brand-text)" }}>{EXAMS[e.exam].shortName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
