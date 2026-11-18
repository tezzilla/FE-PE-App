import { f, n, type Template } from "./engine";

// Second batch from the exam spec review (docs/EXAM-COVERAGE.md "Next batch"): connections, seismic
// base shear, tributary loads, CPM and crashing, retaining wall stability, SPT and liquefaction,
// seepage, activated sludge, superelevation, sight clearance, pavement design, plus FE gaps.
// All problem text is original. Code factors and constants are stated in the prompt.
// Each template has an independent solver in verify.ts.

const gw = 9.81;
const rad = (x: number) => (x * Math.PI) / 180;

// ---------------------------------------------------------------- Structural

const FRACTION: Record<number, string> = { 3: "3/16", 4: "1/4", 5: "5/16", 6: "3/8", 8: "1/2" };

const STRUCT: Template[] = [
  {
    id: "fillet-weld-strength",
    version: 1,
    title: "LRFD design strength of fillet welds",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "AISC 360 Section J2.4: fillet weld strength",
    generate(r) {
      const w16 = r.pick([3, 4, 5, 6, 8]);
      const w = w16 / 16;
      const L = r.range(4, 24, 0.5);
      const FEXX = 70;
      const phiRn = 0.75 * 0.6 * FEXX * 0.707 * w * L;
      return {
        prompt: `Two plates are joined by fillet welds with a total length of ${n(L)} in. The welds are ${FRACTION[w16]} in fillets made with E70 electrodes (FEXX = ${FEXX} ksi). Ignoring base metal limits and any increase for load direction, what is the LRFD design strength of the welds?`,
        answer: phiRn,
        unit: "kips",
        distractors: [
          0.75 * 0.6 * FEXX * w * L, // used the leg size as the throat (no 0.707)
          0.75 * FEXX * 0.707 * w * L, // left out the 0.60 on FEXX
          0.6 * FEXX * 0.707 * w * L, // forgot φ = 0.75
        ],
        solution: `Effective throat = 0.707w = 0.707 × ${f(w, 4)} = ${f(0.707 * w, 4)} in\nFnw = 0.60FEXX = 0.60 × ${FEXX} = 42 ksi\nφRn = 0.75 × 42 × ${f(0.707 * w, 4)} × ${n(L)} = ${f(phiRn)} kips`,
      };
    },
  },
  {
    id: "bolt-shear-bearing",
    version: 1,
    title: "Bolted lap splice: bolt shear vs. bearing",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "AISC 360 Sections J3.6 and J3.10: bolt shear and bearing",
    generate(r) {
      const nb = r.range(2, 8, 1);
      const d = r.pick([0.75, 0.875, 1.0]);
      const Fnv = r.pick([54, 68]);
      const t = r.pick([0.25, 0.3125, 0.375, 0.5, 0.625]);
      const Fu = r.pick([58, 65]);
      const Ab = (Math.PI * d * d) / 4;
      const shear = 0.75 * Fnv * Ab;
      const bearing = 0.75 * 2.4 * d * t * Fu;
      const per = Math.min(shear, bearing);
      return {
        prompt: `A single-shear lap splice uses ${nb} bolts of ${n(d)} in diameter with a nominal shear stress Fnv = ${Fnv} ksi. The thinner connected plate is ${n(t)} in thick with Fu = ${Fu} ksi. Edge distances and spacing are large enough that tearout doesn't govern, and deformation at the holes is a design consideration (bearing Rn = 2.4dtFu). With φ = 0.75, what is the design strength of the connection?`,
        answer: nb * per,
        unit: "kips",
        distractors: [
          nb * Math.max(shear, bearing), // used the larger of shear and bearing
          (nb * per) / 0.75, // forgot φ
          nb * 0.75 * 3.0 * d * t * Fu, // used 3.0dtFu (deformation not a consideration)
          nb * 0.75 * Fnv * d * d, // used d² instead of πd²/4 for the bolt area
        ],
        solution: `Bolt area Ab = π(${n(d)})²/4 = ${f(Ab, 4)} in²\nShear per bolt: φRn = 0.75 × ${Fnv} × ${f(Ab, 4)} = ${f(shear)} kips\nBearing per bolt: φRn = 0.75 × 2.4 × ${n(d)} × ${n(t)} × ${Fu} = ${f(bearing)} kips\n${shear <= bearing ? "Shear" : "Bearing"} governs: ${nb} × ${f(per)} = ${f(nb * per)} kips`,
      };
    },
  },
  {
    id: "tributary-girder-moment",
    version: 1,
    title: "Factored moment in a floor girder from tributary area",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "ASCE 7 Section 2.3 load combinations; tributary width",
    generate(r) {
      const s = r.range(6, 15, 0.5);
      const L = r.range(20, 45, 1);
      const D = r.range(50, 120, 5);
      const Lv = r.pick([40, 50, 80, 100, 125]);
      const wu = (s * (1.2 * D + 1.6 * Lv)) / 1000;
      const Mu = (wu * L * L) / 8;
      return {
        prompt: `Interior floor girders spaced ${n(s)} ft on center span ${L} ft and are simply supported. The floor dead load is ${D} psf (including the girder self-weight) and the live load is ${Lv} psf, with no live load reduction. Using 1.2D + 1.6L, what is the factored maximum moment in an interior girder?`,
        answer: Mu,
        unit: "kip·ft",
        distractors: [
          ((s / 2) * (1.2 * D + 1.6 * Lv) * L * L) / 8000, // used half the spacing (an edge girder's tributary width)
          (s * (D + Lv) * L * L) / 8000, // used service loads
          (wu * L * L) / 12, // used wL²/12 (fixed ends)
        ],
        solution: `Tributary width = girder spacing = ${n(s)} ft\nw_u = ${n(s)} × (1.2 × ${D} + 1.6 × ${Lv}) = ${f(wu * 1000)} lb/ft = ${f(wu, 4)} kip/ft\nM_u = w_u L²/8 = ${f(wu, 4)} × ${L}²/8 = ${f(Mu)} kip·ft`,
      };
    },
  },
  {
    id: "seismic-base-shear-elf",
    version: 1,
    title: "Seismic base shear by the equivalent lateral force procedure",
    topics: { "pe-civil": "structural" },
    reference: "ASCE 7 Section 12.8: seismic response coefficient Cs",
    generate(r) {
      const W = r.range(500, 8000, 50);
      const SDS = r.range(0.3, 1.5, 0.01);
      const SD1 = r.range(0.1, Math.min(0.6, 0.8 * SDS), 0.01);
      const R = r.pick([3, 3.5, 5, 6, 7, 8]);
      const Ie = r.pick([1.0, 1.25, 1.5]);
      const T = r.range(0.2, 2.0, 0.05);
      const base = SDS / (R / Ie);
      const cap = SD1 / (T * (R / Ie));
      const floor = Math.max(0.044 * SDS * Ie, 0.01);
      const Cs = Math.max(Math.min(base, cap), floor);
      const which = Cs === floor ? "the minimum governs" : base <= cap ? "SDS/(R/Ie) governs" : "the SD1/[T(R/Ie)] limit governs";
      return {
        prompt: `A building has seismic weight W = ${n(W)} kips. SDS = ${n(SDS)}, SD1 = ${n(SD1)}, R = ${n(R)}, Ie = ${Ie.toFixed(2)} and the fundamental period T = ${n(T)} s (T is less than TL, and S1 is less than 0.6g). Using the ASCE 7 equivalent lateral force procedure, with Cs = SDS/(R/Ie) but not more than SD1/[T(R/Ie)] and not less than 0.044SDS·Ie or 0.01, what is the seismic base shear?`,
        answer: Cs * W,
        unit: "kips",
        distractors: [
          base * W, // used SDS/(R/Ie) without checking the period-based limit
          Math.max(Math.min(SDS / R, SD1 / (T * R)), floor) * W, // left out Ie
          cap * W, // always used the SD1 limit
        ],
        solution: `SDS/(R/Ie) = ${n(SDS)}/(${n(R)}/${Ie.toFixed(2)}) = ${f(base, 4)}\nUpper limit SD1/[T(R/Ie)] = ${n(SD1)}/[${n(T)} × ${f(R / Ie, 4)}] = ${f(cap, 4)}\nLower limit = max(0.044 × ${n(SDS)} × ${Ie.toFixed(2)}, 0.01) = ${f(floor, 4)}\nCs = ${f(Cs, 4)} (${which})\nV = Cs W = ${f(Cs, 4)} × ${n(W)} = ${f(Cs * W)} kips`,
      };
    },
  },
];

// ---------------------------------------------------------------- Construction

type Act = { id: string; d: number; pre: string[] };

function cpm(acts: Act[]) {
  const es: Record<string, number> = {}, ef: Record<string, number> = {};
  for (const a of acts) {
    es[a.id] = Math.max(0, ...a.pre.map((p) => ef[p]));
    ef[a.id] = es[a.id] + a.d;
  }
  const T = Math.max(...acts.map((a) => ef[a.id]));
  const ls: Record<string, number> = {}, lf: Record<string, number> = {};
  for (const a of [...acts].reverse()) {
    const succ = acts.filter((s) => s.pre.includes(a.id));
    lf[a.id] = succ.length ? Math.min(...succ.map((s) => ls[s.id])) : T;
    ls[a.id] = lf[a.id] - a.d;
  }
  return { es, ef, ls, lf, T };
}

const CONSTR: Template[] = [
  {
    id: "cpm-total-float",
    version: 1,
    title: "Total float of an activity (critical path method)",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Project scheduling: CPM forward and backward pass",
    generate(r) {
      for (;;) {
        const d = () => r.range(2, 12, 1);
        const acts: Act[] = [
          { id: "A", d: d(), pre: [] },
          { id: "B", d: d(), pre: ["A"] },
          { id: "C", d: d(), pre: ["A"] },
          { id: "D", d: d(), pre: ["B"] },
          { id: "E", d: d(), pre: ["B", "C"] },
          { id: "F", d: d(), pre: ["D", "E"] },
        ];
        const x = r.pick(["B", "C", "D", "E"]);
        const c = cpm(acts);
        const TF = c.ls[x] - c.es[x];
        if (TF < 2) continue;
        const succ = acts.filter((s) => s.pre.includes(x));
        const FF = Math.min(...succ.map((s) => c.es[s.id])) - c.ef[x];
        const list = acts.map((a) => `${a.id} ${a.d}, ${a.pre.length ? `after ${a.pre.join(" and ")}` : "no predecessor"}`).join("; ");
        return {
          prompt: `A project has these activities (durations in days): ${list}. What is the total float of activity ${x}?`,
          answer: TF,
          unit: "days",
          distractors: [
            FF, // gave the free float
            c.ls[x], // gave the late start
            c.T - acts.find((a) => a.id === x)!.d, // subtracted the duration from the project length
          ],
          solution: `Forward pass (ES, EF): ${acts.map((a) => `${a.id} ${c.es[a.id]}–${c.ef[a.id]}`).join(", ")}. Project duration = ${c.T} days.\nBackward pass for ${x}: LF = ${c.lf[x]}, LS = ${c.ls[x]}\nTotal float = LS − ES = ${c.ls[x]} − ${c.es[x]} = ${TF} days`,
        };
      }
    },
  },
  {
    id: "least-cost-crashing",
    version: 1,
    title: "Least added cost to shorten a schedule (crashing)",
    topics: { "pe-civil": "construction" },
    reference: "Project scheduling: time-cost trade-off, cost slope",
    generate(r) {
      const acts = ["P", "Q", "R", "S"].map((id) => {
        const dn = r.range(5, 14, 1);
        const red = r.range(1, 3, 1);
        const cn = r.range(8000, 40000, 500);
        const slope = r.range(400, 4000, 100);
        return { id, dn, dc: dn - red, cn, cc: cn + slope * red, slope, red };
      });
      const maxRed = acts.reduce((a, x) => a + x.red, 0);
      const N = r.range(2, Math.min(maxRed, 6), 1);
      const fl = N + r.range(1, 4, 1);
      let rem = N, cost = 0;
      for (const a of [...acts].sort((p, q) => p.slope - q.slope)) {
        const k = Math.min(a.red, rem);
        cost += k * a.slope;
        rem -= k;
      }
      let worst = 0;
      rem = N;
      for (const a of [...acts].sort((p, q) => q.slope - p.slope)) {
        const k = Math.min(a.red, rem);
        worst += k * a.slope;
        rem -= k;
      }
      const minSlope = Math.min(...acts.map((a) => a.slope));
      const data = acts.map((a) => `${a.id}: normal ${a.dn} days at $${n(a.cn)}, crash ${a.dc} days at $${n(a.cc)}`).join("; ");
      return {
        prompt: `A project's critical path runs through activities P, Q, R and S in sequence. The only other path has ${fl} days of float, so it stays non-critical. Normal and crash data: ${data}. To shorten the project by ${N} days at the least added cost, what is the added cost?`,
        answer: cost,
        unit: "$",
        distractors: [
          worst, // crashed the most expensive activities first
          minSlope * N, // used the cheapest cost slope for every day, ignoring crash limits
          acts.reduce((a, x) => a + (x.cc - x.cn), 0), // crashed every activity fully
          (acts.reduce((a, x) => a + x.slope, 0) / 4) * N, // used the average cost slope
        ],
        solution: `Cost slope = (crash cost − normal cost)/(normal − crash duration):\n${acts.map((a) => `${a.id}: (${n(a.cc)} − ${n(a.cn)})/${a.red} = $${n(a.slope)}/day, up to ${a.red} day(s)`).join("\n")}\nCrash the cheapest slopes first until ${N} days are saved: added cost = $${n(cost)}`,
      };
    },
  },
  {
    id: "average-end-area-volume",
    version: 1,
    title: "Earthwork volume by the average end area method",
    topics: { "fe-civil": "surveying", "pe-civil": "construction" },
    reference: "Earthwork: average end area method",
    generate(r) {
      const L = r.pick([25, 50, 100]);
      const A1 = r.range(50, 600, 5);
      const A2 = r.range(50, 600, 5);
      const V = (L * (A1 + A2)) / 2 / 27;
      return {
        prompt: `Two cut cross sections ${L} ft apart have end areas of ${A1} ft² and ${A2} ft². Using the average end area method, what is the volume of cut between them?`,
        answer: V,
        unit: "yd³",
        distractors: [
          (L * (A1 + A2)) / 2, // left the volume in ft³
          (L * (A1 + A2)) / 27, // forgot to average the end areas
          (L * Math.max(A1, A2)) / 27, // used the larger end area only
        ],
        solution: `V = L(A₁ + A₂)/2 = ${L}(${A1} + ${A2})/2 = ${n((L * (A1 + A2)) / 2)} ft³\n÷ 27 ft³/yd³ = ${f(V)} yd³`,
      };
    },
  },
];

// ---------------------------------------------------------------- Geotechnical

function wall(r: Parameters<Template["generate"]>[0]) {
  const H = r.range(2, 6, 0.25);
  const B = Number((H * r.range(0.45, 0.8, 0.05)).toFixed(2));
  const gc = 23.6;
  const gm = r.range(17, 20, 0.5);
  const phi = r.range(28, 36, 1);
  const mu = r.range(0.45, 0.6, 0.05);
  const Ka = Math.tan(rad(45 - phi / 2)) ** 2;
  const Pa = 0.5 * Ka * gm * H * H;
  const W = gc * B * H;
  const text = `A rectangular concrete gravity wall (23.6 kN/m³) is ${n(H)} m tall and ${n(B)} m wide. It retains level, drained granular backfill (γ = ${n(gm)} kN/m³, φ = ${phi}°) to its full height, with no surcharge. The base friction coefficient is ${n(mu)}. Use Rankine active pressure and ignore passive resistance and wall friction.`;
  return { H, B, gc, gm, phi, mu, Ka, Pa, W, text };
}

const GEO: Template[] = [
  {
    id: "retaining-wall-sliding",
    version: 1,
    title: "Factor of safety against sliding for a gravity retaining wall",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Retaining walls: external stability, sliding",
    generate(r) {
      for (;;) {
        const w = wall(r);
        const FS = (w.mu * w.W) / w.Pa;
        if (FS < 0.8 || FS > 3) continue;
        return {
          prompt: `${w.text} What is the factor of safety against sliding?`,
          answer: FS,
          unit: "",
          distractors: [
            (w.mu * w.W) / (w.Ka * w.gm * w.H * w.H), // left out the ½ in the thrust
            (Math.tan(rad(w.phi)) * w.W) / w.Pa, // used tan φ of the backfill as the base friction
            (w.mu * w.W) / (0.5 * (1 - Math.sin(rad(w.phi))) * w.gm * w.H * w.H), // used at-rest K₀
          ],
          solution: `Ka = tan²(45° − ${w.phi}°/2) = ${f(w.Ka, 4)}\nPa = ½Kaγ H² = ½(${f(w.Ka, 4)})(${n(w.gm)})(${n(w.H)})² = ${f(w.Pa)} kN/m\nW = 23.6 × ${n(w.B)} × ${n(w.H)} = ${f(w.W)} kN/m\nFS = μW/Pa = ${n(w.mu)} × ${f(w.W)}/${f(w.Pa)} = ${f(FS)}`,
        };
      }
    },
  },
  {
    id: "retaining-wall-overturning",
    version: 1,
    title: "Factor of safety against overturning for a gravity retaining wall",
    topics: { "pe-civil": "geotechnical" },
    reference: "Retaining walls: external stability, overturning about the toe",
    generate(r) {
      for (;;) {
        const w = wall(r);
        const Mr = (w.W * w.B) / 2;
        const Mo = (w.Pa * w.H) / 3;
        const FS = Mr / Mo;
        if (FS < 0.8 || FS > 4) continue;
        return {
          prompt: `${w.text} What is the factor of safety against overturning about the toe?`,
          answer: FS,
          unit: "",
          distractors: [
            Mr / ((w.Pa * w.H) / 2), // applied the thrust at H/2 instead of H/3
            (w.W * w.B) / Mo, // used the full base width as the weight's lever arm
            Mr / ((w.Ka * w.gm * w.H * w.H * w.H) / 3), // left out the ½ in the thrust
          ],
          solution: `Ka = tan²(45° − ${w.phi}°/2) = ${f(w.Ka, 4)}; Pa = ½KaγH² = ${f(w.Pa)} kN/m, acting H/3 = ${f(w.H / 3)} m above the base\nW = 23.6 × ${n(w.B)} × ${n(w.H)} = ${f(w.W)} kN/m, acting B/2 = ${f(w.B / 2)} m from the toe\nM_R = ${f(Mr)} kN·m/m, M_O = ${f(Mo)} kN·m/m\nFS = ${f(Mr)}/${f(Mo)} = ${f(FS)}`,
        };
      }
    },
  },
  {
    id: "spt-n160",
    version: 1,
    title: "Corrected SPT blow count (N₁)₆₀",
    topics: { "pe-civil": "geotechnical" },
    reference: "In situ testing: SPT energy and overburden corrections",
    generate(r) {
      const z = r.range(3, 15, 0.5);
      const dw = r.range(1, z - 0.5, 0.5);
      const gm = r.range(17, 19, 0.5);
      const gs = r.range(19, 21, 0.5);
      const N = r.range(5, 40, 1);
      const ER = r.pick([60, 70, 80, 90]);
      const CR = r.pick([0.85, 0.95, 1.0]);
      const sv = gm * dw + gs * (z - dw);
      const se = sv - gw * (z - dw);
      const N60 = (N * ER * CR) / 60;
      const CN = Math.min(1.7, Math.sqrt(100 / se));
      const ans = CN * N60;
      return {
        prompt: `An SPT at a depth of ${n(z)} m in sand gives a field blow count of ${N}. The water table is ${n(dw)} m below the surface; the soil weighs ${n(gm)} kN/m³ above it and ${n(gs)} kN/m³ below it. The hammer energy ratio is ${ER}%, the rod length correction is ${n(CR)}, and the borehole and sampler corrections are 1.0. Using CN = (Pa/σ'v)^0.5 ≤ 1.7 with Pa = 100 kPa, what is the corrected blow count (N₁)₆₀?`,
        answer: ans,
        unit: "blows/ft",
        distractors: [
          Math.min(1.7, Math.sqrt(100 / sv)) * N60, // used total stress in CN
          N60, // skipped the overburden correction
          CN * N * CR, // skipped the energy correction
          CN * ((N * 60 * CR) / ER), // inverted the energy ratio
        ],
        solution: `σv = ${n(gm)}(${n(dw)}) + ${n(gs)}(${f(z - dw)}) = ${f(sv)} kPa; u = 9.81(${f(z - dw)}) = ${f(gw * (z - dw))} kPa; σ'v = ${f(se)} kPa\nN₆₀ = N(ER/60)C_R = ${N}(${ER}/60)(${n(CR)}) = ${f(N60)}\nCN = (100/${f(se)})^0.5 = ${f(Math.sqrt(100 / se), 4)}${Math.sqrt(100 / se) > 1.7 ? " → capped at 1.7" : ""}\n(N₁)₆₀ = ${f(CN, 4)} × ${f(N60)} = ${f(ans)}`,
      };
    },
  },
  {
    id: "liquefaction-csr",
    version: 1,
    title: "Cyclic stress ratio for liquefaction screening",
    topics: { "pe-civil": "geotechnical" },
    reference: "Seismic analysis: simplified procedure (Seed and Idriss) for CSR",
    generate(r) {
      const z = r.range(3, 9, 0.5);
      const dw = r.range(0.5, z - 1, 0.5);
      const gm = r.range(17, 19, 0.5);
      const gs = r.range(19, 21, 0.5);
      const a = r.range(0.1, 0.5, 0.01);
      const sv = gm * dw + gs * (z - dw);
      const se = sv - gw * (z - dw);
      const rd = 1 - 0.00765 * z;
      const CSR = 0.65 * a * (sv / se) * rd;
      return {
        prompt: `A saturated sand layer is checked for liquefaction at a depth of ${n(z)} m. The water table is ${n(dw)} m deep; the soil weighs ${n(gm)} kN/m³ above it and ${n(gs)} kN/m³ below it. The peak ground surface acceleration is ${n(a)}g. Using the simplified procedure, CSR = 0.65(amax/g)(σv/σ'v)rd with rd = 1 − 0.00765z (z in m), what is the cyclic stress ratio? (γw = 9.81 kN/m³)`,
        answer: CSR,
        unit: "",
        distractors: [
          0.65 * a * (sv / se), // left out rd
          a * (sv / se) * rd, // left out the 0.65
          0.65 * a * (se / sv) * rd, // inverted the stress ratio
        ],
        solution: `σv = ${n(gm)}(${n(dw)}) + ${n(gs)}(${f(z - dw)}) = ${f(sv)} kPa\nσ'v = ${f(sv)} − 9.81(${f(z - dw)}) = ${f(se)} kPa\nrd = 1 − 0.00765(${n(z)}) = ${f(rd, 4)}\nCSR = 0.65(${n(a)})(${f(sv)}/${f(se)})(${f(rd, 4)}) = ${f(CSR)}`,
      };
    },
  },
  {
    id: "flow-net-seepage",
    version: 1,
    title: "Seepage under a structure from a flow net",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Groundwater and seepage: flow nets",
    generate(r) {
      const k = r.range(0.05, 3, 0.05);
      const H = r.range(3, 15, 0.5);
      const Nf = r.range(3, 6, 1);
      const Nd = r.range(8, 16, 1);
      const L = r.range(50, 300, 10);
      const q = k * H * (Nf / Nd) * L;
      return {
        prompt: `A flow net drawn under a concrete dam has ${Nf} flow channels and ${Nd} equipotential drops. The head difference across the dam is ${n(H)} m, the foundation soil's hydraulic conductivity is ${n(k)} m/day, and the dam is ${L} m long. What is the total seepage under the dam?`,
        answer: q,
        unit: "m³/day",
        distractors: [
          k * H * (Nd / Nf) * L, // inverted the shape factor (Nd/Nf)
          k * H * (Nf / Nd), // gave the flow per metre of dam length
          k * (H / Nd) * L, // used the head loss per drop and left out the flow channels
        ],
        solution: `Shape factor = Nf/Nd = ${Nf}/${Nd} = ${f(Nf / Nd, 4)}\nq per metre = kH(Nf/Nd) = ${n(k)} × ${n(H)} × ${f(Nf / Nd, 4)} = ${f(k * H * (Nf / Nd), 4)} m³/day/m\nTotal = × ${L} m = ${f(q)} m³/day`,
      };
    },
  },
];

// ---------------------------------------------------------------- Water Resources & Environmental

const WRE: Template[] = [
  {
    id: "activated-sludge-srt",
    version: 1,
    title: "Solids retention time of an activated sludge process",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater treatment: SRT (mean cell residence time)",
    generate(r) {
      const Q = r.range(5000, 50000, 500);
      const V = r.range(2000, 20000, 100);
      const X = r.range(2000, 4000, 100);
      const Qw = r.range(50, 600, 10);
      const Xw = r.range(6000, 12000, 500);
      const Xe = r.range(5, 25, 1);
      const SRT = (V * X) / (Qw * Xw + (Q - Qw) * Xe);
      return {
        prompt: `An activated sludge plant treats ${n(Q)} m³/d. The aeration basin holds ${n(V)} m³ at an MLSS of ${n(X)} mg/L. Waste sludge is removed at ${Qw} m³/d with ${n(Xw)} mg/L of solids, and the clarifier effluent carries ${Xe} mg/L of suspended solids. What is the solids retention time?`,
        answer: SRT,
        unit: "days",
        distractors: [
          (V * X) / (Qw * Xw), // ignored the solids lost in the effluent
          (V * X) / (Qw * Xw + Q * Xe), // used the full plant flow for the effluent (not Q − Qw)
          V / Q, // gave the hydraulic retention time
        ],
        solution: `Solids in the basin: VX = ${n(V)} m³ × ${n(X)} mg/L = ${n(V * X)} (m³·mg/L)\nSolids leaving per day = QwXw + (Q − Qw)Xe = ${Qw}(${n(Xw)}) + ${n(Q - Qw)}(${Xe}) = ${n(Qw * Xw + (Q - Qw) * Xe)}\nSRT = ${n(V * X)}/${n(Qw * Xw + (Q - Qw) * Xe)} = ${f(SRT)} days`,
      };
    },
  },
  {
    id: "food-to-microorganism",
    version: 1,
    title: "Food-to-microorganism (F/M) ratio",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Wastewater treatment: F/M ratio",
    generate(r) {
      const Q = r.range(5000, 50000, 500);
      const S0 = r.range(120, 300, 5);
      const S = r.range(5, 25, 1);
      const V = r.range(2000, 20000, 100);
      const X = r.range(2200, 4000, 100);
      const Xv = Math.round(X * r.range(0.7, 0.85, 0.01) / 10) * 10;
      const FM = (Q * S0) / (V * Xv);
      return {
        prompt: `An aeration basin of ${n(V)} m³ receives ${n(Q)} m³/d of primary effluent with a BOD of ${S0} mg/L; the final effluent BOD is ${S} mg/L. The mixed liquor has an MLSS of ${n(X)} mg/L and an MLVSS of ${n(Xv)} mg/L. What is the F/M ratio, based on MLVSS?`,
        answer: FM,
        unit: "g BOD/g VSS·d",
        distractors: [
          (Q * S0) / (V * X), // used MLSS instead of MLVSS
          (Q * (S0 - S)) / (V * Xv), // used the BOD removed (that's the specific utilization rate)
          (V * Xv) / (Q * S0), // inverted the ratio
        ],
        solution: `F/M = QS₀/(VX_v) = ${n(Q)} × ${S0}/(${n(V)} × ${n(Xv)}) = ${f(FM)} d⁻¹`,
      };
    },
  },
  {
    id: "aeration-basin-volume",
    version: 1,
    title: "Aeration basin volume from SRT and kinetic coefficients",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater treatment: completely mixed activated sludge design",
    generate(r) {
      const Q = r.range(5000, 40000, 500);
      const S0 = r.range(120, 280, 5);
      const S = r.range(5, 20, 1);
      const th = r.range(5, 15, 1);
      const Y = r.range(0.4, 0.7, 0.05);
      const kd = r.range(0.04, 0.1, 0.01);
      const X = r.range(2000, 3500, 100);
      const V = (th * Q * Y * (S0 - S)) / (X * (1 + kd * th));
      return {
        prompt: `Size a completely mixed aeration basin for ${n(Q)} m³/d with an influent soluble BOD of ${S0} mg/L and an effluent soluble BOD of ${S} mg/L. Use an SRT of ${th} days, a yield of Y = ${n(Y)} g VSS/g BOD, an endogenous decay rate kd = ${n(kd)} d⁻¹, and an MLVSS of ${n(X)} mg/L. What basin volume is required?`,
        answer: V,
        unit: "m³",
        distractors: [
          (th * Q * Y * (S0 - S)) / X, // left out the decay term (1 + kd·SRT)
          (th * Q * Y * S0) / (X * (1 + kd * th)), // used S₀ instead of S₀ − S
          (Q * Y * (S0 - S)) / (X * (1 + kd * th)), // left out the SRT
        ],
        solution: `X = SRT·Y(S₀ − S)/[θ(1 + kd·SRT)], so V = SRT·Q·Y(S₀ − S)/[X(1 + kd·SRT)]\n= ${th} × ${n(Q)} × ${n(Y)} × (${S0} − ${S})/[${n(X)} × (1 + ${n(kd)} × ${th})]\n= ${f(V)} m³`,
      };
    },
  },
];

// ---------------------------------------------------------------- Transportation

const TRANS: Template[] = [
  {
    id: "superelevation-min-radius",
    version: 1,
    title: "Minimum curve radius from superelevation and side friction",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "AASHTO Green Book: minimum radius, R = V²/[15(e + f)]",
    generate(r) {
      const V = r.pick([30, 35, 40, 45, 50, 55, 60, 65, 70]);
      const e = r.pick([4, 6, 8, 10]);
      const fr = r.range(0.08, 0.17, 0.01);
      const R = (V * V) / (15 * (e / 100 + fr));
      return {
        prompt: `A highway curve is designed for ${V} mph with a maximum superelevation of ${e}% and a side friction factor of ${n(fr)}. What is the minimum radius of the curve?`,
        answer: R,
        unit: "ft",
        distractors: [
          (V * V) / (15 * fr), // ignored the superelevation
          (V * V) / (15 * (e / 100)), // ignored side friction
          (V * V) / (127 * (e / 100 + fr)), // used the metric constant 127
        ],
        solution: `R = V²/[15(e + f)] = ${V}²/[15(${e / 100} + ${n(fr)})] = ${f(R)} ft`,
      };
    },
  },
  {
    id: "middle-ordinate-clearance",
    version: 1,
    title: "Lateral clearance on a horizontal curve for sight distance",
    topics: { "pe-civil": "transportation" },
    reference: "AASHTO Green Book: horizontal sightline offset (middle ordinate)",
    generate(r) {
      for (;;) {
        const R = r.range(400, 3000, 50);
        const S = r.pick([250, 305, 360, 425, 495, 570, 645, 730]);
        const ang = (28.65 * S) / R;
        if (ang > 60) continue;
        const M = R * (1 - Math.cos(rad(ang)));
        return {
          prompt: `A horizontal curve has a radius of ${n(R)} ft measured to the centerline of the inside lane. The stopping sight distance is ${S} ft and is shorter than the curve. What clear distance is needed from the inside lane centerline to a roadside obstruction?`,
          answer: M,
          unit: "ft",
          distractors: [
            R * (1 - Math.cos(rad((57.3 * S) / R))), // used 57.3 (full angle) instead of 28.65
            (S * S) / (4 * R), // used S²/4R instead of the exact formula
            R * Math.sin(rad(ang)), // used sin instead of 1 − cos
          ],
          solution: `M = R[1 − cos(28.65S/R)], with the angle in degrees\n28.65 × ${S}/${n(R)} = ${f(ang, 4)}°\nM = ${n(R)}[1 − cos ${f(ang, 4)}°] = ${f(M)} ft`,
        };
      }
    },
  },
  {
    id: "design-lane-esals",
    version: 1,
    title: "Design-lane ESALs over a design period",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Pavement design: traffic loading in ESALs, growth factor",
    generate(r) {
      const ADT = r.range(5000, 60000, 500);
      const T = r.range(5, 25, 1);
      const TF = r.range(0.5, 2, 0.05);
      const lanes = r.pick([1, 2, 3]);
      const LD = lanes === 1 ? 1.0 : lanes === 2 ? 0.9 : 0.7;
      const g = r.range(1, 5, 0.5);
      const yrs = r.pick([10, 15, 20, 25, 30]);
      const G = ((1 + g / 100) ** yrs - 1) / (g / 100);
      const E = (ADT * (T / 100) * TF * 0.5 * LD * 365 * G) / 1e6;
      return {
        prompt: `A new highway with ${lanes} lane${lanes > 1 ? "s" : ""} in each direction has an opening-year ADT of ${n(ADT)} (both directions). Trucks make up ${T}% of traffic and average ${n(TF)} ESALs per truck. The directional split is 50/50 and the design lane carries a lane distribution factor of ${LD.toFixed(1)}. Traffic grows ${n(g)}% per year; use the growth factor [(1 + g)ⁿ − 1]/g. What is the total design-lane ESAL count over a ${yrs}-year design period, in millions?`,
        answer: E,
        unit: "million ESALs",
        distractors: [
          (ADT * (T / 100) * TF * 0.5 * LD * 365 * yrs) / 1e6, // ignored growth
          (ADT * (T / 100) * TF * LD * 365 * G) / 1e6, // forgot the directional split
          (ADT * (T / 100) * TF * 0.5 * LD * 365 * (1 + g / 100) ** yrs) / 1e6, // used (1 + g)ⁿ as the growth factor
        ],
        solution: `Growth factor G = [(1 + ${g / 100})^${yrs} − 1]/${g / 100} = ${f(G, 4)}\nFirst-year design-lane ESALs = ${n(ADT)} × ${T / 100} × ${n(TF)} × 0.5 × ${LD.toFixed(1)} × 365 = ${f((ADT * (T / 100) * TF * 0.5 * LD * 365), 4)}\nTotal = × ${f(G, 4)} = ${f(E * 1e6, 4)} ≈ ${f(E)} million`,
      };
    },
  },
  {
    id: "base-thickness-sn",
    version: 1,
    title: "Required base thickness from the structural number",
    topics: { "pe-civil": "transportation" },
    reference: "AASHTO flexible pavement design: structural number",
    generate(r) {
      for (;;) {
        const SN = r.range(3, 6, 0.1);
        const D1 = r.range(3, 6, 0.5);
        const m2 = r.range(0.8, 1.2, 0.05);
        const D2 = (SN - 0.44 * D1) / (0.14 * m2);
        if (D2 < 4 || D2 > 30) continue;
        return {
          prompt: `A flexible pavement needs a structural number of ${n(SN)}. It will have ${n(D1)} in of asphalt concrete (layer coefficient 0.44) over a granular base (layer coefficient 0.14, drainage coefficient ${n(m2)}), with no subbase. What base thickness is required?`,
          answer: D2,
          unit: "in",
          distractors: [
            (SN - 0.44 * D1) / 0.14, // ignored the drainage coefficient
            SN / (0.14 * m2), // forgot the asphalt layer's contribution
            ((SN - 0.44 * D1) * m2) / 0.14, // multiplied by the drainage coefficient
          ],
          solution: `SN = a₁D₁ + a₂D₂m₂, so D₂ = (SN − a₁D₁)/(a₂m₂)\n= (${n(SN)} − 0.44 × ${n(D1)})/(0.14 × ${n(m2)}) = ${f(SN - 0.44 * D1, 4)}/${f(0.14 * m2, 4)} = ${f(D2)} in`,
        };
      }
    },
  },
];

// ---------------------------------------------------------------- FE

const FE: Template[] = [
  {
    id: "tee-section-inertia",
    version: 1,
    title: "Moment of inertia of a T-section about its centroid",
    topics: { "fe-civil": "statics" },
    reference: "FE Reference Handbook: Statics, parallel-axis theorem",
    generate(r) {
      const bf = r.range(150, 400, 10);
      const tf = r.range(15, 40, 5);
      const tw = r.range(10, 30, 2);
      const hw = r.range(150, 450, 10);
      const Af = bf * tf, Aw = tw * hw;
      const yf = hw + tf / 2, yw = hw / 2;
      const y = (Af * yf + Aw * yw) / (Af + Aw);
      const Io = (bf * tf ** 3) / 12 + (tw * hw ** 3) / 12;
      const I = Io + Af * (yf - y) ** 2 + Aw * (yw - y) ** 2;
      return {
        prompt: `A T-section has a flange ${bf} mm wide and ${tf} mm thick on top of a web ${tw} mm thick and ${hw} mm tall. What is its moment of inertia about the horizontal axis through its centroid?`,
        answer: I / 1e6,
        unit: "×10⁶ mm⁴",
        distractors: [
          Io / 1e6, // left out the parallel-axis (Ad²) terms
          (Io + Af * yf ** 2 + Aw * yw ** 2) / 1e6, // transferred to the bottom of the web, not the centroid
          (Io + Af * (yf - y) ** 2) / 1e6, // transferred the flange only
        ],
        solution: `Centroid from the bottom: ȳ = (${n(Af)} × ${f(yf)} + ${n(Aw)} × ${f(yw)})/${n(Af + Aw)} = ${f(y, 4)} mm\nFlange: ${bf}(${tf})³/12 + ${n(Af)}(${f(yf - y, 4)})² \nWeb: ${tw}(${hw})³/12 + ${n(Aw)}(${f(yw - y, 4)})²\nI = ${f(I / 1e6, 4)} × 10⁶ mm⁴`,
      };
    },
  },
  {
    id: "benefit-cost-ratio",
    version: 1,
    title: "Conventional benefit-cost ratio",
    topics: { "fe-civil": "economics", "pe-civil": "water-env" },
    reference: "FE Reference Handbook: Engineering Economics, benefit-cost analysis",
    generate(r) {
      const P = r.range(500, 8000, 50) * 1000;
      const B = r.range(50, 900, 5) * 1000;
      const M = Math.round((B * r.range(0.05, 0.4, 0.01)) / 1000) * 1000;
      const yrs = r.pick([20, 25, 30, 40, 50]);
      const ip = r.pick([3, 4, 5, 6, 7, 8]);
      const i = ip / 100;
      const PA = ((1 + i) ** yrs - 1) / (i * (1 + i) ** yrs);
      const BC = (B * PA) / (P + M * PA);
      return {
        prompt: `A flood control project costs $${n(P)} now. It will reduce flood damage by $${n(B)} per year for ${yrs} years, and operation and maintenance will cost $${n(M)} per year. At ${ip}% interest, what is the conventional benefit-cost ratio (O&M counted as a cost)?`,
        answer: BC,
        unit: "",
        distractors: [
          ((B - M) * PA) / P, // gave the modified B/C ratio
          (B * yrs) / (P + M * yrs), // didn't discount
          (B * PA) / P, // ignored O&M
        ],
        solution: `(P/A, ${ip}%, ${yrs}) = [(1 + i)ⁿ − 1]/[i(1 + i)ⁿ] = ${f(PA, 5)}\nPW benefits = ${n(B)} × ${f(PA, 5)} = $${f(B * PA, 4)}\nPW costs = ${n(P)} + ${n(M)} × ${f(PA, 5)} = $${f(P + M * PA, 4)}\nB/C = ${f(BC)}`,
      };
    },
  },
];

export const SPEC_GAPS: Template[] = [...STRUCT, ...CONSTR, ...GEO, ...WRE, ...TRANS, ...FE];
