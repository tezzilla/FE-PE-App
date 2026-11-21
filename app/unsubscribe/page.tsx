import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/weekly";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email preferences | CivilPrep", robots: { index: false } };

// Opening the link doesn't change anything (email scanners open links); the button does.
async function confirm(form: FormData) {
  "use server";
  const t = String(form.get("t") ?? "");
  const uid = await verifyUnsubscribeToken(t);
  if (uid) await db.user.updateMany({ where: { id: uid }, data: { weeklyEmail: false } });
  redirect(`/unsubscribe?done=${uid ? 1 : 0}`);
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t, done } = await searchParams;
  if (done) {
    return (
      <div className="card p-6 max-w-md mx-auto text-center space-y-3">
        <h1 className="text-xl font-semibold">{done === "1" ? "You're unsubscribed" : "That link didn't work"}</h1>
        <p className="muted text-sm">
          {done === "1"
            ? "You won't get the weekly progress email or study tips anymore. Account emails, like password resets, still arrive."
            : "Log in and change your email preferences on your Account page."}
        </p>
        <Link href="/account" className="btn-ghost">Account settings</Link>
      </div>
    );
  }
  const valid = !!t && !!(await verifyUnsubscribeToken(t));
  return (
    <div className="card p-6 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-xl font-semibold">Stop study emails?</h1>
      {valid ? (
        <form action={confirm}>
          <input type="hidden" name="t" value={t} />
          <button className="btn">Unsubscribe</button>
        </form>
      ) : (
        <p className="muted text-sm">This link is invalid. Log in and change your email preferences on your Account page.</p>
      )}
      <p className="muted text-xs">You can turn it back on anytime from your Account page.</p>
    </div>
  );
}
