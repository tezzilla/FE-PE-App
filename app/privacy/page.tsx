import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ContactLine } from "@/components/ContactLine";

export const metadata: Metadata = { title: "Privacy Policy · CivilPrep" };

export default function Privacy() {
  return (
    <article className="legal">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated {LEGAL_UPDATED}</p>

      <p>
        This policy explains what CivilPrep collects through its website and mobile app, why, and the choices
        you have. Plain version: we collect what we need to run your account and tailor your practice. We
        don&apos;t sell your data or show ads.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address, an optional display name, and your password, stored only as a one-way hash we can&apos;t reverse.</li>
        <li><strong>Study activity:</strong> which questions you answer, your choices, whether they were correct, mock exam scores, and when. If you&apos;re a PE candidate you may also choose your PE module.</li>
        <li><strong>Subscription status:</strong> your plan, its status, and renewal date, plus the customer and subscription IDs Stripe gives us. Stripe collects and stores your payment details; we never receive your full card number.</li>
        <li><strong>Security data:</strong> your IP address and recent failed sign-in attempts, kept briefly to block password guessing.</li>
        <li><strong>Hosting logs:</strong> our hosting provider records standard request logs (such as IP address and browser type) to run and protect the service.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>to run your account and keep you signed in;</li>
        <li>to adapt practice to you: your answer history drives smart practice, review scheduling, and readiness scores;</li>
        <li>to manage subscriptions and billing through Stripe;</li>
        <li>to secure the service and prevent abuse;</li>
        <li>to improve our questions, for example by finding problems many people get wrong.</li>
      </ul>

      <h2>Cookies and storage</h2>
      <p>
        The website sets one cookie, a sign-in session cookie that keeps you logged in. We don&apos;t use
        advertising or third-party tracking cookies. The mobile app stores its sign-in token in your device&apos;s
        secure storage (iOS Keychain or Android Keystore).
      </p>

      <h2>Who we share it with</h2>
      <p>We share data only with service providers that run CivilPrep for us, under their own privacy commitments:</p>
      <ul>
        <li><strong>Stripe</strong> for payments;</li>
        <li><strong>our hosting and database providers</strong> (currently Vercel and Neon) to store and serve the app.</li>
      </ul>
      <p>
        If you review problems as a reviewer, the display name and credential you choose are shown to students
        next to problems you approved. Your email is never shown. We may disclose information if the law
        requires it. We don&apos;t sell or rent personal information.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and study history while your account exists. Security records of sign-in attempts
        are deleted within about a day. If you ask us to delete your account, we delete your account and study
        history, except records we must keep for legal, tax, or fraud-prevention reasons (such as payment records
        held by Stripe). Deleting your account cancels any subscription immediately.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>
          On the <Link href="/account">Account</Link> page (or in the app) you can download a copy of your data, change your
          details, and delete your account yourself. You can also contact us for any of these.
        </li>
        <li>You can cancel a subscription anytime from your dashboard.</li>
        <li>Depending on where you live (for example, California or the EU), you may have additional rights. We&apos;ll honor them when they apply.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Passwords are hashed, connections use HTTPS, sign-in attempts are rate-limited, and payment data stays
        with Stripe. No system is perfectly secure, but we work to protect your information.
      </p>

      <h2>Children</h2>
      <p>CivilPrep is for adults preparing for professional exams and is not directed at children under 16.</p>

      <h2>Changes</h2>
      <p>We&apos;ll post updates here and change the date above. Significant changes will be announced by email or in the app.</p>

      <h2>Contact</h2>
      <p>Privacy questions or requests: <ContactLine />. See also our <Link href="/terms">Terms of Service</Link>.</p>
    </article>
  );
}
