"use client";

import { useActionState, useState } from "react";
import { buyGift, redeem, type GiftState, type RedeemState } from "@/app/actions/gifts";

export function GiftForm({ plans }: { plans: { id: string; name: string; price: number; days: number; blurb: string }[] }) {
  const [state, action, pending] = useActionState<GiftState, FormData>(buyGift, undefined);
  const [plan, setPlan] = useState(plans[0]?.id);
  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="font-semibold mb-1">Choose a gift</legend>
        {plans.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 rounded-xl p-4 cursor-pointer"
            style={{ border: plan === p.id ? "2px solid var(--brand)" : "1px solid var(--border)" }}
          >
            <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} />
            <span className="flex-1">
              <span className="font-semibold block">{p.name}</span>
              <span className="muted text-sm">{p.blurb}</span>
            </span>
            <span className="text-xl font-extrabold">${p.price}</span>
          </label>
        ))}
      </fieldset>
      <label className="block text-sm font-medium">
        Recipient&apos;s email
        <input name="recipientEmail" type="email" required className="input mt-1" placeholder="engineer@example.com" />
      </label>
      <label className="block text-sm font-medium">
        Message (optional)
        <textarea name="message" maxLength={300} rows={3} className="input mt-1" placeholder="Good luck on the exam!" />
      </label>
      {state?.error && <p className="text-sm" style={{ color: "#dc2626" }}>{state.error}</p>}
      <button className="btn w-full btn-lg" disabled={pending}>{pending ? "Opening checkout…" : "Continue to payment"}</button>
      <p className="muted text-xs">
        We email the recipient a gift code right after payment. Access starts when they redeem it, so they can save it until they
        start studying. You&apos;ll get a receipt and a copy of the code.
      </p>
    </form>
  );
}

export function RedeemForm({ initial }: { initial?: string }) {
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeem, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium">
        Gift code
        <input name="code" required defaultValue={initial} className="input mt-1 font-mono tracking-wider uppercase" placeholder="CP-XXXX-XXXX-XXXX" autoComplete="off" />
      </label>
      {state?.error && <p className="text-sm" style={{ color: "#dc2626" }}>{state.error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Redeeming…" : "Redeem gift"}</button>
    </form>
  );
}
