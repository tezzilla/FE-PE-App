import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { cardDeck, gradeCard } from "@/lib/cards";
import { isExamId } from "@/lib/content/exams";
import { unauthorized } from "@/lib/mobile";

export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const exam = new URL(req.url).searchParams.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  return NextResponse.json(await cardDeck(user, exam));
}

export async function POST(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const r = await gradeCard(user, body?.cardId, body?.grade);
  return NextResponse.json(r.body, { status: r.status });
}
