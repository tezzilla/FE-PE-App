"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Tabs shown on every page of an exam, so each study tool is one tap away from anywhere in that exam.
// Hidden while a timed exam is running (see .exam-nav in globals.css).

export function ExamNav({ exam, name }: { exam: string; name: string }) {
  const path = usePathname();
  const base = `/exams/${exam}`;
  const tabs = [
    { href: base, label: "Overview", match: (p: string) => p === base || p.startsWith(`${base}/topics`) || p.startsWith(`${base}/modules`) },
    { href: `${base}/smart`, label: "Smart practice" },
    { href: `${base}/practice`, label: "Practice" },
    { href: `${base}/quiz`, label: "Custom quiz" },
    { href: `${base}/mock`, label: "Full exam" },
    { href: `${base}/flashcards`, label: "Flashcards" },
    { href: `${base}/handbook-drill`, label: "Handbook hunt" },
    { href: `${base}/resources`, label: "Documents" },
  ];
  const isActive = (t: (typeof tabs)[number]) => (t.match ? t.match(path) : path.startsWith(t.href));
  const row = useRef<HTMLDivElement>(null);

  // On phones the row scrolls sideways; keep the current tab in view.
  useEffect(() => {
    row.current?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [path]);

  return (
    <nav aria-label={`${name} sections`} className="exam-nav -mx-4 px-4 -mt-2 sm:-mt-4 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
      <div ref={row} className="flex gap-1 overflow-x-auto no-scrollbar">
        <span className="font-semibold text-sm self-center pr-2 mr-1 border-r whitespace-nowrap hidden sm:inline" style={{ borderColor: "var(--border)" }}>
          {name}
        </span>
        {tabs.map((t) => {
          const active = isActive(t);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className="whitespace-nowrap text-sm px-3 py-2.5 border-b-2 -mb-px hover:text-[var(--fg)]"
              style={{ borderColor: active ? "var(--brand)" : "transparent", color: active ? "var(--fg)" : "var(--muted)", fontWeight: active ? 600 : 400 }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
