import Link from "next/link";
import { headers } from "next/headers";
import { requireReviewer } from "@/lib/auth";
import { setupStatus, type CheckState } from "@/lib/setup-status";
import { templateReviewStatus } from "@/lib/reviews";
import { approveVerified, sendTestEmail } from "./actions";
import { SubmitButton } from "./SubmitButton";
import { StripeSetupForm } from "./StripeSetupForm";
import { LeftoversForm } from "./LeftoversForm";
import { keyMode } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const BADGE: Record<CheckState, { text: string; color: string }> = {
  ok: { text: "OK", color: "#16a34a" },
  warn: { text: "Check", color: "#ca8a04" },
  missing: { text: "Missing", color: "#dc2626" },
};

const TEST_MSG: Record<string, string> = {
  sent: "Test email sent. Check that inbox (and spam). If it doesn't arrive, look at Postmark > your server > Activity.",
  pending:
    "Postmark accepted your settings but held this email: your Postmark account is still pending approval, and until then it only sends to addresses on your own domain (getcivilprep.com). Your token and sender are working. Once Postmark approves the account, emails will reach any address. To test now, send it to support@getcivilprep.com instead.",
  failed: "Postmark refused the test email. Postmark > your server > Activity shows why (often: account still pending approval, or EMAIL_FROM isn't on a verified domain).",
  off: "Email isn't configured yet.",
  notallowed: "For safety, test emails can only go to your own login email or an address on your sending domain.",
};

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ test?: string; approved?: string; failed?: string }> }) {
  const user = await requireReviewer();
  const { test, approved: approvedParam, failed } = await searchParams;
  const failedIds = (failed ?? "").split(",").filter(Boolean);
  const waiting = [...(await templateReviewStatus()).values()].filter((s) => s.status === "needs_review").length;
  const checks = await setupStatus((await headers()).get("host"));
  const bad = checks.filter((c) => c.state !== "ok").length;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Site setup</h1>
        <Link href="/review" className="muted text-sm hover:underline">Review queue</Link>
      </div>
      <p className="muted text-sm">
        Checks the live settings. Secret values are never shown. {bad ? `${bad} item${bad > 1 ? "s" : ""} need attention.` : "Everything is set."}
      </p>
      <div className="space-y-3">
        {checks.map((c) => (
          <div key={c.name} className="card p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: "#fff", background: BADGE[c.state].color }}>{BADGE[c.state].text}</span>
            </div>
            <p className="text-sm">{c.detail}</p>
            {c.fix && <p className="muted text-sm">Fix: {c.fix}</p>}
          </div>
        ))}
      </div>
      <StripeSetupForm keyMode={keyMode(process.env.STRIPE_SECRET_KEY)} />
      <LeftoversForm live={!!keyMode(process.env.STRIPE_SECRET_KEY)?.endsWith("live")} />

      <form id="auto-approve" action={approveVerified} className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-56 text-sm space-y-1">
            <p className="font-semibold">Problem types waiting for review: {waiting}</p>
            <p className="muted">
              Approve every waiting type that passes the independent answer check (200 versions each, re-solved from the
              question text). Students will see &ldquo;reviewed by CivilPrep&apos;s independent answer check&rdquo;, not your
              name. Types you&apos;ve already decided on are left alone.
            </p>
          </div>
          <button className="btn" disabled={waiting === 0}>Approve all verified</button>
        </div>
        {approvedParam !== undefined && (
          <p role="status" className="text-sm p-3 rounded" style={{ background: "var(--bg)", border: `1px solid ${failedIds.length ? "#ca8a04" : "#16a34a"}` }}>
            Approved {approvedParam} problem type{approvedParam === "1" ? "" : "s"}.
            {failedIds.length ? ` Not approved (failed the check, review by hand): ${failedIds.join(", ")}.` : " None failed the check."}
          </p>
        )}
      </form>

      <form id="test-email" action={sendTestEmail} className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex-1 min-w-56 text-sm">
            Send a test email to
            <input name="to" type="email" className="input mt-1" defaultValue={user.email} aria-label="Test email recipient" />
            <span className="muted text-xs">Your own email, or any address on your sending domain.</span>
          </label>
          <SubmitButton />
        </div>
        {test && TEST_MSG[test] && (
          <p role="status" className="text-sm p-3 rounded" style={{ background: "var(--bg)", border: `1px solid ${test === "sent" ? "#16a34a" : test === "pending" ? "#ca8a04" : "#dc2626"}` }}>
            {TEST_MSG[test]}
          </p>
        )}
      </form>
    </div>
  );
}
