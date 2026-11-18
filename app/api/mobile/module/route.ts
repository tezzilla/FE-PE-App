import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PE_MODULE_SPECS } from "@/lib/content/pe-spec";
import { moduleOverview } from "@/lib/pe-modules";
import { unauthorized } from "@/lib/mobile";

// GET ?module=water-env -> one PE module exam: knowledge areas, sub-topics, content counts, progress.
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const o = await moduleOverview(user, new URL(req.url).searchParams.get("module") ?? "");
  if (!o) return NextResponse.json({ error: "Unknown PE module" }, { status: 400 });
  return NextResponse.json(o);
}

// POST { module } -> make this module the student's PE exam (weights smart practice and timed exams).
export async function POST(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const module = typeof body?.module === "string" ? body.module : "";
  if (!PE_MODULE_SPECS[module]) return NextResponse.json({ error: "Unknown PE module" }, { status: 400 });
  await db.user.update({ where: { id: user.id }, data: { peDepth: module } });
  return NextResponse.json({ ok: true, peDepth: module });
}
