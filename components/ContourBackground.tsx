// Decorative topographic contour lines behind the hero: a nod to site work and surveying. Pure SVG
// generated at build time (no canvas, no WebGL, no library). Still, by design: decoration that loops
// distracts and costs battery. Hidden from assistive tech.

type Pt = [number, number];

/** A closed, smooth contour around (cx, cy): a wobbly circle drawn as Catmull-Rom curves. */
function contour(cx: number, cy: number, r: number, k: number, seed: number): string {
  const N = 48;
  const pts: Pt[] = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const wobble =
      1 + 0.13 * Math.sin(3 * a + seed + k * 0.35) + 0.07 * Math.sin(5 * a + seed * 1.7) + 0.04 * Math.sin(8 * a + k * 0.8);
    return [cx + Math.cos(a) * r * wobble * 1.25, cy + Math.sin(a) * r * wobble];
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

const HILLS = [
  { cx: 900, cy: 210, levels: 11, step: 34, seed: 0.6 },
  { cx: 260, cy: 560, levels: 7, step: 30, seed: 2.1 },
];

const PATHS = HILLS.flatMap((h) =>
  Array.from({ length: h.levels }, (_, k) => ({ d: contour(h.cx, h.cy, 24 + k * h.step, k, h.seed), index: k % 5 === 4 })),
);

export default function ContourBackground() {
  return (
    <div className="contour-bg" aria-hidden>
      <svg viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice">
        {PATHS.map((p, i) => (
          // Every fifth line is an "index contour", drawn a little heavier, as on a real topo map.
          <path key={i} d={p.d} fill="none" stroke="currentColor" strokeWidth={p.index ? 1.6 : 0.9} />
        ))}
      </svg>
    </div>
  );
}
