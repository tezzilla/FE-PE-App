"use server";

import { redirect } from "next/navigation";
import { requireReviewer } from "@/lib/auth";
import { emailEnabled, sendEmailDetailed } from "@/lib/email";
import { db } from "@/lib/db";
import { templateReviewStatus } from "@/lib/reviews";
import { TEMPLATES } from "@/lib/templates";
import { verifyTemplate } from "@/lib/templates/verify";

/**
 * Approve every problem type that's still waiting for review and passes the independent answer check
 * (200 variants re-solved from the prompt text). Recorded as automated, so students see "CivilPrep's
 * independent answer check", never the reviewer's name. Earlier manual decisions (rejected, changes
 * requested, or already approved) are left alone.
 */
export async function approveVerified() {
  const user = await requireReviewer();
  const status = await templateReviewStatus();
  let approved = 0;
  const failed: string[] = [];
  for (const t of TEMPLATES) {
    if (status.get(t.id)?.status !== "needs_review") continue;
    const r = verifyTemplate(t, 200);
    if (!r.ok) {
      failed.push(t.id);
      continue;
    }
    await db.templateReview.create({
      data: {
        templateId: t.id,
        templateVersion: t.version,
        reviewerId: user.id,
        status: "approved",
        method: "automated",
        samples: JSON.stringify({ variants: r.variants, worstError: r.worstError, fallbackChoices: r.fallbackChoices }),
        notes: `Automated: ${r.variants} variants re-solved independently; largest difference ${(r.worstError * 100).toFixed(4)}%.`,
        decidedAt: new Date(),
      },
    });
    approved++;
  }
  redirect(`/review/setup?approved=${approved}&failed=${encodeURIComponent(failed.join(","))}#auto-approve`);
}

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
