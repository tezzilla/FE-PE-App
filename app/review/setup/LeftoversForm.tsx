"use client";

import { useActionState } from "react";
import { leftoversAction, type LeftoversState } from "./leftovers-action";

export function LeftoversForm({ live }: { live: boolean }) {
  const [state, action, pending] = useActionState<LeftoversState, FormData>(leftoversAction, null);
  const f = state?.found;
  const total = f ? f.passes.length + f.gifts.length + f.subscriptions.length + f.customers.length : 0;
  return (
    <form id="leftovers" action={action} className="card p-4 space-y-3">
      <h2 className="font-semibold">Test purchases left from the sandbox</h2>
      <p className="muted text-sm">
        Purchases made while testing in the Stripe sandbox still unlock content after you go live. This finds them
        (sandbox passes and gifts, and subscriptions or customers the live account doesn&apos;t have) and can remove
        the access they grant. Nothing is deleted: passes are revoked and gift codes voided.
      </p>
      {!live && <p className="text-sm">Available once this site uses a live Stripe key.</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" name="op" value="check" disabled={pending || !live}>{pending ? "Checking…" : "Check"}</button>
        {f && total > 0 && !state?.cleaned && (
          <button className="btn" name="op" value="clean" disabled={pending}>Remove access from {total} item{total > 1 ? "s" : ""}</button>
        )}
      </div>
      {state?.error && <p className="text-sm" style={{ color: "#dc2626" }} role="alert">{state.error}</p>}
      {f && (
        <div className="text-sm space-y-2" role="status">
          {state?.cleaned ? (
            <p className="font-semibold" style={{ color: "var(--good)" }}>Done. Sandbox purchases no longer grant access.</p>
          ) : total === 0 ? (
            <p className="font-semibold" style={{ color: "var(--good)" }}>Nothing found. {f.checked} Stripe records checked.</p>
          ) : null}
          {f.passes.length > 0 && <List title="Sandbox passes" items={f.passes.map((p) => `${p.email}: ${p.plan}`)} />}
          {f.gifts.length > 0 && <List title="Sandbox gift codes" items={f.gifts.map((g) => `${g.code}: ${g.plan}${g.redeemed ? " (redeemed)" : ""}`)} />}
          {f.subscriptions.length > 0 && <List title="Subscriptions not in the live account" items={f.subscriptions.map((s) => `${s.email}: ${s.plan ?? "no plan"} (${s.status ?? "no status"})`)} />}
          {f.customers.length > 0 && <List title="Customer IDs not in the live account" items={f.customers.map((c) => c.email)} />}
        </div>
      )}
    </form>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium">{title} ({items.length})</p>
      <ul className="list-disc pl-5 muted">{items.slice(0, 20).map((i) => <li key={i}>{i}</li>)}</ul>
      {items.length > 20 && <p className="muted">…and {items.length - 20} more</p>}
    </div>
  );
}
