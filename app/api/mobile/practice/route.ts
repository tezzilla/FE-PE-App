import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { EXAMS, isExamId } from "@/lib/content/exams";
import { questionsFor, shuffle, toPublic } from "@/lib/content";
import { canSeeQuestion, hasExamAccess } from "@/lib/access";
import { generatedQuestions } from "@/lib/questions";
import { unauthorized } from "@/lib/mobile";
import { tutorEnabled } from "@/lib/tutor";
import { areaPractice } from "@/lib/pe-modules";

// GET ?exam=fe-civil&topic=statics -> { questions, topicNames }
// GET ?exam=pe-civil&topic=water-env&area=5 -> one PE knowledge area (plus areaName and lockedCount)
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const params = new URL(req.url).searchParams;
  const exam = params.get("exam") ?? "";
  const topic = params.get("topic") ?? undefined;
  if (!isExamId(exam) || (topic && !EXAMS[exam].topics.some((t) => t.slug === topic))) {
    return NextResponse.json({ error: "Unknown exam or topic" }, { status: 400 });
  }
  const areaParam = params.get("area");
  if (areaParam) {
    const ap = exam === "pe-civil" && topic ? await areaPractice(user, topic, Number(areaParam)) : null;
    if (!ap) return NextResponse.json({ error: "Unknown knowledge area" }, { status: 400 });
    return NextResponse.json({
      questions: shuffle([...ap.visible, ...ap.generated]).map(toPublic),
      topicNames: Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name])),
      tutor: tutorEnabled(),
      areaName: `${ap.area.n}. ${ap.area.name}`,
      lockedCount: ap.all.length - ap.visible.length + (ap.generated.length ? 0 : ap.generators * 3),
    });
  }
  const fixed = questionsFor(exam, topic).filter((q) => canSeeQuestion(user, q));
  const generated = hasExamAccess(user, exam) ? await generatedQuestions(exam, 3, topic) : [];
  return NextResponse.json({
    questions: shuffle([...fixed, ...generated]).map(toPublic),
    topicNames: Object.fromEntries(EXAMS[exam].topics.map((t) => [t.slug, t.name])),
    tutor: tutorEnabled(),
  });
}
