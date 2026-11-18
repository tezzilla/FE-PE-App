import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { deleteAccount } from "@/lib/account";
import { unauthorized } from "@/lib/mobile";

// In-app account deletion (required by the App Store for apps that let people create accounts).
// DELETE { password }
export async function DELETE(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const r = await deleteAccount(user, body?.password);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
