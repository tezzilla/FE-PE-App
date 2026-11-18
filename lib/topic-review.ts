import "server-only";
import type { User } from "@prisma/client";
import type { ExamId } from "./content/types";
import { EXAMS } from "./content/exams";
import { questionsFor } from "./content";
import { flashcardsFor } from "./content/flashcards";
import { topicGuide } from "./content/topic-guides";
import { approvedTemplates } from "./reviews";
import { templatesFor } from "./templates";
import { templateToQuestion } from "./templates/engine";
import { learnerState } from "./adaptive/server";
import { topicMastery } from "./adaptive/model";
import { hasExamAccess } from "./access";

/** Everything on a topic review page. Null for an unknown exam/topic. Shared by the website and the app. */
export async function topicReview(user: User | null, exam: ExamId, topic: string) {
  const t = EXAMS[exam].topics.find((x) => x.slug === topic);
  const guide = topicGuide(exam, topic);
  if (!t || !guide) return null;
  // Worked example: a fixed variant of an approved problem type, else a free sample question.
  const approved = await approvedTemplates();
  const tpl = templatesFor(exam, topic).find((x) => approved.has(x.id));
  const example = (tpl && templateToQuestion(tpl, exam, 1)) || questionsFor(exam, topic).find((q) => q.free) || null;
  const review = tpl ? approved.get(tpl.id) : undefined;
  const mastery = user ? topicMastery(await learnerState(user.id, exam), topic) : null;
  return {
    topic: t,
    guide,
    // Free visitors see the free formula cards only; the rest are counted so the page can say so.
    cards: flashcardsFor(exam, topic).filter((c) => c.free || hasExamAccess(user, exam)),
    lockedCards: flashcardsFor(exam, topic).filter((c) => !(c.free || hasExamAccess(user, exam))).length,
    example,
    reviewedBy: review?.reviewerName ? [review.reviewerName, review.credential].filter(Boolean).join(", ") : null,
    mastery,
  };
}
