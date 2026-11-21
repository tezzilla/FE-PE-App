import Link from "next/link";
import { resetTokenValid } from "@/lib/account";
import { NewPasswordForm } from "@/components/ResetForms";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = await resetTokenValid(token);
  return (
    <div className="max-w-sm mx-auto card p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      {valid ? (
        <>
          <p className="muted text-sm">This signs you out on every other device.</p>
          <NewPasswordForm token={token} />
        </>
      ) : (
        <p className="text-sm">
          This reset link is invalid, already used, or expired. <Link href="/forgot-password" className="underline">Request a new link</Link>.
        </p>
      )}
    </div>
  );
}
