import Link from "next/link";
import type { Metadata } from "next";
import { CHECKED, COMPETITORS } from "@/lib/content/competitors";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Compare FE & PE Civil prep options | CivilPrep",
  description: "How CivilPrep compares with PPI2Pass, School of PE and PrepFE on price and features.",
};

export default function CompareIndex() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <p className="eyebrow">Compare</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">How CivilPrep compares</h1>
        <p className="muted text-lg">An honest side-by-side with the prep options engineers ask us about most, including where they&apos;re the better fit.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {COMPETITORS.map((c) => (
          <Link key={c.slug} href={`/compare/${c.slug}`} className="card card-link p-6 flex flex-col gap-2">
            <h2 className="font-semibold text-lg">CivilPrep vs {c.name}</h2>
            <p className="muted text-sm">{c.kind}</p>
            <p className="text-sm">{c.rows.feprice}</p>
            <span className="mt-auto pt-2 inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--brand-text)" }}>
              Compare <Icon name="arrow" size={16} />
            </span>
          </Link>
        ))}
      </div>
      <p className="muted text-xs">Competitor details as published, {CHECKED}. Trademarks belong to their owners.</p>
    </div>
  );
}
