"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Timed "where is it in the handbook?" drill. Exam day rewards finding the right chapter fast, so each
// answer shows whether it was right and how long it took; the summary gives accuracy and average time.

export type DrillItem = { prompt: string; choices: string[]; answer: number };

const TARGET_S = 15;

export function HandbookDrill({ items }: { items: DrillItem[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ ok: boolean; s: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);

  useEffect(() => {
    start.current = performance.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed((performance.now() - start.current) / 1000), 200);
    return () => clearInterval(t);
  }, [i]);

  const done = i >= items.length;
  if (done) {
    const right = results.filter((r) => r.ok).length;
    const avg = results.reduce((a, r) => a + r.s, 0) / Math.max(1, results.length);
    return (
      <div className="card p-6 text-center space-y-3">
        <p className="text-4xl font-extrabold">{right}/{items.length}</p>
        <p className="muted">Average {avg.toFixed(1)} s per lookup {avg <= TARGET_S ? "(nice pace)" : `(aim for under ${TARGET_S} s)`}</p>
        <p className="text-sm muted">Knowing which chapter to open saves minutes per problem on exam day.</p>
        <button className="btn" onClick={() => router.refresh()}>New round</button>
      </div>
    );
  }

  const q = items[i];
  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    setResults((r) => [...r, { ok: k === q.answer, s: (performance.now() - start.current) / 1000 }]);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between text-sm muted">
        <span>{i + 1} of {items.length}</span>
        <span className="tabular-nums" aria-live="off">{picked === null ? `${elapsed.toFixed(0)} s` : `${results[results.length - 1].s.toFixed(1)} s`}</span>
      </div>
      <p className="text-sm muted">Which handbook chapter would you open for:</p>
      <p className="text-lg font-semibold">{q.prompt}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {q.choices.map((c, k) => {
          const state = picked === null ? "" : k === q.answer ? "correct" : k === picked ? "wrong" : "";
          return (
            <button
              key={c}
              onClick={() => choose(k)}
              disabled={picked !== null}
              className={`card p-3 text-left text-sm ${state === "correct" ? "anim-correct" : state === "wrong" ? "anim-wrong" : "card-link"}`}
              style={state === "correct" ? { borderColor: "var(--good, #16a34a)" } : state === "wrong" ? { borderColor: "#dc2626" } : undefined}
            >
              {c}
              {state === "correct" && <span className="sr-only"> (correct)</span>}
              {state === "wrong" && <span className="sr-only"> (your answer, incorrect)</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" role="status">{picked === q.answer ? "Correct." : `It's in ${q.choices[q.answer]}.`}</p>
          <button className="btn" onClick={() => { setPicked(null); setI((v) => v + 1); }} autoFocus>
            {i + 1 === items.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
