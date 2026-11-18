"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Desktop header links with a visible "you are here" state.
export function HeaderLinks({ links, className = "" }: { links: { href: string; label: string }[]; className?: string }) {
  const path = usePathname();
  return (
    <>
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`hover:underline ${className}`}
            style={{ color: active ? "var(--fg)" : "var(--muted)", fontWeight: active ? 600 : undefined }}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
