import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitReport } from "@/lib/reports";

export async function POST(req: Request) {
  const r = await submitReport(await getCurrentUser(), await req.json().catch(() => null));
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
