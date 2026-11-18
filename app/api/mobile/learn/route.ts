import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { EXPLAINERS, getExplainer } from "@/lib/content/explainers";
import { topicName } from "@/lib/content/exams";
import { explainerExample } from "@/lib/explainer-example";
import { unauthorized } from "@/lib/mobile";

// GET -> formula guide list. GET ?slug=mannings-equation -> one guide with its worked example.
// The guides are public on the website; the app asks for a session like every other mobile route.
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({
      guides: EXPLAINERS.map((e) => ({ slug: e.slug, title: e.title, summary: e.summary, exam: e.exam, topic: e.topic, group: topicName(e.exam, e.topic) })),
    });
  }
  const e = getExplainer(slug);
  if (!e) return NextResponse.json({ error: "Unknown guide" }, { status: 404 });
  const ex = await explainerExample(e);
  return NextResponse.json({
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    formula: e.formula,
    variables: e.variables,
    whenToUse: e.whenToUse,
    mistakes: e.mistakes,
    handbook: e.handbook,
    exam: e.exam,
    topic: e.topic,
    topicName: topicName(e.exam, e.topic),
    example: ex ? { prompt: ex.prompt, choices: ex.choices, answer: ex.answer, explanation: ex.explanation } : null,
    related: EXPLAINERS.filter((x) => x.slug !== e.slug && x.topic === e.topic).slice(0, 4).map((x) => ({ slug: x.slug, title: x.title })),
  });
}
