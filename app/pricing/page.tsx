import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { billingStatus } from "@/lib/stripe";
import { getCurrentUser, isReviewer } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/access";

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  const subscribed = hasActiveSubscription(user);
  const status = await billingStatus();
  const ready = status.ready;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Simple monthly pricing</h1>
        <p className="muted mt-2">Study for as many months as you need. Cancel anytime from your dashboard.</p>
        <p className="muted text-sm mt-1">
          Plans renew monthly until you cancel. See the <Link href="/terms" className="underline">Terms</Link>.
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
      {error === "unavailable" && (
        <div className="card p-4 text-center">That plan isn&apos;t available right now. Please try again later.</div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const current = subscribed && user?.plan === p.id;
          return (
            <div key={p.id} className="card p-6 flex flex-col">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="text-4xl font-extrabold mt-3">
                ${p.priceMonthly}<span className="text-base font-normal muted">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {p.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <div className="mt-6">
                {!ready && !subscribed ? (
                  <p className="text-center muted text-sm">Subscriptions open soon. Free practice is available now.</p>
                ) : !user ? (
                  <Link href="/signup" className="btn w-full">Sign up to subscribe</Link>
                ) : current ? (
                  <p className="text-center font-semibold">Current plan</p>
                ) : subscribed ? (
                  <form action="/api/stripe/portal" method="POST">
                    <button className="btn-ghost w-full">Change plan</button>
                  </form>
                ) : (
                  <form action="/api/stripe/checkout" method="POST">
                    <input type="hidden" name="plan" value={p.id} />
                    <button className="btn w-full">Subscribe</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
