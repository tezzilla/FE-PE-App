import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { isExamId } from "@/lib/content/exams";
import { sampleToken } from "@/lib/leads";
import { unauthorized } from "@/lib/mobile";

// GET ?exam=fe-civil -> { url } of the printable free problem set for a signed-in app user.
// Signed-in users already have an account, so this doesn't create a marketing lead.
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const exam = new URL(req.url).searchParams.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  const base = (process.env.APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  return NextResponse.json({ url: `${base}/free/${exam}/set?t=${encodeURIComponent(await sampleToken(user.email, exam))}` });
}
