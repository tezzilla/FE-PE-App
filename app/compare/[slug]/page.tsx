import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CHECKED, CIVILPREP, COMPETITORS, ROWS, getCompetitor } from "@/lib/content/competitors";
import { SOLD_PLANS } from "@/lib/plans";
import { Icon } from "@/components/Icon";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCompetitor((await params).slug);
  return c
    ? { title: `CivilPrep vs ${c.name}: FE & PE Civil prep compared`, description: `How CivilPrep compares with ${c.name} on price, practice exams, adaptive practice and more.` }
    : {};
}

/** CivilPrep's prices straight from the plan list, so this page never drifts from the pricing page. */
function ourPrices() {
  const line = (exam: string, fallback: string) => {
    const m = SOLD_PLANS.find((p) => p.exam === exam && p.kind === "subscription");
    const pass = SOLD_PLANS.find((p) => p.exam === exam && p.kind === "pass");
    return [m && `$${m.price}/month`, pass && `$${pass.price} for ${pass.days! / 30} months`].filter(Boolean).join(", or ") || fallback;
  };
  return { ...CIVILPREP, feprice: line("fe-civil", CIVILPREP.feprice), peprice: line("pe-civil", CIVILPREP.peprice) };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCompetitor((await params).slug);
  if (!c) notFound();
  const us = ourPrices();

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="space-y-3">
        <Link href="/compare" className="muted text-sm hover:underline">All comparisons</Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">CivilPrep vs {c.name}</h1>
        <p className="muted text-lg leading-relaxed">{c.summary}</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[36rem]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left p-3 sm:p-4 w-1/4"></th>
              <th className="text-left p-3 sm:p-4" style={{ color: "var(--brand-text)" }}>CivilPrep</th>
              <th className="text-left p-3 sm:p-4">{c.name}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key} style={{ borderTop: "1px solid var(--border)" }}>
                <th scope="row" className="text-left font-semibold p-3 sm:p-4 align-top">{r.label}</th>
                <td className="p-3 sm:p-4 align-top">{us[r.key]}</td>
                <td className="p-3 sm:p-4 align-top muted">{c.rows[r.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-3">
          <h2 className="font-bold text-lg">Choose {c.name} if</h2>
          <ul className="space-y-2">
            {c.chooseThem.map((t) => <li key={t} className="flex gap-2"><span className="muted mt-0.5"><Icon name="check" size={16} /></span>{t}</li>)}
          </ul>
        </div>
        <div className="card p-6 space-y-3" style={{ borderColor: "var(--brand)" }}>
          <h2 className="font-bold text-lg">Choose CivilPrep if</h2>
          <ul className="space-y-2">
            {c.chooseUs.map((t) => <li key={t} className="flex gap-2"><span className="mt-0.5" style={{ color: "var(--good)" }}><Icon name="check" size={16} /></span>{t}</li>)}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/signup" className="btn">Start free</Link>
            <Link href="/pricing" className="btn-ghost">See pricing</Link>
          </div>
        </div>
      </div>

      <p className="muted text-xs leading-relaxed">
        {c.name} details are from its published website and review sites as of {CHECKED}, and may have changed; check{" "}
        <a href={c.url} className="underline" rel="nofollow noopener" target="_blank">{c.url.replace(/^https?:\/\//, "")}</a> for current offers.
        Prices are approximate and exclude sales. {c.name} is a trademark of its owner; CivilPrep is not affiliated with or endorsed by {c.name}.
      </p>
    </div>
  );
}
