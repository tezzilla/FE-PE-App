import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ContactLine } from "@/components/ContactLine";
import { SOLD_PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Terms of Service · CivilPrep" };

export default function Terms() {
  return (
    <article className="legal">
      <h1>Terms of Service</h1>
      <p className="muted">Last updated {LEGAL_UPDATED}</p>

      <p>
        These terms cover your use of the CivilPrep website and mobile app (together, &quot;CivilPrep&quot;).
        By creating an account or using CivilPrep you agree to them. If you don&apos;t agree, don&apos;t use CivilPrep.
      </p>

      <h2>What CivilPrep is</h2>
      <p>
        CivilPrep is study material for the FE Civil and PE Civil exams: practice problems, worked solutions,
        timed mock exams, and progress tracking. CivilPrep is not affiliated with, endorsed by, or connected to
        NCEES or any state licensing board. FE and PE are exams administered by NCEES.
      </p>

      <h2>No guarantee of results</h2>
      <p>
        CivilPrep is a study aid. We don&apos;t guarantee that you will pass any exam. Readiness scores and
        other estimates measure your progress on our material and are not predictions of exam results.
        Practice problems are reviewed for accuracy, but errors can happen. Always rely on official NCEES
        materials and reference handbooks for exam rules and content.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must give a valid email address and keep your password private.</li>
        <li>Accounts are for one person. Don&apos;t share your login or resell access.</li>
        <li>You are responsible for activity on your account.</li>
        <li>We may suspend or close accounts that break these terms or misuse the service.</li>
      </ul>

      <h2>Subscriptions and billing</h2>
      <ul>
        <li>
          Monthly plans ({SOLD_PLANS.filter((p) => p.kind === "subscription").map((p) => `${p.name}, $${p.price}/month`).join("; ")})
          are billed monthly in advance and <strong>renew automatically</strong> each month until you cancel.
        </li>
        <li>
          Passes ({SOLD_PLANS.filter((p) => p.kind === "pass").map((p) => `${p.name}, $${p.price} for ${p.days} days`).join("; ")})
          are a single payment for a fixed period and <strong>do not renew</strong>. A pass bought while another is
          active adds its days after the current one ends. PE Civil plans include FE Civil content.
        </li>
        <li>
          Promotional prices, such as founding-member pricing, last as long as the subscription they were applied
          to stays active, unless the offer says otherwise.
        </li>
        <li>Payments are processed by Stripe. We never see or store your full card number.</li>
        <li>
          You can cancel anytime from your dashboard (&quot;Manage billing&quot;). Cancellation stops future
          charges; you keep access until the end of the period you already paid for.
        </li>
        <li>
          Except where the law requires otherwise, payments are not refundable for partial months or unused pass time. If you think
          you were charged in error, contact us and we&apos;ll look into it.
        </li>
        <li>We may change prices. We&apos;ll tell you before a change applies to your subscription, and you can cancel before it does.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Don&apos;t:</p>
      <ul>
        <li>copy, scrape, or redistribute CivilPrep questions, solutions, or problem generators;</li>
        <li>try to access other people&apos;s accounts or data, or get around paid-plan limits;</li>
        <li>interfere with or overload the service, or reverse engineer it beyond what the law allows;</li>
        <li>post or submit content that infringes someone else&apos;s rights, including NCEES exam content.</li>
      </ul>

      <h2>Content ownership</h2>
      <p>
        CivilPrep&apos;s questions, solutions, software, and design belong to CivilPrep or its licensors. Your
        subscription gives you a personal, non-transferable right to use them for your own exam preparation
        while your account is in good standing. Your answer history belongs to you; see the{" "}
        <Link href="/privacy">Privacy Policy</Link> for how we use it.
      </p>

      <h2>Disclaimers and limits of liability</h2>
      <p>
        CivilPrep is provided &quot;as is&quot; without warranties of any kind, to the extent the law allows.
        Content is for exam study only and is not professional engineering advice. To the extent the law
        allows, our total liability for any claim related to CivilPrep is limited to the amount you paid us in
        the 12 months before the claim, and we are not liable for indirect or consequential losses.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. If a change is significant, we&apos;ll notify you by email or in the app
        before it takes effect. Continuing to use CivilPrep after that means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: <ContactLine />.</p>
    </article>
  );
}
