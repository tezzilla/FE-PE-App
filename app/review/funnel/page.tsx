import Link from "next/link";
import { requireReviewer } from "@/lib/auth";
import { funnelReport } from "@/lib/funnel";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "pricing_view", label: "Viewed pricing" },
  { key: "signup", label: "Signed up" },
  { key: "checkout_start", label: "Started checkout" },
  { key: "purchase", label: "Paid" },
] as const;

/** Where visitors drop off on the way to paying. Counts are events, not unique people. */
export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireReviewer();
  const days = [7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const { counts, byPlan } = await funnelReport(new Date(Date.now() - days * 864e5));
  const top = Math.max(1, ...STEPS.map((s) => counts[s.key]));

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Signup and purchase funnel</h1>
        <Link href="/review" className="muted text-sm hover:underline">Review queue</Link>
      </div>
      <nav className="flex gap-2 text-sm" aria-label="Time range">
        {[7, 30, 90].map((d) => (
          <Link key={d} href={`/review/funnel?days=${d}`} className={d === days ? "btn !py-1" : "btn-ghost !py-1"} aria-current={d === days ? "page" : undefined}>
            Last {d} days
          </Link>
        ))}
      </nav>
      <div className="card p-5 space-y-4">
        {STEPS.map((s, i) => {
          const n = counts[s.key];
          const prev = i > 0 ? counts[STEPS[i - 1].key] : null;
          return (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="tabular-nums">
                  {n.toLocaleString()}
                  {prev ? <span className="muted"> · {Math.round((100 * n) / prev)}% of previous step</span> : null}
                </span>
              </div>
              <div className="h-3 rounded" style={{ background: "var(--border)" }}>
                <div className="h-3 rounded" style={{ width: `${(100 * n) / top}%`, background: "var(--chart-line)" }} />
              </div>
            </div>
          );
        })}
      </div>
      {byPlan.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Purchases by plan</h2>
          <table className="w-full text-sm">
            <tbody>
              {byPlan.map((r) => (
                <tr key={r.plan} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-1.5">{r.plan.startsWith("gift:") ? `Gift: ${getPlan(r.plan.slice(5))?.name ?? r.plan}` : getPlan(r.plan)?.name ?? r.plan}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted text-xs">
        Pricing views count once per browser tab; signups, checkouts and payments are recorded on the server. No cookies or
        personal data are used. Visitors can sign up before or after viewing pricing, so a step can exceed the one before it.
      </p>
    </div>
  );
}
