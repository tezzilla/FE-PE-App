import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { RedeemForm } from "@/components/GiftForms";

export const dynamic = "force-dynamic";

export default async function RedeemPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const user = await getCurrentUser();
  const here = `/redeem${code ? `?code=${encodeURIComponent(code)}` : ""}`;

  return (
    <div className="card elevated p-6 sm:p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Redeem a gift</h1>
      {user ? (
        <>
          <p className="muted text-sm">Redeeming adds the pass to <strong>{user.email}</strong>. Access starts now.</p>
          <RedeemForm initial={code} />
        </>
      ) : (
        <>
          <p className="muted">Create a free account (or log in) first, then you&apos;ll come right back here to redeem your code.</p>
          <div className="flex flex-col gap-2">
            <Link href={`/signup?next=${encodeURIComponent(here)}`} className="btn">Create free account</Link>
            <Link href={`/login?next=${encodeURIComponent(here)}`} className="btn-ghost">Log in</Link>
          </div>
        </>
      )}
    </div>
  );
}
