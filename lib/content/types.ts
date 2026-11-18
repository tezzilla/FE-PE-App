export type ExamId = "fe-civil" | "pe-civil";

export interface Question {
  id: string;
  exam: ExamId;
  topic: string; // topic slug, must exist in the exam's topic list
  prompt: string;
  choices: string[];
  answer: number; // index into choices
  explanation: string;
  reference?: string; // where to look in the NCEES reference handbook / codes
  free?: boolean; // visible on the free tier
  templateId?: string; // set for generated problems
  /** Where this question came from (see Provenance in lib/templates/engine.ts). Defaults to original. */
  provenance?: import("../templates/engine").Provenance;
}

/** Shape sent to the browser. Never includes the answer or explanation. */
export type PublicQuestion = Omit<Question, "answer" | "explanation">;

export interface Topic {
  slug: string;
  name: string;
  /** Approximate number of exam questions per the NCEES spec. Verify against the current spec. */
  examQuestions: string;
}

export interface ExamDef {
  id: ExamId;
  name: string;
  shortName: string;
  description: string;
  /** Real exam timing used to scale mock exams: minutes per question. */
  minutesPerQuestion: number;
  realExam: string;
  topics: Topic[];
}
