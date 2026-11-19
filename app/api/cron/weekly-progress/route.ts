import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { sendWeekly, weeklyRecipients } from "@/lib/weekly";
import { alertOwner, describeError } from "@/lib/alerts";

const DAY = 24 * 3600 * 1000;

// Runs Monday mornings (vercel.json). Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!emailEnabled()) return NextResponse.json({ skipped: "email not configured" });

  try {
    return await sendAll();
  } catch (e) {
    await alertOwner("cron-weekly", "Weekly progress email job failed", [describeError(e)]);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

async function sendAll() {
  const now = new Date();
  const users = await weeklyRecipients(now);
  let sent = 0;
  for (const u of users) {
    // Claim first so overlapping runs can't double-send.
    const claimed = await db.user.updateMany({
      where: { id: u.id, OR: [{ weeklyEmailSentAt: null }, { weeklyEmailSentAt: { lt: new Date(now.getTime() - 6 * DAY) } }] },
      data: { weeklyEmailSentAt: now },
    });
    if (!claimed.count) continue;
    if (await sendWeekly(u, now)) sent++;
  }
  return NextResponse.json({ candidates: users.length, sent });
}
