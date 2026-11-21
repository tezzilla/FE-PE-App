"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when a page fails to render. Keeps the site's header and footer, never a raw error.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="max-w-md mx-auto text-center space-y-4 py-12">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="muted">
        This page hit a problem. Your progress is saved. Try again, or head back to your dashboard.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn" onClick={reset}>Try again</button>
        <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
      </div>
      {error.digest && <p className="muted text-xs">Reference: {error.digest}</p>}
    </div>
  );
}
