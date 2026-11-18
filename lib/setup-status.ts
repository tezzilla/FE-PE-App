import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { billingStatus } from "./stripe";
import { templateReviewStatus } from "./reviews";
import { TEMPLATES } from "./templates";

// Owner-facing configuration checks for the reviewer-only setup page. Never returns secret values.

export type CheckState = "ok" | "warn" | "missing";
export interface Check {
  name: string;
  state: CheckState;
  detail: string;
  /** What to do when it isn't ok. */
  fix?: string;
}

const ENV = "Vercel > Settings > Environment Variables, then Deployments > Redeploy.";

async function postmarkCheck(): Promise<Check> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.EMAIL_FROM;
  if (!token || !from) {
    const missing = [!token && "POSTMARK_SERVER_TOKEN", !from && "EMAIL_FROM"].filter(Boolean).join(" and ");
    return { name: "Email (Postmark)", state: "missing", detail: `${missing} not set. Password reset and welcome emails are not sent.`, fix: `Add ${missing} in ${ENV}` };
  }
  try {
    const res = await fetch("https://api.postmarkapp.com/server", {
      headers: { Accept: "application/json", "X-Postmark-Server-Token": token },
      cache: "no-store",
    });
    if (res.status === 401) {
      return { name: "Email (Postmark)", state: "missing", detail: "Postmark rejected POSTMARK_SERVER_TOKEN.", fix: `Copy the Server API token from Postmark > Servers > your server > API Tokens (not the Account token) into ${ENV}` };
    }
    const body = await res.json().catch(() => ({}));
    return { name: "Email (Postmark)", state: "ok", detail: `Token works (server "${body.Name ?? "?"}"). Sending from ${from}. Use "Send test email" below to confirm delivery.` };
  } catch {
    return { name: "Email (Postmark)", state: "warn", detail: "Set, but Postmark couldn't be reached to check the token." };
  }
}

async function tutorCheck(): Promise<Check> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { name: "AI tutor (optional)", state: "warn", detail: "ANTHROPIC_API_KEY not set. The tutor button is hidden.", fix: `Create a key at console.anthropic.com > API Keys and add it in ${ENV}` };
  }
  try {
    await new Anthropic().models.retrieve("claude-opus-5-5"); // free call; confirms the key works
    return { name: "AI tutor (optional)", state: "ok", detail: "Key works. Students see \"Ask the AI tutor\" after answering." };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return { name: "AI tutor (optional)", state: "missing", detail: "Anthropic rejected ANTHROPIC_API_KEY.", fix: `Create a new key and replace it in ${ENV}` };
    }
    if (e instanceof Anthropic.APIError) return { name: "AI tutor (optional)", state: "warn", detail: `Key set; Anthropic returned ${e.status} when checking it.` };
    return { name: "AI tutor (optional)", state: "warn", detail: "Key set, but Anthropic couldn't be reached to check it." };
  }
}

export async function setupStatus(requestHost: string | null): Promise<Check[]> {
  const checks: Check[] = [];

  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    checks.push({ name: "Site address (APP_URL)", state: "missing", detail: "Not set. Links in emails and Stripe return pages point to localhost.", fix: `Set APP_URL to your main address in ${ENV}` });
  } else {
    const host = (() => { try { return new URL(appUrl).host; } catch { return null; } })();
    const matches = !requestHost || host === requestHost || requestHost.endsWith(".vercel.app");
    checks.push(
      matches
        ? { name: "Site address (APP_URL)", state: "ok", detail: appUrl }
        : { name: "Site address (APP_URL)", state: "warn", detail: `Set to ${appUrl}, but you're visiting ${requestHost}. Links in emails will use ${appUrl}.`, fix: `If ${requestHost} is your main address, set APP_URL to https://${requestHost} in ${ENV}` },
    );
  }

  checks.push(await postmarkCheck());

  const contact = process.env.CONTACT_EMAIL;
  checks.push(
    contact
      ? { name: "Contact email (CONTACT_EMAIL)", state: "ok", detail: `${contact}, shown on Terms and Privacy.` }
      : { name: "Contact email (CONTACT_EMAIL)", state: "missing", detail: "Not set. Terms and Privacy say an address will be posted.", fix: `Set CONTACT_EMAIL in ${ENV}` },
  );

  const billing = await billingStatus();
  checks.push(
    billing.ready
      ? { name: "Payments (Stripe)", state: "ok", detail: `Ready${billing.keyMode ? `, ${billing.keyMode} mode` : ""}.${billing.problems.length ? " " + billing.problems.join(" ") : ""}` }
      : { name: "Payments (Stripe)", state: "missing", detail: billing.problems.join(" ") },
  );

  checks.push(await tutorCheck());

  const status = await templateReviewStatus();
  const approved = TEMPLATES.filter((t) => status.get(t.id)?.status === "approved").length;
  checks.push(
    approved === TEMPLATES.length
      ? { name: "Problem templates", state: "ok", detail: `All ${approved} approved and live.` }
      : { name: "Problem templates", state: approved ? "warn" : "missing", detail: `${approved} of ${TEMPLATES.length} approved. Only approved templates appear for students.`, fix: "Review them on the Review queue page." },
  );

  checks.push(
    process.env.REVIEWER_EMAILS
      ? { name: "Reviewers (REVIEWER_EMAILS)", state: "ok", detail: "Set." }
      : { name: "Reviewers (REVIEWER_EMAILS)", state: "missing", detail: "Not set." },
  );
  return checks;
}
