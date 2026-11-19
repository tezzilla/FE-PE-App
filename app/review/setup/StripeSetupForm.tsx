"use client";

import { useActionState } from "react";
import { setupStripe, type StripeSetupState } from "./stripe-action";

export function StripeSetupForm({ keyMode }: { keyMode: string | null }) {
  const [state, action, pending] = useActionState<StripeSetupState, FormData>(setupStripe, null);
  const live = !!keyMode?.endsWith("live");
  return (
    <form id="stripe-setup" action={action} className="card p-4 space-y-3">
      <h2 className="font-semibold">Set up Stripe</h2>
      <p className="muted text-sm">
        Creates or updates the products and prices for every plan, the founding-member codes, the webhook endpoint
        and the Customer Portal in the Stripe account this site&apos;s key belongs to. It runs on the server with
        that key; nothing is deleted, and it&apos;s safe to run again.
      </p>
      <p className="text-sm">
        Key on this deployment: <strong>{keyMode ?? "none"}</strong>
      </p>
      {live && (
        <label className="block text-sm">
          Type <strong>LIVE</strong> to change live mode
          <input name="confirm" className="input mt-1 !w-40" autoComplete="off" />
        </label>
      )}
      <button className="btn" disabled={pending || !keyMode}>{pending ? "Setting up…" : live ? "Set up live Stripe" : "Set up Stripe"}</button>
      {state?.error && <p className="text-sm" style={{ color: "#dc2626" }} role="alert">{state.error}</p>}
      {state?.ok && (
        <div className="space-y-2" role="status">
          <p className="text-sm font-semibold" style={{ color: "var(--good)" }}>Done ({state.mode} mode).</p>
          {state.secretSaved && (
            <p className="text-sm">Webhook created and its signing secret saved securely on the server. Nothing to copy.</p>
          )}
          {state.needsManualSecret && (
            <p className="text-sm">
              The webhook endpoint already existed, so its signing secret couldn&apos;t be saved automatically. In Stripe, open
              Developers &gt; Webhooks &gt; the CivilPrep endpoint, reveal its signing secret (whsec_...), save it as{" "}
              <code>STRIPE_WEBHOOK_SECRET</code> in Vercel for Production, and redeploy.
            </p>
          )}
          <pre className="text-xs whitespace-pre-wrap p-3 rounded" style={{ background: "var(--border)" }}>{state.log.join("\n")}</pre>
        </div>
      )}
    </form>
  );
}
