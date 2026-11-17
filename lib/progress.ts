import { db } from "./db";
import type { ExamId } from "./content/types";

export type TopicStats = Record<string, { attempted: number; correct: number }>;

/** Accuracy per topic, counting only the latest attempt on each question. */
export async function topicStats(userId: string, exam: ExamId): Promise<TopicStats> {
  const attempts = await db.attempt.findMany({
    where: { userId, exam },
    orderBy: { createdAt: "desc" },
    select: { questionId: true, topic: true, correct: true },
  });
  const seen = new Set<string>();
  const stats: TopicStats = {};
  for (const a of attempts) {
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    const s = (stats[a.topic] ??= { attempted: 0, correct: 0 });
    s.attempted++;
    if (a.correct) s.correct++;
  }
  return stats;
}
