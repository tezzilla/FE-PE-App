import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { isExamId } from "@/lib/content/exams";
import { drillItems } from "@/lib/handbook-drill";
import { hasExamAccess } from "@/lib/access";
import { unauthorized } from "@/lib/mobile";

// GET ?exam=fe-civil -> 10 "which handbook chapter?" items for the timed drill.
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const exam = new URL(req.url).searchParams.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  return NextResponse.json(drillItems(exam, hasExamAccess(user, exam)));
}
