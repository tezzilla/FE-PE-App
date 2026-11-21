"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExamId, PublicQuestion } from "@/lib/content/types";
import { QuestionCard, type Feedback } from "./QuestionCard";
import { Icon } from "@/components/Icon";

type Phase = "ready" | "exam" | "review" | "break" | "submitting" | "done";
const BREAK_SECONDS = 25 * 60;

interface Saved {
  phase: Phase;
  session: number;
  i: number;
  answers: Record<string, number>;
  flags: string[];
  left: number;
  breakLeft: number;
  used: number;
}

interface Result {
  mockId: string;
  total: number;
  correct: number;
  breakdown: Record<string, [number, number]>;
  results: Record<string, Feedback>;
}

const fmt = (s: number) =>
  `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function load(key: string): Saved | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

/**
 * Full-length exam in the style of the NCEES computer-based test: two timed sessions with an optional
 * break, flag-and-review before ending each session, no going back to a finished session, and the
 * student's own reference handbook PDF beside the questions. Progress is saved in the browser so a
 * refresh or crash resumes where it left off (the question list itself is saved on the server).
 */
export function FullExam({
  mockId,
  exam,
  sessions,
  sessionSeconds,
  topicNames,
  discard,
}: {
  /** "Discard and start over" control, hidden once the exam is submitted. */
  discard?: React.ReactNode;
  mockId: string;
  exam: ExamId;
  sessions: PublicQuestion[][];
  sessionSeconds: number[];
  topicNames: Record<string, string>;
}) {
  const key = `civilprep.fullexam.${mockId}`;
  const [s, setS] = useState<Saved>(() => ({
    phase: "ready",
    session: 0,
    i: 0,
    answers: {},
    flags: [],
    left: sessionSeconds[0],
    breakLeft: BREAK_SECONDS,
    used: 0,
  }));
  const [restored, setRestored] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [pdf, setPdf] = useState<string | null>(null);
  const [showRef, setShowRef] = useState(false);
  const [filter, setFilter] = useState<"incorrect" | "flagged" | "all">("incorrect");
  const [reviewIdx, setReviewIdx] = useState(0);
  const submitting = useRef(false);

  // Restore saved progress after mount (localStorage isn't available during server rendering).
  useEffect(() => {
    const saved = load(key);
    if (saved && saved.phase !== "done" && saved.phase !== "submitting") setS(saved);
    setRestored(true);
  }, [key]);

  useEffect(() => {
    if (!restored || s.phase === "done") return;
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {
      /* private mode: progress just isn't saved */
    }
  }, [s, key, restored]);

  const submit = useCallback(
    async (state: Saved) => {
      if (submitting.current) return;
      submitting.current = true;
      setS({ ...state, phase: "submitting" });
      const res = await fetch("/api/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockId, answers: state.answers, flags: state.flags, durationS: state.used }),
      }).catch(() => null);
      if (!res?.ok) {
        submitting.current = false;
        setError(res?.status === 409 ? "This exam was already submitted." : "Couldn't submit. Check your connection and try again.");
        setS({ ...state, phase: "review" });
        return;
      }
      setResult(await res.json());
      setS({ ...state, phase: "done" });
      try {
        localStorage.removeItem(key);
      } catch {}
    },
    [mockId, key],
  );

  const endSession = useCallback(
    (state: Saved) => {
      setConfirmEnd(false);
      if (state.session < sessions.length - 1) {
        setS({ ...state, phase: "break", breakLeft: BREAK_SECONDS });
      } else {
        void submit(state);
      }
    },
    [sessions.length, submit],
  );

  // One clock for the exam sessions and the break.
  useEffect(() => {
    if (!restored) return;
    if (s.phase !== "exam" && s.phase !== "review" && s.phase !== "break") return;
    const t = setTimeout(() => {
      setS((cur) => {
        if (cur.phase === "break") {
          if (cur.breakLeft <= 1) return { ...cur, phase: "exam", session: cur.session + 1, i: 0, left: sessionSeconds[cur.session + 1] };
          return { ...cur, breakLeft: cur.breakLeft - 1 };
        }
        if (cur.left <= 1) {
          queueMicrotask(() => endSession({ ...cur, left: 0, used: cur.used + 1 }));
          return { ...cur, left: 0, used: cur.used + 1 };
        }
        return { ...cur, left: cur.left - 1, used: cur.used + 1 };
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [s, restored, sessionSeconds, endSession]);

  const qs = sessions[s.session] ?? [];
  const q = qs[s.i];
  const flagged = new Set(s.flags);

  const handbook = (
    <aside className="card p-3 space-y-2 h-fit md:sticky md:top-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">Reference handbook</p>
        <button type="button" className="muted text-sm underline" onClick={() => setShowRef(false)}>Hide</button>
      </div>
      {pdf ? (
        <>
          <iframe src={pdf} title="Reference handbook" className="w-full rounded" style={{ height: "72vh", border: "1px solid var(--border)" }} />
          <p className="muted text-xs">Search with Ctrl+F (⌘F) inside the document, as on the real exam.</p>
        </>
      ) : (
        <div className="text-sm space-y-2">
          <p>
            Open the official NCEES {exam === "fe-civil" ? "FE" : "PE Civil"} Reference Handbook PDF you downloaded from your{" "}
            <a href="https://ncees.org/" target="_blank" rel="noreferrer" className="underline">MyNCEES account</a>. It&apos;s free
            for candidates. The file stays on your device; it isn&apos;t uploaded.
          </p>
          <input
            type="file"
            accept="application/pdf"
            aria-label="Open your reference handbook PDF"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPdf(URL.createObjectURL(file));
            }}
          />
        </div>
      )}
    </aside>
  );

  if (!restored) return <p className="muted">Loading…</p>;
  const discardBar = s.phase !== "done" && s.phase !== "submitting" && discard ? <div className="flex justify-end">{discard}</div> : null;

  // ---------------------------------------------------------------- results
  if (s.phase === "done" && result) {
    const pct = Math.round((100 * result.correct) / Math.max(1, result.total));
    const all = sessions.flat();
    const list = all.filter((x) =>
      filter === "all" ? true : filter === "flagged" ? flagged.has(x.id) : !result.results[x.id]?.correct,
    );
    const cur = list[Math.min(reviewIdx, list.length - 1)];
    const rows = Object.entries(result.breakdown).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]);
    return (
      <div className="space-y-5">
        <div className="card p-6 text-center space-y-1">
          <p className="text-4xl font-semibold">{pct}%</p>
          <p className="muted">{result.correct} of {result.total} correct · time used {fmt(s.used)}</p>
          <p className="muted text-sm">NCEES doesn&apos;t publish a fixed passing percentage. Use this to compare your own attempts and to find weak topics.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">By topic (weakest first)</h2>
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([topic, [c, t]]) => (
                <tr key={topic} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-1.5">{topicNames[topic] ?? topic}</td>
                  <td className="py-1.5 text-right">{c}/{t}</td>
                  <td className="py-1.5 text-right w-16 font-semibold" style={{ color: c / t >= 0.7 ? "#16a34a" : c / t >= 0.5 ? "#ca8a04" : "#dc2626" }}>
                    {Math.round((100 * c) / t)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold mr-2">Review</h2>
          {(["incorrect", "flagged", "all"] as const).map((f) => (
            <button key={f} type="button" className={filter === f ? "btn !py-1" : "btn-ghost !py-1"} onClick={() => { setFilter(f); setReviewIdx(0); }}>
              {f === "incorrect" ? "Incorrect" : f === "flagged" ? "Flagged" : "All"}
            </button>
          ))}
          <Link href={`/exams/${exam}/smart`} className="btn-ghost !py-1 ml-auto">Practice weak topics</Link>
        </div>
        {cur ? (
          <>
            <p className="muted text-sm">{Math.min(reviewIdx, list.length - 1) + 1} of {list.length} · {topicNames[cur.topic]}</p>
            <QuestionCard question={cur} selected={s.answers[cur.id] ?? null} feedback={result.results[cur.id]} />
            <div className="flex justify-between">
              <button type="button" className="btn-ghost" disabled={reviewIdx === 0} onClick={() => setReviewIdx(reviewIdx - 1)}>Previous</button>
              <button type="button" className="btn-ghost" disabled={reviewIdx >= list.length - 1} onClick={() => setReviewIdx(reviewIdx + 1)}>Next</button>
            </div>
          </>
        ) : (
          <p className="muted">Nothing to show for this filter.</p>
        )}
      </div>
    );
  }

  if (s.phase === "submitting") return <div className="card p-6 text-center">Scoring your exam…</div>;

  // ---------------------------------------------------------------- break
  if (s.phase === "break") {
    return (
      <div className="card p-6 text-center space-y-3 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold">Session {s.session + 1} complete</h2>
        <p>Optional break: <span className="font-mono text-lg">{fmt(s.breakLeft)}</span></p>
        <p className="muted text-sm">The real exam offers a scheduled break here. Session {s.session + 2} starts automatically when the break ends. You can&apos;t return to session {s.session + 1}.</p>
        <button
          type="button"
          className="btn"
          onClick={() => setS({ ...s, phase: "exam", session: s.session + 1, i: 0, left: sessionSeconds[s.session + 1] })}
        >
          Start session {s.session + 2} now
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- ready
  if (s.phase === "ready") {
    return (
      <div className="space-y-3">
      {discardBar}
      <div className="card p-6 space-y-3 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold">Session {s.session + 1} of {sessions.length}</h2>
        <p>{qs.length} questions · {fmt(sessionSeconds[s.session])} for this session</p>
        <ul className="muted text-sm list-disc pl-5 space-y-1">
          <li>Answers aren&apos;t shown until the end. Flag questions to revisit before ending the session.</li>
          <li>Once you end a session you can&apos;t go back to it, as on the real exam.</li>
          <li>Open your NCEES reference handbook in the side panel and use an NCEES-approved calculator.</li>
          <li>Progress saves automatically. If you close the page, come back to resume.</li>
        </ul>
        <button type="button" className="btn" onClick={() => setS({ ...s, phase: "exam" })}>Begin session {s.session + 1}</button>
      </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- exam / review
  const answeredCount = qs.filter((x) => s.answers[x.id] !== undefined).length;
  const unanswered = qs.filter((x) => s.answers[x.id] === undefined);
  const flaggedHere = qs.filter((x) => flagged.has(x.id));

  const header = (
    <div className="card p-3 flex flex-wrap items-center gap-3 sticky top-2 z-10">
      <span className={`font-mono text-lg ${s.left < 300 ? "text-red-500" : ""}`} aria-live="off">⏱ {fmt(s.left)}</span>
      <span className="muted text-sm">Session {s.session + 1}/{sessions.length} · {answeredCount}/{qs.length} answered</span>
      <div className="ml-auto flex gap-2">
        <button type="button" className="btn-ghost !py-1.5" onClick={() => setShowRef(!showRef)}>{showRef ? "Hide" : "Reference"} handbook</button>
        {s.phase === "exam" ? (
          <button type="button" className="btn !py-1.5" onClick={() => setS({ ...s, phase: "review" })}>Review &amp; end session</button>
        ) : (
          <button type="button" className="btn-ghost !py-1.5" onClick={() => { setS({ ...s, phase: "exam" }); setConfirmEnd(false); }}>Back to questions</button>
        )}
      </div>
    </div>
  );

  const body =
    s.phase === "review" ? (
      <div className="card p-5 space-y-4">
        <h2 className="text-xl font-semibold">Review session {s.session + 1}</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p>{answeredCount} of {qs.length} answered · {unanswered.length} unanswered · {flaggedHere.length} flagged</p>
        {[["Unanswered", unanswered], ["Flagged", flaggedHere]].map(([label, items]) =>
          (items as PublicQuestion[]).length ? (
            <div key={label as string}>
              <p className="font-semibold text-sm mb-1">{label as string}</p>
              <div className="flex flex-wrap gap-1.5">
                {(items as PublicQuestion[]).map((x) => (
                  <button key={x.id} type="button" className="w-9 h-9 rounded text-sm border" style={{ borderColor: "var(--border)" }}
                    onClick={() => setS({ ...s, phase: "exam", i: qs.indexOf(x) })}>
                    {qs.indexOf(x) + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : null,
        )}
        {confirmEnd ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm">End session {s.session + 1}? You can&apos;t come back to it.</span>
            <button type="button" className="btn" onClick={() => endSession(s)}>Yes, end session</button>
            <button type="button" className="btn-ghost" onClick={() => setConfirmEnd(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirmEnd(true)}>
            End session {s.session + 1}{s.session === sessions.length - 1 ? " and submit exam" : ""}
          </button>
        )}
      </div>
    ) : q ? (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5" aria-label="Question navigator">
          {qs.map((x, n) => (
            <button key={x.id} type="button" onClick={() => setS({ ...s, i: n })} aria-label={`Question ${n + 1}`}
              className="w-9 h-9 rounded text-sm border"
              style={{
                background: s.answers[x.id] !== undefined ? "var(--border)" : "transparent",
                borderColor: n === s.i ? "var(--brand)" : "var(--border)",
                borderWidth: n === s.i ? 2 : 1,
              }}>
              {n + 1}{flagged.has(x.id) && <><Icon name="flag" size={12} className="inline ml-0.5 align-[-1px]" /><span className="sr-only"> (flagged)</span></>}
            </button>
          ))}
        </div>
        <p className="muted text-sm">Question {s.i + 1} of {qs.length}</p>
        <QuestionCard question={q} selected={s.answers[q.id] ?? null} onSelect={(c) => setS({ ...s, answers: { ...s.answers, [q.id]: c } })} />
        <div className="flex justify-between gap-2">
          <button type="button" className="btn-ghost" disabled={s.i === 0} onClick={() => setS({ ...s, i: s.i - 1 })}>Previous</button>
          <button type="button" className="btn-ghost"
            onClick={() => setS({ ...s, flags: flagged.has(q.id) ? s.flags.filter((f) => f !== q.id) : [...s.flags, q.id] })}>
            {flagged.has(q.id) ? "Unflag" : "Flag for review"}
          </button>
          {s.i < qs.length - 1 ? (
            <button type="button" className="btn-ghost" onClick={() => setS({ ...s, i: s.i + 1 })}>Next</button>
          ) : (
            <button type="button" className="btn" onClick={() => setS({ ...s, phase: "review" })}>Review</button>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {discardBar}
      {header}
      <div className={showRef ? "grid md:grid-cols-2 gap-4 items-start" : ""}>
        <div className="space-y-4">{body}</div>
        {showRef && handbook}
      </div>
    </div>
  );
}
