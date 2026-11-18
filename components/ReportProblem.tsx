"use client";

import { useState } from "react";

/** "Report a problem" link under a solution. Reports go to the reviewers' inbox. */
export function ReportProblem({ questionId, selected }: { questionId: string; selected: number | null }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") return <p className="muted text-sm mt-2">Thanks. A reviewer will look at this question.</p>;
  if (!open) {
    return (
      <button type="button" className="muted text-sm underline mt-2" onClick={() => setOpen(true)}>
        Report a problem with this question
      </button>
    );
  }

  async function send() {
    setState("sending");
    setError(null);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selected, message }),
    });
    if (res.ok) return setState("sent");
    setState("idle");
    setError((await res.json().catch(() => ({}))).error ?? "Couldn't send. Try again.");
  }

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-sm">
        What&apos;s wrong? (wrong answer, typo, unclear wording, missing data...)
        <textarea
          className="input mt-1"
          rows={3}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I get 47.2 kPa, not 49.1. The solution uses the wrong depth."
        />
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn !py-1.5" onClick={send} disabled={state === "sending" || message.trim().length < 5}>
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button type="button" className="btn-ghost !py-1.5" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
