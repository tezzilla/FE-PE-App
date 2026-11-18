import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeCard } from "@/lib/cards";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const r = await gradeCard(user, body?.cardId, body?.grade);
  return NextResponse.json(r.body, { status: r.status });
}
