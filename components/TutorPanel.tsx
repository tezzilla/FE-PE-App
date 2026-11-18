"use client";

import { useState } from "react";

type Turn = { role: "user" | "assistant"; text: string };

const STARTERS = ["Why is my answer wrong?", "Walk me through the steps", "Where is this in the handbook?"];

/** Ask the AI tutor about a problem the student just answered. Grounded in the verified solution. */
export function TutorPanel({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...turns, { role: "user" as const, text: q }];
    setTurns(history);
    setDraft("");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, history }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok || !body?.reply) {
      setTurns(turns); // drop the unanswered question so the student can retry
      setDraft(q);
      return setError(body?.error ?? "The tutor couldn't answer. Try again.");
    }
    setTurns([...history, { role: "assistant", text: body.reply }]);
    setLeft(body.left);
  }

  if (!open) {
    return (
      <button className="btn-ghost w-full sm:w-auto" onClick={() => setOpen(true)}>
        Ask the AI tutor about this problem
      </button>
    );
  }

  const full = turns.length >= 12;
  return (
    <div className="card p-4 space-y-3" aria-live="polite">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">AI tutor</h3>
        {left !== null && <span className="muted text-xs">{left} questions left today</span>}
      </div>
      <p className="muted text-xs">
        Explains the engineer-verified solution. AI can make mistakes; the verified solution above is the authority.
      </p>
      {turns.map((t, i) => (
        <div key={i} className={t.role === "user" ? "text-sm font-medium" : "text-sm whitespace-pre-line leading-relaxed"}>
          {t.role === "user" ? `You: ${t.text}` : t.text}
        </div>
      ))}
      {busy && <p className="muted text-sm">Thinking…</p>}
      {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}
      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button key={s} className="btn-ghost !py-1 text-sm" disabled={busy} onClick={() => ask(s)}>{s}</button>
          ))}
        </div>
      )}
      {full ? (
        <p className="muted text-sm">That's the limit for one problem. Move on and come back to it later.</p>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <input
            className="input flex-1"
            value={draft}
            maxLength={1500}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this problem"
            aria-label="Ask the tutor"
          />
          <button className="btn" disabled={busy || !draft.trim()}>Ask</button>
        </form>
      )}
    </div>
  );
}
