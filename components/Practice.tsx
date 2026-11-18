"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicQuestion } from "@/lib/content/types";
import { QuestionCard, type Feedback } from "./QuestionCard";
import { TutorPanel } from "./TutorPanel";

export function Practice({
  questions,
  topicNames,
  lockedCount,
  reasons,
  againLabel = "Practice again",
  timeLimitS,
  paceS,
  tutor = false,
}: {
  questions: PublicQuestion[];
  topicNames: Record<string, string>;
  lockedCount: number;
  /** Why the adaptive engine picked each question, keyed by question id. */
  reasons?: Record<string, string>;
  againLabel?: string;
  /** Optional countdown for the whole set (timed quiz). */
  timeLimitS?: number;
  /** Real exam pace in seconds per question, shown with the student's own pace. */
  paceS?: number;
  /** Show "Ask the AI tutor" after each answer. */
  tutor?: boolean;
}) {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState({ done: 0, correct: 0 });
  const [busy, setBusy] = useState(false);

  const [timeUp, setTimeUp] = useState(false);
  const [left, setLeft] = useState(timeLimitS ?? 0);
  const [spentMs, setSpentMs] = useState(0);
  const shownAt = useRef(Date.now());

  const q = timeUp ? undefined : questions[i];

  // Restart the per-question clock whenever a new question appears.
  useEffect(() => {
    shownAt.current = Date.now();
  }, [i]);

  useEffect(() => {
    if (!timeLimitS) return;
    const end = Date.now() + timeLimitS * 1000;
    const id = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        setTimeUp(true);
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [timeLimitS]);

  async function check() {
    if (selected === null || !q) return;
    const timeMs = Date.now() - shownAt.current;
    setBusy(true);
    const res = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id, selected, timeMs }),
    });
    setBusy(false);
    if (!res.ok) return alert("Could not check answer. Try again.");
    const fb: Feedback = await res.json();
    setFeedback(fb);
    setSpentMs((t) => t + timeMs);
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
        <h2 className="text-xl font-bold">{timeUp ? "Time's up" : "Set complete"}</h2>
        {score.done > 0 && (
          <p>You got {score.correct} of {score.done} correct ({Math.round((100 * score.correct) / score.done)}%).</p>
        )}
        {timeUp && score.done < questions.length && (
          <p className="muted text-sm">You answered {score.done} of {questions.length} in the time allowed.</p>
        )}
        {score.done > 0 && paceS && (
          <p className="muted text-sm">
            Your pace: {fmt(spentMs / score.done / 1000)} per question. Exam pace: {fmt(paceS)}.
            {spentMs / score.done / 1000 > paceS * 1.25 ? " You're slower than exam pace; try timed quizzes." : ""}
          </p>
        )}
        {lockedCount > 0 && (
          <p className="muted">{lockedCount} more questions in this set are available to subscribers.</p>
        )}
        <div className="flex gap-3 justify-center">
          {lockedCount > 0 && <Link href="/pricing" className="btn">Unlock all questions</Link>}
          <button className={lockedCount > 0 ? "btn-ghost" : "btn"} onClick={() => location.reload()}>{againLabel}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="muted text-sm">
        Question {i + 1} of {questions.length} · {topicNames[q.topic]} · Score {score.correct}/{score.done}
        {timeLimitS ? (
          <span className="font-semibold" style={{ color: left < 60 ? "#dc2626" : undefined }} aria-label="Time left">
            {" "}· {fmt(left)} left
          </span>
        ) : null}
      </p>
      {reasons?.[q.id] && (
        <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>Why this question: {reasons[q.id]}</p>
      )}
      <QuestionCard question={q} selected={selected} onSelect={feedback ? undefined : setSelected} feedback={feedback} />
      {feedback && tutor && <TutorPanel key={q.id} questionId={q.id} />}
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

function fmt(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}
