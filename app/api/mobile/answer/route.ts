import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { gradeAnswer } from "@/lib/grading";
import { unauthorized } from "@/lib/mobile";

export async function POST(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const r = await gradeAnswer(user, body?.questionId, body?.selected, body?.timeMs);
  return NextResponse.json(r.body, { status: r.status });
}
