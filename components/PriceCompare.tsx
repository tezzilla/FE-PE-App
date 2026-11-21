"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";

interface Option {
  id: string;
  label: string;
  sub: string;
  price: string;
  suffix?: string;
  struck?: boolean;
  eyebrow: string;
  heading: string;
  text: string;
  points: string[];
  cta: { href: string; label: string };
}

const usd = (x: number) => "$" + x.toLocaleString("en-US");

/** Price comparison where choosing an option rewrites the pitch beside it. */
export function PriceCompare({ fe, fePass, pe, pePass }: { fe: number; fePass?: number; pe: number; pePass?: number }) {
  const pct = (x: number) => `${Math.round((100 * x) / 1100)}%`;
  const options: Option[] = [
    {
      id: "course",
      label: "Typical on-demand review course",
      sub: "4 to 12 months",
      price: "$1,100+",
      struck: true,
      eyebrow: "The usual route",
      heading: "Big review courses cost $1,100 to $2,000. You don't need one to pass.",
      text: "You pay for hours of recorded lectures on a fixed schedule. What actually moves your score is working hundreds of exam-style problems with the handbook open.",
      points: ["Lectures you'll mostly skip", "Often paid out of your own pocket", "One price whether you need 3 months or 12"],
      cta: { href: "/pricing", label: "Compare CivilPrep plans" },
    },
    {
      id: "fe",
      label: "CivilPrep FE Civil",
      sub: fePass ? `or ${usd(fePass)} for a 3-month pass` : "cancel anytime",
      price: usd(fe),
      suffix: "/mo",
      eyebrow: "FE Civil",
      heading: fePass
        ? `Everything for the FE for ${usd(fe)}/month, or ${usd(fePass)} for 3 months.`
        : `Everything for the FE for ${usd(fe)}/month.`,
      text: `That's about ${pct(fePass ?? fe * 3)} of a typical course for a full 3-month study period, and you can cancel anytime.`,
      points: ["All 14 FE Civil topic areas", "Full 110-question timed exams", "Smart practice, flashcards and a study plan"],
      cta: { href: "/signup", label: "Start FE prep free" },
    },
    {
      id: "pe",
      label: "CivilPrep PE Civil",
      sub: pePass ? `or ${usd(pePass)} for a 6-month pass` : "FE content included",
      price: usd(pe),
      suffix: "/mo",
      eyebrow: "PE Civil",
      heading: pePass
        ? `The PE Civil for ${usd(pe)}/month, or ${usd(pePass)} for 6 months.`
        : `The PE Civil for ${usd(pe)}/month.`,
      text: `About ${pct(pePass ?? pe * 6)} of a typical course for six months of prep, with all five PE module exams and FE content included for refreshing fundamentals.`,
      points: ["All 5 PE module exams", "Full 80-question timed exams", "Design standards guide: free vs. paid"],
      cta: { href: "/signup", label: "Start PE prep free" },
    },
  ];
  const [sel, setSel] = useState("course");
  const o = options.find((x) => x.id === sel)!;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div key={o.id} className="space-y-3 flip-in" aria-live="polite">
        <p className="eyebrow">{o.eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight">{o.heading}</h2>
        <p className="muted">{o.text}</p>
        <ul className="space-y-1.5 text-sm">
          {o.points.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span style={{ color: o.struck ? "#94a3b8" : "var(--good)" }}>
                <Icon name={o.struck ? "chevron" : "check"} size={16} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <Link href={o.cta.href} className="btn mt-2">
          {o.cta.label} <Icon name="arrow" size={16} className="ml-1.5" />
        </Link>
      </div>
      <div className="space-y-3" role="radiogroup" aria-label="Compare prices">
        {options.map((x) => {
          const on = x.id === sel;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSel(x.id)}
              className="w-full text-left rounded-xl p-4 flex items-center justify-between gap-3 transition"
              style={
                on
                  ? { border: "2px solid var(--brand)", background: "var(--card)", color: "var(--fg)" }
                  : { border: "1px solid rgb(255 255 255 / 0.15)", background: "rgb(255 255 255 / 0.03)" }
              }
              data-inset={on ? "" : undefined}
            >
              <div>
                <p className="font-semibold">{x.label}</p>
                <p className="muted text-sm">{x.sub}</p>
              </div>
              <p className={`text-2xl font-semibold whitespace-nowrap ${x.struck ? "line-through decoration-2 opacity-70" : ""}`}>
                {x.price}
                {x.suffix && <span className="text-base font-normal muted">{x.suffix}</span>}
              </p>
            </button>
          );
        })}
        <p className="muted text-xs">
          Tap an option to compare. Course prices are published on-demand prices from major FE/PE review providers, November 2026.
        </p>
      </div>
    </div>
  );
}
