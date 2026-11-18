import Link from "next/link";
import { headers } from "next/headers";
import { requireReviewer } from "@/lib/auth";
import { setupStatus, type CheckState } from "@/lib/setup-status";
import { sendTestEmail } from "./actions";

export const dynamic = "force-dynamic";

const BADGE: Record<CheckState, { text: string; color: string }> = {
  ok: { text: "OK", color: "#16a34a" },
  warn: { text: "Check", color: "#ca8a04" },
  missing: { text: "Missing", color: "#dc2626" },
};

const TEST_MSG: Record<string, string> = {
  sent: "Test email sent to your address. Check your inbox (and spam). If it doesn't arrive, look at Postmark > your server > Activity.",
  failed: "Postmark refused the test email. Postmark > your server > Activity shows why (often: account still pending approval, or EMAIL_FROM isn't on a verified domain).",
  off: "Email isn't configured yet.",
};

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const user = await requireReviewer();
  const { test } = await searchParams;
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
      {test && TEST_MSG[test] && <div className="card p-3 text-sm">{TEST_MSG[test]}</div>}
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
      <form action={sendTestEmail} className="card p-4 flex flex-wrap items-center gap-3">
        <p className="flex-1 min-w-56 text-sm">Send a test email to <strong>{user.email}</strong>.</p>
        <button className="btn">Send test email</button>
      </form>
    </div>
  );
}
