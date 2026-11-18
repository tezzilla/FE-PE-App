import "server-only";
import type { User } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { EXAMS, EXAM_IDS, topicName } from "./content/exams";
import type { ExamId } from "./content/types";
import { computeState, readiness } from "./adaptive/model";
import { studyPlanFor, weightsFor } from "./adaptive/server";
import { dueCardCount } from "./cards";
import { sendEmail, weeklyProgressEmail } from "./email";

// Weekly progress email: what the student did in the last 7 days, how their readiness moved, where to
// focus next. Sent by /api/cron/weekly-progress to students active in the last 30 days who haven't
// opted out (User.weeklyEmail).

const DAY = 24 * 3600 * 1000;
const AUDIENCE = "civilprep-weekly-unsubscribe";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** A signed, non-expiring token that only allows turning off the weekly email for one user. */
export async function unsubscribeToken(userId: string) {
  return new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENCE).setIssuedAt().sign(secret());
}

export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: AUDIENCE });
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}

/** The page link (confirm button) and the one-click POST endpoint for List-Unsubscribe. */
export async function unsubscribeUrls(userId: string) {
  const t = encodeURIComponent(await unsubscribeToken(userId));
  return { page: `${appUrl()}/unsubscribe?t=${t}`, oneClick: `${appUrl()}/api/unsubscribe?t=${t}` };
}

/** One exam's week: answers, accuracy, readiness change, weakest topics, cards due, plan target. */
async function examWeek(user: User, exam: ExamId, now: Date) {
  const attempts = await db.attempt.findMany({
    where: { userId: user.id, exam },
    select: { questionId: true, topic: true, correct: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  if (!attempts.length) return null;
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const week = attempts.filter((a) => a.createdAt >= weekAgo);
  const w = weightsFor(user, exam);
  const nowR = readiness(computeState(attempts, now), w);
  const thenR = readiness(computeState(attempts.filter((a) => a.createdAt < weekAgo), weekAgo), w);
  const [cards, sp] = await Promise.all([dueCardCount(user, exam), studyPlanFor(user, exam)]);
  return { exam, week, nowR, thenR, cards, sp };
}

/** The email's sentences for one student, or null if they have nothing to report. */
export async function weeklyLines(user: User, now = new Date()): Promise<string[] | null> {
  const weeks = (await Promise.all(EXAM_IDS.map((e) => examWeek(user, e, now)))).filter((x) => x !== null);
  if (!weeks.length) return null;
  const lines: string[] = [];
  for (const { exam, week, nowR, thenR, cards, sp } of weeks) {
    const name = EXAMS[exam].name;
    const correct = week.filter((a) => a.correct).length;
    const change = Math.round((nowR.score - thenR.score) * 100);
    lines.push(
      week.length
        ? `${name}: you answered ${week.length} question${week.length === 1 ? "" : "s"} this week (${Math.round((100 * correct) / week.length)}% correct). Your readiness is ${Math.round(nowR.score * 100)}%${change ? `, ${change > 0 ? "up" : "down"} ${Math.abs(change)} point${Math.abs(change) === 1 ? "" : "s"} from last week` : ""}.`
        : `${name}: no practice this week. Your readiness is ${Math.round(nowR.score * 100)}%. Even 20 minutes keeps your reviews on schedule.`,
    );
    const weak = nowR.weakest.slice(0, 2).map((x) => topicName(exam, x.topic));
    if (weak.length) lines.push(`Focus next on ${weak.join(" and ")}. Smart practice will steer you there.`);
    if (sp) {
      lines.push(
        `Your plan: ${sp.plan.daysLeft} days to your exam, a target of ${sp.plan.weeklyTarget} questions a week (${sp.plan.answeredLast7Days} done this week).`,
      );
    }
    if (cards > 0) lines.push(`${cards} formula flashcard${cards === 1 ? " is" : "s are"} due for review.`);
  }
  return lines;
}

/** Send one student's weekly email. Returns false if there was nothing to send or sending failed. */
export async function sendWeekly(user: User, now = new Date()) {
  const lines = await weeklyLines(user, now);
  if (!lines) return false;
  const u = await unsubscribeUrls(user.id);
  return sendEmail(weeklyProgressEmail(user.email, user.name, lines, u.page, u.oneClick));
}

/** Students to email this run: opted in, active in the last 30 days, not emailed in the last 6 days. */
export async function weeklyRecipients(now = new Date(), limit = 300) {
  return db.user.findMany({
    where: {
      weeklyEmail: true,
      OR: [{ weeklyEmailSentAt: null }, { weeklyEmailSentAt: { lt: new Date(now.getTime() - 6 * DAY) } }],
      attempts: { some: { createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } },
    },
    take: limit,
  });
}
