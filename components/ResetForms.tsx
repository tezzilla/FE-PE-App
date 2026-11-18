"use client";

import Link from "next/link";
import { useActionState } from "react";
import { chooseNewPassword, requestReset } from "@/app/actions/reset";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  if (state?.sent) {
    return (
      <p className="text-sm">
        If an account exists for that email, a reset link is on its way. It expires in 1 hour. Check your spam folder if it
        doesn&apos;t arrive in a few minutes.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm">Email</span>
        <input name="email" type="email" required className="input mt-1" autoComplete="email" />
      </label>
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Sending…" : "Email me a reset link"}</button>
    </form>
  );
}

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(chooseNewPassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input name="password" type="password" required minLength={8} placeholder="New password (8+ characters)" className="input" autoComplete="new-password" />
      <input name="confirm" type="password" required minLength={8} placeholder="Confirm new password" className="input" autoComplete="new-password" />
      {state?.error && (
        <p className="text-red-500 text-sm">
          {state.error} {state.error.includes("expired") && <Link href="/forgot-password" className="underline">Request a new link</Link>}
        </p>
      )}
      <button className="btn w-full" disabled={pending}>{pending ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
