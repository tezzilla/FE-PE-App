import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { track } from "@/lib/funnel";
import { blockedFor, clientIp, hit } from "@/lib/ratelimit";

// Browser beacon for the one step that happens client-side: viewing the pricing page.
// Only that name is accepted here; the other steps are recorded on the server.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.name !== "pricing_view") return NextResponse.json({ ok: false }, { status: 400 });
  const key = `funnel:ip:${await clientIp()}`;
  const limit = { max: 30, windowMs: 3600_000 };
  if (await blockedFor(key, limit)) return NextResponse.json({ ok: true });
  await hit(key, limit);
  const user = await getCurrentUser();
  await track("pricing_view", { userId: user?.id });
  return NextResponse.json({ ok: true });
}
