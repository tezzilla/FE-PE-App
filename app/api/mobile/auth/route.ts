import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { createAccount, verifyCredentials } from "@/lib/accounts";
import { publicUser } from "@/lib/mobile";

// POST { mode: "login" | "signup", email, password, name? } -> { token, user }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const r = body.mode === "signup"
    ? await createAccount(body.email, body.password, body.name)
    : await verifyCredentials(body.email, body.password);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: body.mode === "signup" ? 400 : 401 });
  return NextResponse.json({ token: await createToken(r.user.id), user: publicUser(r.user) });
}
