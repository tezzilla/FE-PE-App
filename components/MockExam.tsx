"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExamId, PublicQuestion } from "@/lib/content/types";
import { QuestionCard, type Feedback } from "./QuestionCard";

type Result = { total: number; correct: number; results: Record<string, Feedback> };

const fmt = (s: number) =>
  `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function MockExam({ exam, questions, seconds }: { exam: ExamId; questions: PublicQuestion[]; seconds: number }) {
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(seconds);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<Result | null>(null);
  const submitting = useRef(false);

  const submit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    const res = await fetch("/api/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam, questionIds: questions.map((q) => q.id), answers, durationS: seconds - left }),
    });
    if (!res.ok) {
      submitting.current = false;
      return alert("Submit failed. Try again.");
    }
    setResult(await res.json());
    setI(0);
  }, [exam, questions, answers, seconds, left]);

  useEffect(() => {
    if (!started || result) return;
    if (left <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, left, result, submit]);

  if (!started) {
    return (
      <div className="card p-6 space-y-3">
        <p>{questions.length} questions · time limit {fmt(seconds)}</p>
        <p className="muted text-sm">
          Answers are not shown until you submit. The exam submits automatically when time runs out.
          Keep your reference handbook open as you would on test day.
        </p>
        <button className="btn" onClick={() => setStarted(true)}>Start exam</button>
      </div>
    );
  }

  const q = questions[i];
  const answered = Object.keys(answers).length;

  if (result) {
    const pct = Math.round((100 * result.correct) / result.total);
    return (
      <div className="space-y-4">
        <div className="card p-6 text-center">
          <p className="text-4xl font-extrabold">{pct}%</p>
          <p className="muted">{result.correct} of {result.total} correct · time used {fmt(seconds - left)}</p>
          <p className="muted text-sm mt-2">NCEES does not publish a fixed passing percentage. Use this as a relative benchmark.</p>
          <Link href="/dashboard" className="btn mt-4">Back to dashboard</Link>
        </div>
        <h2 className="font-semibold">Review</h2>
        <Nav questions={questions} i={i} setI={setI} answers={answers} flags={flags} results={result.results} />
        <QuestionCard question={q} selected={answers[q.id] ?? null} feedback={result.results[q.id]} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-3 flex items-center justify-between sticky top-2 z-10">
        <span className={`font-mono text-lg ${left < 300 ? "text-red-500" : ""}`}>⏱ {fmt(left)}</span>
        <span className="muted text-sm">{answered}/{questions.length} answered</span>
        <button className="btn !py-1.5" onClick={() => confirm("Submit exam for grading?") && submit()}>Submit</button>
      </div>
      <Nav questions={questions} i={i} setI={setI} answers={answers} flags={flags} />
      <QuestionCard
        question={q}
        selected={answers[q.id] ?? null}
        onSelect={(c) => setAnswers((a) => ({ ...a, [q.id]: c }))}
      />
      <div className="flex justify-between">
        <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
        <button
          className="btn-ghost"
          onClick={() =>
            setFlags((f) => {
              const n = new Set(f);
              if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
              return n;
            })
          }
        >
          {flags.has(q.id) ? "Unflag" : "Flag for review"}
        </button>
        <button className="btn-ghost" disabled={i === questions.length - 1} onClick={() => setI(i + 1)}>Next</button>
      </div>
    </div>
  );
}

function Nav({
  questions, i, setI, answers, flags, results,
}: {
  questions: PublicQuestion[];
  i: number;
  setI: (n: number) => void;
  answers: Record<string, number>;
  flags: Set<string>;
  results?: Record<string, Feedback>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, n) => {
        let bg = answers[q.id] !== undefined ? "var(--border)" : "transparent";
        if (results) bg = results[q.id]?.correct ? "#16a34a55" : "#dc262655";
        return (
          <button
            key={q.id}
            onClick={() => setI(n)}
            className="w-9 h-9 rounded text-sm border"
            style={{ background: bg, borderColor: n === i ? "var(--brand)" : "var(--border)", borderWidth: n === i ? 2 : 1 }}
          >
            {n + 1}{flags.has(q.id) ? "⚑" : ""}
          </button>
        );
      })}
    </div>
  );
}
