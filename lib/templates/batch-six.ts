import { f, n, type Template } from "./engine";

// Sixth batch from docs/EXAM-COVERAGE.md: masonry walls, culvert outlet control, Muskingum routing,
// drilled shafts, concrete mix design, axle load equivalency, rate of return, capitalized cost,
// pedestrian timing, curve externals, phase relations, falling-head permeability, rapid mix, filter
// count, cantilever deflection and impulse. All problem text is original; code formulas and factors
// are stated in the prompt. Each template has an independent solver in verify.ts.

const g = 9.81;
const rad = (x: number) => (x * Math.PI) / 180;

// Fully grouted CMU wall properties per foot of wall (approximate published values).
const CMU = [
  { t: 8, An: 91.5, r: 2.31 },
  { t: 10, An: 115.5, r: 2.89 },
  { t: 12, An: 139.5, r: 3.46 },
] as const;

export const BATCH_SIX: Template[] = [
  // ---------------------------------------------------------------- Structural
  {
    id: "cmu-wall-axial-asd",
    version: 1,
    title: "Allowable axial load on a grouted CMU wall (ASD)",
    topics: { "pe-civil": "structural" },
    reference: "TMS 402 allowable stress design: axial compression with slenderness",
    generate(r) {
      for (;;) {
        const w = r.pick(CMU);
        const fm = r.pick([1500, 2000, 2500, 3000]);
        const h = r.range(8, 20, 1);
        const ratio = (h * 12) / w.r;
        if (ratio > 99) continue;
        const Pa = (0.25 * fm * w.An * (1 - (ratio / 140) ** 2)) / 1000;
        return {
          prompt: `A ${w.t}-in fully grouted CMU wall is ${h} ft tall between lateral supports. Per foot of wall, An = ${w.An} in² and r = ${w.r} in; f'm = ${n(fm)} psi. Ignoring the vertical reinforcement (bars not laterally tied) and using Pa = 0.25f'm An[1 − (h/140r)²] for h/r ≤ 99, what is the allowable axial load per foot of wall?`,
          answer: Pa,
          unit: "kips/ft",
          distractors: [
            (0.25 * fm * w.An) / 1000, // left out the slenderness reduction
            (0.25 * fm * w.An * (1 - (h / (140 * w.r)) ** 2)) / 1000, // left h in feet in the slenderness ratio
            (0.25 * fm * w.An * (70 * w.r / (h * 12)) ** 2) / 1000, // used the formula for h/r > 99
          ],
          solution: `h/r = ${h} × 12/${w.r} = ${f(ratio, 4)} (≤ 99)\nReduction = 1 − (${f(ratio, 4)}/140)² = ${f(1 - (ratio / 140) ** 2, 4)}\nPa = 0.25 × ${n(fm)} × ${w.An} × ${f(1 - (ratio / 140) ** 2, 4)} = ${f(Pa * 1000, 5)} lb = ${f(Pa)} kips/ft`,
        };
      }
    },
  },
  {
    id: "cantilever-tip-deflection",
    version: 1,
    title: "Tip deflection of a cantilever with an end load",
    topics: { "fe-civil": "mechanics-materials", "pe-civil": "structural" },
    reference: "FE Reference Handbook: Mechanics of Materials, cantilever beam formulas",
    generate(r) {
      const P = r.range(2, 50, 1);
      const L = r.range(1, 5, 0.1);
      const E = r.pick([200, 70]);
      const I = r.range(5, 200, 1); // ×10⁶ mm⁴
      const d = ((P * 1000) * (L * 1000) ** 3) / (3 * E * 1000 * I * 1e6);
      return {
        prompt: `A ${n(L)} m ${E === 200 ? "steel" : "aluminum"} cantilever (E = ${E} GPa, I = ${I} × 10⁶ mm⁴) carries a ${P} kN point load at its free end. What is the tip deflection?`,
        answer: d,
        unit: "mm",
        distractors: [
          ((P * 1000) * (L * 1000) ** 3) / (48 * E * 1000 * I * 1e6), // used the simply supported midspan formula PL³/48EI
          ((P * 1000) * (L * 1000) ** 3) / (8 * E * 1000 * I * 1e6), // used wL⁴/8EI's 8 with a point load
          ((P * 1000) * (L * 1000) ** 2) / (2 * E * 1000 * I * 1e6), // gave the end slope form PL²/2EI
        ],
        solution: `δ = PL³/(3EI) = (${P} × 10³ N)(${n(L * 1000)} mm)³/(3 × ${E} × 10³ MPa × ${I} × 10⁶ mm⁴) = ${f(d)} mm`,
      };
    },
  },

  // ---------------------------------------------------------------- Water Resources & Environmental
  {
    id: "culvert-outlet-control-hw",
    version: 1,
    title: "Culvert headwater under outlet control",
    topics: { "pe-civil": "water-env" },
    reference: "FHWA HDS-5: outlet control, full-flow energy equation",
    generate(r) {
      for (;;) {
        const Din = r.pick([24, 30, 36, 42, 48, 60]);
        const D = Din / 12;
        const A = (Math.PI * D * D) / 4;
        const V = r.range(4, 12, 0.5);
        const Q = Math.round(V * A);
        const Va = Q / A;
        const L = r.range(50, 300, 10);
        const nn = r.pick([0.012, 0.024]);
        const ke = r.pick([0.2, 0.5, 0.7]);
        const S = r.range(0.002, 0.02, 0.001);
        const ho = r.range(D * 0.8, D * 1.3, 0.1);
        const R = D / 4;
        const hv = (Va * Va) / (2 * 32.2);
        const H = (1 + ke + (29 * nn * nn * L) / R ** 1.33) * hv;
        const HW = H + ho - L * S;
        if (HW < D) continue;
        return {
          prompt: `A ${Din}-in circular culvert (${nn === 0.012 ? "concrete" : "corrugated metal"}, n = ${nn}) ${n(L)} ft long on a slope of ${n(S)} ft/ft carries ${Q} cfs flowing full. The entrance loss coefficient is ${ke}. Using outlet control with H = [1 + ke + 29n²L/R^1.33]V²/2g and ho = ${n(ho)} ft, what is the headwater depth above the inlet invert, HW = H + ho − LS?`,
          answer: HW,
          unit: "ft",
          distractors: [
            (1 + ke) * hv + ho - L * S, // left out the friction loss
            H + ho, // didn't subtract the fall LS
            (1 + (29 * nn * nn * L) / R ** 1.33) * hv + ho - L * S, // left out the entrance loss
          ],
          solution: `V = Q/A = ${Q}/${f(A, 4)} = ${f(Va, 4)} ft/s; V²/2g = ${f(hv, 4)} ft; R = D/4 = ${f(R, 4)} ft\nH = [1 + ${ke} + 29(${nn})²(${n(L)})/${f(R, 4)}^1.33] × ${f(hv, 4)} = ${f(H, 4)} ft\nHW = ${f(H, 4)} + ${n(ho)} − ${n(L)}(${n(S)}) = ${f(HW)} ft`,
        };
      }
    },
  },
  {
    id: "muskingum-outflow",
    version: 1,
    title: "Channel routing by the Muskingum method",
    topics: { "pe-civil": "water-env" },
    reference: "Hydrology: Muskingum routing coefficients",
    generate(r) {
      for (;;) {
        const K = r.range(6, 24, 1);
        const X = r.range(0.1, 0.3, 0.05);
        const dt = r.range(Math.ceil(2 * K * X), 12, 1);
        const den = 2 * K * (1 - X) + dt;
        const C0 = (dt - 2 * K * X) / den, C1 = (dt + 2 * K * X) / den, C2 = (2 * K * (1 - X) - dt) / den;
        if (C0 < 0 || C2 < 0) continue;
        const I1 = r.range(100, 800, 10);
        const I2 = r.range(100, 800, 10);
        const O1 = r.range(100, 600, 10);
        const O2 = C0 * I2 + C1 * I1 + C2 * O1;
        if (Math.abs(O2 - I2) / I2 < 0.05) continue;
        return {
          prompt: `A river reach is routed with the Muskingum method using K = ${K} h, X = ${n(X)} and Δt = ${dt} h. At the start of the step, inflow is ${I1} cfs and outflow is ${O1} cfs. At the end of the step, inflow is ${I2} cfs. What is the outflow at the end of the step?`,
          answer: O2,
          unit: "cfs",
          distractors: [
            C0 * I1 + C1 * I2 + C2 * O1, // swapped the coefficients on I₁ and I₂
            (I1 + I2) / 2, // used the average inflow
            I2, // assumed outflow equals inflow
          ],
          solution: `D = 2K(1 − X) + Δt = ${f(den, 4)}\nC₀ = (Δt − 2KX)/D = ${f(C0, 4)}, C₁ = (Δt + 2KX)/D = ${f(C1, 4)}, C₂ = [2K(1 − X) − Δt]/D = ${f(C2, 4)} (sum = 1)\nO₂ = C₀I₂ + C₁I₁ + C₂O₁ = ${f(C0, 4)}(${I2}) + ${f(C1, 4)}(${I1}) + ${f(C2, 4)}(${O1}) = ${f(O2)} cfs`,
        };
      }
    },
  },
  {
    id: "rapid-mix-power",
    version: 1,
    title: "Power for a rapid mix basin from the velocity gradient",
    topics: { "pe-civil": "water-env" },
    reference: "Drinking water treatment: mixing, G = √(P/μV)",
    generate(r) {
      const G = r.range(600, 1000, 50);
      const V = r.range(2, 20, 0.5);
      const mu = r.pick([
        { T: 5, mu: 1.519e-3 },
        { T: 10, mu: 1.307e-3 },
        { T: 15, mu: 1.139e-3 },
        { T: 20, mu: 1.002e-3 },
      ] as const);
      const P = (G * G * mu.mu * V) / 1000;
      return {
        prompt: `A rapid mix basin of ${n(V)} m³ must provide a velocity gradient G = ${G} s⁻¹. At the design water temperature of ${mu.T}°C, the dynamic viscosity is ${mu.mu.toExponential(3).replace("e-3", " × 10⁻³")} N·s/m². What power must be delivered to the water?`,
        answer: P,
        unit: "kW",
        distractors: [
          (G * mu.mu * V) / 1000, // didn't square G
          (G * G * mu.mu) / 1000, // left out the basin volume
          (G * G * mu.mu * V) / 1000 / 0.75, // divided by an assumed motor efficiency (the question asks for power to the water)
        ],
        solution: `G = √(P/μV), so P = G²μV = (${G})²(${mu.mu.toExponential(3)})(${n(V)}) = ${f(P * 1000, 5)} W = ${f(P)} kW`,
      };
    },
  },
  {
    id: "filters-required",
    version: 1,
    title: "Number of filters needed, with one out of service",
    topics: { "pe-civil": "water-env" },
    reference: "Drinking water treatment: filtration rate and redundancy",
    generate(r) {
      const Q = r.range(10000, 150000, 1000);
      const rate = r.range(5, 15, 0.5);
      const a = r.range(40, 120, 5);
      const base = Math.ceil(Number((Q / 24 / rate / a).toFixed(6)));
      const N = base + 1;
      return {
        prompt: `A plant treats ${n(Q)} m³/d through rapid filters, each ${a} m² in area, at a maximum filtration rate of ${n(rate)} m/h. How many filters are needed if the rate must still be met with one filter out of service for backwashing?`,
        answer: N,
        unit: "filters",
        sig: 4,
        minGap: 0.001,
        distractors: [
          base, // forgot the filter out of service
          Math.round(Q / 24 / rate / a) + 1, // rounded to the nearest filter instead of up
          base + 2, // added two spare filters
        ],
        solution: `Required area = Q/rate = (${n(Q)}/24 m³/h)/${n(rate)} m/h = ${f(Q / 24 / rate, 4)} m²\nFilters in service = ${f(Q / 24 / rate, 4)}/${a} = ${f(Q / 24 / rate / a, 4)} → ${base}\nPlus one out of service = ${N} filters`,
      };
    },
  },

  // ---------------------------------------------------------------- Geotechnical
  {
    id: "drilled-shaft-beta",
    version: 1,
    title: "Side resistance of a drilled shaft in sand (β method)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Deep foundations: drilled shaft side resistance, β method",
    generate(r) {
      const D = r.range(2.5, 6, 0.5);
      const L = r.range(20, 70, 5);
      const gm = r.range(110, 125, 1);
      const z = L / 2;
      const beta = Math.min(1.2, Math.max(0.25, 1.5 - 0.135 * Math.sqrt(z)));
      const sv = (gm * z) / 1000;
      const Qs = beta * sv * Math.PI * D * L;
      return {
        prompt: `A ${n(D)} ft diameter drilled shaft extends ${L} ft into dry sand (γ = ${gm} pcf). Evaluate the side resistance at mid-depth using fs = βσ'v with β = 1.5 − 0.135√z (z in ft, 0.25 ≤ β ≤ 1.2). What is the nominal side resistance of the shaft?`,
        answer: Qs,
        unit: "kips",
        distractors: [
          Math.min(1.2, Math.max(0.25, 1.5 - 0.135 * Math.sqrt(L))) * ((gm * L) / 1000) * Math.PI * D * L, // evaluated at the tip instead of mid-depth
          sv * Math.PI * D * L, // left out β
          beta * sv * ((Math.PI * D * D) / 4) * L / D, // used the base area instead of the perimeter
        ],
        solution: `Mid-depth z = ${f(z)} ft: σ'v = ${gm} × ${f(z)} = ${f(sv * 1000, 4)} psf = ${f(sv, 4)} ksf\nβ = 1.5 − 0.135√${f(z)} = ${f(beta, 4)}\nfs = ${f(beta, 4)} × ${f(sv, 4)} = ${f(beta * sv, 4)} ksf\nQs = fs × πD × L = ${f(beta * sv, 4)} × π(${n(D)}) × ${L} = ${f(Qs)} kips`,
      };
    },
  },
  {
    id: "degree-of-saturation",
    version: 1,
    title: "Degree of saturation from a soil sample",
    topics: { "fe-civil": "geotechnical", "pe-civil": "geotechnical" },
    reference: "FE Reference Handbook: Geotechnical, phase relationships",
    generate(r) {
      for (;;) {
        const V = r.range(500, 1500, 10);
        const w = r.range(8, 30, 0.5);
        const Gs = r.range(2.6, 2.75, 0.01);
        const rho = r.range(1.7, 2.1, 0.01);
        const M = rho * V;
        const Ms = M / (1 + w / 100);
        const Vs = Ms / Gs;
        const e = (V - Vs) / Vs;
        const S = ((w / 100) * Gs) / e;
        if (S > 0.98 || S < 0.3) continue;
        return {
          prompt: `A soil sample has a volume of ${n(V)} cm³ and a mass of ${f(M, 5)} g. Its moisture content is ${n(w)}% and Gs = ${n(Gs)}. What is its degree of saturation?`,
          answer: S * 100,
          unit: "%",
          distractors: [
            (w / 100) * Gs * 100, // left out the void ratio (S = wGs)
            ((w / 100) * Gs) / ((V - M / Gs) / (M / Gs)) * 100, // used the total mass for the solids
            ((w / 100) * Gs) / (e / (1 + e)) * 100 <= 100 ? ((w / 100) * Gs) / (e / (1 + e)) * 100 : NaN, // used porosity in place of void ratio
          ],
          solution: `Dry mass = ${f(M, 5)}/(1 + ${w / 100}) = ${f(Ms, 5)} g; solids volume = ${f(Ms, 5)}/${n(Gs)} = ${f(Vs, 5)} cm³\ne = (V − Vs)/Vs = (${n(V)} − ${f(Vs, 5)})/${f(Vs, 5)} = ${f(e, 4)}\nS = wGs/e = (${w / 100})(${n(Gs)})/${f(e, 4)} = ${f(S * 100)}%`,
        };
      }
    },
  },
  {
    id: "falling-head-permeability",
    version: 1,
    title: "Hydraulic conductivity from a falling-head test",
    topics: { "fe-civil": "geotechnical", "pe-civil": "geotechnical" },
    reference: "Permeability: falling-head test",
    generate(r) {
      const a = r.range(0.5, 3, 0.1);
      const A = r.range(20, 80, 1);
      const L = r.range(5, 20, 0.5);
      const h1 = r.range(60, 150, 5);
      const h2 = r.range(15, h1 - 20, 5);
      const t = r.range(60, 3600, 30);
      const k = ((a * L) / (A * t)) * Math.log(h1 / h2);
      return {
        prompt: `In a falling-head permeability test, the standpipe area is ${n(a)} cm², the sample is ${n(L)} cm long with an area of ${A} cm², and the head falls from ${h1} cm to ${h2} cm in ${n(t)} s. What is the hydraulic conductivity?`,
        answer: k * 1e4,
        unit: "× 10⁻⁴ cm/s",
        distractors: [
          ((a * L) / (A * t)) * Math.log10(h1 / h2) * 1e4, // used log base 10
          ((A * L) / (a * t)) * Math.log(h1 / h2) * 1e4, // swapped the standpipe and sample areas
          ((a * L) / (A * t)) * (h1 / h2) * 1e4, // used the head ratio without the natural log
        ],
        solution: `k = (aL/At) ln(h₁/h₂) = (${n(a)} × ${n(L)})/(${A} × ${n(t)}) × ln(${h1}/${h2})\n= ${f(k, 4)} cm/s = ${f(k * 1e4)} × 10⁻⁴ cm/s`,
      };
    },
  },

  // ---------------------------------------------------------------- Transportation
  {
    id: "axle-load-equivalency",
    version: 1,
    title: "Daily ESALs from axle loads (fourth-power approximation)",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Pavement design: load equivalency, (P/18)⁴ approximation",
    generate(r) {
      const a1 = r.range(8, 14, 0.5);
      const a2 = r.range(14, 26, 0.5);
      const N = r.range(200, 3000, 50);
      const lef = (a1 / 18) ** 4 + (a2 / 18) ** 4;
      const E = N * lef;
      return {
        prompt: `A design lane carries ${n(N)} trucks per day. Each truck has a ${n(a1)}-kip single steering axle and a ${n(a2)}-kip single drive axle. Using the fourth-power approximation LEF = (P/18)⁴ for single axles, how many ESALs does the lane receive per day?`,
        answer: E,
        unit: "ESALs/day",
        distractors: [
          N * ((a1 + a2) / 18), // used a linear load ratio
          N * (((a1 + a2) / 18) ** 4), // added the axle loads before raising to the 4th power
          N * (a2 / 18) ** 4, // counted only the heavier axle
        ],
        solution: `Steering axle: (${n(a1)}/18)⁴ = ${f((a1 / 18) ** 4, 4)}\nDrive axle: (${n(a2)}/18)⁴ = ${f((a2 / 18) ** 4, 4)}\nPer truck = ${f(lef, 4)}; daily = ${n(N)} × ${f(lef, 4)} = ${f(E)} ESALs/day`,
      };
    },
  },
  {
    id: "pedestrian-phase-time",
    version: 1,
    title: "Minimum pedestrian phase time (walk plus clearance)",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "MUTCD Section 4E: pedestrian intervals",
    generate(r) {
      const W = r.range(30, 110, 2);
      const walk = r.pick([4, 7]);
      const t = walk + W / 3.5;
      return {
        prompt: `A crosswalk is ${W} ft long, curb to curb. Using a walking speed of 3.5 ft/s for the pedestrian clearance time and a minimum walk interval of ${walk} s, what is the minimum total pedestrian time (walk plus clearance)?`,
        answer: t,
        unit: "s",
        distractors: [
          W / 3.5, // left out the walk interval
          walk + W / 4.0, // used the older 4.0 ft/s walking speed
          walk + W / 3.0, // used 3.0 ft/s
        ],
        solution: `Clearance = W/3.5 = ${W}/3.5 = ${f(W / 3.5, 4)} s\nTotal = ${walk} + ${f(W / 3.5, 4)} = ${f(t)} s`,
      };
    },
  },
  {
    id: "curve-external-distance",
    version: 1,
    title: "External distance of a horizontal curve",
    topics: { "fe-civil": "surveying", "pe-civil": "transportation" },
    reference: "FE Reference Handbook: horizontal circular curves",
    generate(r) {
      const R = r.range(300, 3000, 50);
      const I = r.range(15, 80, 1);
      const E = R * (1 / Math.cos(rad(I / 2)) - 1);
      return {
        prompt: `A horizontal circular curve has a radius of ${n(R)} ft and an intersection angle of ${I}°. What is the external distance (from the PI to the midpoint of the curve)?`,
        answer: E,
        unit: "ft",
        distractors: [
          R * (1 - Math.cos(rad(I / 2))), // gave the middle ordinate
          R * (1 / Math.cos(rad(I)) - 1), // used I instead of I/2
          R * Math.tan(rad(I / 2)), // gave the tangent length
        ],
        solution: `E = R[sec(I/2) − 1] = ${n(R)}[sec ${I / 2}° − 1] = ${n(R)} × ${f(1 / Math.cos(rad(I / 2)) - 1, 4)} = ${f(E)} ft`,
      };
    },
  },

  // ---------------------------------------------------------------- Construction / Materials
  {
    id: "mix-design-fine-aggregate",
    version: 1,
    title: "Fine aggregate weight by the absolute volume method",
    topics: { "pe-civil": "construction", "fe-civil": "materials" },
    reference: "Concrete mix design: absolute volume method (ACI 211.1)",
    generate(r) {
      const C = r.range(470, 700, 5);
      const wc = r.range(0.4, 0.55, 0.01);
      const W = Math.round(C * wc);
      const CA = r.range(1700, 1950, 10);
      const Gca = r.range(2.6, 2.72, 0.01);
      const Gfa = r.range(2.58, 2.68, 0.01);
      const air = r.range(2, 7, 0.5);
      const used = C / (3.15 * 62.4) + W / 62.4 + CA / (Gca * 62.4) + (air / 100) * 27;
      const Vfa = 27 - used;
      const FA = Vfa * Gfa * 62.4;
      return {
        prompt: `A 1 yd³ concrete batch uses ${C} lb of cement (SG 3.15), ${W} lb of water, and ${n(CA)} lb of coarse aggregate (SSD, SG ${n(Gca)}), with ${n(air)}% air. Using the absolute volume method, what weight of fine aggregate (SSD, SG ${n(Gfa)}) completes the batch?`,
        answer: FA,
        unit: "lb",
        distractors: [
          (27 - (used - (air / 100) * 27)) * Gfa * 62.4, // left out the air volume
          Vfa, // gave the fine aggregate volume (ft³), not weight
          (27 - used) * 62.4, // left out the fine aggregate's specific gravity
        ],
        solution: `Volumes (ft³): cement ${C}/(3.15 × 62.4) = ${f(C / (3.15 * 62.4), 4)}; water ${W}/62.4 = ${f(W / 62.4, 4)}; coarse ${n(CA)}/(${n(Gca)} × 62.4) = ${f(CA / (Gca * 62.4), 4)}; air ${air / 100} × 27 = ${f((air / 100) * 27, 4)}\nFine aggregate volume = 27 − ${f(used, 4)} = ${f(Vfa, 4)} ft³\nWeight = ${f(Vfa, 4)} × ${n(Gfa)} × 62.4 = ${f(FA)} lb`,
      };
    },
  },

  // ---------------------------------------------------------------- Economics / Dynamics (FE)
  {
    id: "rate-of-return-annuity",
    version: 1,
    title: "Rate of return on an investment with uniform annual returns",
    topics: { "fe-civil": "economics" },
    reference: "FE Reference Handbook: Engineering Economics, rate of return",
    generate(r) {
      for (;;) {
        const P = r.range(10000, 500000, 1000);
        const nyr = r.pick([5, 8, 10, 12, 15, 20]);
        const target = r.range(3, 18, 0.5) / 100;
        const A = Math.round(P / (((1 + target) ** nyr - 1) / (target * (1 + target) ** nyr)) / 100) * 100;
        if (A * nyr <= P * 1.05) continue;
        const pw = (i: number) => (A * ((1 + i) ** nyr - 1)) / (i * (1 + i) ** nyr) - P;
        let lo = 1e-6, hi = 1;
        for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (pw(m) > 0) lo = m; else hi = m; }
        const i = lo * 100;
        return {
          prompt: `An equipment upgrade costs $${n(P)} and saves $${n(A)} per year for ${nyr} years, with no salvage value. What is its rate of return?`,
          answer: i,
          unit: "%",
          distractors: [
            ((A * nyr - P) / (P * nyr)) * 100, // averaged the net gain over the years (no compounding)
            (A / P) * 100, // used the simple annual return A/P
            ((A * nyr / P) ** (1 / nyr) - 1) * 100, // treated the total savings as one lump sum at the end
          ],
          solution: `Find i where PW = 0: ${n(A)}(P/A, i, ${nyr}) = ${n(P)}, so (P/A, i, ${nyr}) = ${f(P / A, 5)}\nBy trial (or interpolation in the interest tables), i = ${f(i)}%`,
        };
      }
    },
  },
  {
    id: "capitalized-cost",
    version: 1,
    title: "Capitalized cost with annual and periodic costs",
    topics: { "fe-civil": "economics", "pe-civil": "water-env" },
    reference: "FE Reference Handbook: Engineering Economics, capitalized cost",
    generate(r) {
      const C = r.range(500, 20000, 50) * 1000;
      const M = r.range(5, 200, 1) * 1000;
      const R = r.range(50, 2000, 10) * 1000;
      const k = r.pick([5, 10, 15, 20, 25]);
      const ip = r.pick([3, 4, 5, 6, 8]);
      const i = ip / 100;
      const AF = i / ((1 + i) ** k - 1);
      const CC = C + M / i + (R * AF) / i;
      return {
        prompt: `A dam costs $${n(C)} to build. Maintenance costs $${n(M)} per year forever, and a major overhaul costing $${n(R)} is needed every ${k} years forever. At ${ip}% interest, what is the capitalized cost?`,
        answer: CC,
        unit: "$",
        distractors: [
          C + M / i, // left out the periodic overhaul
          C + M / i + R / k / i, // spread the overhaul evenly without interest
          C + M / i + R / i, // treated the overhaul as an annual cost
        ],
        solution: `Annual equivalent of the overhaul: R(A/F, ${ip}%, ${k}) = ${n(R)} × ${f(AF, 5)} = $${f(R * AF, 5)}/yr\nCC = C + (M + R(A/F))/i = ${n(C)} + (${n(M)} + ${f(R * AF, 5)})/${i} = $${f(CC, 4)}`,
      };
    },
  },
  {
    id: "impulse-average-force",
    version: 1,
    title: "Average impact force from impulse and momentum",
    topics: { "fe-civil": "dynamics" },
    reference: "FE Reference Handbook: Dynamics, impulse and momentum",
    generate(r) {
      const m = r.range(0.2, 5, 0.1);
      const v1 = r.range(5, 30, 0.5);
      const v2 = r.range(1, v1 * 0.7, 0.5);
      const t = r.range(0.005, 0.1, 0.005);
      const F = (m * (v1 + v2)) / t;
      return {
        prompt: `A ${n(m)} kg ball moving horizontally at ${n(v1)} m/s hits a wall and rebounds straight back at ${n(v2)} m/s. Contact lasts ${n(t)} s. What is the average force on the ball?`,
        answer: F / 1000,
        unit: "kN",
        distractors: [
          (m * (v1 - v2)) / t / 1000, // subtracted the speeds (ignored the reversal of direction)
          (m * v1) / t / 1000, // used only the incoming speed
          (0.5 * m * (v1 * v1 - v2 * v2)) / t / 1000, // used kinetic energy instead of momentum
        ],
        solution: `Impulse = change in momentum: FΔt = m(v₂ − v₁) with directions: m[${n(v2)} − (−${n(v1)})] = ${n(m)} × ${f(v1 + v2, 4)} = ${f(m * (v1 + v2), 4)} N·s\nF = ${f(m * (v1 + v2), 4)}/${n(t)} = ${f(F, 4)} N = ${f(F / 1000)} kN`,
      };
    },
  },
];
