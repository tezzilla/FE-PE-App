"use client";

import { useEffect, useRef, useState } from "react";

// Readiness over the last weeks: one series, so no legend (the heading names it). 2px line, end dot
// with a surface ring and a direct label, recessive hairline grid at 0/50/100%. Hover or keyboard
// focus shows a crosshair and tooltip; a table view carries the same numbers.

type Point = { date: string; score: number; answered: number };

const H = 150, PAD = { l: 34, r: 40, t: 12, b: 24 };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function ReadinessTrend({ points }: { points: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the container's real pixel width so text and marks keep their true size at any width.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (points.length < 2) return null;

  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (points.length - 1);
  const y = (s: number) => PAD.t + (1 - s) * (H - PAD.t - PAD.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const change = Math.round((last.score - points[0].score) * 100);

  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    setHover(best);
  };
  const h = hover !== null ? points[hover] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Readiness, last {points.length} weeks</p>
        <p className="muted text-xs">
          {change === 0 ? "No change" : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} points`} since {fmt(points[0].date)}
        </p>
      </div>
      <div className="relative" ref={box}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          className="block touch-none"
          role="img"
          aria-label={`Readiness went from ${Math.round(points[0].score * 100)}% to ${Math.round(last.score * 100)}% over ${points.length} weeks`}
          tabIndex={0}
          onMouseMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onMouseLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setHover((v) => Math.min(points.length - 1, (v ?? -1) + 1));
            if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? points.length) - 1));
            if (e.key === "Escape") setHover(null);
          }}
          onBlur={() => setHover(null)}
        >
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(g) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{g * 100}%</text>
            </g>
          ))}
          <text x={PAD.l} y={H - 6} fontSize={11} fill="var(--muted)">{fmt(points[0].date)}</text>
          <text x={W - PAD.r} y={H - 6} fontSize={11} fill="var(--muted)" textAnchor="end">This week</text>
          <path d={`${d} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="var(--chart-line)" opacity={0.1} />
          <path d={d} fill="none" stroke="var(--chart-line)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {h && hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="var(--muted)" strokeWidth={1} />
          )}
          {(hover !== null ? [hover] : []).concat(points.length - 1).map((i, k) => (
            <circle key={k} cx={x(i)} cy={y(points[i].score)} r={4} fill="var(--chart-line)" stroke="var(--card)" strokeWidth={2} />
          ))}
          <text x={x(points.length - 1) + 8} y={y(last.score) + 4} fontSize={12} fontWeight={700} fill="var(--fg)">
            {Math.round(last.score * 100)}%
          </text>
        </svg>
        {h && hover !== null && (
          <div
            className="absolute pointer-events-none card px-2.5 py-1.5 text-xs shadow"
            style={{ left: `${(x(hover) / W) * 100}%`, top: 0, transform: `translateX(${hover > points.length / 2 ? "-105%" : "5%"})` }}
          >
            <p className="font-semibold">{Math.round(h.score * 100)}% readiness</p>
            <p className="muted">Week ending {fmt(h.date)} · {h.answered} answers total</p>
          </div>
        )}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer muted">Show as table</summary>
        <table className="w-full mt-1">
          <thead><tr className="muted text-left"><th className="py-1">Week ending</th><th>Readiness</th><th>Answers so far</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="py-1">{fmt(p.date)}</td><td>{Math.round(p.score * 100)}%</td><td>{p.answered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
