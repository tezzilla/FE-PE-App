"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Phone-only bottom navigation, so the exams are one tap away like in a native app.
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const tabs = [
    { href: signedIn ? "/dashboard" : "/", label: "Home", icon: "⌂" },
    { href: "/exams/fe-civil", label: "FE Civil", icon: "◧" },
    { href: "/exams/pe-civil", label: "PE Civil", icon: "◨" },
    { href: signedIn ? "/pricing" : "/login", label: signedIn ? "Plans" : "Log in", icon: "☰" },
  ];
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t grid grid-cols-4"
      style={{ background: "var(--card)", borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.label}
            href={t.href}
            className="flex flex-col items-center justify-center h-14 text-xs"
            style={{ color: active ? "var(--brand)" : "var(--muted)", fontWeight: active ? 600 : 400 }}
            aria-current={active ? "page" : undefined}
          >
            <span className="text-lg leading-none" aria-hidden>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
