import { f, n, type Template } from "./engine";

// Water Resources & Environmental problem generators.
// Each distractor is a specific, common mistake. Keep the comment next to it so reviewers can judge it.

const G_SI = 9.81; // m/s²
const GAMMA_W = 9.81; // kN/m³

export const WATER_RESOURCES: Template[] = [
  {
    id: "rational-method",
    version: 1,
    title: "Rational method peak runoff",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Hydrology: Rational Formula",
    generate(r) {
      const C = r.range(0.3, 0.9, 0.05);
      const i = r.range(1.0, 6.0, 0.1);
      const A = r.range(2, 60, 1);
      const Q = C * i * A;
      return {
        prompt: `A drainage area of ${n(A)} acres has a runoff coefficient C = ${n(C)}. The design rainfall intensity is ${n(i)} in/hr. Using the rational method, what is the peak runoff?`,
        answer: Q,
        unit: "cfs",
        distractors: [
          i * A, // forgot the runoff coefficient
          (1 - C) * i * A, // used the pervious fraction instead of C
          Q / 12, // divided by 12 converting inches, unnecessary since 1 ac·in/hr ≈ 1 cfs
        ],
        solution: `Q = CiA = (${n(C)})(${n(i)} in/hr)(${n(A)} ac) = ${f(Q)} cfs\n\nIn US units the rational formula gives cfs directly because 1 ac·in/hr ≈ 1.008 cfs.`,
      };
    },
  },
  {
    id: "manning-rect-si",
    version: 1,
    title: "Manning's equation, rectangular channel (SI)",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Open-Channel Flow: Manning's Equation",
    generate(r) {
      const b = r.range(1.0, 6.0, 0.5);
      const y = r.range(0.5, 2.5, 0.1);
      const nn = r.pick([0.012, 0.013, 0.015, 0.017, 0.022, 0.025, 0.03]);
      const S = r.pick([0.0005, 0.001, 0.002, 0.003, 0.005]);
      const A = b * y;
      const P = b + 2 * y;
      const R = A / P;
      const Q = (1 / nn) * A * R ** (2 / 3) * Math.sqrt(S);
      return {
        prompt: `A rectangular channel is ${n(b)} m wide with a uniform flow depth of ${n(y)} m. Manning's n = ${n(nn)} and the bed slope is ${n(S)}. What is the discharge?`,
        answer: Q,
        unit: "m³/s",
        distractors: [
          Q * 1.49, // used the US-customary constant 1.49 in SI
          (1 / nn) * A * y ** (2 / 3) * Math.sqrt(S), // took R = y (wide-channel assumption, not valid here)
          (1 / nn) * A * (A / (b + y)) ** (2 / 3) * Math.sqrt(S), // wetted perimeter with only one wall
        ],
        solution: `A = by = (${n(b)})(${n(y)}) = ${f(A)} m²\nP = b + 2y = ${n(b)} + 2(${n(y)}) = ${f(P)} m\nR = A/P = ${f(R)} m\n\nQ = (1/n) A R^(2/3) S^(1/2) = (1/${n(nn)})(${f(A)})(${f(R)})^(2/3)(${n(S)})^(1/2) = ${f(Q)} m³/s`,
      };
    },
  },
  {
    id: "continuity-pipe",
    version: 1,
    title: "Continuity in a pipe reducer",
    topics: { "fe-civil": "fluids", "pe-civil": "water-env" },
    reference: "Fluid Mechanics: Continuity Equation",
    generate(r) {
      const D1 = r.range(12, 30, 2); // with the largest reduction, D2 >= 4 in
      const D2 = D1 - r.pick([2, 4, 6, 8]);
      const V1 = r.range(2, 8, 0.5);
      const V2 = V1 * (D1 / D2) ** 2;
      return {
        prompt: `Water flows at ${n(V1)} ft/s in a ${n(D1)}-in diameter pipe that reduces to a ${n(D2)}-in diameter pipe. What is the velocity in the smaller pipe?`,
        answer: V2,
        unit: "ft/s",
        distractors: [
          V1 * (D1 / D2), // used diameter ratio instead of area ratio
          V1 * (D2 / D1) ** 2, // inverted the area ratio
          V1 * (D2 / D1), // inverted and not squared
        ],
        solution: `Q = A₁V₁ = A₂V₂, so V₂ = V₁(D₁/D₂)²\nV₂ = ${n(V1)} × (${n(D1)}/${n(D2)})² = ${f(V2)} ft/s`,
      };
    },
  },
  {
    id: "hydrostatic-pressure",
    version: 1,
    title: "Hydrostatic gage pressure",
    topics: { "fe-civil": "fluids" },
    reference: "Fluid Mechanics: Pressure Variation in a Static Fluid",
    generate(r) {
      const fluid = r.pick([
        { name: "oil", sg: 0.85 },
        { name: "light oil", sg: 0.8 },
        { name: "seawater", sg: 1.03 },
        { name: "glycerin", sg: 1.26 },
        { name: "a liquid", sg: 0.9 },
      ] as const);
      const h = r.range(2, 30, 0.5);
      const p = fluid.sg * GAMMA_W * h;
      return {
        prompt: `A tank holds ${fluid.name} with specific gravity ${n(fluid.sg)}. What is the gage pressure ${n(h)} m below the free surface? (γ_water = 9.81 kN/m³)`,
        answer: p,
        unit: "kPa",
        distractors: [
          GAMMA_W * h, // ignored specific gravity
          fluid.sg * h, // dropped g (used ρh)
          p + 101.3, // reported absolute instead of gage pressure
          p / 6.895, // converted to psi but kept kPa as the unit
        ],
        solution: `p = (SG)(γ_w)h = (${n(fluid.sg)})(9.81 kN/m³)(${n(h)} m) = ${f(p)} kPa (gage)`,
      };
    },
  },
  {
    id: "detention-time",
    version: 1,
    title: "Hydraulic detention time",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Environmental: Hydraulic Residence Time",
    generate(r) {
      const V = r.range(200, 5000, 50);
      const Q = r.range(1000, 20000, 500);
      const t = (V / Q) * 24;
      return {
        prompt: `A sedimentation basin has a volume of ${n(V)} m³ and treats a flow of ${n(Q)} m³/d. What is the hydraulic detention time?`,
        answer: t,
        unit: "hr",
        distractors: [
          V / Q, // left the answer in days
          (Q / V) * 24, // inverted V/Q
          (V / Q) * 1440, // converted days to minutes
        ],
        solution: `t = V/Q = ${n(V)} m³ / ${n(Q)} m³/d = ${f(V / Q)} d × 24 hr/d = ${f(t)} hr`,
      };
    },
  },
  {
    id: "bod-exertion",
    version: 1,
    title: "BOD exerted after t days",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Environmental: BOD Exertion",
    generate(r) {
      const L0 = r.range(100, 400, 10);
      const k = r.range(0.1, 0.35, 0.01);
      const t = r.pick([3, 5, 7, 10]);
      const bod = L0 * (1 - Math.exp(-k * t));
      return {
        prompt: `A wastewater has an ultimate BOD of ${n(L0)} mg/L and a first-order rate constant k = ${n(k)} d⁻¹ (base e). What is the BOD exerted after ${t} days?`,
        answer: bod,
        unit: "mg/L",
        distractors: [
          L0 * Math.exp(-k * t), // computed BOD remaining instead of exerted
          L0 * (1 - 10 ** (-k * t)), // used base 10 with a base-e rate constant
          L0 * k * t, // linear instead of first-order
        ],
        solution: `BOD_t = L₀(1 − e^(−kt)) = ${n(L0)}(1 − e^(−${n(k)} × ${t})) = ${n(L0)}(${f(1 - Math.exp(-k * t))}) = ${f(bod)} mg/L`,
      };
    },
  },
  {
    id: "bod-dilution",
    version: 1,
    title: "BOD₅ from a dilution test",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Environmental: BOD Test (unseeded)",
    generate(r) {
      const D1 = r.range(7.5, 9.0, 0.1);
      const drop = r.range(2.0, 6.0, 0.1);
      const D2 = Number((D1 - drop).toFixed(1));
      const Vs = r.pick([3, 6, 9, 15, 30]);
      const P = Vs / 300;
      const bod = (D1 - D2) / P;
      return {
        prompt: `A ${Vs} mL wastewater sample is diluted to 300 mL in a BOD bottle (unseeded). Initial DO is ${n(D1)} mg/L and DO after 5 days is ${n(D2)} mg/L. What is the BOD₅?`,
        answer: bod,
        unit: "mg/L",
        distractors: [
          D1 - D2, // forgot to divide by the dilution fraction
          D1 / P, // used initial DO only
          D2 / P, // used final DO only
        ],
        solution: `P = ${Vs}/300 = ${f(P)}\nBOD₅ = (D₁ − D₂)/P = (${n(D1)} − ${n(D2)})/${f(P)} = ${f(bod)} mg/L`,
      };
    },
  },
  {
    id: "darcy-weisbach-si",
    version: 1,
    title: "Darcy-Weisbach head loss (SI)",
    topics: { "fe-civil": "fluids", "pe-civil": "water-env" },
    reference: "Fluid Mechanics: Darcy-Weisbach Equation",
    generate(r) {
      const fr = r.range(0.015, 0.035, 0.001);
      const L = r.range(50, 1000, 10);
      const D = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]);
      const V = r.range(0.5, 3.0, 0.1);
      const hf = (fr * L * V ** 2) / (2 * G_SI * D);
      return {
        prompt: `Water flows at ${n(V)} m/s through ${n(L)} m of ${n(D)} m diameter pipe. The Darcy friction factor is ${n(fr)}. What is the head loss due to friction?`,
        answer: hf,
        unit: "m",
        distractors: [
          (fr * L * V) / (2 * G_SI * D), // forgot to square velocity
          (fr * L * V ** 2) / (G_SI * D), // dropped the 2 in 2g
          (fr * L * V ** 2) / (2 * 32.2 * D), // used g in ft/s² with SI inputs
        ],
        solution: `h_f = f(L/D)(V²/2g) = ${n(fr)} × (${n(L)}/${n(D)}) × (${n(V)}²/(2 × 9.81)) = ${f(hf)} m`,
      };
    },
  },
  {
    id: "nrcs-curve-number",
    version: 1,
    title: "NRCS (SCS) curve number runoff depth",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Hydrology: NRCS (SCS) Rainfall-Runoff",
    generate(r) {
      let CN: number, P: number, S: number;
      do {
        CN = r.range(60, 95, 1);
        P = r.range(1.0, 8.0, 0.1);
        S = 1000 / CN - 10;
      } while (P <= 0.2 * S + 0.3); // keep runoff meaningfully positive
      const Q = (P - 0.2 * S) ** 2 / (P + 0.8 * S);
      return {
        prompt: `A watershed has a curve number CN = ${CN}. A storm produces ${n(P)} in of rainfall. Using the NRCS method with Ia = 0.2S, what is the runoff depth?`,
        answer: Q,
        unit: "in",
        distractors: [
          P ** 2 / (P + S), // ignored initial abstraction
          (P - 0.2 * S) ** 2 / (P + S), // wrong denominator
          P - 0.2 * S, // subtracted Ia only
        ],
        solution: `S = 1000/CN − 10 = 1000/${CN} − 10 = ${f(S)} in\nIa = 0.2S = ${f(0.2 * S)} in\nQ = (P − 0.2S)²/(P + 0.8S) = (${n(P)} − ${f(0.2 * S)})²/(${n(P)} + ${f(0.8 * S)}) = ${f(Q)} in`,
      };
    },
  },
  {
    id: "clarifier-overflow-rate",
    version: 1,
    title: "Circular clarifier surface overflow rate",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Environmental: Clarifier Overflow Rate",
    generate(r) {
      const D = r.range(10, 50, 1);
      const Q = r.range(2000, 30000, 500);
      const A = (Math.PI * D ** 2) / 4;
      const OR = Q / A;
      return {
        prompt: `A circular clarifier ${n(D)} m in diameter treats ${n(Q)} m³/d. What is the surface overflow rate?`,
        answer: OR,
        unit: "m³/m²·d",
        distractors: [
          Q / (Math.PI * D ** 2), // used πD² instead of πD²/4
          Q / D ** 2, // dropped π/4
          Q / (Math.PI * D), // divided by circumference (that's the weir loading idea)
        ],
        solution: `A = πD²/4 = π(${n(D)})²/4 = ${f(A)} m²\nOR = Q/A = ${n(Q)}/${f(A)} = ${f(OR)} m³/m²·d`,
      };
    },
  },
  {
    id: "critical-depth-rect",
    version: 1,
    title: "Critical depth, rectangular channel",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Open-Channel Flow: Critical Depth",
    generate(r) {
      const Q = r.range(2, 40, 0.5);
      const b = r.range(2, 10, 0.5);
      const q = Q / b;
      const yc = (q ** 2 / G_SI) ** (1 / 3);
      return {
        prompt: `A rectangular channel ${n(b)} m wide carries ${n(Q)} m³/s. What is the critical depth?`,
        answer: yc,
        unit: "m",
        distractors: [
          (q / G_SI) ** (1 / 3), // did not square q
          (q ** 2 / G_SI) ** (1 / 2), // square root instead of cube root
          (q ** 2 / (2 * G_SI)) ** (1 / 3), // added a 2 from the velocity-head term
          q ** 2 / G_SI, // forgot the cube root
        ],
        solution: `q = Q/b = ${n(Q)}/${n(b)} = ${f(q)} m²/s\ny_c = (q²/g)^(1/3) = (${f(q)}²/9.81)^(1/3) = ${f(yc)} m`,
      };
    },
  },
  {
    id: "froude-number-rect",
    version: 2,
    title: "Froude number, rectangular channel",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "Open-Channel Flow: Froude Number",
    generate(r) {
      const b = r.range(2, 8, 0.5);
      const y = r.range(0.3, 2.0, 0.1);
      // Pick a realistic target Froude number (0.3 to 3), then back out a rounded discharge.
      const target = r.range(0.3, 3.0, 0.05);
      const Q = Math.max(0.5, Math.round(target * Math.sqrt(G_SI * y) * b * y * 2) / 2);
      const V = Q / (b * y);
      const Fr = V / Math.sqrt(G_SI * y);
      return {
        prompt: `A rectangular channel ${n(b)} m wide carries ${n(Q)} m³/s at a depth of ${n(y)} m. What is the Froude number?`,
        answer: Fr,
        unit: "",
        distractors: [
          V ** 2 / (G_SI * y), // used Fr² (V²/gy)
          V / (G_SI * y), // forgot the square root
          V / Math.sqrt(G_SI * b), // used width instead of hydraulic depth
        ],
        solution: `V = Q/(by) = ${n(Q)}/(${n(b)} × ${n(y)}) = ${f(V)} m/s\nFr = V/√(gy) = ${f(V)}/√(9.81 × ${n(y)}) = ${f(Fr)}\n\n${Math.abs(Fr - 1) < 0.02 ? "Fr ≈ 1: near-critical flow, which is unstable in practice." : Fr > 1 ? "Fr > 1: supercritical flow." : "Fr < 1: subcritical flow."}`,
      };
    },
  },
];
