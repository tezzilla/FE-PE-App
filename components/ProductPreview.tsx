"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";

// Interactive sample questions for the homepage. Numbers are worked out in the explanations; each
// example puts the right answer in a different position.
const EXAMPLES = [
  {
    tag: "Water Resources",
    why: "Hydrology is your weakest topic on the exam.",
    prompt: "A 6-acre site has a runoff coefficient of 0.55. For a design intensity of 3.9 in/hr, what is the peak runoff by the rational method?",
    choices: ["1.07 cfs", "12.9 cfs", "23.4 cfs", "46.8 cfs"],
    answer: 1,
    explanation: "Q = CiA = (0.55)(3.9 in/hr)(6 ac) = 12.9 cfs. 23.4 cfs forgets the runoff coefficient; 1.07 cfs divides by 12 for no reason.",
    ref: "Handbook: Water Resources, rational formula",
  },
  {
    tag: "Geotechnical",
    why: "You missed a similar problem 3 days ago.",
    prompt: "The water table is 2 m below the surface. The soil weighs 18 kN/m³ above it and 20 kN/m³ (saturated) below. What is the vertical effective stress 6 m deep? (γw = 9.81 kN/m³)",
    choices: ["76.8 kPa", "80.8 kPa", "116 kPa", "155 kPa"],
    answer: 0,
    explanation: "σ = 18(2) + 20(4) = 116 kPa. u = 9.81(4) = 39.2 kPa. σ′ = σ − u = 76.8 kPa. 116 kPa is the total stress; 155 kPa adds the pore pressure instead of subtracting it.",
    ref: "Handbook: Geotechnical, effective stress",
  },
  {
    tag: "Engineering Economics",
    why: "Due for review so you don't forget it.",
    prompt: "$10,000 is invested at 6% per year, compounded annually. What is it worth after 10 years?",
    choices: ["$5,580", "$16,000", "$16,900", "$17,900"],
    answer: 3,
    explanation: "F = P(1 + i)ⁿ = 10,000(1.06)¹⁰ = $17,908. $16,000 is simple interest; $16,900 is one year short; $5,580 is the present worth factor used backwards.",
    ref: "Handbook: Engineering Economics, F/P factor",
  },
];

export function ProductPreview() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ex = EXAMPLES[i];
  const right = checked && picked === ex.answer;

  const next = () => {
    setI((n) => (n + 1) % EXAMPLES.length);
    setPicked(null);
    setChecked(false);
  };

  return (
    <div className="card elevated p-5 space-y-3 text-sm" aria-label="Try a sample CivilPrep question">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">Try it · {ex.tag}</span>
        <span className="muted text-xs">Sample {i + 1} of {EXAMPLES.length}</span>
      </div>
      <p className="text-xs font-medium" style={{ color: "var(--brand-text)" }}>
        Why this question: {ex.why}
      </p>
      <p key={`p${i}`} className="leading-relaxed flip-in">{ex.prompt}</p>
      <div className="space-y-1.5" role="radiogroup" aria-label="Answer choices">
        {ex.choices.map((c, k) => {
          const isAnswer = checked && k === ex.answer;
          const isWrongPick = checked && k === picked && k !== ex.answer;
          const border = isAnswer ? "var(--good)" : isWrongPick ? "#dc2626" : picked === k ? "var(--brand)" : "var(--border)";
          return (
            <div key={`${i}-${k}`}>
              <button
                type="button"
                role="radio"
                aria-checked={picked === k}
                disabled={checked}
                onClick={() => setPicked(k)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${checked ? "" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"} ${isAnswer && picked === k ? "anim-correct" : ""} ${isWrongPick ? "anim-wrong" : ""}`}
                style={{
                  border: `${picked === k || isAnswer ? 2 : 1}px solid ${border}`,
                  background: isAnswer ? "color-mix(in srgb, var(--good) 10%, transparent)" : undefined,
                }}
              >
                <span className="font-semibold w-4">{String.fromCharCode(65 + k)}</span>
                <span className="flex-1">{c}</span>
                {isAnswer && <span style={{ color: "var(--good)" }}><Icon name="check" size={16} /></span>}
              </button>
            </div>
          );
        })}
      </div>

      {checked ? (
        <div className="enter space-y-3">
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: right ? "color-mix(in srgb, var(--good) 10%, transparent)" : "color-mix(in srgb, #dc2626 8%, transparent)" }}>
            <p className="font-semibold mb-1">{right ? "Correct." : `Not quite. The answer is ${String.fromCharCode(65 + ex.answer)}.`}</p>
            <p>{ex.explanation}</p>
            <p className="muted mt-1">{ex.ref}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn !py-2" onClick={next}>
              Next sample <Icon name="arrow" size={16} className="ml-1.5" />
            </button>
            <Link href="/signup" className="text-sm font-semibold underline" style={{ color: "var(--brand-text)" }}>
              Get questions picked for you
            </Link>
          </div>
        </div>
      ) : (
        <button type="button" className="btn w-full !py-2" disabled={picked === null} onClick={() => setChecked(true)}>
          Check answer
        </button>
      )}
    </div>
  );
}
