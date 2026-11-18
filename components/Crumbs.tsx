import Link from "next/link";

// Breadcrumb trail. The last item is the current page and is not a link.
export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm muted">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-x-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="hover:underline">{c.label}</Link>
            ) : (
              <span aria-current="page" style={{ color: "var(--fg)" }}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
