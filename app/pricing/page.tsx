import Link from "next/link";
import { EXAMS } from "@/lib/content/exams";
import type { ExamId } from "@/lib/content/types";
import { SOLD_PLANS, getPlan, type Plan } from "@/lib/plans";
import { billingStatus, foundingSpots } from "@/lib/stripe";
import { getCurrentUser, isReviewer } from "@/lib/auth";
import { hasActiveSubscription, passAccessUntil } from "@/lib/access";
import { FAQ } from "@/components/FAQ";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  const subscribed = hasActiveSubscription(user);
  const [status, founding] = await Promise.all([billingStatus(), foundingSpots()]);
  const ready = status.ready;
  const currentPlan = subscribed ? getPlan(user!.plan) : undefined;

  const action = (p: Plan) => {
    if (!ready && !subscribed) return <p className="text-center muted text-sm">Opens soon. Free practice is available now.</p>;
    if (!user) return <Link href="/signup" className={p.kind === "pass" ? "btn-ghost w-full" : "btn w-full"}>Sign up to {p.kind === "pass" ? "buy" : "subscribe"}</Link>;
    if (p.kind === "subscription" && currentPlan?.id === p.id) return <p className="text-center font-semibold">Current plan</p>;
    if (p.kind === "subscription" && subscribed) {
      return (
        <form action="/api/stripe/portal" method="POST">
          <button className="btn-ghost w-full">Change plan</button>
        </form>
      );
    }
    return (
      <form action="/api/stripe/checkout" method="POST">
        <input type="hidden" name="plan" value={p.id} />
        <button className={p.kind === "pass" ? "btn-ghost w-full" : "btn w-full"}>{p.kind === "pass" ? "Buy pass" : "Subscribe"}</button>
      </form>
    );
  };

  const foundingOffers = SOLD_PLANS.filter((p) => p.founding && founding.has(p.founding.code));

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="eyebrow">Pricing</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">A full prep course for less than one exam fee</h1>
        <p className="muted mt-2">Pay monthly and cancel anytime, or buy a pass that covers a typical study period.</p>
        <p className="muted text-sm mt-1">
          Monthly plans renew until you cancel; passes are one payment and never renew. See the <Link href="/terms" className="underline">Terms</Link>.
        </p>
      </div>

      {isReviewer(user) && status.problems.length > 0 && (
        <div className="card p-4 space-y-2 text-sm" style={{ borderColor: "#ca8a04" }}>
          <p className="font-semibold">Billing setup (only reviewers see this)</p>
          <ul className="list-disc pl-5 space-y-1">
            {status.problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <p className="muted">
            Key mode: {status.keyMode ?? "none"} · Stripe variables present: {status.stripeEnvNames.join(", ") || "none"}.
            After changing variables in Vercel, redeploy.
          </p>
        </div>
      )}
      {error === "extension" && (
        <div className="card p-4 text-center">Extensions are for people who already have a pass for that exam. Choose a plan below instead.</div>
      )}
      {error === "checkout" && (
        <div className="card p-4 text-center">Checkout couldn&apos;t start. Please try again in a moment. If it keeps happening, email us and we&apos;ll sort it out.</div>
      )}
      {error === "unavailable" && (
        <div className="card p-4 text-center">That plan isn&apos;t available right now. Please try again later.</div>
      )}

      {ready && foundingOffers.length > 0 && (
        <div className="card p-5 text-center space-y-1" style={{ borderColor: "var(--brand)" }}>
          <p className="font-bold">Founding member pricing</p>
          <p className="text-sm">
            {foundingOffers.map((p, i) => (
              <span key={p.id}>
                {i > 0 && " · "}
                {EXAMS[p.exam].name} for <strong>${p.founding!.price}/mo</strong> with code <code className="font-mono font-semibold">{p.founding!.code}</code>
                {" "}({founding.get(p.founding!.code)! < 1000 ? `${founding.get(p.founding!.code)} spots left` : "limited spots"})
              </span>
            ))}
          </p>
          <p className="muted text-xs">Enter the code at checkout. Your price stays as long as you keep your subscription.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {(["fe-civil", "pe-civil"] as ExamId[]).map((exam) => {
          const plans = SOLD_PLANS.filter((p) => p.exam === exam);
          const pass = passAccessUntil(user, exam);
          return (
            <section key={exam} className="card p-6 space-y-5">
              <div>
                <h2 className="text-2xl font-bold">{EXAMS[exam].name}</h2>
                <p className="muted text-sm">{exam === "pe-civil" ? "All 5 PE Civil module exams. FE Civil content included." : "All 14 FE Civil topic areas."}</p>
                {pass && <p className="text-sm mt-1" style={{ color: "#16a34a" }}>You have a pass until {pass.toLocaleDateString("en-US")}.</p>}
              </div>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl p-4 space-y-3 relative"
                  style={{ border: p.kind === "pass" ? "2px solid var(--brand)" : "1px solid var(--border)" }}
                >
                  {p.kind === "pass" && (
                    <span className="absolute -top-3 right-4 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--btn-bg)", color: "var(--btn-fg)" }}>
                      Best value
                    </span>
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{p.kind === "pass" ? `${p.days! / 30}-month pass` : "Monthly"}</h3>
                    <p className="text-3xl font-extrabold">
                      ${p.price}
                      <span className="text-base font-normal muted">{p.kind === "pass" ? " once" : "/mo"}</span>
                    </p>
                  </div>
                  {p.kind === "pass" && (
                    <p className="text-sm muted">${(p.price / (p.days! / 30)).toFixed(0)}/mo equivalent · {p.days} days · no renewal</p>
                  )}
                  <ul className="space-y-1 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-0.5 shrink-0" style={{ color: "var(--good)" }}><Icon name="check" size={16} /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {action(p)}
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <p className="muted text-xs text-center">
        Prices in USD. Sales tax may apply. Buying for someone else? <Link href="/gift" className="underline">Give a pass as a gift</Link>.
      </p>

      {!user && (
        <div className="card p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-lg">Not sure yet? Start free.</p>
            <p className="muted text-sm">Sample questions in every topic, the diagnostic, and your readiness score. No card required.</p>
          </div>
          <Link href="/signup" className="btn w-full sm:w-auto">Create free account</Link>
        </div>
      )}

      <section className="space-y-4 max-w-3xl mx-auto pt-4">
        <h2 className="text-2xl font-bold text-center">Pricing questions</h2>
        <FAQ
          items={[
            { q: "Monthly or a pass: which should I pick?", a: "If your exam is 3 or more months away, a pass costs less than paying monthly for the same time and never renews. If you're testing sooner or aren't sure of your date, monthly lets you stop anytime." },
            { q: "Does the PE plan include the FE?", a: "Yes. PE Civil plans include all FE Civil content, which is useful for refreshing fundamentals." },
            { q: "How do I cancel?", a: "From your account page, at any time. You keep access until the end of the period you've paid for." },
            { q: "What happens to my progress if I cancel?", a: "It stays in your account. If you come back, your readiness score, history and study plan are right where you left them." },
            { q: "Can my employer pay?", a: "Yes. Checkout produces a receipt, and you can request an invoice. Many firms reimburse exam prep." },
          ]}
        />
      </section>
    </div>
  );
}
