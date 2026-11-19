import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center space-y-4 py-12">
      <p className="eyebrow">404</p>
      <h1 className="text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="muted">The link may be old or mistyped. These are good places to pick up:</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/exams/fe-civil" className="btn-ghost">FE Civil</Link>
        <Link href="/exams/pe-civil" className="btn-ghost">PE Civil</Link>
        <Link href="/learn" className="btn-ghost">Formula guides</Link>
        <Link href="/" className="btn">Home</Link>
      </div>
    </div>
  );
}
