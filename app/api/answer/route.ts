import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeAnswer } from "@/lib/grading";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const r = await gradeAnswer(await getCurrentUser(), body?.questionId, body?.selected, body?.timeMs);
  return NextResponse.json(r.body, { status: r.status });
}
