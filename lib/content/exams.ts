import type { ExamDef, ExamId } from "./types";

export const EXAMS: Record<ExamId, ExamDef> = {
  "fe-civil": {
    id: "fe-civil",
    name: "FE Civil",
    shortName: "FE",
    description:
      "Fundamentals of Engineering, Civil. The first step toward licensure, usually taken near graduation.",
    minutesPerQuestion: 320 / 110,
    realExam: "110 questions, 5 h 20 min of exam time, computer-based, FE Reference Handbook provided.",
    topics: [
      { slug: "math-stats", name: "Mathematics & Statistics", examQuestions: "8-12" },
      { slug: "ethics", name: "Ethics & Professional Practice", examQuestions: "4-6" },
      { slug: "economics", name: "Engineering Economics", examQuestions: "5-8" },
      { slug: "statics", name: "Statics", examQuestions: "8-12" },
      { slug: "dynamics", name: "Dynamics", examQuestions: "4-6" },
      { slug: "mechanics-materials", name: "Mechanics of Materials", examQuestions: "7-11" },
      { slug: "materials", name: "Materials", examQuestions: "5-8" },
      { slug: "fluids", name: "Fluid Mechanics", examQuestions: "6-9" },
      { slug: "surveying", name: "Surveying", examQuestions: "6-9" },
      { slug: "water-env", name: "Water Resources & Environmental", examQuestions: "10-15" },
      { slug: "structural", name: "Structural Engineering", examQuestions: "10-15" },
      { slug: "geotechnical", name: "Geotechnical Engineering", examQuestions: "10-15" },
      { slug: "transportation", name: "Transportation Engineering", examQuestions: "9-14" },
      { slug: "construction", name: "Construction Engineering", examQuestions: "8-12" },
    ],
  },
  "pe-civil": {
    id: "pe-civil",
    name: "PE Civil",
    shortName: "PE",
    description:
      "Principles and Practice of Engineering, Civil. Five separate module exams; you take the one for your discipline, usually after qualifying experience.",
    minutesPerQuestion: 6,
    realExam: "80 questions in 9 hours, computer-based, all from the module you choose, with the PE Civil Reference Handbook plus that module's design standards.",
    topics: [
      { slug: "structural", name: "Structural", examQuestions: "separate exam" },
      { slug: "geotechnical", name: "Geotechnical", examQuestions: "separate exam" },
      { slug: "transportation", name: "Transportation", examQuestions: "separate exam" },
      { slug: "water-env", name: "Water Resources & Environmental", examQuestions: "separate exam" },
      { slug: "construction", name: "Construction", examQuestions: "separate exam" },
    ],
  },
};

export const EXAM_IDS = Object.keys(EXAMS) as ExamId[];

export function isExamId(v: string): v is ExamId {
  return v in EXAMS;
}

export function topicName(exam: ExamId, slug: string): string {
  return EXAMS[exam].topics.find((t) => t.slug === slug)?.name ?? slug;
}
