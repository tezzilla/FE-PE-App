import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./actions/auth";

export const metadata: Metadata = {
  title: "CivilPrep: FE & PE Civil exam prep",
  description: "Affordable monthly FE and PE Civil exam prep. Practice questions, mock exams, progress tracking.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b" style={{ borderColor: "var(--border)" }}>
          <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-5">
            <Link href="/" className="font-bold text-lg">
              Civil<span style={{ color: "var(--brand)" }}>Prep</span>
            </Link>
            <Link href="/exams/fe-civil" className="muted hover:underline hidden sm:inline">FE Civil</Link>
            <Link href="/exams/pe-civil" className="muted hover:underline hidden sm:inline">PE Civil</Link>
            <Link href="/pricing" className="muted hover:underline">Pricing</Link>
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                  <form action={logout}>
                    <button className="muted hover:underline">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">Log in</Link>
                  <Link href="/signup" className="btn !py-1.5">Start free</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
        <footer className="muted text-sm text-center py-6">
          CivilPrep is not affiliated with or endorsed by NCEES. FE and PE are exams administered by NCEES.
        </footer>
      </body>
    </html>
  );
}
