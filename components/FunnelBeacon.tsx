"use client";

import { useEffect } from "react";

/** Counts one pricing-page view per browser tab session. No cookies; nothing identifies the visitor. */
export function FunnelBeacon({ name }: { name: "pricing_view" }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(`funnel:${name}`)) return;
      sessionStorage.setItem(`funnel:${name}`, "1");
    } catch {
      // storage blocked: still count it
    }
    fetch("/api/funnel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), keepalive: true }).catch(() => {});
  }, [name]);
  return null;
}
