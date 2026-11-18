import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { User } from "@prisma/client";
import { db } from "./db";
import { resolveQuestion } from "./questions";
import { canSeeQuestion, hasExamAccess } from "./access";
import { blockedFor, hit } from "./ratelimit";
import { buildTutorSystem, cleanHistory, TUTOR_LIMITS } from "./tutor-prompt";

// AI tutor: explains a problem the student has already answered, grounded in the verified
// solution. Off unless ANTHROPIC_API_KEY is set.

const MODEL = "claude-opus-5-5";

export function tutorEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function anthropic() {
  return (client ??= new Anthropic());
}

type Result = { status: number; body: { reply: string; left: number } | { error: string } };

export async function askTutor(user: User, questionIdIn: unknown, historyIn: unknown): Promise<Result> {
  if (!tutorEnabled()) return { status: 503, body: { error: "The tutor isn't available right now." } };
  const history = cleanHistory(historyIn);
  if (!history) return { status: 400, body: { error: "Bad request" } };

  const resolved = await resolveQuestion(String(questionIdIn ?? ""));
  if (!resolved || !canSeeQuestion(user, resolved.q)) return { status: 400, body: { error: "Unknown question" } };
  const q = resolved.q;

  // Only after the student has answered this exact problem, so the tutor can't be used to get answers.
  const attempt = await db.attempt.findFirst({
    where: { userId: user.id, questionId: q.id },
    orderBy: { createdAt: "desc" },
  });
  if (!attempt) return { status: 403, body: { error: "Answer the question first, then ask the tutor." } };

  const limit = hasExamAccess(user, q.exam) ? TUTOR_LIMITS.paid : TUTOR_LIMITS.free;
  const key = `tutor:${user.id}`;
  if (await blockedFor(key, limit)) {
    return { status: 429, body: { error: `You've used today's ${limit.max} tutor questions. They reset within 24 hours.` } };
  }

  const system = buildTutorSystem(q, attempt.selected);
  let reply: string;
  try {
    const response = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium" },
      // On a safety decline, the API retries on a fallback model it picks by refusal category.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: history.map((t) => ({ role: t.role, content: t.text })),
    });
    if (response.stop_reason === "refusal") {
      reply = "I can't help with that one. Try asking about the problem's steps or concepts.";
    } else {
      reply = response.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("")
        .trim();
      if (response.stop_reason === "max_tokens") reply += "\n\n(Cut short. Ask me to continue.)";
    }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { status: 503, body: { error: "The tutor is busy. Try again in a minute." } };
    if (e instanceof Anthropic.APIError) {
      console.error(`[tutor] API error ${e.status}: ${e.message}`);
      return { status: 502, body: { error: "The tutor couldn't answer. Try again." } };
    }
    console.error("[tutor] connection error", e);
    return { status: 502, body: { error: "The tutor couldn't be reached. Try again." } };
  }

  await hit(key, limit); // count only successful answers
  const row = await db.rateLimit.findUnique({ where: { key } });
  return { status: 200, body: { reply: reply || "Sorry, I don't have an answer for that.", left: Math.max(0, limit.max - (row?.count ?? limit.max)) } };
}
