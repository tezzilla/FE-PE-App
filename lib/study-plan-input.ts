// Validation for a study plan (exam date + weekly hours), shared by the website form and the app.

export type PlanInput = { examDate: Date; weeklyHours: number };

export function parsePlanInput(dateStr: unknown, hoursRaw: unknown, now = Date.now()): { ok: true; value: PlanInput } | { ok: false; error: "date" | "hours" } {
  const date = new Date(`${String(dateStr ?? "")}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr ?? "")) || Number.isNaN(date.getTime()) || date.getTime() < now || date.getTime() > now + 2 * 365 * 24 * 3600 * 1000) {
    return { ok: false, error: "date" };
  }
  const hours = Math.round(Number(hoursRaw));
  if (!Number.isFinite(hours) || hours < 1 || hours > 60) return { ok: false, error: "hours" };
  return { ok: true, value: { examDate: date, weeklyHours: hours } };
}

export const PLAN_ERRORS = {
  date: "Pick an exam date in the next two years.",
  hours: "Weekly hours must be between 1 and 60.",
} as const;
