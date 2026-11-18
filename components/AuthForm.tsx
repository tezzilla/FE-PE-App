"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

export function AuthForm({
  action,
  mode,
  next,
}: {
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  mode: "login" | "signup";
  /** Same-site path to go to after signing in (validated on the server). */
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <label className="block">
          <span className="text-sm">Name (optional)</span>
          <input name="name" className="input mt-1" autoComplete="name" />
        </label>
      )}
      <label className="block">
        <span className="text-sm">Email</span>
        <input name="email" type="email" required className="input mt-1" autoComplete="email" />
      </label>
      <label className="block">
        <span className="text-sm">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          className="input mt-1"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "signup" ? "Create free account" : "Log in"}
      </button>
    </form>
  );
}
