"use client";

import type { PublicQuestion } from "@/lib/content/types";
import { ReportProblem } from "./ReportProblem";

export interface Feedback {
  correct: boolean;
  answer: number;
  explanation: string;
  reference?: string;
  reviewedBy?: string;
}

export function QuestionCard({
  question,
  selected,
  onSelect,
  feedback,
}: {
  question: PublicQuestion;
  selected: number | null;
  onSelect?: (i: number) => void;
  feedback?: Feedback | null;
}) {
  return (
    <div className="card p-5 space-y-4">
      <p className="text-lg leading-relaxed">{question.prompt}</p>
      <div className="space-y-2">
        {question.choices.map((c, idx) => {
          let border = "var(--border)";
          if (feedback) {
            if (idx === feedback.answer) border = "#16a34a";
            else if (idx === selected) border = "#dc2626";
          } else if (idx === selected) border = "var(--brand)";
          // Motion on the student's own pick: a pulse when right, a short shake when wrong.
          const anim = feedback && idx === selected ? (feedback.correct ? "anim-correct" : "anim-wrong") : "";
          return (
            <button
              key={idx}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(idx)}
              className={`w-full text-left rounded-lg px-4 py-3 border-2 flex gap-3 transition-colors ${onSelect ? "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" : ""} ${anim}`}
              style={{ borderColor: border }}
            >
              <span className="font-semibold">{"ABCD"[idx] ?? idx + 1}.</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className="rounded-lg p-4 enter" style={{ background: feedback.correct ? "#16a34a22" : "#dc262622" }}>
          <p className="font-semibold">{feedback.correct ? "Correct" : `Incorrect. Answer: ${"ABCD"[feedback.answer]}`}</p>
          <p className="mt-2 whitespace-pre-line">{feedback.explanation}</p>
          {feedback.reference && <p className="muted text-sm mt-2">Reference: {feedback.reference}</p>}
          {feedback.reviewedBy && <p className="muted text-sm mt-1">Checked by {feedback.reviewedBy}</p>}
          <ReportProblem key={question.id} questionId={question.id} selected={selected} />
        </div>
      )}
    </div>
  );
}
