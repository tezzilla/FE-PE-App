import { f, n, type Template } from "./engine";

// Problem generators for statics, mechanics of materials, structural, geotechnical, transportation,
// surveying and engineering economics. Same rules as water-resources.ts: every distractor is a named,
// common mistake, and nothing here reaches students until a reviewer approves it.

const GAMMA_W = 9.81; // kN/m³
const deg = (x: number) => (x * Math.PI) / 180;

// ---------------------------------------------------------------- Statics / mechanics of materials

const STATICS_MECHANICS: Template[] = [
  {
    id: "beam-point-load-reaction",
    version: 1,
    title: "Simply supported beam: support reaction from a point load",
    topics: { "fe-civil": "statics" },
    reference: "Statics: Equilibrium",
    generate(r) {
      const L = r.range(4, 12, 0.5);
      const a = r.range(0.5, L - 0.5, 0.5);
      const P = r.range(5, 100, 5);
      const RA = (P * (L - a)) / L;
      return {
        prompt: `A simply supported beam spans ${n(L)} m. A ${n(P)} kN point load acts ${n(a)} m from the left support. What is the vertical reaction at the left support?`,
        answer: RA,
        unit: "kN",
        distractors: [
          (P * a) / L, // used the load's distance from the left support as the moment arm (that's R_B)
          P / 2, // assumed the load is at midspan
          P, // put the whole load on one support
        ],
        solution: `ΣM about the right support = 0:\nR_A × ${n(L)} = ${n(P)} × (${n(L)} − ${n(a)})\nR_A = ${n(P)} × ${f(L - a)} / ${n(L)} = ${f(RA)} kN`,
      };
    },
  },
  {
    id: "axial-deformation",
    version: 1,
    title: "Axial deformation of a bar (δ = PL/AE)",
    topics: { "fe-civil": "mechanics-materials" },
    reference: "Mechanics of Materials: Uniaxial Loading and Deformation",
    generate(r) {
      const mat = r.pick([
        { name: "steel", E: 200 },
        { name: "aluminum", E: 70 },
        { name: "brass", E: 100 },
      ] as const);
      const P = r.range(10, 200, 5);
      const L = r.range(0.5, 5, 0.1);
      const A = r.range(100, 2000, 50);
      const d = (P * L * 1000) / (A * mat.E); // mm
      return {
        prompt: `A ${n(L)} m long ${mat.name} bar (E = ${mat.E} GPa) with cross-sectional area ${n(A)} mm² carries an axial tensile load of ${n(P)} kN. What is the elongation?`,
        answer: d,
        unit: "mm",
        distractors: [
          d / 1000, // left L in meters while the rest is in N and mm
          d * 1000, // used E in GPa as if it were MPa
          d / (L * 1000), // computed strain (δ/L) instead of elongation
        ],
        solution: `δ = PL/(AE) = (${n(P)} × 10³ N)(${n(L * 1000)} mm) / [(${n(A)} mm²)(${n(mat.E * 1000)} MPa)] = ${f(d)} mm`,
      };
    },
  },
  {
    id: "udl-max-moment",
    version: 1,
    title: "Maximum moment, simply supported beam with uniform load",
    topics: { "fe-civil": "mechanics-materials", "pe-civil": "structural" },
    reference: "Mechanics of Materials: Beam Diagrams",
    generate(r) {
      const w = r.range(2, 40, 1);
      const L = r.range(3, 15, 0.5);
      const M = (w * L * L) / 8;
      return {
        prompt: `A simply supported beam spans ${n(L)} m and carries a uniformly distributed load of ${n(w)} kN/m (including self-weight). What is the maximum bending moment?`,
        answer: M,
        unit: "kN·m",
        distractors: [
          (w * L * L) / 2, // cantilever formula
          (w * L * L) / 12, // fixed-end moment formula
          (w * L * L) / 4, // PL/4 with the total load as a point load
        ],
        solution: `M_max = wL²/8 = (${n(w)})(${n(L)})²/8 = ${f(M)} kN·m, at midspan`,
      };
    },
  },
  {
    id: "rect-bending-stress",
    version: 1,
    title: "Bending stress in a rectangular beam (σ = Mc/I)",
    topics: { "fe-civil": "mechanics-materials" },
    reference: "Mechanics of Materials: Stresses in Beams",
    generate(r) {
      const b = r.range(100, 400, 25);
      const h = r.range(Math.max(200, b), 900, 50);
      const M = r.range(10, 300, 5);
      const S = (b * h * h) / 6; // mm³
      const sigma = (M * 1e6) / S; // MPa
      return {
        prompt: `A rectangular beam ${n(b)} mm wide and ${n(h)} mm deep is bent about its strong axis by a moment of ${n(M)} kN·m. What is the maximum bending stress?`,
        answer: sigma,
        unit: "MPa",
        distractors: [
          sigma / 2, // used c = h instead of h/2
          (sigma * h) / b, // swapped b and h (weak-axis bending)
          sigma * 2, // used bh²/12 as the section modulus
        ],
        solution: `I = bh³/12, c = h/2, so S = I/c = bh²/6 = (${n(b)})(${n(h)})²/6 = ${f(S)} mm³\nσ = M/S = (${n(M)} × 10⁶ N·mm)/${f(S)} mm³ = ${f(sigma)} MPa`,
      };
    },
  },
  {
    id: "euler-buckling",
    version: 1,
    title: "Euler buckling load with end conditions",
    topics: { "fe-civil": "structural", "pe-civil": "structural" },
    reference: "Mechanics of Materials: Columns",
    generate(r) {
      const end = r.pick([
        { text: "pinned at both ends", K: 1.0 },
        { text: "fixed at the base and free at the top", K: 2.0 },
        { text: "fixed at the base and pinned at the top", K: 0.7 },
        { text: "fixed at both ends", K: 0.5 },
      ] as const);
      const I = r.range(2, 50, 1); // ×10⁶ mm⁴
      const L = r.range(2, 8, 0.5); // m
      const P = (Math.PI ** 2 * 200000 * I * 1e6) / (end.K * L * 1000) ** 2 / 1000; // kN
      return {
        prompt: `A steel column (E = 200 GPa) is ${n(L)} m long and ${end.text}. Its minimum moment of inertia is ${n(I)} × 10⁶ mm⁴. Using the theoretical effective length factor, what is the Euler buckling load?`,
        answer: P,
        unit: "kN",
        distractors: [
          (Math.PI ** 2 * 200000 * I * 1e6) / (L * 1000) ** 2 / 1000, // ignored the end conditions (K = 1)
          (Math.PI ** 2 * 200000 * I * 1e6) / (end.K * (L * 1000) ** 2) / 1000, // didn't square K
          (Math.PI ** 2 * 200000 * I * 1e6) / (0.5 * L * 1000) ** 2 / 1000, // used K = 0.5 regardless
          (Math.PI ** 2 * 200000 * I * 1e6) / (2 * L * 1000) ** 2 / 1000, // assumed a flagpole (K = 2)
          P / 1000, // used E = 200 as MPa instead of 200,000 MPa
        ],
        solution: `K = ${end.K} (${end.text})\nP_cr = π²EI/(KL)² = π²(200,000 MPa)(${n(I)} × 10⁶ mm⁴)/(${end.K} × ${n(L * 1000)} mm)² = ${f(P * 1000)} N = ${f(P)} kN`,
      };
    },
  },
];

// ---------------------------------------------------------------- Geotechnical

const GEOTECH: Template[] = [
  {
    id: "effective-stress",
    version: 1,
    title: "Vertical effective stress below the water table",
    topics: { "fe-civil": "geotechnical", "pe-civil": "geotechnical" },
    reference: "Geotechnical: Effective Stress",
    generate(r) {
      const dw = r.range(0.5, 5, 0.5);
      const z = r.range(dw + 1, dw + 10, 0.5);
      const g = r.range(16, 19, 0.5);
      const gs = r.range(Math.max(18, g + 1), 21.5, 0.5);
      const sigma = g * dw + gs * (z - dw);
      const u = GAMMA_W * (z - dw);
      const eff = sigma - u;
      return {
        prompt: `The water table is ${n(dw)} m below the ground surface. The soil has a moist unit weight of ${n(g)} kN/m³ above the water table and a saturated unit weight of ${n(gs)} kN/m³ below it. What is the vertical effective stress at a depth of ${n(z)} m? (γw = 9.81 kN/m³)`,
        answer: eff,
        unit: "kPa",
        distractors: [
          sigma, // reported total stress
          gs * z - u, // used the saturated unit weight above the water table too
          (gs - GAMMA_W) * z, // used the buoyant unit weight for the full depth
          sigma - GAMMA_W * z, // measured pore pressure from the ground surface, not the water table
        ],
        solution: `σ = (${n(g)})(${n(dw)}) + (${n(gs)})(${f(z - dw)}) = ${f(sigma)} kPa\nu = (9.81)(${f(z - dw)}) = ${f(u)} kPa\nσ' = σ − u = ${f(eff)} kPa`,
      };
    },
  },
  {
    id: "rankine-active-thrust",
    version: 1,
    title: "Rankine active thrust on a retaining wall",
    topics: { "fe-civil": "geotechnical", "pe-civil": "geotechnical" },
    reference: "Geotechnical: Lateral Earth Pressure",
    generate(r) {
      const phi = r.range(25, 40, 1);
      const g = r.range(16, 21, 0.5);
      const H = r.range(2, 10, 0.5);
      const Ka = Math.tan(deg(45 - phi / 2)) ** 2;
      const Kp = Math.tan(deg(45 + phi / 2)) ** 2;
      const Pa = 0.5 * Ka * g * H * H;
      return {
        prompt: `A ${n(H)} m tall smooth vertical wall retains level, dry, cohesionless backfill with γ = ${n(g)} kN/m³ and φ = ${phi}°. Using Rankine theory, what is the active thrust per meter of wall?`,
        answer: Pa,
        unit: "kN/m",
        distractors: [
          0.5 * Kp * g * H * H, // used the passive coefficient
          Ka * g * H * H, // forgot the 1/2 (used the base pressure times height)
          0.5 * Ka * g * H, // didn't square H
        ],
        solution: `Ka = tan²(45° − φ/2) = tan²(${f(45 - phi / 2)}°) = ${f(Ka)}\nPa = ½ Ka γ H² = ½ (${f(Ka)})(${n(g)})(${n(H)})² = ${f(Pa)} kN/m, acting H/3 above the base`,
      };
    },
  },
  {
    id: "nc-clay-settlement",
    version: 1,
    title: "Primary consolidation settlement, normally consolidated clay",
    topics: { "pe-civil": "geotechnical" },
    reference: "Geotechnical: Consolidation",
    generate(r) {
      const Cc = r.range(0.2, 0.6, 0.02);
      const e0 = r.range(0.6, 1.4, 0.05);
      const H = r.range(2, 8, 0.5);
      const s0 = r.range(50, 200, 10);
      const ds = r.range(20, 150, 10);
      const log = Math.log10((s0 + ds) / s0);
      const S = ((Cc * H) / (1 + e0)) * log * 1000;
      return {
        prompt: `A ${n(H)} m thick normally consolidated clay layer has Cc = ${n(Cc)} and e₀ = ${n(e0)}. At mid-depth the initial effective stress is ${n(s0)} kPa, and a new fill adds ${n(ds)} kPa there. What is the primary consolidation settlement?`,
        answer: S,
        unit: "mm",
        distractors: [
          S * Math.LN10, // used natural log instead of log base 10
          S * (1 + e0), // forgot to divide by (1 + e₀)
          ((Cc * H) / (1 + e0)) * (ds / s0) * 1000, // forgot the log (used Δσ/σ₀ directly)
        ],
        solution: `S = [Cc H/(1 + e₀)] log[(σ'₀ + Δσ)/σ'₀]\n= [(${n(Cc)})(${n(H)})/(1 + ${n(e0)})] log(${n(s0 + ds)}/${n(s0)})\n= ${f((Cc * H) / (1 + e0))} × ${f(log)} = ${f(S / 1000)} m = ${f(S)} mm`,
      };
    },
  },
  {
    id: "dry-unit-weight",
    version: 1,
    title: "Dry unit weight from specific gravity and void ratio",
    topics: { "fe-civil": "geotechnical" },
    reference: "Geotechnical: Phase Relationships",
    generate(r) {
      const Gs = r.range(2.6, 2.75, 0.01);
      const e = r.range(0.4, 1.0, 0.02);
      const gd = (Gs * GAMMA_W) / (1 + e);
      return {
        prompt: `A soil has specific gravity of solids Gs = ${n(Gs)} and void ratio e = ${n(e)}. What is its dry unit weight? (γw = 9.81 kN/m³)`,
        answer: gd,
        unit: "kN/m³",
        distractors: [
          (Gs * GAMMA_W) / e, // divided by e instead of (1 + e)
          ((Gs + e) * GAMMA_W) / (1 + e), // saturated unit weight
          Gs * GAMMA_W, // unit weight of the solids alone
        ],
        solution: `γd = Gs γw/(1 + e) = (${n(Gs)})(9.81)/(1 + ${n(e)}) = ${f(gd)} kN/m³`,
      };
    },
  },
];

// ---------------------------------------------------------------- Transportation / surveying

const TRANSPORT: Template[] = [
  {
    id: "stopping-sight-distance",
    version: 1,
    title: "Stopping sight distance on a grade (AASHTO)",
    topics: { "fe-civil": "transportation", "pe-civil": "transportation" },
    reference: "Transportation: Stopping Sight Distance",
    generate(r) {
      const V = r.range(30, 70, 5);
      const G = r.pick([0, 0.02, -0.02, 0.03, -0.03, 0.04, -0.04]);
      const t = r.pick([2.0, 2.5]);
      const a = 11.2;
      const react = 1.47 * V * t;
      const brake = (V * V) / (30 * (a / 32.2 + G));
      const ssd = react + brake;
      const gradeText = G === 0 ? "a level road" : `a ${n(Math.abs(G * 100))}% ${G > 0 ? "upgrade" : "downgrade"}`;
      return {
        prompt: `Find the stopping sight distance for a design speed of ${V} mph on ${gradeText}. Use a perception-reaction time of ${t} s and a deceleration rate of 11.2 ft/s².`,
        answer: ssd,
        unit: "ft",
        distractors: [
          brake, // left out the perception-reaction distance
          react + (V * V) / (30 * (a / 32.2 - G)), // applied the grade with the wrong sign
          V * t + brake, // used mph × s for the reaction distance (forgot 1.47)
        ],
        solution: `SSD = 1.47Vt + V²/[30(a/32.2 ± G)]\nReaction: 1.47(${V})(${t}) = ${f(react)} ft\nBraking: ${V}²/[30(${f(a / 32.2)} ${G >= 0 ? "+" : "−"} ${n(Math.abs(G))})] = ${f(brake)} ft\nSSD = ${f(ssd)} ft`,
      };
    },
  },
  {
    id: "flow-density-speed",
    version: 1,
    title: "Traffic flow from density and speed",
    topics: { "fe-civil": "transportation" },
    reference: "Transportation: Traffic Flow Relationships",
    generate(r) {
      const k = r.range(10, 80, 5);
      const v = r.range(25, 70, 5);
      const lanes = r.pick([2, 3, 4]);
      const q = k * v * lanes;
      return {
        prompt: `A ${lanes}-lane freeway direction has an average density of ${k} veh/mi/ln and a space-mean speed of ${v} mph. What is the total flow rate in that direction?`,
        answer: q,
        unit: "veh/hr",
        distractors: [
          k * v, // per-lane flow only
          (k * v) / lanes, // divided by lanes instead of multiplying
          k * v * lanes * 2, // counted both directions
        ],
        solution: `q = kv per lane = (${k})(${v}) = ${f(k * v)} veh/hr/ln\nTotal = ${f(k * v)} × ${lanes} lanes = ${f(q)} veh/hr`,
      };
    },
  },
  {
    id: "horizontal-curve-length",
    version: 1,
    title: "Length of a circular horizontal curve",
    topics: { "fe-civil": "surveying", "pe-civil": "transportation" },
    reference: "Surveying / Transportation: Horizontal Curves",
    generate(r) {
      const R = r.range(300, 3000, 50);
      const D = r.range(10, 80, 1);
      const L = R * deg(D);
      return {
        prompt: `A circular horizontal curve has radius ${n(R)} ft and intersection (deflection) angle Δ = ${D}°. What is the length of the curve?`,
        answer: L,
        unit: "ft",
        distractors: [
          R * Math.tan(deg(D / 2)), // tangent length T
          2 * R * Math.sin(deg(D / 2)), // long chord
          R * deg(D / 2), // used Δ/2
          R * D, // used Δ in degrees instead of radians
        ],
        solution: `L = RΔ (radians) = ${n(R)} × (${D} × π/180) = ${f(L)} ft`,
      };
    },
  },
  {
    id: "webster-cycle-length",
    version: 1,
    title: "Optimum signal cycle length (Webster)",
    topics: { "pe-civil": "transportation" },
    reference: "Transportation: Signal Timing",
    generate(r) {
      const L = r.range(8, 20, 1);
      const Y = r.range(0.4, 0.75, 0.01);
      const C = (1.5 * L + 5) / (1 - Y);
      return {
        prompt: `An intersection has total lost time L = ${L} s per cycle, and the critical flow ratios sum to Y = ${n(Y)}. Using Webster's method, what is the optimum cycle length?`,
        answer: C,
        unit: "s",
        distractors: [
          (1.5 * L + 5) / Y, // divided by Y instead of (1 − Y)
          (L + 5) / (1 - Y), // dropped the 1.5 factor
          (1.5 * L) / (1 - Y), // dropped the + 5
        ],
        solution: `C₀ = (1.5L + 5)/(1 − Y) = (1.5 × ${L} + 5)/(1 − ${n(Y)}) = ${f(1.5 * L + 5)}/${f(1 - Y)} = ${f(C)} s`,
      };
    },
  },
];

// ---------------------------------------------------------------- Structural design (PE)

const STRUCTURAL: Template[] = [
  {
    id: "rc-beam-design-moment",
    version: 2,
    title: "Design flexural strength of a singly reinforced concrete beam",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318-19: Flexure (Whitney stress block), Table 21.2.2",
    generate(r) {
      // Regenerate until the section is tension-controlled and meets minimum steel, so φ = 0.90.
      for (;;) {
        const b = r.range(10, 24, 2);
        const d = r.range(16, 36, 1);
        const As = r.range(1.0, 6.0, 0.1);
        const fc = r.pick([3, 4, 5]);
        const fy = 60;
        const beta1 = fc <= 4 ? 0.85 : 0.8;
        const a = (As * fy) / (0.85 * fc * b);
        const c = a / beta1;
        const et = (0.003 * (d - c)) / c;
        // ACI 318-19 Table 21.2.2: tension-controlled when εt ≥ εty + 0.003 (0.00507 for Grade 60).
        const etLimit = 60 / 29000 + 0.003;
        const asMin = Math.max((3 * Math.sqrt(fc * 1000) * b * d) / (fy * 1000), (200 * b * d) / (fy * 1000));
        if (et < etLimit || As < asMin) continue;
        const Mn = (As * fy * (d - a / 2)) / 12;
        const phiMn = 0.9 * Mn;
        return {
          prompt: `A rectangular concrete beam has b = ${b} in, d = ${d} in, and ${n(As)} in² of Grade 60 tension steel (fy = 60 ksi). f'c = ${fc},000 psi. What is the design flexural strength φMn?`,
          answer: phiMn,
          unit: "kip·ft",
          distractors: [
            Mn, // forgot φ
            (0.9 * As * fy * d) / 12, // ignored the stress block (lever arm = d)
            (0.9 * As * fy * (d - a)) / 12, // used d − a instead of d − a/2
          ],
          solution: `a = As fy/(0.85 f'c b) = (${n(As)})(60)/(0.85 × ${fc} × ${b}) = ${f(a)} in\nc = a/β₁ = ${f(a)}/${beta1} = ${f(c)} in; εt = 0.003(d − c)/c = ${f(et)} ≥ εty + 0.003 = 0.00507, tension-controlled, φ = 0.90 (ACI 318-19)\nMn = As fy (d − a/2) = (${n(As)})(60)(${d} − ${f(a / 2)}) = ${f(Mn * 12)} kip·in = ${f(Mn)} kip·ft\nφMn = 0.90 × ${f(Mn)} = ${f(phiMn)} kip·ft`,
        };
      }
    },
  },
  {
    id: "steel-required-z",
    version: 1,
    title: "Required plastic section modulus for a steel beam (LRFD)",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360: Chapter F (compact, laterally braced)",
    generate(r) {
      const Mu = r.range(100, 1200, 10);
      const Fy = r.pick([50, 36]);
      const Z = (Mu * 12) / (0.9 * Fy);
      return {
        prompt: `A laterally braced, compact steel beam (Fy = ${Fy} ksi) must resist a factored moment Mu = ${n(Mu)} kip·ft. With Mn = Fy·Z and φb = 0.90, what is the minimum required plastic section modulus Z?`,
        answer: Z,
        unit: "in³",
        distractors: [
          (Mu * 12) / Fy, // left out φ
          Mu / (0.9 * Fy), // didn't convert kip·ft to kip·in
          (Mu * 12 * 0.9) / Fy, // multiplied by φ instead of dividing
        ],
        solution: `Z_req = Mu/(φ Fy) = (${n(Mu)} × 12 kip·in)/(0.90 × ${Fy} ksi) = ${f(Z)} in³`,
      };
    },
  },
  {
    id: "fixed-end-moment",
    version: 1,
    title: "Fixed-end moment for a uniform or midspan point load",
    topics: { "pe-civil": "structural" },
    reference: "Structural: Fixed-End Moments",
    generate(r) {
      const L = r.range(10, 40, 1);
      if (r.next() < 0.5) {
        const w = r.range(0.5, 6, 0.1);
        const M = (w * L * L) / 12;
        return {
          prompt: `A beam fixed at both ends spans ${L} ft and carries a uniform load of ${n(w)} kip/ft. What is the magnitude of the fixed-end moment?`,
          answer: M,
          unit: "kip·ft",
          distractors: [(w * L * L) / 8, (w * L * L) / 24, (w * L * L) / 2], // simple-span max, fixed midspan moment, cantilever
          solution: `FEM = wL²/12 = (${n(w)})(${L})²/12 = ${f(M)} kip·ft at each end\n(The midspan moment is wL²/24.)`,
        };
      }
      const P = r.range(5, 80, 1);
      const M = (P * L) / 8;
      return {
        prompt: `A beam fixed at both ends spans ${L} ft and carries a ${P} kip point load at midspan. What is the magnitude of the fixed-end moment?`,
        answer: M,
        unit: "kip·ft",
        distractors: [(P * L) / 4, (P * L) / 2, (P * L) / 16], // simple-span max, cantilever, halved again
        solution: `FEM = PL/8 = (${P})(${L})/8 = ${f(M)} kip·ft at each end`,
      };
    },
  },
];

// ---------------------------------------------------------------- Engineering economics

const ECONOMICS: Template[] = [
  {
    id: "present-worth-annuity",
    version: 1,
    title: "Present worth of a uniform annual series (P/A)",
    topics: { "fe-civil": "economics" },
    reference: "Engineering Economics: Factor Table (P/A)",
    generate(r) {
      const A = r.range(1000, 20000, 500);
      const i = r.range(3, 12, 0.5) / 100;
      const N = r.range(5, 30, 1);
      const PA = ((1 + i) ** N - 1) / (i * (1 + i) ** N);
      const P = A * PA;
      return {
        prompt: `A project saves $${n(A)} at the end of each year for ${N} years. At ${n(i * 100)}% interest per year, what is the present worth of the savings?`,
        answer: P,
        unit: "$",
        distractors: [
          A * N, // ignored interest
          A / i, // perpetuity formula
          (A * ((1 + i) ** N - 1)) / i, // future worth (F/A)
        ],
        solution: `P = A(P/A, ${n(i * 100)}%, ${N}) = A[(1 + i)ⁿ − 1]/[i(1 + i)ⁿ]\n(P/A) = ${f(PA, 5)}\nP = ${n(A)} × ${f(PA, 5)} = $${f(P, 5)}`,
      };
    },
  },
  {
    id: "future-worth-single",
    version: 1,
    title: "Future worth of a single amount (F/P)",
    topics: { "fe-civil": "economics" },
    reference: "Engineering Economics: Factor Table (F/P)",
    generate(r) {
      const P = r.range(1000, 100000, 1000);
      const i = r.range(2, 12, 0.5) / 100;
      const N = r.range(2, 30, 1);
      const F = P * (1 + i) ** N;
      return {
        prompt: `$${n(P)} is invested today at ${n(i * 100)}% per year, compounded annually. What is it worth after ${N} years?`,
        answer: F,
        unit: "$",
        distractors: [
          P * (1 + i * N), // simple interest
          P / (1 + i) ** N, // present worth factor instead
          P * (1 + i) ** (N - 1), // one period short
          P * (1 + i) ** (N + 1), // one period too many
        ],
        solution: `F = P(1 + i)ⁿ = ${n(P)}(1 + ${n(i)})^${N} = ${n(P)} × ${f((1 + i) ** N, 5)} = $${f(F, 5)}`,
      };
    },
  },
  {
    id: "straight-line-book-value",
    version: 1,
    title: "Book value with straight-line depreciation",
    topics: { "fe-civil": "economics" },
    reference: "Engineering Economics: Depreciation",
    generate(r) {
      const C = r.range(10000, 500000, 5000);
      const S = Math.round((C * r.range(0, 0.2, 0.05)) / 1000) * 1000;
      const N = r.range(5, 20, 1);
      const k = r.range(1, N - 1, 1);
      const D = (C - S) / N;
      const BV = C - k * D;
      return {
        prompt: `Equipment costs $${n(C)}, has a ${N}-year life, and an estimated salvage value of $${n(S)}. Using straight-line depreciation, what is its book value at the end of year ${k}?`,
        answer: BV,
        unit: "$",
        distractors: [
          C - (k * C) / N, // ignored salvage value
          D, // reported the annual depreciation
          C - (k - 1) * D, // one year short
          C - (k + 1) * D, // one year too many
        ],
        solution: `D = (C − S)/n = (${n(C)} − ${n(S)})/${N} = $${f(D, 5)} per year\nBV after ${k} years = ${n(C)} − ${k} × ${f(D, 5)} = $${f(BV, 5)}`,
      };
    },
  },
];

export const CIVIL_CORE: Template[] = [...STATICS_MECHANICS, ...GEOTECH, ...TRANSPORT, ...STRUCTURAL, ...ECONOMICS];
