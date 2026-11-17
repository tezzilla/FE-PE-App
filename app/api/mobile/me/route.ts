import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { homePayload, unauthorized } from "@/lib/mobile";

export async function GET() {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  return NextResponse.json(await homePayload(user));
}
