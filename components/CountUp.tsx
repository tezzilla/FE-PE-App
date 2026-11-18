"use client";

import { useEffect, useRef, useState } from "react";

// Counts a whole number up from zero the first time it scrolls into view. Values that aren't plain
// integers ("110 + 80", "24/7") render as-is. The server renders the final value, so it's correct
// without JavaScript, and people who prefer reduced motion see the final value with no animation.
export default function CountUp({ value, durationMs = 1200 }: { value: string; durationMs?: number }) {
  const target = /^\d[\d,]*$/.test(value) ? Number(value.replace(/,/g, "")) : null;
  const [shown, setShown] = useState<number | null>(target);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (target === null || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    setShown(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - (1 - t) ** 3; // ease-out cubic
          setShown(Math.round(eased * target));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden>{target === null ? value : (shown ?? target).toLocaleString("en-US")}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
