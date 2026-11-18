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
