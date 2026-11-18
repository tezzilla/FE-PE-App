// Typed client for the CivilPrep website's mobile API (/api/mobile/*).
// Set EXPO_PUBLIC_API_URL to the deployed site, e.g. https://civilprep.example.com.
import Constants from 'expo-constants';

/**
 * Where the website's API lives.
 * 1. EXPO_PUBLIC_API_URL, if set (production builds, or pointing dev at a deployed site).
 * 2. In development: the same computer the phone loaded the app from (Expo's dev server host),
 *    port 3000. No need to look up the PC's IP address by hand.
 * 3. Fallback: localhost:3000 (works for web and simulators on the same machine).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv !== undefined) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  // Tunnel hosts (*.exp.direct, *.on.expo.app) forward only the Expo dev server, not the website.
  if (host && !/\.(exp\.direct|expo\.app)$/.test(host)) return `http://${host}:3000`;
  return 'http://localhost:3000';
}

export const API_URL = resolveApiUrl();

export type ExamId = 'fe-civil' | 'pe-civil';

export interface User {
  email: string;
  name: string | null;
  active: boolean;
  plan: { id: string; name: string } | null;
  /** e.g. "FE Civil monthly, renews 1/5/2027" or "PE Civil pass until 5/1/2027". */
  summary?: string;
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
    throw new ApiError(`Can't reach CivilPrep at ${API_URL || 'this site'}. Check your connection.`, 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 404 with no JSON error means the server isn't a CivilPrep backend (wrong URL or failed deploy).
    const message = body.error ?? (res.status === 404
      ? `No CivilPrep API at ${API_URL || 'this site'} (404). Check EXPO_PUBLIC_API_URL and that the site is deployed.`
      : `Request to ${API_URL || 'this site'} failed (${res.status}).`);
    throw new ApiError(message, res.status);
  }
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
  deleteAccount: (token: string, password: string) =>
    request<{ ok: true }>('/api/mobile/account', token, { method: 'DELETE', body: JSON.stringify({ password }) }),
  report: (token: string, questionId: string, selected: number | null, message: string) =>
    request<{ ok: true }>('/api/mobile/report', token, {
      method: 'POST',
      body: JSON.stringify({ questionId, selected, message }),
    }),
  answer: (token: string, questionId: string, selected: number) =>
    request<Feedback>('/api/mobile/answer', token, {
      method: 'POST',
      body: JSON.stringify({ questionId, selected }),
    }),
};
