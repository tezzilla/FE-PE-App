import "server-only";

// Transactional email through Postmark (https://postmarkapp.com/developer/user-guide/send-email-with-api).
// Needs POSTMARK_SERVER_TOKEN and EMAIL_FROM (a sender signature or verified domain in Postmark).
// Without a token, development logs the email instead of sending; production refuses silently-failing
// sends by logging an error.

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function emailEnabled() {
  return !!process.env.POSTMARK_SERVER_TOKEN && !!process.env.EMAIL_FROM;
}

/** Send one email. Never throws: email problems must not break sign-up or password reset. */
export async function sendEmail(email: Email): Promise<boolean> {
  return (await sendEmailDetailed(email)).ok;
}

/** Same as sendEmail, but also returns Postmark's error code and message (for the setup page). */
export async function sendEmailDetailed(email: Email): Promise<{ ok: boolean; code?: number; message?: string }> {
  if (!emailEnabled()) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Email not sent (POSTMARK_SERVER_TOKEN/EMAIL_FROM missing): "${email.subject}"`);
    } else {
      console.log(`[dev email] to=${email.to} subject="${email.subject}"\n${email.text}`);
    }
    return { ok: false, message: "Email isn't configured." };
  }
  try {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN!,
      },
      body: JSON.stringify({
        From: process.env.EMAIL_FROM,
        To: email.to,
        Subject: email.subject,
        TextBody: email.text,
        HtmlBody: email.html,
        MessageStream: "outbound",
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`Postmark error ${res.status}: ${body.ErrorCode ?? ""} ${body.Message ?? ""}`);
      return { ok: false, code: body.ErrorCode, message: body.Message };
    }
    return { ok: true };
  } catch (e) {
    console.error("Postmark request failed", e);
    return { ok: false, message: "Couldn't reach Postmark." };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal branded layout. Inline styles because email clients ignore stylesheets. */
function layout(title: string, paragraphs: string[], button?: { label: string; url: string }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-size:20px;font-weight:700;margin:0 0 24px">Civil<span style="color:#ea580c">Prep</span></p>
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
${paragraphs.map((p) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px">${esc(p)}</p>`).join("\n")}
${button ? `<p style="margin:24px 0"><a href="${esc(button.url)}" style="background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${esc(button.label)}</a></p><p style="font-size:13px;color:#64748b;word-break:break-all">Or paste this link into your browser: ${esc(button.url)}</p>` : ""}
<p style="font-size:12px;color:#64748b;margin-top:32px">CivilPrep is not affiliated with NCEES.</p>
</div></body></html>`;
  const text = [title, "", ...paragraphs, ...(button ? ["", `${button.label}: ${button.url}`] : [])].join("\n");
  return { html, text };
}

const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function resetEmail(to: string, token: string): Email {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Reset your CivilPrep password",
    ...layout(
      "Reset your password",
      ["Someone (hopefully you) asked to reset the password for this CivilPrep account.", "The link works once and expires in 1 hour. If you didn't ask for this, ignore this email; your password won't change."],
      { label: "Choose a new password", url },
    ),
  };
}

export function passwordChangedEmail(to: string): Email {
  return {
    to,
    subject: "Your CivilPrep password was changed",
    ...layout("Your password was changed", [
      "The password for this CivilPrep account was just changed, and you've been signed out on your other devices.",
      "If this wasn't you, reset your password right away from the login page and contact us.",
    ], { label: "Go to CivilPrep", url: `${appUrl()}/login` }),
  };
}

const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export function passEndingEmail(to: string, examName: string, until: Date, extendPrice: number): Email {
  return {
    to,
    subject: `Your ${examName} access ends ${longDate(until)}`,
    ...layout(`Your ${examName} pass ends soon`, [
      `Your ${examName} access ends on ${longDate(until)}.`,
      `If your exam is later than that, you can add 30 more days for $${extendPrice}. Your progress, readiness score and study plan stay exactly where they are.`,
      "If you've already taken your exam: good luck, and we'd love to hear how it went.",
    ], { label: "Extend 30 days", url: `${appUrl()}/dashboard#extend` }),
  };
}

export function sampleSetEmail(to: string, examName: string, url: string): Email {
  return {
    to,
    subject: `Your free ${examName} practice problems`,
    ...layout(`Your free ${examName} problem set`, [
      "Here's your set of exam-style practice problems with worked solutions. Open it in your browser, or save it as a PDF to work offline.",
      "Tip: work them with the NCEES reference handbook open, the same way you will on exam day.",
    ], { label: "Open the problem set", url }),
  };
}

export function giftReceivedEmail(to: string, planName: string, code: string, from: string, message: string | null): Email {
  return {
    to,
    subject: `You've been given ${planName} on CivilPrep`,
    ...layout(`A gift for your exam prep`, [
      `${from} gave you a ${planName} on CivilPrep: practice problems with worked solutions, smart practice that targets your weak topics, and full-length timed exams.`,
      ...(message ? [`Their message: "${message}"`] : []),
      `Your gift code is ${code}. Create a free account (or log in), then redeem the code. Your access starts when you redeem it, so you can save it until you start studying.`,
    ], { label: "Redeem your gift", url: `${appUrl()}/redeem?code=${encodeURIComponent(code)}` }),
  };
}

export function giftPurchasedEmail(to: string, planName: string, code: string, recipient: string): Email {
  return {
    to,
    subject: `Your CivilPrep gift is on its way`,
    ...layout("Thanks for your gift", [
      `We've emailed ${recipient} their ${planName} with redemption instructions.`,
      `Keep this code in case they need it: ${code}. It can be redeemed once, on any CivilPrep account, and access starts when it's redeemed.`,
      "Your receipt comes separately from Stripe.",
    ]),
  };
}

export function welcomeEmail(to: string): Email {
  return {
    to,
    subject: "Welcome to CivilPrep",
    ...layout("Welcome to CivilPrep", [
      "Your account is ready. Start with the diagnostic to see where you stand, then let smart practice target your weak topics.",
      "Set your exam date in your study plan and we'll pace your weeks for you.",
    ], { label: "Open your dashboard", url: `${appUrl()}/dashboard` }),
  };
}
