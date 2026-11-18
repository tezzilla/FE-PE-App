import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser, isReviewer } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/access";
import { HeaderLinks } from "@/components/HeaderLinks";
import { logout } from "./actions/auth";
import { MobileTabBar } from "@/components/MobileTabBar";

export const metadata: Metadata = {
  title: "CivilPrep: FE & PE Civil exam prep",
  description: "FE and PE Civil exam prep that adapts to your weak spots: practice problems with worked solutions, full-length timed exams, formula flashcards and a study plan. From $29/month.",
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
        <header
          className="border-b sticky top-0 z-30 backdrop-blur"
          style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}
        >
          <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-4 lg:gap-5">
            <Link href="/" className="font-bold text-lg">
              Civil<span style={{ color: "var(--brand-text)" }}>Prep</span>
            </Link>
            <HeaderLinks
              className="hidden md:inline whitespace-nowrap"
              links={[
                ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
                { href: "/exams/fe-civil", label: "FE Civil" },
                { href: "/exams/pe-civil", label: "PE Civil" },
                { href: "/learn", label: "Formula guides" },
                ...(hasPaidAccess(user) ? [] : [{ href: "/pricing", label: "Pricing" }]),
              ]}
            />
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <>
                  {isReviewer(user) && <HeaderLinks links={[{ href: "/review", label: "Review" }]} />}
                  <HeaderLinks className="hidden md:inline whitespace-nowrap" links={[{ href: "/account", label: "Account" }]} />
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
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 pb-24 md:pb-8">{children}</main>
        <MobileTabBar signedIn={!!user} />
        <footer className="muted text-sm text-center px-4 pt-2 pb-24 md:py-6">
          <p>CivilPrep is not affiliated with or endorsed by NCEES. FE and PE are exams administered by NCEES.</p>
          <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/learn" className="hover:underline">Formula guides</Link>
            <Link href="/free/fe-civil" className="hover:underline">Free FE problems</Link>
            <Link href="/free/pe-civil" className="hover:underline">Free PE problems</Link>
            <Link href="/compare" className="hover:underline">Compare</Link>
            <Link href="/gift" className="hover:underline">Gift a pass</Link>
            <Link href="/redeem" className="hover:underline">Redeem a gift</Link>
          </p>
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
