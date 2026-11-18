import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { toPublic } from "@/lib/content";
import { diagnosticSession } from "@/lib/adaptive/server";
import { unauthorized } from "@/lib/mobile";
import { tutorEnabled } from "@/lib/tutor";

// GET ?exam=fe-civil -> about 2 questions per topic
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const exam = new URL(req.url).searchParams.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  const questions = await diagnosticSession(user, exam, 2);
  return NextResponse.json({
    questions: questions.map(toPublic),
    topicNames: Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name])),
    tutor: tutorEnabled(),
  });
}
