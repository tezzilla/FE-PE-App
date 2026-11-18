import { f, n, type Template } from "./engine";

// Seventh batch from docs/EXAM-COVERAGE.md: lateral-torsional buckling, tied columns, unit hydrograph
// convolution, cantilever sheet piles, critical lane analysis, sling tension, and related gaps. All
// problem text is original; code formulas and factors are stated in the prompt. Each template has an
// independent solver in verify.ts.

const rad = (x: number) => (x * Math.PI) / 180;
const STD_PIPES = [12, 15, 18, 21, 24, 27, 30, 36, 42, 48, 54, 60, 66, 72];

export const BATCH_SEVEN: Template[] = [
  // ---------------------------------------------------------------- Structural
  {
    id: "steel-ltb-inelastic",
    version: 1,
    title: "Steel beam flexural strength with inelastic lateral-torsional buckling",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section F2.2: Lp < Lb ≤ Lr",
    generate(r) {
      const Zx = r.range(50, 200, 1);
      const Sx = Math.round((Zx / r.range(1.1, 1.15, 0.01)) * 10) / 10;
      const Lp = r.range(5, 9, 0.1);
      const Lr = Number((Lp + r.range(10, 25, 0.5)).toFixed(1));
      const Lb = Number((Lp + (Lr - Lp) * r.range(0.15, 0.85, 0.05)).toFixed(1));
      const Cb = r.pick([1.0, 1.14, 1.3, 1.67]);
      const Mp = (50 * Zx) / 12;
      const My = (0.7 * 50 * Sx) / 12;
      const raw = Cb * (Mp - (Mp - My) * ((Lb - Lp) / (Lr - Lp)));
      const Mn = Math.min(Mp, raw);
      return {
        prompt: `A compact W-shape (Fy = 50 ksi, Zx = ${Zx} in³, Sx = ${n(Sx)} in³) has Lp = ${n(Lp)} ft and Lr = ${n(Lr)} ft. Its compression flange is braced at Lb = ${n(Lb)} ft, and Cb = ${Cb}. Using Mn = Cb[Mp − (Mp − 0.7FySx)(Lb − Lp)/(Lr − Lp)] ≤ Mp and φ = 0.90, what is φMn?`,
        answer: 0.9 * Mn,
        unit: "kip·ft",
        distractors: [
          0.9 * Mp, // ignored lateral-torsional buckling
          0.9 * (Mp - (Mp - My) * ((Lb - Lp) / (Lr - Lp))), // left out Cb
          raw > Mp ? 0.9 * raw : 0.9 * (Mp - (Mp - 50 * Sx / 12) * ((Lb - Lp) / (Lr - Lp))) * Cb, // didn't cap at Mp, or used FySx instead of 0.7FySx
        ],
        solution: `Mp = FyZx = 50 × ${Zx}/12 = ${f(Mp, 4)} kip·ft; 0.7FySx = 0.7 × 50 × ${n(Sx)}/12 = ${f(My, 4)} kip·ft\nMn = ${Cb}[${f(Mp, 4)} − (${f(Mp - My, 4)})(${n(Lb)} − ${n(Lp)})/(${n(Lr)} − ${n(Lp)})] = ${f(raw, 4)} kip·ft${raw > Mp ? ` > Mp, so Mn = Mp = ${f(Mp, 4)}` : ""}\nφMn = 0.90 × ${f(Mn, 4)} = ${f(0.9 * Mn)} kip·ft`,
      };
    },
  },
  {
    id: "rc-tied-column-axial",
    version: 1,
    title: "Maximum axial strength of a tied concrete column",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Section 22.4.2: φPn,max for tied columns",
    generate(r) {
      const b = r.range(12, 30, 2);
      const h = r.range(b, 30, 2);
      const Ag = b * h;
      const rho = r.range(1, 4, 0.25);
      const Ast = Math.round(Ag * (rho / 100) * 100) / 100;
      const fc = r.pick([4, 5, 6]);
      const P0 = 0.85 * fc * (Ag - Ast) + 60 * Ast;
      const phiPn = 0.65 * 0.8 * P0;
      return {
        prompt: `A tied rectangular column is ${b} in × ${h} in with Ast = ${n(Ast)} in² of Grade 60 longitudinal steel and f'c = ${fc} ksi. Using φPn,max = 0.65 × 0.80[0.85f'c(Ag − Ast) + fyAst], what is the maximum design axial strength?`,
        answer: phiPn,
        unit: "kips",
        distractors: [
          0.65 * P0, // left out the 0.80 factor
          0.75 * 0.85 * P0, // used the spiral column factors
          0.65 * 0.8 * (0.85 * fc * Ag + 60 * Ast), // didn't subtract the steel area from Ag
        ],
        solution: `Ag = ${b} × ${h} = ${Ag} in²\nP₀ = 0.85(${fc})(${Ag} − ${n(Ast)}) + 60(${n(Ast)}) = ${f(P0, 5)} kips\nφPn,max = 0.65 × 0.80 × ${f(P0, 5)} = ${f(phiPn)} kips`,
      };
    },
  },
  {
    id: "steel-beam-shear",
    version: 1,
    title: "Design shear strength of a rolled steel beam",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section G2.1: φv = 1.0 and Cv1 = 1.0 for most rolled I-shapes",
    generate(r) {
      const d = r.range(12, 30, 0.1);
      const tw = r.range(0.25, 0.7, 0.01);
      const tf = r.range(0.4, 1.1, 0.01);
      const Vn = 0.6 * 50 * d * tw;
      return {
        prompt: `A rolled W-shape (Fy = 50 ksi) has d = ${n(d)} in, tw = ${n(tw)} in and tf = ${n(tf)} in. Its web meets the limit for φv = 1.0 and Cv1 = 1.0. Using Vn = 0.6FyAwCv1 with Aw = d·tw, what is the design shear strength φvVn?`,
        answer: Vn,
        unit: "kips",
        distractors: [
          0.9 * Vn, // used φ = 0.90
          0.6 * 50 * (d - 2 * tf) * tw, // used the clear web depth instead of d
          50 * d * tw, // left out the 0.6
        ],
        solution: `Aw = d·tw = ${n(d)} × ${n(tw)} = ${f(d * tw, 4)} in²\nφvVn = 1.0 × 0.6 × 50 × ${f(d * tw, 4)} × 1.0 = ${f(Vn)} kips`,
      };
    },
  },
  {
    id: "one-way-slab-min-thickness",
    version: 1,
    title: "Minimum thickness of a one-way slab (deflections not computed)",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Table 7.3.1.1 (normalweight concrete, fy = 60 ksi)",
    generate(r) {
      const L = r.range(8, 22, 0.5);
      const c = r.pick([
        { t: "simply supported", k: 20 },
        { t: "continuous at one end", k: 24 },
        { t: "continuous at both ends", k: 28 },
        { t: "a cantilever", k: 10 },
      ] as const);
      const h = (L * 12) / c.k;
      const others = [20, 24, 28, 10].filter((k) => k !== c.k);
      return {
        prompt: `A one-way solid slab of normalweight concrete with Grade 60 reinforcement spans ${n(L)} ft and is ${c.t}. It doesn't support partitions likely to be damaged by deflection. Using the ACI 318 minimum thickness table (ℓ/20 simply supported, ℓ/24 one end continuous, ℓ/28 both ends continuous, ℓ/10 cantilever), what is the minimum slab thickness?`,
        answer: h,
        unit: "in",
        distractors: [
          ...others.map((k) => (L * 12) / k), // used another support condition's divisor
          (L * 12) / ({ 20: 16, 24: 18.5, 28: 21, 10: 8 } as Record<number, number>)[c.k], // used the beam table (ℓ/16, ℓ/18.5, ℓ/21, ℓ/8)
        ],
        solution: `ℓ = ${n(L)} ft = ${n(L * 12)} in; ${c.t}: h_min = ℓ/${c.k}\nh_min = ${n(L * 12)}/${c.k} = ${f(h)} in`,
      };
    },
  },

  // ---------------------------------------------------------------- Water Resources & Environmental
  {
    id: "unit-hydrograph-convolution",
    version: 1,
    title: "Peak flow from a two-period storm by unit hydrograph convolution",
    topics: { "pe-civil": "water-env" },
    reference: "Hydrology: discrete convolution of a unit hydrograph",
    generate(r) {
      for (;;) {
        const shape = r.pick([
          [0, 0.25, 0.8, 1, 0.6, 0.35, 0.15, 0],
          [0, 0.4, 1, 0.75, 0.45, 0.25, 0.1, 0],
          [0, 0.15, 0.55, 1, 0.8, 0.5, 0.25, 0.1, 0],
        ]);
        const peak = r.range(100, 1500, 10);
        const U = shape.map((s) => Math.round(s * peak));
        const P1 = r.range(0.3, 2, 0.1);
        const P2 = r.range(0.3, 2, 0.1);
        const Q = U.map((u, t) => P1 * u + P2 * (t > 0 ? U[t - 1] : 0));
        const Qp = Math.max(...Q);
        if (Math.abs(Qp - (P1 + P2) * Math.max(...U)) / Qp < 0.04) continue;
        return {
          prompt: `A watershed's 1-hour unit hydrograph has ordinates of ${U.join(", ")} cfs per inch at hours 0 through ${U.length - 1}. A storm produces ${n(P1)} in of excess rainfall in the first hour and ${n(P2)} in in the second hour. What is the peak of the direct runoff hydrograph?`,
          answer: Qp,
          unit: "cfs",
          distractors: [
            (P1 + P2) * Math.max(...U), // added the excess and assumed both peaks line up
            P1 * Math.max(...U), // used only the first hour's excess
            Math.max(...U.map((u, t) => P2 * u + P1 * (t > 0 ? U[t - 1] : 0))), // lagged the wrong hour
          ],
          solution: `Q(t) = ${n(P1)}U(t) + ${n(P2)}U(t − 1):\n${Q.map((q, t) => `t = ${t}: ${f(q, 4)}`).join(", ")} cfs\nPeak = ${f(Qp)} cfs`,
        };
      }
    },
  },
  {
    id: "nrcs-lag-tc",
    version: 1,
    title: "Time of concentration by the NRCS lag method",
    topics: { "pe-civil": "water-env" },
    reference: "NRCS (SCS) lag equation; tc = tL/0.6",
    generate(r) {
      const L = r.range(1000, 15000, 100);
      const CN = r.range(60, 95, 1);
      const Y = r.range(1, 10, 0.5);
      const S = 1000 / CN - 10;
      const tL = (L ** 0.8 * (S + 1) ** 0.7) / (1900 * Math.sqrt(Y));
      return {
        prompt: `A watershed has a hydraulic length of ${n(L)} ft, a curve number of ${CN}, and an average watershed slope of ${n(Y)}%. Using the NRCS lag equation tL = L^0.8(S + 1)^0.7/(1,900Y^0.5) with S = 1,000/CN − 10 and tc = tL/0.6, what is the time of concentration?`,
        answer: tL / 0.6,
        unit: "h",
        distractors: [
          tL, // gave the lag time, not tc
          (L ** 0.8 * (S + 1) ** 0.7) / (1900 * Math.sqrt(Y / 100)) / 0.6, // used the slope as a decimal
          tL * 0.6, // multiplied by 0.6 instead of dividing
        ],
        solution: `S = 1,000/${CN} − 10 = ${f(S, 4)} in\ntL = ${n(L)}^0.8 × (${f(S + 1, 4)})^0.7/(1,900 × ${n(Y)}^0.5) = ${f(tL, 4)} h\ntc = tL/0.6 = ${f(tL / 0.6)} h`,
      };
    },
  },
  {
    id: "v-notch-weir",
    version: 1,
    title: "Flow over a triangular (V-notch) weir",
    topics: { "pe-civil": "water-env", "fe-civil": "fluids" },
    reference: "Flow measurement: triangular weir, Q = (8/15)Cd√(2g) tan(θ/2) H^2.5",
    generate(r) {
      const th = r.pick([60, 90]);
      const Cd = r.range(0.58, 0.61, 0.01);
      const H = r.range(0.05, 0.6, 0.01);
      const k = (8 / 15) * Cd * Math.sqrt(2 * 9.81) * Math.tan(rad(th / 2));
      const Q = k * H ** 2.5 * 1000;
      return {
        prompt: `A ${th}° V-notch weir has a discharge coefficient of ${n(Cd)} and a head of ${n(H)} m above the notch vertex. Using Q = (8/15)Cd√(2g) tan(θ/2) H^2.5, what is the flow?`,
        answer: Q,
        unit: "L/s",
        distractors: [
          k * H ** 1.5 * 1000, // used the rectangular-weir exponent 3/2
          (8 / 15) * Cd * Math.sqrt(2 * 9.81) * Math.tan(rad(th)) * H ** 2.5 * 1000, // used tan θ instead of tan(θ/2)
          Cd * Math.sqrt(2 * 9.81) * Math.tan(rad(th / 2)) * H ** 2.5 * 1000, // left out 8/15
        ],
        solution: `Q = (8/15)(${n(Cd)})√(2 × 9.81) tan(${th / 2}°)(${n(H)})^2.5 = ${f(Q / 1000, 4)} m³/s = ${f(Q)} L/s`,
      };
    },
  },
  {
    id: "storm-sewer-size",
    version: 1,
    title: "Smallest standard storm sewer that carries a design flow full",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Storm sewer design: Manning, full circular pipe, D = (Qn/0.463√S)^(3/8)",
    generate(r) {
      for (;;) {
        const Q = r.range(2, 80, 0.5);
        const nn = 0.013;
        const S = r.range(0.002, 0.02, 0.0005);
        const Dreq = ((Q * nn) / (0.463 * Math.sqrt(S))) ** 0.375 * 12;
        const idx = STD_PIPES.findIndex((d) => d >= Dreq - 1e-9);
        if (idx < 3 || idx > STD_PIPES.length - 4) continue;
        const D = STD_PIPES[idx];
        if (D - Dreq < 0.3) continue; // avoid borderline sizes
        return {
          prompt: `A storm sewer (n = 0.013) on a slope of ${n(S)} ft/ft must carry ${n(Q)} cfs flowing full. Using D = [Qn/(0.463√S)]^(3/8) (D in ft) and standard sizes of ${STD_PIPES.join(", ")} in, what is the smallest standard pipe that works?`,
          answer: D,
          unit: "in",
          sig: 4,
          minGap: 0.001,
          distractors: [
            STD_PIPES[idx - 1], // rounded down to the nearer standard size
            STD_PIPES[idx + 1], // went up one size more than needed
            STD_PIPES.find((d) => d >= ((Q * nn) / (0.463 * S)) ** 0.375 * 12) ?? STD_PIPES[idx + 3], // forgot the square root on S
            STD_PIPES[idx - 2], // used a smaller pipe from a partial-flow assumption
            STD_PIPES[idx + 2], // added a safety size
            STD_PIPES[idx - 3], // sized for half the flow
            STD_PIPES[idx + 3], // sized for double the flow
          ],
          solution: `D = [${n(Q)} × 0.013/(0.463√${n(S)})]^(3/8) = ${f(Dreq / 12, 4)} ft = ${f(Dreq, 4)} in\nThe next standard size up is ${D} in`,
        };
      }
    },
  },

  // ---------------------------------------------------------------- Geotechnical
  {
    id: "cantilever-sheet-pile-depth",
    version: 1,
    title: "Embedment of a cantilever sheet pile in dry sand (simplified)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Retaining structures: cantilever sheet pile, simplified moment balance about the toe",
    generate(r) {
      const H = r.range(2, 6, 0.25);
      const phi = r.range(28, 38, 1);
      const Ka = Math.tan(rad(45 - phi / 2)) ** 2;
      const Kp = Math.tan(rad(45 + phi / 2)) ** 2;
      const D0 = H / ((Kp / Ka) ** (1 / 3) - 1);
      return {
        prompt: `A cantilever sheet pile retains ${n(H)} m of dry sand (φ = ${phi}°, same soil below the dredge line, no water). Using the simplified method, take moments about the toe with Rankine active pressure over the full height H + D and passive pressure over D, which gives D₀ = H/[(Kp/Ka)^(1/3) − 1]. Then increase D₀ by 20%. What is the design embedment depth?`,
        answer: 1.2 * D0,
        unit: "m",
        distractors: [
          D0, // didn't add the 20%
          (1.2 * H) / (Kp / Ka - 1), // left out the cube root
          (1.2 * H) / (Math.sqrt(Kp / Ka) - 1), // used a square root instead of a cube root
        ],
        solution: `Ka = tan²(45° − ${phi}°/2) = ${f(Ka, 4)}; Kp = tan²(45° + ${phi}°/2) = ${f(Kp, 4)}\nMoments about the toe: Kp D³/6 = Ka(H + D)³/6 → D₀ = H/[(Kp/Ka)^(1/3) − 1] = ${n(H)}/[${f((Kp / Ka) ** (1 / 3), 4)} − 1] = ${f(D0, 4)} m\nDesign D = 1.2 × ${f(D0, 4)} = ${f(1.2 * D0)} m`,
      };
    },
  },
  {
    id: "passive-thrust-cohesion",
    version: 1,
    title: "Rankine passive thrust in a c-φ soil",
    topics: { "pe-civil": "geotechnical" },
    reference: "Lateral earth pressure: Rankine passive with cohesion, σp = Kpσv + 2c√Kp",
    generate(r) {
      const H = r.range(1, 4, 0.25);
      const gm = r.range(17, 20, 0.5);
      const phi = r.range(15, 30, 1);
      const c = r.range(5, 30, 1);
      const Kp = Math.tan(rad(45 + phi / 2)) ** 2;
      const P = 0.5 * Kp * gm * H * H + 2 * c * Math.sqrt(Kp) * H;
      return {
        prompt: `A smooth vertical wall is pushed into a c-φ soil (c = ${c} kPa, φ = ${phi}°, γ = ${n(gm)} kN/m³) over a depth of ${n(H)} m, with a level ground surface and no water. What is the Rankine passive thrust per metre?`,
        answer: P,
        unit: "kN/m",
        distractors: [
          0.5 * Kp * gm * H * H, // left out the cohesion term
          0.5 * Kp * gm * H * H + 2 * c * Kp * H, // used Kp instead of √Kp in the cohesion term
          0.5 * Kp * gm * H * H - 2 * c * Math.sqrt(Kp) * H, // subtracted the cohesion term (active-side sign)
        ],
        solution: `Kp = tan²(45° + ${phi}°/2) = ${f(Kp, 4)}\nPp = ½KpγH² + 2c√Kp H = ½(${f(Kp, 4)})(${n(gm)})(${n(H)})² + 2(${c})(${f(Math.sqrt(Kp), 4)})(${n(H)})\n= ${f(0.5 * Kp * gm * H * H, 4)} + ${f(2 * c * Math.sqrt(Kp) * H, 4)} = ${f(P)} kN/m`,
      };
    },
  },
  {
    id: "clay-bearing-undrained",
    version: 1,
    title: "Allowable bearing pressure of a strip footing on clay (undrained)",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Shallow foundations: undrained bearing capacity, Nc = 5.14 (φ = 0)",
    generate(r) {
      const B = r.range(1, 3, 0.25);
      const Df = r.range(0.5, 2, 0.25);
      const cu = r.range(25, 150, 5);
      const gm = r.range(17, 20, 0.5);
      const qult = 5.14 * cu + gm * Df;
      return {
        prompt: `A strip footing ${n(B)} m wide is founded ${n(Df)} m deep in saturated clay with undrained shear strength ${cu} kPa (φ = 0). The soil above the footing weighs ${n(gm)} kN/m³. Using q_ult = 5.14cu + γDf and a factor of safety of 3 on q_ult, what is the allowable bearing pressure?`,
        answer: qult / 3,
        unit: "kPa",
        distractors: [
          (5.7 * cu + gm * Df) / 3, // used Terzaghi's Nc = 5.7
          (5.14 * cu) / 3, // left out the overburden term
          qult, // forgot the factor of safety
        ],
        solution: `q_ult = 5.14(${cu}) + ${n(gm)}(${n(Df)}) = ${f(5.14 * cu, 4)} + ${f(gm * Df, 4)} = ${f(qult, 4)} kPa\nq_allow = ${f(qult, 4)}/3 = ${f(qult / 3)} kPa`,
      };
    },
  },

  // ---------------------------------------------------------------- Transportation
  {
    id: "critical-lane-vc",
    version: 1,
    title: "Critical volume-to-capacity ratio of a signalized intersection",
    topics: { "pe-civil": "transportation" },
    reference: "Highway Capacity Manual: critical flow ratio, Xc = Σ(v/s)crit × C/(C − L)",
    generate(r) {
      for (;;) {
        const phases = r.pick([2, 3, 4]);
        const v = Array.from({ length: phases }, () => r.range(150, 700, 10));
        const s = 1800;
        const C = r.range(60, 150, 5);
        const L = 4 * phases;
        const Y = v.reduce((a, x) => a + x / s, 0);
        const Xc = Y * (C / (C - L));
        if (Xc < 0.4 || Xc > 1.3) continue;
        return {
          prompt: `A ${phases}-phase signal has a cycle length of ${C} s and 4 s of lost time per phase. The critical lane volumes are ${v.join(", ")} veh/h/ln, and the adjusted saturation flow is ${n(s)} veh/h/ln for every lane group. What is the critical volume-to-capacity ratio Xc?`,
          answer: Xc,
          unit: "",
          distractors: [
            Y, // left out C/(C − L)
            Y * (C / (C - 4)), // counted only 4 s of lost time per cycle
            v.reduce((a, x) => a + x / 1900, 0) * (C / (C - L)), // used the base saturation flow 1,900 instead of the adjusted value
          ],
          solution: `Σ(v/s) = (${v.join(" + ")})/${n(s)} = ${f(Y, 4)}\nL = ${phases} × 4 = ${L} s\nXc = ${f(Y, 4)} × ${C}/(${C} − ${L}) = ${f(Xc)}`,
        };
      }
    },
  },
  {
    id: "incident-queue-delay",
    version: 1,
    title: "Total delay from a freeway incident (deterministic queuing)",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic flow: D/D/1 queuing for a temporary capacity reduction",
    generate(r) {
      for (;;) {
        const lam = r.range(1500, 4000, 100);
        const mu = r.range(lam + 500, 6000, 100);
        const mu2 = r.range(500, lam - 300, 100);
        const t = r.range(0.25, 1.5, 0.25);
        if (mu2 >= lam) continue;
        const Qm = (lam - mu2) * t;
        const clear = Qm / (mu - lam);
        const D = 0.5 * Qm * (t + clear);
        return {
          prompt: `Demand on a freeway is ${n(lam)} veh/h and its capacity is ${n(mu)} veh/h. An incident cuts capacity to ${n(mu2)} veh/h for ${n(t)} h, then full capacity returns. Assuming uniform arrivals and departures, what is the total vehicle delay?`,
          answer: D,
          unit: "veh·h",
          distractors: [
            0.5 * Qm * t, // counted only the delay during the incident
            Qm * (t + clear), // used the full queue for the whole period (no ½)
            Qm, // gave the maximum queue (vehicles), not delay
          ],
          solution: `Queue grows at ${n(lam)} − ${n(mu2)} = ${n(lam - mu2)} veh/h; at ${n(t)} h it is ${f(Qm, 4)} veh\nIt clears at ${n(mu)} − ${n(lam)} = ${n(mu - lam)} veh/h, taking ${f(clear, 4)} h\nTotal delay = area of the queue triangle = ½ × ${f(Qm, 4)} × (${n(t)} + ${f(clear, 4)}) = ${f(D)} veh·h`,
        };
      }
    },
  },

  // ---------------------------------------------------------------- Construction
  {
    id: "two-leg-sling-tension",
    version: 1,
    title: "Tension in a two-leg bridle sling",
    topics: { "pe-civil": "construction" },
    reference: "Lifting and rigging: sling angle factor",
    generate(r) {
      for (;;) {
        const W = r.range(2, 40, 0.5);
        const Ls = r.range(8, 20, 0.5);
        const d = r.range(4, 24, 0.5);
        if (d / 2 > 0.85 * Ls) continue;
        const h = Math.sqrt(Ls * Ls - (d / 2) ** 2);
        const T = (W * Ls) / (2 * h);
        const ang = (Math.asin(h / Ls) * 180) / Math.PI;
        return {
          prompt: `A ${n(W)} kip load is lifted by a two-leg bridle. Each leg is ${n(Ls)} ft long and attaches to lifting lugs ${n(d)} ft apart, symmetric about the load's center of gravity. What is the tension in each sling leg?`,
          answer: T,
          unit: "kips",
          distractors: [
            W / 2, // ignored the sling angle
            (W * Ls) / (2 * (d / 2)), // used the horizontal leg projection (cos instead of sin)
            (W * Ls) / h, // put the whole load on one leg
          ],
          solution: `Vertical height of each leg: h = √(${n(Ls)}² − (${n(d)}/2)²) = ${f(h, 4)} ft (sling angle ${f(ang, 3)}° from horizontal)\nEach leg carries W/2 vertically: T = (W/2)(L/h) = ${n(W / 2)} × ${n(Ls)}/${f(h, 4)} = ${f(T)} kips`,
        };
      }
    },
  },
  {
    id: "excavator-production-bcy",
    version: 1,
    title: "Hourly excavator production in bank cubic yards",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Construction operations: equipment production",
    generate(r) {
      const bucket = r.range(1.5, 5, 0.25);
      const fill = r.range(0.8, 1.1, 0.05);
      const ct = r.range(18, 35, 1);
      const E = r.range(45, 55, 1);
      const sw = r.range(15, 35, 1);
      const lcy = (3600 / ct) * bucket * fill * (E / 60);
      const bcy = lcy / (1 + sw / 100);
      return {
        prompt: `An excavator with a ${n(bucket)} yd³ heaped bucket has a fill factor of ${n(fill)} and a cycle time of ${ct} s. It works ${E} minutes per hour. The soil swells ${sw}% from bank to loose. What is the hourly production in bank cubic yards?`,
        answer: bcy,
        unit: "BCY/h",
        distractors: [
          lcy, // gave loose cubic yards
          (3600 / ct) * bucket * fill / (1 + sw / 100), // left out the 50-minute-hour efficiency
          lcy * (1 + sw / 100), // multiplied by the swell instead of dividing
        ],
        solution: `Cycles per hour = 3,600/${ct} = ${f(3600 / ct, 4)}\nLoose production = ${f(3600 / ct, 4)} × ${n(bucket)} × ${n(fill)} × (${E}/60) = ${f(lcy, 4)} LCY/h\nBank = ${f(lcy, 4)}/(1 + ${sw / 100}) = ${f(bcy)} BCY/h`,
      };
    },
  },
];
