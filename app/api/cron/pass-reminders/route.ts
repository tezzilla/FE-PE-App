import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlan, extensionFor } from "@/lib/plans";
import { EXAMS } from "@/lib/content/exams";
import { emailEnabled, passEndingEmail, sendEmail } from "@/lib/email";
import { hasActiveSubscription } from "@/lib/access";
import { sendWelcomeSeries } from "@/lib/welcome";
import { reconcilePayments } from "@/lib/reconcile";
import { alertOwner, describeError } from "@/lib/alerts";

const DAY = 24 * 3600 * 1000;

// Runs daily (vercel.json). Hobby plans limit how many cron jobs a project has, so this one run does
// three independent jobs: payment reconciliation, pass-ending reminders and the welcome series.
// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; anything else is refused.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out: Record<string, unknown> = {};
  const failures: string[] = [];
  // Each job runs even if another one fails.
  const run = async (name: string, job: () => Promise<unknown>) => {
    try {
      out[name] = await job();
    } catch (e) {
      out[name] = { error: true };
      failures.push(`${name}: ${describeError(e)}`);
    }
  };

  await run("reconcile", async () => {
    const r = await reconcilePayments();
    if (r.repaired.length || r.problems.length) {
      await alertOwner("reconcile", r.problems.length ? "Payments need attention" : "Missed payments were repaired", [
        `Daily check of ${r.checked} paid checkouts from the last 3 days.`,
        ...(r.repaired.length ? ["", "Repaired (access granted now):", ...r.repaired.map((x) => `- ${x}`)] : []),
        ...(r.problems.length ? ["", "Needs you:", ...r.problems.map((x) => `- ${x}`)] : []),
      ]);
    }
    return { checked: r.checked, repaired: r.repaired.length, problems: r.problems.length };
  });

  if (emailEnabled()) {
    await run("reminders", passReminders);
    await run("welcome", () => sendWelcomeSeries());
  } else {
    out.email = "not configured";
  }

  if (failures.length) await alertOwner("cron-daily", "Daily job failed", failures);
  return NextResponse.json(out, { status: failures.length ? 500 : 200 });
}

/** Emails pass holders whose access ends in about a week, once per pass. */
async function passReminders() {
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
  return { checked: passes.length, sent };
}
