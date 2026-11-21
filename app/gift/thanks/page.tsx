import Link from "next/link";

export default function GiftThanks() {
  return (
    <div className="card elevated p-8 max-w-lg mx-auto text-center space-y-3">
      <h1 className="text-2xl font-semibold">Thank you, your gift is on its way</h1>
      <p className="muted">
        We&apos;re emailing the recipient their gift code now, and you&apos;ll get a copy plus your receipt. If it doesn&apos;t
        arrive within a few minutes, ask them to check their spam folder.
      </p>
      <Link href="/" className="btn">Back to CivilPrep</Link>
    </div>
  );
}
