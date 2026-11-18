import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import type { ExamId, Question } from "./content/types";
import { EXAMS, isExamId } from "./content/exams";
import { questionsFor } from "./content";
import { approvedTemplates } from "./reviews";
import { templatesFor } from "./templates";
import { templateToQuestion } from "./templates/engine";
import { sampleSetEmail, sendEmail } from "./email";
import { LIMITS, blockedFor, clientIp, hit, tooMany } from "./ratelimit";

const AUDIENCE = "civilprep-sample-set";
const SET_SIZE = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** A signed link to the sample set (30 days), so the page can't be reached without asking for it. */
export async function sampleToken(email: string, exam: ExamId) {
  return new SignJWT({ exam, email })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySampleToken(token: string, exam: ExamId) {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: AUDIENCE });
    return payload.exam === exam;
  } catch {
    return false;
  }
}

/** Save the lead, email the link, and return it. */
export async function requestSampleSet(emailIn: unknown, examIn: unknown, optIn: boolean) {
  const email = String(emailIn ?? "").trim().toLowerCase();
  const exam = String(examIn ?? "");
  if (!isExamId(exam)) return { error: "Unknown exam." } as const;
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: "Enter a valid email address." } as const;

  const key = `lead:${await clientIp()}`;
  const wait = await blockedFor(key, LIMITS.leadIp);
  if (wait) return { error: tooMany(wait) } as const;
  await hit(key, LIMITS.leadIp);

  await db.lead.upsert({
    where: { email_exam: { email, exam } },
    create: { email, exam, marketingOptIn: optIn },
    // Never switch an earlier opt-in off just because the box was left blank this time.
    update: optIn ? { marketingOptIn: true } : {},
  });
  const url = `${appUrl()}/free/${exam}/set?t=${encodeURIComponent(await sampleToken(email, exam))}`;
  await sendEmail(sampleSetEmail(email, EXAMS[exam].name, url));
  return { url } as const;
}

/**
 * The problems in the sample set: one per topic first, then more until the set is full. The free
 * sample questions plus fixed-seed variants of approved problem types (never unapproved ones).
 */
export async function sampleSet(exam: ExamId): Promise<Question[]> {
  const approved = await approvedTemplates();
  const pool = new Map<string, Question[]>();
  for (const t of EXAMS[exam].topics) {
    // Only questions that are already free; paid fixed questions stay paid.
    const fixed = questionsFor(exam, t.slug).filter((q) => q.free);
    const generated = templatesFor(exam, t.slug)
      .filter((tpl) => approved.has(tpl.id))
      .flatMap((tpl) => templateToQuestion(tpl, exam, 1000 + tpl.id.length) ?? []);
    pool.set(t.slug, [...fixed, ...generated]);
  }
  const out: Question[] = [];
  for (let round = 0; out.length < SET_SIZE; round++) {
    let added = false;
    for (const qs of pool.values()) {
      if (qs[round] && out.length < SET_SIZE) {
        out.push(qs[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}
