// Independent answer check for problem templates: re-solves generated problems from the numbers in the
// prompt text, with formulas written here from scratch (not imported from the templates), and compares the
// result with the answer the template marks correct. Used by `npm run test:answers` and by the reviewer
// "approve all verified" action. A new template needs a solver below, or it can't be auto-approved.
import { buildVariant, type Template } from "./engine";

const nums = (s: string) => (s.match(/-?\d[\d,]*\.?\d*/g) ?? []).map((x) => Number(x.replace(/,/g, "")));
const rad = (d: number) => (d * Math.PI) / 180;
const g = 9.81, gw = 9.81;

// Each solver gets the prompt and returns the expected answer.
export const SOLVERS: Record<string, (p: string) => number> = {
  "rational-method": (p) => { const [A, C, i] = nums(p); return C * i * A; },
  "manning-rect-si": (p) => { const [b, y, nn, S0] = nums(p); const A = b * y, R = A / (b + 2 * y); return (A * R ** (2 / 3) * Math.sqrt(S0)) / nn; },
  "continuity-pipe": (p) => { const [V1, D1, D2] = nums(p); return V1 * (D1 / D2) ** 2; },
  "hydrostatic-pressure": (p) => { const [sg, h] = nums(p); return sg * gw * h; },
  "detention-time": (p) => { const [V, Q] = nums(p); return (V / Q) * 24; },
  "bod-exertion": (p) => { const [L0, k, t] = nums(p); return L0 * (1 - Math.exp(-k * t)); },
  "bod-dilution": (p) => { const [Vs, , D1, , D2] = nums(p); return (D1 - D2) / (Vs / 300); },
  "darcy-weisbach-si": (p) => { const [V, L, D, f] = nums(p); return f * (L / D) * (V * V) / (2 * g); },
  "nrcs-curve-number": (p) => { const [CN, P] = nums(p); const s = 1000 / CN - 10; return (P - 0.2 * s) ** 2 / (P + 0.8 * s); },
  "clarifier-overflow-rate": (p) => { const [D, Q] = nums(p); return Q / ((Math.PI * D * D) / 4); },
  "critical-depth-rect": (p) => { const [b, Q] = nums(p); return ((Q / b) ** 2 / g) ** (1 / 3); },
  "froude-number-rect": (p) => { const [b, Q, y] = nums(p); return Q / (b * y) / Math.sqrt(g * y); },
  "beam-point-load-reaction": (p) => { const [L, P, a] = nums(p); return (P * (L - a)) / L; },
  "axial-deformation": (p) => { const [L, E, A, P] = nums(p); return (P * 1000 * L * 1000) / (A * E * 1000); },
  "udl-max-moment": (p) => { const [L, w] = nums(p); return (w * L * L) / 8; },
  "rect-bending-stress": (p) => { const [b, h, M] = nums(p); return (M * 1e6) / ((b * h * h) / 6); },
  "euler-buckling": (p) => {
    const [E, L] = nums(p); const I = nums(p.split("inertia is")[1])[0] * 1e6;
    const K = p.includes("pinned at both") ? 1 : p.includes("free at the top") ? 2 : p.includes("pinned at the top") ? 0.7 : 0.5;
    return (Math.PI ** 2 * E * 1000 * I) / (K * L * 1000) ** 2 / 1000;
  },
  "effective-stress": (p) => { const [dw, gm, gs, z] = nums(p); return gm * dw + gs * (z - dw) - gw * (z - dw); },
  "rankine-active-thrust": (p) => { const [H, gm, phi] = nums(p); return 0.5 * Math.tan(rad(45 - phi / 2)) ** 2 * gm * H * H; },
  "nc-clay-settlement": (p) => { const [H, Cc, e0, s0, ds] = nums(p.replace("e₀", "e")); return ((Cc * H) / (1 + e0)) * Math.log10((s0 + ds) / s0) * 1000; },
  "dry-unit-weight": (p) => { const [Gs, e] = nums(p); return (Gs * gw) / (1 + e); },
  "stopping-sight-distance": (p) => {
    const [V, ...rest] = nums(p); const t = nums(p.split("time of")[1])[0];
    const G = p.includes("level road") ? 0 : (rest[0] / 100) * (p.includes("upgrade") ? 1 : -1);
    return 1.47 * V * t + (V * V) / (30 * (11.2 / 32.2 + G));
  },
  "flow-density-speed": (p) => { const [lanes, k, v] = nums(p); return lanes * k * v; },
  "horizontal-curve-length": (p) => { const [R, D] = nums(p); return R * rad(D); },
  "webster-cycle-length": (p) => { const [L, Y] = nums(p); return (1.5 * L + 5) / (1 - Y); },
  "rc-beam-design-moment": (p) => {
    const [b, d, As] = nums(p); const fcK = nums(p.split("f'c =")[1])[0] / 1000; const a = (As * 60) / (0.85 * fcK * b);
    const beta1 = fcK <= 4 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * (fcK - 4)); const c = a / beta1;
    const et = (0.003 * (d - c)) / c; const ety = 60 / 29000;
    const phi = et >= ety + 0.003 ? 0.9 : et <= ety ? 0.65 : 0.65 + (0.25 * (et - ety)) / 0.003; // ACI 318-19 Table 21.2.2
    return (phi * As * 60 * (d - a / 2)) / 12;
  },
  "steel-required-z": (p) => { const [Fy, Mu] = nums(p); return (Mu * 12) / (0.9 * Fy); },
  "fixed-end-moment": (p) => { const [L, x] = nums(p); return p.includes("uniform") ? (x * L * L) / 12 : (x * L) / 8; },
  "present-worth-annuity": (p) => { const [A, N, ip] = nums(p); const i = ip / 100; return (A * ((1 + i) ** N - 1)) / (i * (1 + i) ** N); },
  "future-worth-single": (p) => { const [P, ip, N] = nums(p); return P * (1 + ip / 100) ** N; },
  "straight-line-book-value": (p) => { const [C, N, S0, k] = nums(p); return C - k * ((C - S0) / N); },
  "sample-std-dev": (p) => { const xs = nums(p.split("were")[1]); const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)); },
  "linear-interpolation": (p) => { const [y1, x1, y2, x2, x] = nums(p); return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1); },
  "projectile-range": (p) => { const [v, th] = nums(p); return (v * v * Math.sin(rad(2 * th))) / g; },
  "braking-distance": (p) => { const [, kmh, mu] = nums(p); const v = kmh / 3.6; return (v * v) / (2 * mu * g); },
  "thermal-expansion": (p) => { const [L, a, , dT] = nums(p); return a * 1e-6 * L * dT * 1000; },
  "concrete-wc-ratio": (p) => { const [bags, , gal] = nums(p); return (gal * 8.34) / (bags * 94); },
  "earthwork-truck-loads": (p) => { const [B, sw, C] = nums(p); return Math.ceil((B * (1 + sw / 100)) / C - 1e-9); },
  "earned-value-index": (p) => { const [PV, EV, AC] = nums(p); return p.includes("(CPI)") ? EV / AC : EV / PV; },
  "differential-leveling": (p) => { const [BM, bs1, fs1, bs2, fs2] = nums(p); return BM + bs1 - fs1 + bs2 - fs2; },
  "traverse-departure": (p) => { const [th, L] = nums(p); return p.includes("departure") ? L * Math.sin(rad(th)) : L * Math.cos(rad(th)); },
  "resultant-two-forces": (p) => { const [F1, F2, th] = nums(p); return Math.sqrt(F1 * F1 + F2 * F2 + 2 * F1 * F2 * Math.cos(rad(th))); },
  "tr55-sheet-flow": (p) => { const [L, nn, s, , , P2] = nums(p); return ((0.007 * (nn * L) ** 0.8) / (Math.sqrt(P2) * s ** 0.4)) * 60; },
  "tr55-shallow-flow": (p) => { const [L, s] = nums(p); const k = p.includes("unpaved") ? 16.1345 : 20.3282; return L / (60 * k * Math.sqrt(s)); },
  "hec22-gutter-flow": (p) => { const [Sx, SL, nn, , , T] = nums(p); return (0.56 / nn) * Sx ** (5 / 3) * Math.sqrt(SL) * T ** (8 / 3); },
};


export interface VerifyResult {
  ok: boolean;
  /** Largest relative difference between the marked answer and the independent solution. */
  worstError: number;
  variants: number;
  duplicateChoices: number;
  fallbackChoices: number;
  worstPrompt: string;
  reason?: string;
}

/** Re-solve `n` variants of a template. Passes when every marked answer is within 0.1% and choices are distinct. */
export function verifyTemplate(t: Template, n = 200): VerifyResult {
  const solve = SOLVERS[t.id];
  if (!solve) return { ok: false, worstError: NaN, variants: 0, duplicateChoices: 0, fallbackChoices: 0, worstPrompt: "", reason: "no independent solver for this template" };
  let worst = 0, dupes = 0, fallback = 0, worstPrompt = "";
  for (let k = 1; k <= n; k++) {
    const v = buildVariant(t, k * 7919);
    const expected = solve(v.prompt);
    const err = Math.abs(v.answerValue - expected) / Math.abs(expected);
    if (!(err <= worst)) { worst = Number.isFinite(err) ? err : Infinity; worstPrompt = v.prompt; }
    if (v.usedFallback) fallback++;
    if (new Set(v.choices).size !== v.choices.length) dupes++;
  }
  const ok = worst < 1e-3 && dupes === 0;
  return { ok, worstError: worst, variants: n, duplicateChoices: dupes, fallbackChoices: fallback, worstPrompt, reason: ok ? undefined : dupes ? "duplicate answer choices" : "marked answer doesn't match the independent solution" };
}
