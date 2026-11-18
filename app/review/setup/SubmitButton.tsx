"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Sending…" : "Send test email"}</button>;
}
