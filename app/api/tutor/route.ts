import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askTutor } from "@/lib/tutor";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use the tutor." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const r = await askTutor(user, body?.questionId, body?.history);
  return NextResponse.json(r.body, { status: r.status });
}
