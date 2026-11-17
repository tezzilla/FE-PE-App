import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/access";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const subscribed = hasActiveSubscription(user);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Simple monthly pricing</h1>
        <p className="muted mt-2">Study for as many months as you need. Cancel anytime from your dashboard.</p>
      </div>
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
                {!user ? (
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
