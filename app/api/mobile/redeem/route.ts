import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { redeemGift } from "@/lib/gifts";
import { unauthorized } from "@/lib/mobile";

// POST { code } -> { ok, plan } or { error }. Used by the app's web version only: store rules don't
// allow native apps to unlock paid content with their own codes, so the native app sends people to the website.
export async function POST(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const r = await redeemGift(user, body?.code);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, plan: r.plan.name });
}
