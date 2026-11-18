"use client";

import { useState } from "react";
import type { DeckCard } from "@/lib/cards";
import { GRADE_LABELS, nextLabel, type CardGrade } from "@/lib/adaptive/cards";

export function Flashcards({ cards: initial, endpoint = "/api/cards" }: { cards: DeckCard[]; endpoint?: string }) {
  const [queue, setQueue] = useState(initial);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const card = queue[0];

  async function grade(g: CardGrade) {
    if (!card) return;
    setBusy(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, grade: g }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Could not save. Try again.");
    setDone((n) => n + 1);
    setFlipped(false);
    // "Again" puts the card back at the end of this session.
    setQueue(([c, ...rest]) =>
      g === 0 ? [...rest, { ...c, state: { interval: 0, ease: Math.max(1.3, (c.state?.ease ?? 2.5) - 0.2), reps: 0, lapses: c.state?.lapses ?? 0, due: new Date().toISOString() } }] : rest,
    );
  }

  if (!card) {
    return (
      <div className="card p-6 text-center space-y-2">
        <h2 className="text-xl font-bold">All caught up</h2>
        <p className="muted">{done ? `${done} review${done === 1 ? "" : "s"} done. ` : ""}Cards come back as they fall due.</p>
      </div>
    );
  }

  const prev = card.state ? { interval: card.state.interval, ease: card.state.ease, reps: card.state.reps, lapses: card.state.lapses } : null;

  return (
    <div className="space-y-3">
      <p className="muted text-sm">
        {queue.length} left · {card.topicName} · {card.state ? "review" : "new"}
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="card p-6 w-full text-left min-h-48 flex flex-col justify-center gap-3"
        aria-label={flipped ? "Hide answer" : "Show answer"}
      >
        <p className="text-lg font-semibold">{card.front}</p>
        {flipped ? (
          <>
            <p className="whitespace-pre-line font-mono text-[15px] leading-relaxed">{card.back}</p>
            <p className="muted text-xs">Find it on exam day: {card.ref}</p>
          </>
        ) : (
          <p className="muted text-sm">Recall it, then tap to check.</p>
        )}
      </button>
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADE_LABELS.map((label, g) => (
            <button key={label} className={g === 2 ? "btn" : "btn-ghost"} disabled={busy} onClick={() => grade(g as CardGrade)}>
              <span className="block">{label}</span>
              <span className="block text-xs opacity-75">{nextLabel(prev, g as CardGrade)}</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="btn w-full" onClick={() => setFlipped(true)}>Show answer</button>
      )}
      {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}
    </div>
  );
}
