import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ContactLine } from "@/components/ContactLine";
import { SOLD_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Cancellations and refunds · CivilPrep",
  description: "How to cancel a CivilPrep subscription, what happens to your access, and when payments can be refunded.",
  alternates: { canonical: "/refunds" },
};

// Plain-language summary of the billing terms in /terms. It restates them; the Terms of Service govern.
export default function Refunds() {
  const monthly = SOLD_PLANS.filter((p) => p.kind === "subscription");
  const passes = SOLD_PLANS.filter((p) => p.kind === "pass" && !p.extension);
  return (
    <article className="legal">
      <h1>Cancellations and refunds</h1>
      <p className="muted">Last updated {LEGAL_UPDATED}</p>
      <p>
        The short version: you can cancel a monthly plan anytime and keep access until the end of the month you paid
        for, passes never renew, and if something went wrong with a charge, contact us and we&apos;ll make it right.
      </p>

      <h2>Monthly plans</h2>
      <ul>
        <li>{monthly.map((p) => `${p.name} ($${p.price}/month)`).join(" and ")} renew automatically each month until you cancel.</li>
        <li>
          Cancel anytime: open your <Link href="/dashboard">dashboard</Link> and choose <strong>Manage billing</strong>. No
          email or phone call needed.
        </li>
        <li>Canceling stops future charges. You keep full access until the end of the month you already paid for.</li>
        <li>Founding-member pricing lasts as long as that subscription stays active. If you cancel and come back later, the regular price applies.</li>
      </ul>

      <h2>Passes</h2>
      <ul>
        <li>
          {passes.map((p) => `${p.name} ($${p.price} for ${p.days} days)`).join(" and ")} are a single payment and{" "}
          <strong>never renew</strong>, so there is nothing to cancel.
        </li>
        <li>Buying a pass while another is active adds its days after the current one ends.</li>
      </ul>

      <h2>Refunds</h2>
      <ul>
        <li>
          Except where the law requires otherwise, payments aren&apos;t refundable for partial months or unused pass time.
        </li>
        <li>
          If you were charged in error, charged twice, or paid and didn&apos;t get access, contact us at <ContactLine /> with
          the email on your account and we&apos;ll look into it.
        </li>
        <li>Approved refunds go back to the original payment method through Stripe. Banks usually take 5 to 10 business days to show them.</li>
        <li>A fully refunded pass stops giving access, and a refunded gift code that hasn&apos;t been redeemed stops working.</li>
      </ul>

      <h2>Gifts</h2>
      <ul>
        <li>Gift passes follow the same rules as passes. The person who bought the gift can contact us about a charge.</li>
      </ul>

      <p className="muted">
        This page summarizes the billing section of our <Link href="/terms">Terms of Service</Link>, which govern if the two
        ever differ.
      </p>
    </article>
  );
}
