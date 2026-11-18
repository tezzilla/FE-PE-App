"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

// Phone-only bottom navigation, so the main areas are one tap away like in a native app.
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const tabs = [
    { href: signedIn ? "/dashboard" : "/", label: "Home", icon: <Icon name="home" size={20} /> },
    { href: "/exams/fe-civil", label: "FE Civil", icon: <Badge text="FE" /> },
    { href: "/exams/pe-civil", label: "PE Civil", icon: <Badge text="PE" /> },
    { href: "/learn", label: "Formulas", icon: <Icon name="book" size={20} /> },
    { href: signedIn ? "/account" : "/login", label: signedIn ? "Account" : "Log in", icon: <Icon name="user" size={20} /> },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t grid grid-cols-5 exam-tabbar"
      style={{ background: "var(--card)", borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path === t.href || path.startsWith(t.href + "/");
        return (
          <Link
            key={t.label}
            href={t.href}
            className="flex flex-col items-center justify-center gap-0.5 h-14 text-[11px]"
            style={{ color: active ? "var(--brand-text)" : "var(--muted)", fontWeight: active ? 600 : 400 }}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden className="h-5 flex items-center">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="text-[10px] font-bold leading-none border-2 rounded px-1 py-0.5" style={{ borderColor: "currentColor" }}>{text}</span>;
}
