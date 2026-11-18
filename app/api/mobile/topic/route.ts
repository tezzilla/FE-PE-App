import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { isExamId } from "@/lib/content/exams";
import { topicReview } from "@/lib/topic-review";
import { unauthorized } from "@/lib/mobile";

// GET ?exam=pe-civil&topic=water-env -> topic review (summary, handbook, formulas, traps, worked example)
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const p = new URL(req.url).searchParams;
  const exam = p.get("exam") ?? "";
  const r = isExamId(exam) ? await topicReview(user, exam, p.get("topic") ?? "") : null;
  if (!r) return NextResponse.json({ error: "Unknown exam or topic" }, { status: 400 });
  return NextResponse.json({
    name: r.topic.name,
    examQuestions: r.topic.examQuestions,
    summary: r.guide.summary,
    handbook: r.guide.handbook,
    traps: r.guide.traps,
    formulas: r.cards.map((c) => ({ front: c.front, back: c.back, ref: c.ref })),
    // The example is a public teaching sample, so its answer and solution are included.
    example: r.example
      ? { prompt: r.example.prompt, choices: r.example.choices, answer: r.example.answer, explanation: r.example.explanation, reference: r.example.reference ?? null }
      : null,
    reviewedBy: r.reviewedBy,
    mastery: r.mastery && r.mastery.evidence > 0 ? { value: r.mastery.mastery, answered: r.mastery.evidence } : null,
  });
}
