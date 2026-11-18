import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/weekly";

// One-click unsubscribe (RFC 8058): mail clients POST to the List-Unsubscribe URL with
// "List-Unsubscribe=One-Click". The token only allows turning off the weekly email.
export async function POST(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const uid = await verifyUnsubscribeToken(t);
  if (!uid) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await db.user.updateMany({ where: { id: uid }, data: { weeklyEmail: false } });
  return NextResponse.json({ ok: true });
}
