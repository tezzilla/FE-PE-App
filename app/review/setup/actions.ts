"use server";

import { redirect } from "next/navigation";
import { requireReviewer } from "@/lib/auth";
import { emailEnabled, sendEmail } from "@/lib/email";

/** Send a test email to the signed-in reviewer's own address. */
export async function sendTestEmail() {
  const user = await requireReviewer();
  if (!emailEnabled()) redirect("/review/setup?test=off");
  const ok = await sendEmail({
    to: user.email,
    subject: "CivilPrep test email",
    text: "If you can read this, password reset and welcome emails will work.",
    html: "<p>If you can read this, password reset and welcome emails will work.</p>",
  });
  redirect(`/review/setup?test=${ok ? "sent" : "failed"}`);
}
