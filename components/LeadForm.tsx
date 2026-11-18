"use client";

import { useActionState } from "react";
import { requestSample, type LeadState } from "@/app/actions/leads";

export function LeadForm({ exam }: { exam: string }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(requestSample, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="exam" value={exam} />
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="email" className="input mt-1" placeholder="you@example.com" />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="optIn" className="mt-1" />
        <span className="muted">Also send me occasional study tips and CivilPrep offers. Unsubscribe anytime.</span>
      </label>
      {state?.error && <p className="text-sm" style={{ color: "#dc2626" }}>{state.error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Preparing…" : "Get the free problem set"}</button>
      <p className="muted text-xs">We&apos;ll also email you the link. No account needed.</p>
    </form>
  );
}
