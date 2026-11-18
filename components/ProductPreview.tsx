import { Icon } from "./Icon";

/** Static illustration of a practice question (example content, not live data). */
export function ProductPreview() {
  const choices = ["0.42 cfs", "4.7 cfs", "12.8 cfs", "21.0 cfs"];
  return (
    <div className="relative" aria-label="Example of a CivilPrep practice question">
      <div className="card elevated p-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">Smart practice · Question 4 of 10</span>
          <span className="muted text-xs">Example</span>
        </div>
        <p className="text-xs font-medium" style={{ color: "var(--brand)" }}>
          Why this question: Hydrology is your weakest topic on the exam.
        </p>
        <p className="leading-relaxed">
          A 6-acre site has a runoff coefficient of 0.55. For a design intensity of 3.9 in/hr, what is the peak
          runoff by the rational method?
        </p>
        <ul className="space-y-1.5">
          {choices.map((c, i) => {
            const right = i === 2;
            return (
              <li
                key={c}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ border: `1px solid ${right ? "var(--good)" : "var(--border)"}`, background: right ? "color-mix(in srgb, var(--good) 10%, transparent)" : undefined }}
              >
                <span className="font-semibold w-4">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{c}</span>
                {right && <span style={{ color: "var(--good)" }}><Icon name="check" size={16} /></span>}
              </li>
            );
          })}
        </ul>
        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "var(--bg)" }}>
          <strong>Correct.</strong> Q = CiA = (0.55)(3.9 in/hr)(6 ac) = 12.8 cfs. Handbook: Water Resources, rational
          method.
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="muted text-xs whitespace-nowrap">Your readiness</span>
          <div className="h-1.5 rounded flex-1" style={{ background: "var(--border)" }}>
            <div className="h-1.5 rounded" style={{ width: "72%", background: "var(--brand)" }} />
          </div>
          <span className="font-bold" style={{ color: "var(--good)" }}>72%</span>
        </div>
      </div>
    </div>
  );
}
