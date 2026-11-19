import "server-only";
import { blockedFor, hit } from "./ratelimit";
import { emailEnabled, sendEmail } from "./email";

// Emails the owner when something that touches money or access breaks: a webhook that fails, a
// checkout that errors, a daily job that crashes, or a payment the daily reconciliation had to repair.
// Vercel's Hobby plan keeps logs for only an hour, so these would otherwise go unnoticed.
//
// Recipient: ALERT_EMAIL, else CONTACT_EMAIL. At most one email per alert key per hour, so a burst of
// failures sends one message, not hundreds. Never throws: alerting must not break the request.

const THROTTLE = { max: 1, windowMs: 60 * 60_000 };

export function alertRecipient() {
  return process.env.ALERT_EMAIL || process.env.CONTACT_EMAIL || null;
}

/** `key` groups repeats (e.g. "webhook-failed"); `lines` are the details, already free of secrets. */
export async function alertOwner(key: string, subject: string, lines: string[]) {
  console.error(`[alert] ${subject}\n${lines.join("\n")}`);
  try {
    const to = alertRecipient();
    if (!to || !emailEnabled()) return false;
    const k = `alert:${key}`;
    if (await blockedFor(k, THROTTLE)) return false;
    await hit(k, THROTTLE);
    const site = (process.env.APP_URL ?? "").replace(/\/$/, "");
    const text = [...lines, "", `More alerts of this kind are held for an hour. Site setup: ${site}/review/setup`].join("\n");
    return await sendEmail({
      to,
      subject: `[CivilPrep alert] ${subject}`,
      text,
      html: `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;white-space:pre-wrap">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre>`,
    });
  } catch (e) {
    console.error("alertOwner failed", e);
    return false;
  }
}

/** A short, secret-free description of an error for an alert email. */
export function describeError(e: unknown) {
  if (e && typeof e === "object" && "type" in e && "message" in e) {
    const s = e as { type?: string; code?: string; message?: string; requestId?: string };
    return [`${s.type}${s.code ? ` (${s.code})` : ""}: ${s.message}`, s.requestId ? `Stripe request: ${s.requestId}` : ""].filter(Boolean).join("\n");
  }
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}
