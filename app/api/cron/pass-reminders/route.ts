import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlan, extensionFor } from "@/lib/plans";
import { EXAMS } from "@/lib/content/exams";
import { emailEnabled, passEndingEmail, sendEmail } from "@/lib/email";
import { hasActiveSubscription } from "@/lib/access";
import { sendWelcomeSeries } from "@/lib/welcome";

const DAY = 24 * 3600 * 1000;

// Runs daily (vercel.json): emails pass holders whose access ends in about a week, once per pass.
// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; anything else is refused.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!emailEnabled()) return NextResponse.json({ skipped: "email not configured" });

  const now = Date.now();
  const passes = await db.pass.findMany({
    where: { revokedAt: null, remindedAt: null, expiresAt: { gte: new Date(now + 4 * DAY), lte: new Date(now + 8 * DAY) } },
    include: { user: true },
  });
  let sent = 0;
  for (const p of passes) {
    const plan = getPlan(p.plan);
    if (!plan) continue;
    const exam = plan.exam;
    const until = exam === "pe-civil" ? p.user.peAccessUntil : p.user.feAccessUntil;
    const ext = extensionFor(exam);
    // Only the pass that actually ends their access (a later pass or extension means they're covered),
    // and not subscribers, who keep access anyway.
    const covered = hasActiveSubscription(p.user) && !!getPlan(p.user.plan)?.exams.includes(exam);
    const endsAccess = !!until && Math.abs(until.getTime() - p.expiresAt.getTime()) < 60_000;
    // Claim first so two overlapping runs can't both send.
    const claimed = await db.pass.updateMany({ where: { id: p.id, remindedAt: null }, data: { remindedAt: new Date() } });
    if (!claimed.count || !ext || covered || !endsAccess) continue;
    if (await sendEmail(passEndingEmail(p.user.email, EXAMS[exam].name, until!, ext.price))) sent++;
  }
  // The same daily run sends the welcome series (Hobby plans limit how many cron jobs a project has).
  const welcome = await sendWelcomeSeries();
  return NextResponse.json({ checked: passes.length, sent, welcome });
}
