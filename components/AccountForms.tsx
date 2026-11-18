"use client";

import { useActionState } from "react";
import { removeAccount, saveName, savePassword, type FormState } from "@/app/account/actions";

function Status({ state }: { state: FormState }) {
  if (state?.error) return <p className="text-red-500 text-sm">{state.error}</p>;
  if (state?.done) return <p className="text-sm" style={{ color: "#16a34a" }}>{state.done}</p>;
  return null;
}

export function NameForm({ name }: { name: string | null }) {
  const [state, action, pending] = useActionState(saveName, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        Display name
        <input name="name" defaultValue={name ?? ""} maxLength={80} className="input mt-1" autoComplete="name" />
      </label>
      <Status state={state} />
      <button className="btn-ghost" disabled={pending}>Save name</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(savePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <input name="current" type="password" required placeholder="Current password" className="input" autoComplete="current-password" />
      <input name="next" type="password" required minLength={8} placeholder="New password (8+ characters)" className="input" autoComplete="new-password" />
      <input name="confirm" type="password" required minLength={8} placeholder="Confirm new password" className="input" autoComplete="new-password" />
      <Status state={state} />
      <button className="btn-ghost" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}

export function DeleteForm({ hasSubscription }: { hasSubscription: boolean }) {
  const [state, action, pending] = useActionState(removeAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm">
        This permanently deletes your account, answers, readiness history and mock exams.
        {hasSubscription && " Your subscription is canceled immediately and you won't be charged again (no refund for the current month)."}
      </p>
      <input name="password" type="password" required placeholder="Password" className="input" autoComplete="current-password" />
      <input name="confirm" required placeholder="Type DELETE to confirm" className="input" autoComplete="off" />
      <Status state={state} />
      <button className="btn" style={{ background: "#dc2626" }} disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</button>
    </form>
  );
}
