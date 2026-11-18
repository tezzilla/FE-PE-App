"use server";

import { redirect } from "next/navigation";
import { requireReviewer } from "@/lib/auth";
import { emailEnabled, sendEmailDetailed } from "@/lib/email";

/** The sender's domain, from EMAIL_FROM ("Name <a@b.com>" or "a@b.com"). */
function senderDomain() {
  return /@([^>\s]+)>?\s*$/.exec(process.env.EMAIL_FROM ?? "")?.[1]?.toLowerCase() ?? null;
}

/** Send a test email to the reviewer's own address or an address on the sender's domain. */
export async function sendTestEmail(form: FormData) {
  const user = await requireReviewer();
  if (!emailEnabled()) redirect("/review/setup?test=off#test-email");
  const to = String(form.get("to") ?? "").trim().toLowerCase() || user.email.toLowerCase();
  const domain = senderDomain();
  const allowed = to === user.email.toLowerCase() || (!!domain && /^[^@\s]+@[^@\s]+$/.test(to) && to.endsWith(`@${domain}`));
  if (!allowed) redirect("/review/setup?test=notallowed#test-email");
  const r = await sendEmailDetailed({
    to,
    subject: "CivilPrep test email",
    text: "If you can read this, password reset and welcome emails will work.",
    html: "<p>If you can read this, password reset and welcome emails will work.</p>",
  });
  // 412: Postmark account pending approval, so it only delivers to the sender's own domain.
  const test = r.ok ? "sent" : r.code === 412 ? "pending" : "failed";
  redirect(`/review/setup?test=${test}#test-email`);
}
