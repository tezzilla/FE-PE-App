"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicQuestion } from "@/lib/content/types";
import { QuestionCard, type Feedback } from "./QuestionCard";

export function Practice({
  questions,
  topicNames,
  lockedCount,
}: {
  questions: PublicQuestion[];
  topicNames: Record<string, string>;
  lockedCount: number;
}) {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState({ done: 0, correct: 0 });
  const [busy, setBusy] = useState(false);

  const q = questions[i];

  async function check() {
    if (selected === null || !q) return;
    setBusy(true);
    const res = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id, selected }),
    });
    setBusy(false);
    if (!res.ok) return alert("Could not check answer. Try again.");
    const fb: Feedback = await res.json();
    setFeedback(fb);
    setScore((s) => ({ done: s.done + 1, correct: s.correct + (fb.correct ? 1 : 0) }));
  }

  function next() {
    setI((n) => n + 1);
    setSelected(null);
    setFeedback(null);
  }

  if (!q) {
    return (
      <div className="card p-6 space-y-3 text-center">
        <h2 className="text-xl font-bold">Set complete</h2>
        {score.done > 0 && (
          <p>You got {score.correct} of {score.done} correct ({Math.round((100 * score.correct) / score.done)}%).</p>
        )}
        {lockedCount > 0 && (
          <p className="muted">{lockedCount} more questions in this set are available to subscribers.</p>
        )}
        <div className="flex gap-3 justify-center">
          {lockedCount > 0 && <Link href="/pricing" className="btn">Unlock all questions</Link>}
          <button className="btn-ghost" onClick={() => location.reload()}>Practice again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="muted text-sm">
        Question {i + 1} of {questions.length} · {topicNames[q.topic]} · Score {score.correct}/{score.done}
      </p>
      <QuestionCard question={q} selected={selected} onSelect={feedback ? undefined : setSelected} feedback={feedback} />
      <div className="flex justify-end">
        {feedback ? (
          <button className="btn" onClick={next}>Next question</button>
        ) : (
          <button className="btn" onClick={check} disabled={selected === null || busy}>Check answer</button>
        )}
      </div>
    </div>
  );
}
