// Independent answer check for problem templates: re-solves generated problems from the numbers in the
// prompt text, with formulas written here from scratch (not imported from the templates), and compares the
// result with the answer the template marks correct. Used by `npm run test:answers` and by the reviewer
// "approve all verified" action. A new template needs a solver below, or it can't be auto-approved.
import { buildVariant, type Template } from "./engine";

const nums = (s: string) => (s.match(/-?\d[\d,]*\.?\d*/g) ?? []).map((x) => Number(x.replace(/,/g, "")));
const rad = (d: number) => (d * Math.PI) / 180;
const g = 9.81, gw = 9.81;
/** First number after a label in the prompt. */
const at = (p: string, label: string) => { const i = p.indexOf(label); return i < 0 ? NaN : nums(p.slice(i + label.length))[0]; };

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
  // ---- PE depth (pe-depth.ts) and FE core additions (fe-core-2.ts)
  "pump-system-power": (p) => {
    const [dz, L, D, Q, fr, K, eta] = nums(p); const V = Q / (Math.PI * D * D / 4); const hv = V * V / (2 * g);
    return gw * Q * (dz + fr * (L / D) * hv + K * hv) / (eta / 100);
  },
  "hydraulic-jump-energy-loss": (p) => {
    const [b, Q, y1] = nums(p); const Fr = Q / (b * y1) / Math.sqrt(g * y1); const y2 = 0.5 * y1 * (Math.sqrt(1 + 8 * Fr * Fr) - 1);
    const E = (y: number) => y + (Q / (b * y)) ** 2 / (2 * g); return E(y1) - E(y2); // specific energy difference
  },
  "thiem-confined-drawdown": (p) => { const [b, K, Q, r2, s2, r1] = nums(p); return s2 + Q * Math.log(r2 / r1) / (2 * Math.PI * K * b); },
  "streeter-phelps-do": (p) => {
    const [Qr, DOr, Lr, Qw, DOw, Lw, DOs, kd, kr, t] = nums(p);
    const L0 = (Qr * Lr + Qw * Lw) / (Qr + Qw), D0 = DOs - (Qr * DOr + Qw * DOw) / (Qr + Qw);
    return DOs - (kd * L0 / (kr - kd) * (Math.exp(-kd * t) - Math.exp(-kr * t)) + D0 * Math.exp(-kr * t));
  },
  "chlorine-ct": (p) => { const [V, Q, bf, C] = nums(p); return C * bf * (V / Q) * 24 * 60; },
  "hazen-williams-headloss-us": (p) => { const [Din, L, Q, C] = nums(p); return 4.73 * L * Q ** 1.852 / (C ** 1.852 * (Din / 12) ** 4.87); },
  "contracted-weir-flow": (p) => { const [L, H] = nums(p); return 3.33 * (L - 2 * 0.1 * H) * H ** 1.5; },
  "total-hardness": (p) => { const [Ca, Mg] = nums(p); return Ca * 2 * 50 / 40.08 + Mg * 2 * 50 / 24.305; }, // meq/L x 50, from atomic weights
  "strip-footing-bearing-wt": (p) => {
    const B = at(p, "footing"), Df = at(p, "founded"), gm = at(p, "weighs"), gs = at(p, "below it is"), Nq = at(p, "Nq ="), Ng = at(p, "Nγ ="), FS = at(p, "safety of");
    return (gm * Df * Nq + 0.5 * (gs - gw) * B * Ng) / FS;
  },
  "consolidation-time": (p) => { const H = at(p, "A"), cv = at(p, "consolidation is"), Tv = at(p, "(Tv ="); const Hd = p.includes("both its top and bottom") ? H / 2 : H; return Tv * Hd * Hd / cv; },
  "infinite-slope-seepage": (p) => { const phi = at(p, "φ' ="), beta = at(p, "inclined at"), gs = at(p, "unit weight is"); return ((gs - gw) / gs) * Math.tan(rad(phi)) / Math.tan(rad(beta)); },
  "pile-alpha-capacity": (p) => {
    const D = at(p, "A"), L = at(p, "driven"), cu = at(p, "strength"), a = at(p, "α ="), FS = at(p, "safety of");
    return (a * cu * Math.PI * D * L + 9 * cu * Math.PI * D * D / 4) / FS;
  },
  "aisc-column-capacity": (p) => {
    const A = at(p, "gross area"), r = at(p, "gyration"), KL = at(p, "about that axis is"), Fy = at(p, "Fy ="), E = at(p, "E =");
    const sl = KL * 12 / r, Fe = Math.PI ** 2 * E / (sl * sl), Fcr = sl <= 4.71 * Math.sqrt(E / Fy) ? Fy * 0.658 ** (Fy / Fe) : 0.877 * Fe;
    return 0.9 * Fcr * A;
  },
  "beam-column-interaction": (p) => {
    const Pr = at(p, "Pr ="), Mr = at(p, "Mr ="), Pc = at(p, "φPn ="), Mc = at(p, "φMn =");
    return Pr / Pc >= 0.2 ? Pr / Pc + (8 / 9) * (Mr / Mc) : Pr / (2 * Pc) + Mr / Mc;
  },
  "rc-beam-shear-vc": (p) => { const bw = at(p, "bw ="), d = at(p, "d ="), fc = at(p, "f'c ="); return 0.75 * 2 * Math.sqrt(fc) * bw * d / 1000; },
  "ss-udl-deflection-us": (p) => { const E = at(p, "E ="), I = at(p, "I ="), L = at(p, "spans") * 12, w = at(p, "load of") / 12; return 5 * w * L ** 4 / (384 * E * I); },
  "lrfd-governing-combination": (p) => { const D = at(p, "D ="), L = at(p, "L ="), S = at(p, "S ="); return Math.max(1.4 * D, 1.2 * D + 1.6 * L + 0.5 * S, 1.2 * D + 1.6 * S + L); },
  "crest-curve-length-ssd": (p) => {
    const [g1, g2, S] = nums(p); const A = Math.abs(g2 - g1);
    const a = A * S * S / 2158, b = 2 * S - 2158 / A; return S < a ? a : b; // S<L case if consistent, else S>L
  },
  "freeway-flow-rate": (p) => { const [N, V, PHF, PT, ET] = nums(p); return V / (PHF * N * (1 / (1 + (PT / 100) * (ET - 1)))); },
  "sag-curve-headlight": (p) => {
    const [g1, g2, S] = nums(p); const A = Math.abs(g2 - g1);
    const a = A * S * S / (400 + 3.5 * S), b = 2 * S - (400 + 3.5 * S) / A; return S < a ? a : b;
  },
  "wall-formwork-pressure": (p) => {
    const h = at(p, "placed in"), R = at(p, "forms at"), T = at(p, "temperature of");
    return Math.min(Math.max(150 + 9000 * R / T, 600), 150 * h);
  },
  "haul-fleet-size": (p) => { const [ld, hl, dp, rt] = nums(p); return Math.ceil((ld + hl + dp + rt) / ld - 1e-9); },
  "estimate-at-completion": (p) => { const [BAC, EV, AC] = nums(p); return AC + (BAC - EV) / (EV / AC); }, // AC + ETC at current CPI
  "truss-apex-member-force": (p) => { const [th, P] = nums(p); return P / 2 / Math.sin(rad(th)); },
  "tee-section-centroid": (p) => {
    const [bf, tf, tw, hw] = nums(p); const top = hw + tf;
    // centroid from the top, then convert
    const fromTop = (bf * tf * tf / 2 + tw * hw * (tf + hw / 2)) / (bf * tf + tw * hw); return top - fromTop;
  },
  "solid-shaft-torsion": (p) => { const [d, T] = nums(p); const J = Math.PI * d ** 4 / 32; return T * 1e6 * (d / 2) / J; },
  "principal-stress-max": (p) => {
    const sx = at(p, "σx ="), sy = at(p, "σy ="), t = at(p, "τxy =");
    // largest eigenvalue of the 2x2 stress tensor
    const tr = sx + sy, det = sx * sy - t * t; return tr / 2 + Math.sqrt(tr * tr / 4 - det);
  },
  "incline-push-force": (p) => { const [W, th, mu] = nums(p); return W * Math.sin(rad(th)) + mu * W * Math.cos(rad(th)); },
  "drop-onto-spring": (p) => {
    const [m, h, k] = nums(p); const K = k * 1000, W = m * g;
    // solve ½Kx² − Wx − Wh = 0 by bisection
    let lo = 0, hi = 10; for (let i = 0; i < 200; i++) { const x = (lo + hi) / 2; if (0.5 * K * x * x - W * x - W * h > 0) hi = x; else lo = x; }
    return lo * 1000;
  },
  "curve-pt-station": (p) => {
    const R = at(p, "radius"), I = at(p, "angle of"); const m = p.match(/PI is at station (\d+)\+(\d+\.\d+)/)!;
    const pi = Number(m[1]) * 100 + Number(m[2]); return pi - R * Math.tan(rad(I / 2)) + R * rad(I);
  },
  "venturi-flow": (p) => {
    const [D1, D2, dh, Cd] = nums(p); const A1 = Math.PI * D1 * D1 / 4, A2 = Math.PI * D2 * D2 / 4;
    // continuity + Bernoulli: V2² − V1² = 2gΔh with V1 = V2·A2/A1
    const V2 = Math.sqrt(2 * g * dh / (1 - (A2 / A1) ** 2)); return Cd * A2 * V2 * 1000;
  },
  "breakeven-volume": (p) => { const [F, pr, v] = nums(p); return F / (pr - v); },
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
