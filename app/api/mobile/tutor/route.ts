import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { askTutor } from "@/lib/tutor";
import { unauthorized } from "@/lib/mobile";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const r = await askTutor(user, body?.questionId, body?.history);
  return NextResponse.json(r.body, { status: r.status });
}
