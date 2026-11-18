import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { toPublic } from "@/lib/content";
import { quizSession } from "@/lib/adaptive/server";
import { QUIZ_COUNTS, QUIZ_SOURCES, type QuizSource } from "@/lib/adaptive/quiz";
import { unauthorized } from "@/lib/mobile";
import { tutorEnabled } from "@/lib/tutor";

// GET ?exam=fe-civil&source=missed|all|unseen&count=10|20|40&topic=a&topic=b -> { questions, topicNames, tutor }
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const p = new URL(req.url).searchParams;
  const exam = p.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  const slugs = EXAMS[exam].topics.map((t) => t.slug);
  const picked = p.getAll("topic").filter((t) => slugs.includes(t));
  const source: QuizSource = QUIZ_SOURCES.find((s) => s === p.get("source")) ?? "all";
  const count = QUIZ_COUNTS.find((c) => String(c) === p.get("count")) ?? 20;
  const questions = await quizSession(user, exam, { topics: picked.length ? picked : slugs, count, source });
  return NextResponse.json({
    questions: questions.map(toPublic),
    topicNames: Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name])),
    tutor: tutorEnabled(),
  });
}
