// Typed client for the CivilPrep website's mobile API (/api/mobile/*).
// Set EXPO_PUBLIC_API_URL to the deployed site, e.g. https://civilprep.example.com.

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type ExamId = 'fe-civil' | 'pe-civil';

export interface User {
  email: string;
  name: string | null;
  active: boolean;
  plan: { id: string; name: string } | null;
  renews: string | null;
  peDepth: string | null;
}

export interface ExamSummary {
  id: ExamId;
  name: string;
  realExam: string;
  access: boolean;
  readiness: {
    score: number;
    coverage: number;
    dueReviews: number;
    answered: number;
    weakest: { slug: string; name: string; mastery: number }[];
  };
  topics: { slug: string; name: string; mastery: number; answered: number }[];
}

export interface Home {
  user: User;
  exams: ExamSummary[];
  accountUrl: string;
}

export interface Question {
  id: string;
  exam: ExamId;
  topic: string;
  prompt: string;
  choices: string[];
  reference?: string;
}

export interface QuestionSet {
  questions: Question[];
  reasons?: Record<string, string>;
  topicNames: Record<string, string>;
}

export interface Feedback {
  correct: boolean;
  answer: number;
  explanation: string;
  reference?: string;
  reviewedBy?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach CivilPrep. Check your connection.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
  return body as T;
}

export const api = {
  auth: (mode: 'login' | 'signup', email: string, password: string, name?: string) =>
    request<{ token: string; user: User }>('/api/mobile/auth', null, {
      method: 'POST',
      body: JSON.stringify({ mode, email, password, name }),
    }),
  home: (token: string) => request<Home>('/api/mobile/me', token),
  smart: (token: string, exam: ExamId) => request<QuestionSet>(`/api/mobile/smart?exam=${exam}`, token),
  practice: (token: string, exam: ExamId, topic?: string) =>
    request<QuestionSet>(`/api/mobile/practice?exam=${exam}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`, token),
  answer: (token: string, questionId: string, selected: number) =>
    request<Feedback>('/api/mobile/answer', token, {
      method: 'POST',
      body: JSON.stringify({ questionId, selected }),
    }),
};
