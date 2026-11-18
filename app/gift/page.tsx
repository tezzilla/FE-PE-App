import type { Metadata } from "next";
import { EXAMS } from "@/lib/content/exams";
import { GIFTABLE_PLANS } from "@/lib/plans";
import { billingStatus } from "@/lib/stripe";
import { GiftForm } from "@/components/GiftForms";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Give FE or PE Civil exam prep | CivilPrep",
  description: "Gift a CivilPrep FE or PE Civil pass to a graduate, coworker or friend studying for their exam.",
};

export default async function GiftPage() {
  const ready = (await billingStatus()).ready;
  const plans = GIFTABLE_PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    days: p.days!,
    blurb: `${p.days! / 30} months of ${EXAMS[p.exam].name}${p.exam === "pe-civil" ? " (FE content included)" : ""}`,
  }));

  return (
    <div className="grid md:grid-cols-2 gap-10 items-start max-w-4xl mx-auto md:pt-6">
      <div className="space-y-5">
        <p className="eyebrow">Gift a pass</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Give someone a head start on their license</h1>
        <p className="muted text-lg leading-relaxed">
          A thoughtful gift for a new graduate, a coworker studying for the PE, or anyone on the path to licensure. Firms can
          use it to sponsor an employee&apos;s prep, with a receipt for your records.
        </p>
        <ul className="space-y-3">
          {[
            "Full question bank, smart practice and timed exams",
            "One payment, no renewal",
            "Access starts when they redeem it",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 shrink-0" style={{ color: "var(--good)" }}><Icon name="check" /></span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="card elevated p-6 sm:p-8">
        {ready ? <GiftForm plans={plans} /> : <p className="muted">Gifts open soon.</p>}
      </div>
    </div>
  );
}
