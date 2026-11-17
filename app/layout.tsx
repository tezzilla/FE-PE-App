import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser, isReviewer } from "@/lib/auth";
import { logout } from "./actions/auth";
import { MobileTabBar } from "@/components/MobileTabBar";

export const metadata: Metadata = {
  title: "CivilPrep: FE & PE Civil exam prep",
  description: "Affordable monthly FE and PE Civil exam prep. Practice questions, mock exams, progress tracking.",
  appleWebApp: { capable: true, title: "CivilPrep", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
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
            <Link href="/pricing" className="muted hover:underline hidden sm:inline">Pricing</Link>
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <>
                  {isReviewer(user) && <Link href="/review" className="hover:underline">Review</Link>}
                  <Link href="/dashboard" className="hover:underline hidden sm:inline">Dashboard</Link>
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
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 pb-24 sm:pb-8">{children}</main>
        <MobileTabBar signedIn={!!user} />
        <footer className="muted text-sm text-center px-4 pt-2 pb-24 sm:py-6">
          <p>CivilPrep is not affiliated with or endorsed by NCEES. FE and PE are exams administered by NCEES.</p>
          <p className="mt-2">
            <Link href="/terms" className="hover:underline">Terms</Link>
            {" · "}
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
