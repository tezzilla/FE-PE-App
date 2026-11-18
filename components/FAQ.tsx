import { Icon } from "./Icon";

export function FAQ({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="faq card divide-y" style={{ borderColor: "var(--border)" }}>
      {items.map((it) => (
        <details key={it.q} className="p-4 sm:p-5" style={{ borderColor: "var(--border)" }}>
          <summary className="flex items-center justify-between gap-4 font-semibold">
            {it.q}
            <span className="faq-chevron muted transition-transform"><Icon name="chevron" size={18} /></span>
          </summary>
          <div className="muted mt-2 leading-relaxed">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
