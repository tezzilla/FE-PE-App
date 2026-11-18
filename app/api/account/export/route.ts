import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportData } from "@/lib/account";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return new NextResponse(JSON.stringify(await exportData(user), null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="civilprep-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
