import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import { hasPaidAccess } from "./access";
import { PLANS } from "./plans";
import { sendEmail, welcomeSeriesEmail } from "./email";
import { unsubscribeUrls } from "./weekly";

// Welcome series: three short emails on days 1, 3 and 7 after signup (the signup email is day 0).
// Sent by the daily cron to new accounts that haven't opted out of study emails (User.weeklyEmail).
// welcomeStep counts how many went out, so each is sent once.

const DAY = 24 * 3600 * 1000;
const STEPS = [1, 3, 7] as const;
/** Only accounts this new get the series, so existing students never receive a burst of old emails. */
const MAX_AGE_DAYS = 14;
/** Addresses that can't receive mail; sending to them hurts deliverability. */
const UNDELIVERABLE = /@(example\.(com|org|net)|[^@]+\.(test|invalid|localhost|example))$/i;

const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type WelcomeContent = { subject: string; title: string; lines: string[]; button: { label: string; url: string } };

export async function welcomeContent(user: User, step: number): Promise<WelcomeContent> {
  const exam = user.peDepth ? "pe-civil" : "fe-civil";
  const answers = await db.attempt.count({ where: { userId: user.id } });
  const base = `${appUrl()}/exams/${exam}`;
  if (step === 1) {
    return answers === 0
      ? {
          subject: "Find your weak spots in about 30 minutes",
          title: "Start with the diagnostic",
          lines: [
            "The fastest way to study is to skip what you already know. The diagnostic asks about two questions per topic and shows where you stand.",
            "After that, smart practice keeps picking questions from your weakest topics, weighted by how much each one counts on the exam.",
          ],
          button: { label: "Take the diagnostic", url: `${base}/diagnostic` },
        }
      : {
          subject: "Your next 10 questions are ready",
          title: "Keep the momentum going",
          lines: [
            `You've answered ${answers} question${answers === 1 ? "" : "s"} so far. Smart practice has picked your next 10 from your weakest topics, plus any reviews that are due.`,
            "Short daily sessions beat weekend cramming: ten questions a day covers the whole exam blueprint in a few weeks.",
          ],
          button: { label: "Start smart practice", url: `${base}/smart` },
        };
  }
  if (step === 2) {
    return {
      subject: "Find formulas faster on exam day",
      title: "Two habits that save time on exam day",
      lines: [
        "Formula flashcards: a few minutes a day keeps key formulas fresh, and every card says where it lives in the reference handbook.",
        hasPaidAccess(user)
          ? "Handbook hunt: a timed drill on which chapter you'd open. Knowing where to look saves minutes per problem."
          : "With full access, Handbook hunt drills which chapter you'd open for each formula. Knowing where to look saves minutes per problem.",
        "Set your exam date too, and your study plan will give you a weekly target and focus topics.",
      ],
      button: { label: "Open your study tools", url: base },
    };
  }
  if (hasPaidAccess(user)) {
    return {
      subject: "Time for a full practice exam",
      title: "Try a full-length timed exam",
      lines: [
        "A week in is a good time to sit a full timed exam. It builds stamina and pacing, and the score report ranks your topics from weakest to strongest.",
        "Then let smart practice work on the weakest ones.",
      ],
      button: { label: "Start a full exam", url: `${base}/mock` },
    };
  }
  const founding = PLANS.find((p) => p.exam === exam && p.founding && !p.legacy)?.founding;
  return {
    subject: "Unlock the full question bank",
    title: "Ready for the full bank?",
    lines: [
      "The free tier gives you a sample question in every topic. Full access adds every question, calculation problems that never repeat, full-length timed exams, all the formula flashcards and the exam documents page.",
      founding
        ? `As an early member you can use code ${founding.code} at checkout for $${founding.price}/month for as long as you stay subscribed (first 100 people).`
        : "Monthly plans cancel anytime, and one-time passes never renew.",
    ],
    button: { label: "See plans", url: `${appUrl()}/pricing` },
  };
}

/** Which step (1-based) is due for an account of this age, or null. A missed day skips ahead instead of sending two. */
export function dueStep(sentSoFar: number, ageDays: number): number | null {
  if (sentSoFar >= STEPS.length) return null;
  let i = sentSoFar;
  while (i < STEPS.length - 1 && ageDays >= STEPS[i + 1]) i++;
  return ageDays >= STEPS[i] ? i + 1 : null;
}

/** Send whichever welcome emails are due. */
export async function sendWelcomeSeries(now = new Date(), limit = 300) {
  const users = await db.user.findMany({
    where: { weeklyEmail: true, welcomeStep: { lt: STEPS.length }, createdAt: { gte: new Date(now.getTime() - MAX_AGE_DAYS * DAY) } },
    take: limit,
  });
  let sent = 0;
  for (const u of users) {
    const step = dueStep(u.welcomeStep, (now.getTime() - u.createdAt.getTime()) / DAY);
    if (!step) continue;
    // Claim first so overlapping runs can't double-send.
    const claimed = await db.user.updateMany({ where: { id: u.id, welcomeStep: u.welcomeStep }, data: { welcomeStep: step } });
    if (!claimed.count || UNDELIVERABLE.test(u.email)) continue;
    const links = await unsubscribeUrls(u.id);
    if (await sendEmail(welcomeSeriesEmail(u.email, u.name, await welcomeContent(u, step), links.page, links.oneClick))) sent++;
  }
  return { candidates: users.length, sent };
}
