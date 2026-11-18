// Independent answer check for problem templates: re-solves generated problems from the numbers in the
// prompt text, with formulas written here from scratch (not imported from the templates), and compares the
// result with the answer the template marks correct. Used by `npm run test:answers` and by the reviewer
// "approve all verified" action. A new template needs a solver below, or it can't be auto-approved.
import { buildVariant, makeRng, type Template } from "./engine";

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
  // ---- Spec-gap batch (spec-gaps.ts)
  "fillet-weld-strength": (p) => { const m = p.match(/are (\d+)\/(\d+) in fillets/)!; const w = Number(m[1]) / Number(m[2]); const te = w / Math.SQRT2; return 0.75 * 0.6 * at(p, "FEXX =") * te * at(p, "total length of"); },
  "bolt-shear-bearing": (p) => {
    const nb = at(p, "uses"), d = at(p, "bolts of"), Fnv = at(p, "Fnv ="), t = at(p, "plate is"), Fu = at(p, "Fu =");
    return nb * Math.min(0.75 * Fnv * Math.PI * (d / 2) ** 2, 0.75 * 2.4 * d * t * Fu);
  },
  "tributary-girder-moment": (p) => { const s = at(p, "spaced"), L = at(p, "span"), D = at(p, "dead load is"), Lv = at(p, "live load is"); return (s * (1.2 * D + 1.6 * Lv) / 1000) * L * L / 8; },
  "seismic-base-shear-elf": (p) => {
    const W = at(p, "W ="), SDS = at(p, "SDS ="), SD1 = at(p, "SD1 ="), R = at(p, "R ="), Ie = at(p, "Ie ="), T = at(p, "T =");
    const Cs = Math.min(SDS * Ie / R, SD1 * Ie / (T * R)); return Math.max(Cs, 0.044 * SDS * Ie, 0.01) * W;
  },
  "cpm-total-float": (p) => {
    // longest path through the activity, by enumerating every start-to-finish path
    const acts = [...p.matchAll(/([A-F]) (\d+), (?:no predecessor|after ([A-F](?: and [A-F])*))/g)].map((m) => ({ id: m[1], d: Number(m[2]), pre: m[3] ? m[3].split(" and ") : [] }));
    const x = p.match(/total float of activity ([A-F])/)![1];
    const succ = (id: string) => acts.filter((a) => a.pre.includes(id));
    const paths: string[][] = [];
    const walk = (id: string, path: string[]) => { const s = succ(id); if (!s.length) paths.push([...path, id]); else s.forEach((a) => walk(a.id, [...path, id])); };
    acts.filter((a) => !a.pre.length).forEach((a) => walk(a.id, []));
    const len = (ps: string[]) => ps.reduce((t, id) => t + acts.find((a) => a.id === id)!.d, 0);
    const T = Math.max(...paths.map(len));
    return T - Math.max(...paths.filter((ps) => ps.includes(x)).map(len));
  },
  "least-cost-crashing": (p) => {
    const acts = [...p.matchAll(/([PQRS]): normal (\d+) days at \$([\d,]+), crash (\d+) days at \$([\d,]+)/g)].map((m) => {
      const [dn, cn, dc, cc] = [m[2], m[3], m[4], m[5]].map((v) => Number(v.replace(/,/g, "")));
      return { red: dn - dc, slope: (cc - cn) / (dn - dc) };
    });
    const N = at(p, "project by");
    // brute force over every feasible split of the N days
    let best = Infinity;
    const go = (i: number, left: number, cost: number) => {
      if (i === acts.length) { if (left === 0) best = Math.min(best, cost); return; }
      for (let k = 0; k <= Math.min(acts[i].red, left); k++) go(i + 1, left - k, cost + k * acts[i].slope);
    };
    go(0, N, 0);
    return best;
  },
  "average-end-area-volume": (p) => { const [L, A1, A2] = nums(p); return ((A1 + A2) / 2) * L / 27; },
  "retaining-wall-sliding": (p) => {
    const H = at(p, "is"), B = at(p, "tall and"), gm = at(p, "(γ ="), phi = at(p, "φ ="), mu = at(p, "coefficient is");
    const Ka = (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi)));
    return mu * at(p, "wall (") * B * H / (Ka * gm * H * H / 2);
  },
  "retaining-wall-overturning": (p) => {
    const H = at(p, "is"), B = at(p, "tall and"), gm = at(p, "(γ ="), phi = at(p, "φ =");
    const Ka = (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi)));
    const W = at(p, "wall (") * B * H, Pa = Ka * gm * H * H / 2;
    return (W * B / 2) / (Pa * H / 3);
  },
  "spt-n160": (p) => {
    const z = at(p, "depth of"), N = at(p, "blow count of"), dw = at(p, "water table is"), gm = at(p, "soil weighs"), gs = at(p, "kN/m³ above it and");
    const ER = at(p, "energy ratio is"), CR = at(p, "rod length correction is");
    const u = gw * (z - dw), se = gm * dw + gs * (z - dw) - u;
    return Math.min(1.7, 1 / Math.sqrt(se / 100)) * N * CR * (ER / 60);
  },
  "liquefaction-csr": (p) => {
    const z = at(p, "depth of"), dw = at(p, "water table is"), gm = at(p, "soil weighs"), gs = at(p, "kN/m³ above it and"), a = at(p, "acceleration is");
    const sv = gm * dw + gs * (z - dw); return 0.65 * a * (sv / (sv - gw * (z - dw))) * (1 - 0.00765 * z);
  },
  "flow-net-seepage": (p) => { const [Nf, Nd, H, k, L] = nums(p); return (k * H * Nf / Nd) * L; },
  "activated-sludge-srt": (p) => {
    const Q = at(p, "treats"), V = at(p, "holds"), X = at(p, "MLSS of"), Qw = at(p, "removed at"), Xw = at(p, "m³/d with"), Xe = at(p, "carries");
    return V * X / (Qw * Xw + (Q - Qw) * Xe);
  },
  "food-to-microorganism": (p) => { const V = at(p, "basin of"), Q = at(p, "receives"), S0 = at(p, "BOD of"), Xv = at(p, "MLVSS of"); return Q * S0 / (V * Xv); },
  "aeration-basin-volume": (p) => {
    const Q = at(p, "basin for"), S0 = at(p, "influent soluble BOD of"), S = at(p, "effluent soluble BOD of"), th = at(p, "SRT of"), Y = at(p, "Y ="), kd = at(p, "kd ="), X = at(p, "MLVSS of");
    return th * Q * Y * (S0 - S) / (X * (1 + kd * th));
  },
  "superelevation-min-radius": (p) => { const [V, e, fr] = nums(p); return V * V / (15 * (e / 100 + fr)); },
  "middle-ordinate-clearance": (p) => {
    const R = at(p, "radius of"), S = at(p, "distance is");
    const half = S / (2 * R); // half the central angle subtended by the sight line, in radians
    return R * (1 - Math.cos(half));
  },
  "design-lane-esals": (p) => {
    const ADT = at(p, "ADT of"), T = at(p, "make up"), TF = at(p, "average"), LD = at(p, "factor of"), g = at(p, "grows") / 100, n = at(p, "over a");
    let G = 0; for (let y = 0; y < n; y++) G += (1 + g) ** y; // sum of yearly traffic factors
    return ADT * (T / 100) * TF * 0.5 * LD * 365 * G / 1e6;
  },
  "base-thickness-sn": (p) => { const SN = at(p, "number of"), D1 = at(p, "will have"), m2 = at(p, "drainage coefficient"); return (SN - 0.44 * D1) / (0.14 * m2); },
  "tee-section-inertia": (p) => {
    const [bf, tf, tw, hw] = nums(p);
    // strips: integrate y² dA about the bottom, then shift to the centroid (I_c = I_base − A ȳ²)
    const A = bf * tf + tw * hw, Q = bf * tf * (hw + tf / 2) + tw * hw * hw / 2, ybar = Q / A;
    const Ibase = tw * hw ** 3 / 3 + bf * ((hw + tf) ** 3 - hw ** 3) / 3;
    return (Ibase - A * ybar * ybar) / 1e6;
  },
  "benefit-cost-ratio": (p) => {
    const P = at(p, "costs $"), B = at(p, "damage by $"), n = at(p, "per year for"), M = at(p, "will cost $"), i = at(p, "At") / 100;
    let PA = 0; for (let y = 1; y <= n; y++) PA += 1 / (1 + i) ** y;
    return B * PA / (P + M * PA);
  },
  // ---- Ops and design batch (ops-design.ts)
  "wind-windward-pressure": (p) => { const V = at(p, "speed of"), Kz = at(p, "Kz ="); return 0.00256 * Kz * V * V * 0.85 * 0.85 * 0.8; },
  "footing-punching-shear-vu": (p) => {
    const c = at(p, "column"), B = at(p, "footing"), d = at(p, "d ="), Pu = at(p, "load is");
    // soil pressure acting outside the critical perimeter at d/2 from the faces
    const inside = ((c + d) / 12) ** 2; return Pu * (1 - inside / (B * B));
  },
  "footing-one-way-shear-vu": (p) => {
    const c = at(p, "column"), B = at(p, "footing"), d = at(p, "d ="), Pu = at(p, "load is");
    const strip = (B - c / 12) / 2 - d / 12; return Pu * strip / B; // fraction of the footing area beyond the section
  },
  "braced-cut-strut-load": (p) => {
    const H = at(p, "A"), gm = at(p, "(γ ="), phi = at(p, "φ ="), sh = at(p, "struts spaced"), sv = at(p, "tributary height of");
    const Ka = (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi))); return 0.65 * Ka * gm * H * sv * sh;
  },
  "crane-mat-area": (p) => {
    const W = at(p, "weighs"), P = at(p, "It lifts"), R = at(p, "radius of"), a = at(p, "are each"), qa = at(p, "bearing is");
    // vertical equilibrium plus moments about the center of rotation: Rf − Rr = P·R/a, Rf + Rr = W + P
    const Rf = ((W + P) + (P * R) / a) / 2; return Rf / 2 / qa;
  },
  "borrow-volume-compaction": (p) => { const Vf = at(p, "needs"), RC = at(p, "requires"), gmax = at(p, "weight is"), gb = at(p, "in-place dry unit weight is"); return Vf * (RC / 100) * gmax / gb; },
  "compaction-water-to-add": (p) => { const gd = at(p, "weight of"), w2 = at(p, "moisture content of"), w1 = at(p, "arrives at"); return gd * 27 * (w2 - w1) / 100 / 8.34; },
  "signal-change-clearance": (p) => {
    const V = at(p, "speed of"), G = at(p, "on a") / 100, W = at(p, "is"); const v = V * at(p, "Use v =");
    return 1 + v / (20 + 64.4 * G) + (W + 20) / v;
  },
  "intersection-sight-distance": (p) => {
    const V = at(p, "design speed is"); const left = p.includes("turns left");
    const lanes = left ? at(p, "crossing") : 1; return V * at(p, "ISD =") * ((left ? 7.5 : 6.5) + 0.5 * Math.max(0, lanes - 1));
  },
  "primary-sludge-volume": (p) => { const Q = at(p, "treats"), TSS = at(p, "TSS of"), rem = at(p, "removes"), ps = at(p, "sludge is"); return (Q * TSS * rem / 100 / 1000) / (1020 * ps / 100); },
  "nitrification-oxygen": (p) => { const Q = at(p, "treating"), N0 = at(p, "ammonia from"), Ne = at(p, "mg/L to"); return Q * (N0 - Ne) * 4.57 / 1000; },
  "unit-hydrograph-peak": (p) => { const up = at(p, "peak of"), CN = at(p, "curve number is"), P = at(p, "storm is"); const S = 1000 / CN - 10, Ia = 0.2 * S; return up * (P - Ia) ** 2 / (P - Ia + S); },
  "detention-storage-triangular": (p) => { const Qp = at(p, "peak of"), tb = at(p, "base time of"), Qa = at(p, "release is"); return (tb * 3600) * (Qp - Qa) / 2 / 43560; },

  // ---- Networks, sewers, timber and FE gaps (networks-timber.ts)
  "parallel-pipes-hw": (p) => {
    const Q = at(p, "flow of"), D1 = at(p, "Pipe 1 is"), L1 = at(p, "Pipe 1 is " + D1 + " in diameter,"), C1 = at(p, "C ="), rest = p.slice(p.indexOf("Pipe 2"));
    const D2 = at(rest, "Pipe 2 is"), L2 = at(rest, "diameter,"), C2 = at(rest, "C =");
    // find the common head loss by bisection, flows from Hazen-Williams solved for Q
    const q = (C: number, D: number, L: number, h: number) => ((h * C ** 1.852 * (D / 12) ** 4.87) / (4.73 * L)) ** (1 / 1.852);
    let lo = 0, hi = 1e4;
    for (let i = 0; i < 200; i++) { const h = (lo + hi) / 2; if (q(C1, D1, L1, h) + q(C2, D2, L2, h) > Q) hi = h; else lo = h; }
    return q(C1, D1, L1, lo);
  },
  "series-pipes-darcy": (p) => {
    const [Q, L1, D1, f1, L2, D2, f2] = nums(p);
    const hf = (L: number, D: number, fr: number) => { const V = 4 * Q / (Math.PI * D * D); return fr * L / D * V * V / (2 * g); };
    return hf(L1, D1, f1) + hf(L2, D2, f2);
  },
  "sewer-full-flow-capacity": (p) => { const [Din, nn, S] = nums(p); const D = Din / 12, P = Math.PI * D, A = P * D / 4; return 1.486 / nn * A * (A / P) ** (2 / 3) * Math.sqrt(S); },
  "sewer-min-slope": (p) => { const [Din, nn, V] = nums(p); const R = Din / 48; return (V * nn / 1.486) ** 2 / R ** (4 / 3); },
  "timber-joist-allowable-moment": (p) => {
    const [b, d] = nums(p); const Fb = at(p, "Fb ="), CF = at(p, "CF ="), CD = at(p, "CD ="), Cr = at(p, "Cr =");
    return Fb * CF * CD * Cr * (b * d * d / 6) / 12;
  },
  "timber-column-capacity": (p) => {
    const d = nums(p)[0], le = at(p, "length of") * 12, Fc = at(p, "Fc ="), E = at(p, "E'min ="), CD = at(p, "CD ="), c = at(p, "with c =");
    const Fs = Fc * CD, FcE = 0.822 * E / (le / d) ** 2, a = FcE / Fs;
    // smaller root of c·Cp² − (1 + α)Cp + α = 0
    const Cp = ((1 + a) - Math.sqrt((1 + a) ** 2 - 4 * c * a)) / (2 * c);
    return Fs * Cp * d * d / 1000;
  },
  "pile-group-efficiency": (p) => {
    const m = at(p, "group has"), nc = at(p, "rows of"), D = at(p, "pile is"), s = at(p, "spacing is"), Q = at(p, "capacity is");
    const th = Math.atan2(D, s) * 180 / Math.PI; return (1 - th * ((nc - 1) * m + (m - 1) * nc) / (90 * m * nc)) * m * nc * Q;
  },
  "earthwork-waste-shrinkage": (p) => { const [cut, fill, sh] = nums(p); return cut - fill / (1 - sh / 100); },
  "aashto-group-index": (p) => {
    const F = at(p, "has"), LL = at(p, "liquid limit of"), PI = at(p, "plasticity index of");
    return Math.max(0, Math.round((F - 35) * (0.2 + 0.005 * (LL - 40)) + 0.01 * (F - 15) * (PI - 10)));
  },
  "orifice-discharge": (p) => { const [d, h, Cd] = nums(p); return Cd * Math.PI * (d / 2000) ** 2 * Math.sqrt(2 * g * h) * 1000; },
  "floating-block-freeboard": (p) => { const [H, s] = nums(p); const sf = p.includes("seawater") ? 1.025 : 1; return H * (1 - s / sf); },
  "pipe-bend-force": (p) => {
    const V = at(p, "flows at"), D = at(p, "bend in a"), pr = at(p, "pressure is"); const A = Math.PI * D * D / 4, Q = V * A;
    const fx = pr * A + Q * V, fy = pr * A + Q * V; return Math.hypot(fx, fy); // ρ = 1,000 kg/m³ → kN with Q·V
  },
  "area-by-coordinates": (p) => {
    const pts = [...p.matchAll(/\(E (-?\d+), N (-?\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    // trapezoid rule over the boundary
    let a = 0; for (let i = 0; i < pts.length; i++) { const [e1, n1] = pts[i], [e2, n2] = pts[(i + 1) % pts.length]; a += (e2 - e1) * (n1 + n2) / 2; }
    return Math.abs(a);
  },
  "disk-spin-up-time": (p) => { const [m, R, T, rpm] = nums(p); const I = m * R * R / 2; return (rpm / 60 * 2 * Math.PI) * I / T; },
  "beam-shear-stress-at-y": (p) => {
    const [b, h, V, y] = nums(p); // τ = (V/2I)(h²/4 − y²)
    return V * 1000 / (2 * (b * h ** 3 / 12)) * (h * h / 4 - y * y);
  },

  // ---- Fifth batch (batch-five.ts)
  "superelevation-runoff-length": (p) => { const e = at(p, "superelevation of"), n1 = Number(p.match(/, and (\d) 12 ft lane/)![1]), D = at(p, "Δ ="), bw = at(p, "b_w ="); return 12 * n1 * e * bw / D; },
  "vertical-curve-elevation": (p) => {
    const [L, g1, g2, E, x] = nums(p);
    // integrate the grade, which changes linearly from g1 to g2 over L (trapezoid of grades from 0 to x)
    const gx = g1 + (g2 - g1) * x / L; return E + (g1 + gx) / 2 * x / 100;
  },
  "crest-high-point": (p) => { const [L, g1, g2] = nums(p); return L * g1 / (g1 - g2); },
  "composite-beam-phi-mn": (p) => {
    const As = at(p, "As ="), d = at(p, "d ="), L = at(p, "spans"), s = at(p, "spaced"), t = at(p, "with a"), fc = at(p, "f'c =");
    const be = Math.min(L * 3, s * 12), C = As * 50, a = C / (0.85 * fc * be);
    // couple between the steel centroid (d/2 below the slab) and the concrete block centroid (a/2 below the top)
    return 0.9 * C * ((t + d / 2) - a / 2) / 12;
  },
  "plate-tension-capacity": (p) => {
    const [b, t, Fy, Fu, nh, db] = nums(p);
    return Math.min(0.9 * Fy * b * t, 0.75 * Fu * t * (b - nh * (db + 1 / 8)));
  },
  "thiem-unconfined-flow": (p) => { const [K, r1, r2, h1, h2] = nums(p); return Math.PI * K * (h2 - h1) * (h2 + h1) / Math.log(r2 / r1); },
  "two-well-superposition": (p) => {
    const T = at(p, "transmissivity"), R = at(p, "influence of"), Q1 = at(p, "Well 1 pumps"), d1 = at(p, "m³/d and is"), rest = p.slice(p.indexOf("well 2"));
    const Q2 = at(rest, "pumps"), d2 = at(rest, "and is");
    return (Q1 * Math.log(R / d1) + Q2 * Math.log(R / d2)) / (2 * Math.PI * T);
  },
  "clarifier-solids-loading": (p) => { const [D, Q, Rr, X] = nums(p); return Q * (1 + Rr) * X / 1000 / (Math.PI * (D / 2) ** 2); },
  "aeration-oxygen-demand": (p) => {
    const Q = at(p, "treats"), S0 = at(p, "from"), S = at(p, "mg/L to"), Y = at(p, "Y ="), kd = at(p, "kd ="), th = at(p, "SRT ="), fr = at(p, "BOD₅ is");
    const removed = Q * (S0 - S) / 1000; return removed / fr - 1.42 * Y * removed / (1 + kd * th);
  },
  "wall-thrust-surcharge-water": (p) => {
    const H = at(p, "A"), phi = at(p, "φ ="), q = at(p, "surcharge of"), dw = at(p, "wall is"), gm = at(p, "soil weighs"), gs = at(p, "above the water table and");
    const Ka = (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi)));
    // integrate the pressure diagram numerically (Simpson's rule on each segment)
    const press = (z: number) => { const sv = q + (z <= dw ? gm * z : gm * dw + (gs - gw) * (z - dw)); return Ka * sv + (z > dw ? gw * (z - dw) : 0); };
    const simpson = (a: number, b: number) => { const N = 200, h = (b - a) / N; let sum = press(a) + press(b); for (let i = 1; i < N; i++) sum += press(a + i * h) * (i % 2 ? 4 : 2); return sum * h / 3; };
    return simpson(0, dw) + simpson(dw, H);
  },
  "oc-clay-settlement": (p) => {
    const H = at(p, "A"), e0 = at(p, "e₀ ="), Cc = at(p, "Cc ="), Cr = at(p, "Cr ="), s0 = at(p, "effective stress is"), sp = at(p, "preconsolidation stress is"), ds = at(p, "adds");
    // change in void ratio, then strain
    const de = Cr * Math.log10(sp / s0) + Cc * Math.log10((s0 + ds) / sp); return de / (1 + e0) * H * 1000;
  },
  "stress-21-method": (p) => { const [B, L, P] = nums(p), z = at(p, "increase"); return P / ((B + z) * (L + z)); },
  "linear-schedule-lag": (p) => { const [a, Lt, b] = nums(p); return Lt * (b - a) / (a * b); },

  // ---- Sixth batch (batch-six.ts)
  "cmu-wall-axial-asd": (p) => { const h = at(p, "wall is"), An = at(p, "An ="), r = at(p, "and r ="), fm = at(p, "f'm ="); const hr = h * 12 / r; return 0.25 * fm * An * (1 - hr * hr / 19600) / 1000; },
  "cantilever-tip-deflection": (p) => { const L = at(p, "A") * 1000, E = at(p, "E =") * 1000, I = at(p, "I =") * 1e6, P = at(p, "carries a") * 1000; return P * L ** 3 / (3 * E * I); },
  "culvert-outlet-control-hw": (p) => {
    const [Din, nn, L, S, Q, ke] = nums(p); const ho = at(p, "and ho =");
    const D = Din / 12, A = Math.PI * D * D / 4, V = Q / A, R = A / (Math.PI * D);
    return (1 + ke + 29 * nn * nn * L / R ** 1.33) * V * V / 64.4 + ho - L * S;
  },
  "muskingum-outflow": (p) => {
    const K = at(p, "K ="), X = at(p, "X ="), dt = at(p, "Δt ="), I1 = at(p, "inflow is"), O1 = at(p, "outflow is"), I2 = at(p, "end of the step, inflow is");
    // storage form: S = K[XI + (1 − X)O]; (S₂ − S₁)/Δt = (I₁ + I₂)/2 − (O₁ + O₂)/2, solved for O₂
    const S1 = K * (X * I1 + (1 - X) * O1);
    return (S1 + dt * ((I1 + I2) / 2 - O1 / 2) - K * X * I2) / (K * (1 - X) + dt / 2);
  },
  "rapid-mix-power": (p) => { const V = at(p, "basin of"), G = at(p, "G ="), mu = at(p, "viscosity is") * 1e-3; return mu * V * G * G / 1000; },
  "filters-required": (p) => { const [Q, a, rate] = nums(p); return Math.ceil(Q / (24 * rate * a) - 1e-9) + 1; },
  "drilled-shaft-beta": (p) => {
    const [D, L, gm] = nums(p); const z = L / 2;
    const b = Math.min(1.2, Math.max(0.25, 1.5 - 0.135 * Math.sqrt(z))); return b * gm * z / 1000 * Math.PI * D * L;
  },
  "degree-of-saturation": (p) => {
    const [V, M, w, Gs] = nums(p); const rho = M / V, wd = w / 100;
    const e = Gs * (1 + wd) / rho - 1; return wd * Gs / e * 100;
  },
  "falling-head-permeability": (p) => { const [a, L, A, h1, h2, t] = nums(p); return a * L * Math.log(h1 / h2) / (A * t) * 1e4; },
  "axle-load-equivalency": (p) => { const [N, a1, a2] = nums(p); return N * (a1 ** 4 + a2 ** 4) / 18 ** 4; },
  "pedestrian-phase-time": (p) => { const W = nums(p)[0], walk = at(p, "interval of"); return walk + W / 3.5; },
  "curve-external-distance": (p) => { const [R, I] = nums(p); const T = R * Math.tan(rad(I / 2)); return Math.sqrt(R * R + T * T) - R; },
  "mix-design-fine-aggregate": (p) => {
    const C = at(p, "uses"), W = at(p, "(SG 3.15),"), CA = at(p, "water, and"), Gca = at(p, "SSD, SG"), air = at(p, "with"), Gfa = at(p, "fine aggregate (SSD, SG");
    const g = 62.4; return (27 * (1 - air / 100) - C / (3.15 * g) - W / g - CA / (Gca * g)) * Gfa * g;
  },
  "rate-of-return-annuity": (p) => {
    const P = at(p, "costs $"), A = at(p, "saves $"), n = at(p, "per year for");
    // secant iteration on PW(i) = A(P/A) − P
    const f = (i: number) => { let s = 0; for (let y = 1; y <= n; y++) s += A / (1 + i) ** y; return s - P; };
    let a = 0.01, b = 0.3; for (let k = 0; k < 100; k++) { const fa = f(a), fb = f(b); if (Math.abs(fb - fa) < 1e-12) break; const c = b - fb * (b - a) / (fb - fa); a = b; b = c; }
    return b * 100;
  },
  "capitalized-cost": (p) => {
    const C = at(p, "costs $"), M = at(p, "Maintenance costs $"), R = at(p, "costing $"), k = at(p, "every"), i = at(p, "At") / 100;
    return C + M / i + R / ((1 + i) ** k - 1); // perpetual series of payments every k years
  },
  "impulse-average-force": (p) => { const [m, v1, v2, t] = nums(p); return m * (v2 - -v1) / t / 1000; },

  // ---- Seventh batch (batch-seven.ts)
  "steel-ltb-inelastic": (p) => {
    const Zx = at(p, "Zx ="), Sx = at(p, "Sx ="), Lp = at(p, "Lp ="), Lr = at(p, "Lr ="), Lb = at(p, "Lb ="), Cb = at(p, "Cb =");
    const Mp = 50 * Zx / 12, Mr = 35 * Sx / 12, frac = (Lb - Lp) / (Lr - Lp);
    return 0.9 * Math.min(Mp, Cb * (Mp * (1 - frac) + Mr * frac)); // linear interpolation between Mp and 0.7FySx
  },
  "rc-tied-column-axial": (p) => { const [b, h, Ast, , fc] = nums(p); return 0.52 * (0.85 * fc * (b * h - Ast) + 60 * Ast); },
  "steel-beam-shear": (p) => { const d = at(p, "d ="), tw = at(p, "tw ="); return 30 * d * tw; },
  "one-way-slab-min-thickness": (p) => {
    const L = at(p, "spans") * 12, cond = p.match(/ft and is (.+?)\. It/)![1];
    const k = ({ "simply supported": 20, "continuous at one end": 24, "continuous at both ends": 28, "a cantilever": 10 } as Record<string, number>)[cond];
    return L / k;
  },
  "unit-hydrograph-convolution": (p) => {
    const U = nums(p.slice(p.indexOf("ordinates of") + 12, p.indexOf("cfs per inch")));
    const P1 = at(p, "produces"), P2 = at(p, "first hour and");
    let best = 0; for (let t = 0; t <= U.length; t++) best = Math.max(best, (U[t] ?? 0) * P1 + (U[t - 1] ?? 0) * P2);
    return best;
  },
  "nrcs-lag-tc": (p) => { const L = at(p, "length of"), CN = at(p, "curve number of"), Y = at(p, "slope of"); const S = 1000 / CN - 10; return Math.exp(0.8 * Math.log(L) + 0.7 * Math.log(S + 1)) / (1900 * Math.sqrt(Y) * 0.6); },
  "v-notch-weir": (p) => { const [th, Cd, H] = nums(p); return 8 / 15 * Cd * Math.sqrt(2 * 9.81) * Math.tan(rad(th / 2)) * Math.pow(H, 2.5) * 1000; },
  "storm-sewer-size": (p) => {
    const S = at(p, "slope of"), Q = at(p, "carry"); const sizes = [12, 15, 18, 21, 24, 27, 30, 36, 42, 48, 54, 60, 66, 72];
    // capacity of each size flowing full; pick the first that carries Q
    return sizes.find((d) => { const D = d / 12, A = Math.PI * D * D / 4; return 1.486 / 0.013 * A * (D / 4) ** (2 / 3) * Math.sqrt(S) >= Q * 1.0005; }) ?? NaN;
  },
  "cantilever-sheet-pile-depth": (p) => {
    const H = at(p, "retains"), phi = at(p, "φ ="); const Ka = (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi))), Kp = 1 / Ka;
    // solve Kp D³ = Ka (H + D)³ by bisection
    let lo = 0, hi = 50 * H; for (let i = 0; i < 200; i++) { const D = (lo + hi) / 2; if (Kp * D ** 3 - Ka * (H + D) ** 3 > 0) hi = D; else lo = D; }
    return 1.2 * lo;
  },
  "passive-thrust-cohesion": (p) => {
    const c = at(p, "c ="), phi = at(p, "φ ="), gm = at(p, "γ ="), H = at(p, "depth of"); const Kp = (1 + Math.sin(rad(phi))) / (1 - Math.sin(rad(phi)));
    return gm * H * H * Kp / 2 + 2 * c * H * Math.sqrt(Kp);
  },
  "clay-bearing-undrained": (p) => { const Df = at(p, "founded"), cu = at(p, "strength"), gm = at(p, "weighs"); return ((Math.PI + 2) * cu + gm * Df) / 3; },
  "critical-lane-vc": (p) => {
    const phases = at(p, "A"), C = at(p, "length of"), lost = at(p, "s and") * phases, s = at(p, "saturation flow is");
    const vols = nums(p.slice(p.indexOf("volumes are") + 11, p.indexOf("veh/h/ln")));
    return vols.reduce((a, v) => a + v, 0) / s * C / (C - lost);
  },
  "incident-queue-delay": (p) => {
    const lam = at(p, "Demand on a freeway is"), mu = at(p, "capacity is"), mu2 = at(p, "capacity to"), t = at(p, "veh/h for");
    // integrate queue length over time: rises linearly to (λ − μ′)t, then falls at (μ − λ)
    const Qm = (lam - mu2) * t, T2 = Qm / (mu - lam); return Qm * t / 2 + Qm * T2 / 2;
  },
  "two-leg-sling-tension": (p) => { const [W, Ls, d] = nums(p); const ang = Math.acos(d / 2 / Ls); return W / (2 * Math.sin(ang)); },
  "excavator-production-bcy": (p) => { const [bucket, fill, ct, E, sw] = nums(p); return bucket * fill * (E * 60 / ct) / (1 + sw / 100); },

  // ---- Eighth batch (batch-eight.ts)
  "segment-crash-rate": (p) => { const L = at(p, "A"), V = at(p, "ADT of"), C = at(p, "had"), N = at(p, "over"); return C / (N * 365 * V * L / 1e8); },
  "aadt-design-hour-volume": (p) => {
    const A0 = at(p, "AADT of"), g = at(p, "growing") / 100, n = at(p, "design year"), K = at(p, "K ="), D = at(p, "D =");
    let A = A0; for (let y = 0; y < n; y++) A *= 1 + g; return A * K * D;
  },
  "work-zone-taper-length": (p) => {
    const S = at(p, "speed of"), W = at(p, "traffic by"), kind = p.match(/needs a (\w+) taper/)![1];
    const L = S >= 45 ? W * S : W * S * S / 60; return L * ({ merging: 1, shifting: 1 / 2, shoulder: 1 / 3 } as Record<string, number>)[kind];
  },
  "triaxial-friction-angle": (p) => {
    const dev = at(p, "deviator stress of"), s3 = at(p, "cell pressure of");
    // Mohr circle tangent: radius = (center) sin φ
    const center = s3 + dev / 2, radius = dev / 2; return Math.asin(radius / center) * 180 / Math.PI;
  },
  "sand-cone-relative-compaction": (p) => {
    const Ms = at(p, "test,"), rs = at(p, "density"), Mw = at(p, "weighs"), w = at(p, "moisture content of"), rmax = at(p, "dry density is");
    return (Mw / (1 + w / 100)) / (Ms / rs) / rmax * 100;
  },
  "rqd-from-core-run": (p) => {
    const run = at(p, "A"), pieces = nums(p.slice(p.indexOf("pieces of") + 9, p.lastIndexOf(" in.")));
    return pieces.reduce((a, x) => a + (x >= 4 ? x : 0), 0) / run * 100;
  },
  "flat-roof-snow-load": (p) => { const pg = at(p, "pg ="), Ce = at(p, "Ce ="), Ct = at(p, "Ct ="); return 0.7 * Ce * Ct * pg; },
  "rusle-soil-loss": (p) => {
    const ac = at(p, "A"), R = at(p, "R ="), K = at(p, "K ="), LS = at(p, "LS ="), C = at(p, "C ="), P = at(p, "P =");
    return [R, K, LS, C, P, ac].reduce((a, b) => a * b, 1);
  },
  "maturity-nurse-saul": (p) => {
    const temps = nums(p.slice(p.indexOf("temperatures of") + 15, p.indexOf("°C over"))), dt = at(p, "consecutive"), T0 = at(p, "datum temperature of");
    return temps.reduce((a, t) => a + Math.max(0, t - T0) * dt, 0);
  },
  "grade-stake-cut": (p) => {
    const BS = at(p, "backsight of"), BM = at(p, "elevation"), rod = at(p, "stake is"), E0 = at(p, "starts at elevation"), g = at(p, "runs at"), x = at(p, "the stake is");
    return (BM + BS - rod) - (E0 + g / 100 * x);
  },
  "pressure-pipe-wall-thickness": (p) => { const D = at(p, "A"), P = at(p, "pressure of"), S = at(p, "stress is"), ca = at(p, "allowance of"); return P * (D / 2) / S + ca; },

  // ---- Ninth batch (batch-nine.ts)
  "liquefaction-factor-of-safety": (p) => {
    const z = at(p, "sand at"), dw = at(p, "water table"), gm = at(p, "γ ="), gs = at(p, "kN/m³ above it and"), CRR = at(p, "CRR₇.₅ ="), M = at(p, "magnitude"), a = at(p, "amax =");
    const sv = gm * dw + gs * (z - dw), se = sv - gw * (z - dw);
    const csr = 0.65 * a * sv / se * (1 - 0.00765 * z), msf = Math.pow(10, 2.24) / Math.pow(M, 2.56);
    return CRR * msf / csr;
  },
  "pseudo-static-infinite-slope": (p) => {
    const phi = rad(at(p, "φ' =")), b = rad(at(p, "inclined at")), kh = at(p, "kh =");
    // resolve weight W = 1 and kh·W along and normal to the slope
    const N = Math.cos(b) - kh * Math.sin(b), T = Math.sin(b) + kh * Math.cos(b); return N * Math.tan(phi) / T;
  },
  "heave-exit-gradient": (p) => { const L = at(p, "last"), dh = at(p, "drops"), gs = at(p, "unit weight of"); return ((gs - gw) / gw) * L / dh; },
  "mse-reinforcement-tension": (p) => {
    const Sv = at(p, "spacing of"), z = at(p, "layer"), gm = at(p, "weighs"), phi = at(p, "φ ="), q = at(p, "surcharge of");
    return (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi))) * (gm * z + q) * Sv;
  },
  "pile-elastic-shortening": (p) => {
    const d = at(p, "A"), E = at(p, "E ="), L = at(p, "GPa) is"), Qp = at(p, "carries"), Qs = at(p, "bearing and"), xi = at(p, "ξ =");
    return (Qp + xi * Qs) * L / (d * d * E * 1e6) * 1000;
  },
  "shoring-post-load": (p) => {
    const [sx, sy, t] = nums(p); const form = at(p, "dead load of"), live = at(p, "live load of");
    return (t / 12 * 150 + form + live) * sx * sy / 1000;
  },
  "left-turn-storage": (p) => {
    const V = at(p, "has"), C = at(p, "and a"), pT = at(p, "making up");
    const cycles = 3600 / C; return 2 * (V / cycles) * ((100 - pT) * 25 + pT * 40) / 100;
  },
  "cooper-jacob-drawdown": (p) => {
    const Q = at(p, "pumps"), T = at(p, "transmissivity"), m = p.match(/storativity (\d+) × 10\^-(\d+)/)!, S = Number(m[1]) * 10 ** -Number(m[2]);
    const r = at(p, "drawdown"), t = at(p, "m from the well after");
    return 2.3 * Q / (4 * Math.PI * T) * Math.log10((2.25 * T * t) / (r * r * S)); // the prompt states the 2.3 factor
  },
  "groundwater-travel-time": (p) => {
    const L = at(p, "wells"), h1 = at(p, "levels of"), h2 = at(p, "m and"), K = at(p, "conductivity is"), ne = at(p, "porosity is");
    return L / (K * (h1 - h2) / L / ne) / 365;
  },
  "tmdl-load-reduction": (p) => {
    const Q = at(p, "flow of"), Cnow = at(p, "phosphorus at"), Ct = at(p, "target is"), mos = at(p, "and");
    return 8.34 * Q * (Cnow - Ct * (1 - mos / 100));
  },
  "propped-cantilever-reaction": (p) => {
    const L = at(p, "spans"), w = at(p, "load of");
    // compatibility: cantilever tip deflection wL⁴/8EI cancelled by prop RL³/3EI
    const R = w * L ** 4 / 8 / (L ** 3 / 3);
    return p.includes("reaction at the propped end") ? R : Math.abs(R * L - w * L * L / 2);
  },
  "dewatering-pump-power": (p) => { const Q = at(p, "deliver"), lift = at(p, "lift of"), fr = at(p, "plus"), eta = at(p, "efficiency is"); return Q * (lift + fr) / 3960 / (eta / 100); },
  "euac-alternative": (p) => {
    const P = at(p, "costs $"), M = at(p, "now, $"), S = at(p, "salvage value of $"), N = at(p, "end of its"), i = at(p, "At") / 100;
    // annualize the net present cost of all cash flows
    let pw = P; for (let y = 1; y <= N; y++) pw += M / (1 + i) ** y; pw -= S / (1 + i) ** N;
    let ann = 0; for (let y = 1; y <= N; y++) ann += 1 / (1 + i) ** y;
    return pw / ann;
  },

  // ---- Tenth batch (batch-ten.ts)
  "liquidity-index": (p) => { const w = at(p, "content of"), LL = at(p, "liquid limit of"), PL = at(p, "plastic limit of"); return (w - PL) / (LL - PL); },
  "compression-index-oedometer": (p) => {
    const e1 = at(p, "void ratio is"), s1 = at(p, "stress of"), e2 = at(p, "kPa and"), s2 = at(p, nums(p.slice(p.indexOf("kPa and"))).slice(0, 1).join("") + " at");
    return (e1 - e2) / (Math.log(s2 / s1) / Math.LN10);
  },
  "modified-gates-pile": (p) => { const Ed = at(p, "energy of"), Nb = at(p, "set is"); return 1.75 * Math.sqrt(Ed) * (Math.log(10 * Nb) / Math.LN10) - 100; },
  "davisson-offset": (p) => {
    const steel = p.includes("H-pile"), D = steel ? at(p, "width") : at(p, "A"), L = at(p, "is"), P = at(p, "load of");
    const A = steel ? at(p, "A =") : D * D, E = at(p, "E =");
    return P * (L * 12) / (A * E) + 0.15 + D / 120;
  },
  "sign-letter-height": (p) => { const V = at(p, "at"), t = at(p, "need"), extra = at(p, "read"); return (V * 5280 / 3600 * 1.47 / (5280 / 3600) * t + extra) / 30; },
  "pavement-marking-quantity": (p) => {
    const L = at(p, "A") * 5280, pass = at(p, "allowed,");
    return L * 2 + L * (100 - pass) / 100 + L * pass / 100 * (10 / 40);
  },
  "slope-stake-offset": (p) => { const w = at(p, "is"), h = at(p, "centerline is"), s = at(p, "slopes are"); return w / 2 + s * h; },
  "oxygen-sag-minimum-do": (p) => {
    const L0 = at(p, "L₀ ="), D0 = at(p, "D₀ ="), kd = at(p, "deoxygenation rate is"), kr = at(p, "reaeration rate is"), DOs = at(p, "saturation DO is");
    // scan the deficit curve for its maximum
    const D = (t: number) => kd * L0 / (kr - kd) * (Math.exp(-kd * t) - Math.exp(-kr * t)) + D0 * Math.exp(-kr * t);
    let lo = 0, hi = 60; for (let k = 0; k < 200; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (D(m1) < D(m2)) lo = m1; else hi = m2; }
    return DOs - D((lo + hi) / 2);
  },
  "two-axle-max-moment": (p) => {
    const L = at(p, "span of"), P = at(p, "equal"), a = at(p, "spaced");
    // brute-force the axle position and take the largest moment under either axle
    let best = 0;
    for (let k = 0; k <= 4000; k++) {
      const x = (k / 4000) * (L - a); // left axle position, both axles on the span
      const R = P * (L - x) / L + P * (L - x - a) / L;
      best = Math.max(best, R * x, R * (x + a) - P * a);
    }
    return best;
  },
  "live-load-reduction-column": (p) => {
    const AT = at(p, "area of"), L0 = at(p, "load of"); const k = 0.25 + 15 / Math.sqrt(4 * AT);
    return (k < 0.5 ? 0.5 : k) * L0 * AT / 1000;
  },
  "distribution-storage-volume": (p) => {
    const MDD = at(p, "demand is"), eqp = at(p, "equalization of"), ff = at(p, "fire flow of"), hr = at(p, "gpm for"), emp = p.includes("emergency") ? at(p, "emergency storage of") : 0;
    const base = eqp / 100 * MDD + ff * hr * 60 / 1e6; return base * (1 + emp / 100);
  },

  // ---- Eleventh batch (batch-eleven.ts)
  "bolt-group-eccentric": (p) => {
    const nb = at(p, "line of"), s = at(p, "bolts at"), P = at(p, "load of"), e = at(p, "kips acting");
    // check every bolt; take the largest resultant
    const ys = Array.from({ length: nb }, (_, i) => i * s - ((nb - 1) * s) / 2), J = ys.reduce((a, y) => a + y * y, 0);
    return Math.max(...ys.map((y) => Math.hypot(P / nb, (P * e * y) / J)));
  },
  "prestress-elastic-shortening": (p) => {
    const A = at(p, "A ="), I = at(p, "I ="), e = at(p, "eccentricity of"), Pi = at(p, "force is"), MD = at(p, "moment at midspan is"), Eci = at(p, "Eci =");
    const top = Pi / A, ecc = ((Pi * e - MD * 12) * e) / I;
    return (28500 / Eci) * (top + ecc);
  },
  "two-way-slab-thickness": (p) => {
    const L = at(p, "has"), c = at(p, "with");
    const k = p.slice(0, p.indexOf("using ACI")).includes("without edge beams") ? 30 : 33;
    return Math.max((L * 12 - c) / k, 5);
  },
  "lime-softening-dose": (p) => {
    const Q = at(p, "treated at"), CO2 = at(p, "CO₂ ="), alk = at(p, "alkalinity ="), Mg = at(p, "hardness ="), ex = at(p, "Mg²⁺ +");
    return (((CO2 + alk + Mg + ex) / 50) * 28 * Q) / 1000; // meq/L × CaO equivalent weight
  },
  "sludge-thickening-volume": (p) => { const [V1, s1, s2] = nums(p); return V1 / (s2 / s1); },
  "contact-basin-volume": (p) => {
    const CT = at(p, "CT ="), Q = at(p, "flow of"), C = at(p, "residual of"), bf = at(p, "(T₁₀/T) of");
    return (CT / C / bf / (24 * 60)) * Q;
  },
  "thickener-diameter": (p) => { const [Q, s] = nums(p), SLR = at(p, "rate is"); return 2 * Math.sqrt((Q * s * 10) / SLR / Math.PI); },
  "spiral-curve-length": (p) => { const R = at(p, "radius"), V = at(p, "on a"), C = at(p, "C ="); return (3.15 * V * V * V) / R / C; },
  "roundabout-entry-capacity": (p) => { const ve = at(p, "flow is"), vc = at(p, "circulating flow is"); return ve / (1380 / Math.exp(0.00102 * vc)); },
  "toll-booth-queue-wait": (p) => {
    const lam = at(p, "at"), mu = at(p, "rate of");
    return ((lam / mu) / (mu - lam)) * 3600; // Wq = ρ/(μ − λ)
  },
  "geotextile-aos": (p) => {
    const D85 = at(p, "D₈₅ ="), Cu = at(p, "and Cu =");
    let B = 1;
    if (Cu > 2 && Cu <= 4) B = Cu / 2;
    else if (Cu > 4 && Cu < 8) B = 8 / Cu;
    return B * D85;
  },
  "equipment-owning-cost": (p) => {
    const P = at(p, "costs $"), S = at(p, "sold for $"), N = at(p, "after"), hrs = at(p, "works"), rate = at(p, "total") / 100;
    const aai = (P * (N + 1) + S * (N - 1)) / (2 * N);
    return ((P - S) / N + rate * aai) / hrs;
  },

  // ---- Twelfth batch (batch-twelve.ts)
  "shear-wall-uplift": (p) => {
    const L = at(p, "A"), V = at(p, "force of"), h = at(p, "kips applied"), W = at(p, "wall is");
    // moments about the compression end: T·L + 0.6W·L/2 = V·h
    return (V * h - 0.3 * W * L) / L;
  },
  "base-plate-bearing": (p) => {
    const [B, N, B2, N2] = nums(p), fc = at(p, "f'c =");
    const ratio = Math.min(2, Math.sqrt((B2 * N2) / (B * N)));
    return 0.5525 * fc * B * N * ratio; // 0.65 × 0.85 = 0.5525
  },
  "development-length-tension": (p) => {
    const bar = at(p, "#"), db = at(p, "db ="), fc = at(p, "f'c =");
    const pt = p.includes("is a top bar") ? 1.3 : 1, pe = p.includes("epoxy-coated") ? 1.5 : 1;
    const ld = (60000 * Math.min(1.7, pt * pe) * db) / ((bar <= 6 ? 25 : 20) * Math.sqrt(fc));
    return ld < 12 ? 12 : ld;
  },
  "web-local-yielding": (p) => { const tw = at(p, "tw ="), k = at(p, "k ="), lb = at(p, "length is"); return 50 * tw * 5 * k + 50 * tw * lb; },
  "filter-backwash-percent": (p) => {
    const run = at(p, "runs"), fr = at(p, "hours at"), bw = at(p, "backwashed at"), tb = at(p, "m/h for");
    return (bw * tb) / (fr * run * 60) * 100;
  },
  "ion-exchange-run-volume": (p) => { const V = at(p, "holds"), cap = at(p, "capacity of"), H = at(p, "hardness is"); return (V * cap * 1000 * 50) / H; },
  "landfill-leachate-balance": (p) => {
    const A = at(p, "A"), P = at(p, "receives"), R = at(p, "runoff is"), ET = at(p, "evapotranspiration is"), dS = at(p, "changes by");
    return A * 1e4 * ((P - R - ET - dS) / 1000);
  },
  "trickling-filter-organic-loading": (p) => {
    const [D, H, Q, BOD] = nums(p.replace("BOD₅", "BOD"));
    return (Q * BOD) / 1000 / (Math.PI * (D / 2) ** 2 * H);
  },
  "epdo-crash-index": (p) => {
    const F = at(p, "had"), I = at(p, "fatal,"), PDO = at(p, "injury and"), wF = at(p, "weights of"), wI = at(p, "fatal and");
    return F * wF + I * wI + PDO;
  },
  "concrete-pump-time": (p) => { const V = at(p, "needs"), rate = at(p, "rated at"), E = at(p, "pump to"); return V / rate / (E / 100); },
  "rock-socket-side-resistance": (p) => {
    const D = at(p, "A"), L = at(p, "has a"), qu = at(p, "strength of"), aE = at(p, "αE is");
    return 0.65 * aE * Math.sqrt(2.12 * qu) * Math.PI * D * L; // pa(qu/pa)^0.5 = √(pa·qu)
  },

  // ---- Thirteenth batch (batch-thirteen.ts)
  "moment-magnification-nonsway": (p) => {
    const Lu = at(p, "length of") * 12, EI = at(p, "(EI)eff =") * 1e6, Pu = at(p, "Pu ="), M1 = at(p, "M₁ ="), M2 = at(p, "M₂ =");
    const single = p.includes("bent in single");
    const Pc = (Math.PI * Math.PI * EI) / (Lu * Lu);
    const Cm = 0.6 - 0.4 * (single ? M1 / M2 : -M1 / M2);
    return Math.max(1, Cm / (1 - Pu / (0.75 * Pc))) * M2;
  },
  "wood-bolt-group-capacity": (p) => {
    const nb = at(p, "uses"), Z = at(p, "Z ="), CD = at(p, "CD ="), CM = at(p, "CM ="), Cg = at(p, "Cg =");
    return [nb, Z, CD, CM, Cg].reduce((a, b) => a * b, 1) / 1000;
  },
  "base-plate-thickness": (p) => {
    const d = at(p, "d ="), bf = at(p, "bf ="), Pu = at(p, "Pu ="), m = p.match(/on a (\d+) in × (\d+) in base plate/)!;
    const B = Number(m[1]), N = Number(m[2]);
    const l = Math.max((N - 0.95 * d) / 2, (B - 0.8 * bf) / 2);
    return l * Math.sqrt((2 * Pu) / (0.9 * 36 * B * N));
  },
  "sequent-peak-storage": (p) => {
    const D = at(p, "constant");
    const flows = nums(p.slice(p.indexOf("dry period are") + 14, p.indexOf("million m³. Ignoring")));
    // largest cumulative shortfall over any run of consecutive months (max-subarray of D − I)
    let best = 0;
    for (let i = 0; i < flows.length; i++) { let s = 0; for (let j = i; j < flows.length; j++) { s += D - flows[j]; best = Math.max(best, s); } }
    return best;
  },
  "sediment-basin-stokes": (p) => {
    const d = at(p, "particles") / 1000, Q = at(p, "inflow of");
    const vs = (9.81 * 1652 * d * d) / (18 * 1.002e-3);
    return Q / vs;
  },
  "network-node-pressure": (p) => {
    const Ws = at(p, "elevation"), z = at(p, "ground elevation"), L = at(p, "through"), Din = Number(p.match(/ft of (\d+)-in main/)![1]), C = at(p, "C ="), Q = at(p, "carrying");
    const D = Din / 12, hf = (4.73 * L * Math.pow(Q, 1.852)) / (Math.pow(C, 1.852) * Math.pow(D, 4.87));
    return ((Ws - hf - z) * 62.4) / 144; // γh in psi
  },
  "parking-peak-accumulation": (p) => {
    const N0 = at(p, "holds");
    const arr = nums(p.slice(p.indexOf("arrivals of") + 11, p.indexOf(" and departures")));
    const dep = nums(p.slice(p.indexOf("departures of") + 13, p.indexOf(". What")));
    let occ = N0, peak = N0;
    arr.forEach((a, i) => { occ += a - dep[i]; peak = Math.max(peak, occ); });
    return peak;
  },
  "walkway-pedestrian-space": (p) => {
    const W = at(p, "A"), shy = at(p, "loses"), P15 = at(p, "minutes,"), S = at(p, "average");
    return (S * 15 * (W - shy)) / P15;
  },
  "spot-speed-85th": (p) => { const m = at(p, "mean speed of"), s = at(p, "deviation of"); return m + 1.036 * s; },
  "space-mean-speed": (p) => { const v = nums(p.slice(p.indexOf("clocked at") + 10)); return 1 / (v.reduce((a, x) => a + 1 / x, 0) / v.length); },
  "cost-loaded-cumulative": (p) => {
    const acts = [...p.matchAll(/([A-D]) starts at week (\d+), lasts (\d+) weeks, costs \$([\d,]+)/g)].map((m) => ({ s: Number(m[2]), d: Number(m[3]), c: Number(m[4].replace(/,/g, "")) }));
    const wk = at(p, "end of week");
    // add up week by week
    let tot = 0;
    for (const a of acts) for (let w = 1; w <= wk; w++) if (w > a.s && w <= a.s + a.d) tot += a.c / a.d;
    return tot;
  },
  "preload-surcharge-time": (p) => {
    const sPerm = at(p, "settle"), sTot = at(p, "settlement to"), H = at(p, "alone, a"), cv = at(p, "cv ="), dbl = p.includes("top and bottom");
    const U = sPerm / sTot;
    const Tv = U <= 0.6 ? (Math.PI / 4) * U * U : 1.781 - 0.933 * Math.log10(100 - U * 100);
    const Hdr = dbl ? H / 2 : H;
    return (Tv * Hdr * Hdr) / cv;
  },

  // ---- Fourteenth batch (batch-fourteen.ts)
  "sway-moment-magnification": (p) => {
    const SPu = at(p, "ΣPu ="), SPc = at(p, "ΣPc ="), Mns = at(p, "(nonsway) loads is"), Ms = at(p, "(sway) loads is");
    const ds = Math.max(1, 1 / (1 - SPu / (0.75 * SPc)));
    return Mns + ds * Ms;
  },
  "timber-beam-stability-cl": (p) => {
    const m = p.match(/A ([\d.]+) in × ([\d.]+) in/)!, b = Number(m[1]), d = Number(m[2]);
    const le = at(p, "ℓe ="), Emin = at(p, "E'min ="), Fbs = at(p, "CV) =");
    const FbE = (1.2 * Emin * b * b) / (le * d), a = FbE / Fbs;
    // the NDS expression is the smaller root of 0.95·CL² − (1 + α)·CL + α = 0
    const A = 0.95, B = -(1 + a), C = a;
    return (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  },
  "hardy-cross-correction": (p) => {
    const pipes = [...p.matchAll(/pipe [A-D]: \+?(-?[\d.]+) cfs \(k = ([\d.]+)\)/g)].map((m) => ({ Q: Number(m[1]), k: Number(m[2]) }));
    let num = 0, den = 0;
    for (const { Q, k } of pipes) { const h = k * Math.sign(Q) * Math.pow(Math.abs(Q), 1.852); num += h; den += 1.852 * k * Math.pow(Math.abs(Q), 0.852); }
    return -num / den;
  },
  "pump-operating-point": (p) => {
    const pm = p.match(/H = (\d+) − ([\d.]+)Q²/)!, sm = p.match(/H = (\d+) \+ ([\d.]+)Q²/)!;
    const H0 = Number(pm[1]), a = Number(pm[2]), Hs = Number(sm[1]), K = Number(sm[2]);
    // bisection on pump head minus system head
    let lo = 0, hi = 100; for (let i = 0; i < 200; i++) { const q = (lo + hi) / 2; if (H0 - a * q * q > Hs + K * q * q) lo = q; else hi = q; }
    return lo;
  },
  "gumbel-flood-frequency": (p) => {
    const mean = at(p, "mean of"), sd = at(p, "deviation of"), T = at(p, "what is the");
    const yT = -Math.log(-Math.log(1 - 1 / T)); // reduced variate
    const K = (Math.sqrt(6) / Math.PI) * (yT - 0.5772);
    return mean + K * sd;
  },
  "signal-uniform-delay": (p) => {
    const C = at(p, "has a"), g = at(p, "cycle with"), v = at(p, "uniform at") / 3600, s = 0.5;
    // area of the queue triangle per cycle divided by vehicles per cycle
    const r = C - g, Qmax = v * r, t0 = Qmax / (s - v);
    return (0.5 * Qmax * (r + t0)) / (v * C);
  },
  "learning-curve-unit-time": (p) => { const T1 = at(p, "takes"), rate = at(p, "along a") / 100, N = at(p, "pier number"); return T1 * Math.pow(rate, Math.log2(N)); },
  "cost-index-capacity-scaling": (p) => {
    const S1 = at(p, "A"), I1 = at(p, "index was"), C1 = at(p, "cost $"), S2 = at(p, "cost of a"), I2 = at(p, "today (index");
    return C1 * Math.exp(0.6 * Math.log(S2 / S1)) * (I2 / I1);
  },
  "crane-lift-percent-capacity": (p) => {
    const load = at(p, "lift a"), rig = at(p, "weighs"), hook = at(p, "hook block"), jib = p.includes("jib requires") ? at(p, "requires a") : 0, cap = at(p, "planned radius is");
    return ((load + rig + hook + jib) * 100) / cap;
  },
  "dynamic-compaction-depth": (p) => { const W = at(p, "drops a"), H = at(p, "weight from"), nn = at(p, "n ="); return nn * Math.sqrt(W * H); },
  "mse-pullout-resistance": (p) => {
    const z = at(p, "layer"), gm = at(p, "γ ="), Le = at(p, "extends"), Fs = at(p, "F* =");
    return 2 * 0.8 * Fs * gm * z * Le;
  },

  // ---- Fifteenth batch (batch-fifteen.ts)
  "block-shear-plate": (p) => {
    const t = at(p, "A"), Fy = at(p, "Fy ="), Fu = at(p, "Fu ="), nb = at(p, "line of"), d = at(p, "bolts ("), s = at(p, "load at"), Le = at(p, "end distance is"), e2 = at(p, "side edge is");
    const dh = d + 1 / 8, L = Le + (nb - 1) * s;
    const shearRupture = 0.6 * Fu * (L - (nb - 0.5) * dh) * t, shearYield = 0.6 * Fy * L * t, tension = Fu * (e2 - dh / 2) * t;
    return 0.75 * (Math.min(shearRupture, shearYield) + tension);
  },
  "shear-studs-full-composite": (p) => {
    const As = at(p, "As ="), beff = at(p, "width of"), t = at(p, "and a"), fc = at(p, "f'c ="), Qn = at(p, "Qn =");
    const C = Math.min(0.85 * fc * beff * t, 50 * As);
    return 2 * Math.ceil(C / Qn - 1e-9);
  },
  "coulomb-active-thrust": (p) => {
    const H = at(p, "retains"), gm = at(p, "γ ="), phi = rad(at(p, "φ =")), d = rad(at(p, "δ ="));
    const root = Math.sqrt((Math.sin(phi + d) * Math.sin(phi)) / Math.cos(d));
    return (0.5 * gm * H * H * Math.cos(phi) ** 2) / (Math.cos(d) * (1 + root) * (1 + root));
  },
  "mononobe-okabe-thrust": (p) => {
    const H = at(p, "A"), gm = at(p, "γ ="), phi = rad(at(p, "φ =")), d = rad(at(p, "δ =")), kh = at(p, "kh =");
    const th = Math.atan2(kh, 1);
    const root = Math.sqrt((Math.sin(phi + d) * Math.sin(phi - th)) / Math.cos(d + th));
    const KAE = Math.cos(phi - th) ** 2 / (Math.cos(th) * Math.cos(d + th) * (1 + root) ** 2);
    return 0.5 * gm * H * H * KAE;
  },
  "secondary-compression": (p) => {
    const H = at(p, "A"), t1 = at(p, "after"), ep = at(p, "void ratio is"), Ca = at(p, "Cα is"), t2 = at(p, "end of primary consolidation and");
    return ((Ca * H) / (1 + ep)) * (Math.log(t2 / t1) / Math.LN10) * 1000;
  },
  "infiltration-trench-length": (p) => {
    const A = at(p, "from a"), C = at(p, "coefficient"), P = at(p, "for a"), W = at(p, "trench is"), D = at(p, "ft wide and"), nv = at(p, "porosity");
    return (C * P * A * 3630) / (nv * W * D); // 1 ac·in = 3,630 ft³
  },
  "aerated-grit-chamber": (p) => {
    const Q = at(p, "flow of"), t = at(p, "with"), D = at(p, "It is"), ratio = at(p, "ratio of");
    return (Q * t * 60) / (ratio * D * D);
  },
  "wet-well-volume": (p) => { const q = at(p, "delivers"), th = at(p, "starts) is"); return (q * th) / 4; },
  "freeway-merge-flow": (p) => { const vF = at(p, "vF ="), PFM = at(p, "PFM ="), vR = at(p, "vR ="); return vF * PFM + vR; },
  "required-superelevation": (p) => { const R = at(p, "radius"), V = at(p, "designed for"), fr = at(p, "factor of"); return (V * V / (15 * R) - fr) * 100; },
  "earthwork-overhaul": (p) => {
    const V = at(p, "diagram,"), d = at(p, "fill is"), FH = at(p, "free-haul distance is"), price = at(p, "at $");
    return price * V * ((d - FH) / 100);
  },
};


export interface VerifyResult {
  ok: boolean;
  /** Largest relative difference between the marked answer and the independent solution. */
  worstError: number;
  variants: number;
  duplicateChoices: number;
  /** Variants where two choices sit closer together than the template's minimum gap. */
  crowdedChoices: number;
  fallbackChoices: number;
  worstPrompt: string;
  reason?: string;
}

/** Re-solve `n` variants of a template. Passes when every marked answer is within 0.1% and choices are distinct. */
export function verifyTemplate(t: Template, n = 200): VerifyResult {
  const solve = SOLVERS[t.id];
  if (!solve) return { ok: false, worstError: NaN, variants: 0, duplicateChoices: 0, crowdedChoices: 0, fallbackChoices: 0, worstPrompt: "", reason: "no independent solver for this template" };
  let worst = 0, dupes = 0, fallback = 0, crowded = 0, worstPrompt = "";
  for (let k = 1; k <= n; k++) {
    const v = buildVariant(t, k * 7919);
    const gap = (t.generate(makeRng(k * 7919)).minGap ?? 0.03) * 0.999;
    const vs = [...v.values].sort((a, b) => a - b);
    if (vs.length !== 4 || vs.some((x, i) => i > 0 && (x - vs[i - 1]) / Math.abs(v.answerValue) < gap)) crowded++;
    const expected = solve(v.prompt);
    const err = Math.abs(v.answerValue - expected) / Math.abs(expected);
    if (!(err <= worst)) { worst = Number.isFinite(err) ? err : Infinity; worstPrompt = v.prompt; }
    if (v.usedFallback) fallback++;
    if (new Set(v.choices).size !== v.choices.length) dupes++;
  }
  const ok = worst < 1e-3 && dupes === 0 && crowded === 0;
  return {
    ok, worstError: worst, variants: n, duplicateChoices: dupes, crowdedChoices: crowded, fallbackChoices: fallback, worstPrompt,
    reason: ok ? undefined : dupes ? "duplicate answer choices" : crowded ? "answer choices too close together" : "marked answer doesn't match the independent solution",
  };
}
