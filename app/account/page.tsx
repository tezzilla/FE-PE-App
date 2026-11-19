import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { accessSummary } from "@/lib/access";
import { DeleteForm, NameForm, PasswordForm } from "@/components/AccountForms";
import { setWeeklyEmail } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const billable = !!user.stripeSubscriptionId && !["canceled", "incomplete_expired"].includes(user.subscriptionStatus ?? "");

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="muted">{user.email}</p>
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Profile</h2>
        <NameForm name={user.name} />
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Plan</h2>
        <p className="text-sm">
          {accessSummary(user)}
        </p>
        {user.stripeCustomerId ? (
          <form action="/api/stripe/portal" method="POST">
            <button className="btn-ghost">Manage billing, invoices and receipts</button>
          </form>
        ) : (
          <Link href="/pricing" className="btn-ghost">See plans</Link>
        )}
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Email</h2>
        <form action={setWeeklyEmail} className="space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="weeklyEmail" defaultChecked={user.weeklyEmail} className="mt-1" />
            <span>
              <span className="font-medium">Study emails</span>
              <span className="block muted">A Monday progress summary, plus a few tips in your first week. Account emails, like password resets, always arrive.</span>
            </span>
          </label>
          <button className="btn-ghost">Save</button>
        </form>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Password</h2>
        <PasswordForm />
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Your data</h2>
        <p className="text-sm muted">Download everything we store about you as a JSON file. See the <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
        <a href="/api/account/export" className="btn-ghost" download>Download my data</a>
      </section>

      <section className="card p-5 space-y-3" style={{ borderColor: "#dc262666" }}>
        <h2 className="font-semibold" style={{ color: "#dc2626" }}>Delete account</h2>
        <DeleteForm hasSubscription={billable} />
      </section>
    </div>
  );
}
