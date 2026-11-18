import { f, n, type Template } from "./engine";

// Multi-step problem types for the PE Civil depth modules, written from the NCEES PE Civil exam
// specifications' knowledge areas (2026 review). All problem text is original. Where an answer depends
// on code factors or tables (bearing capacity factors, load factors, AISC/ACI constants), the prompt
// states them, so the result doesn't depend on which edition a student has.
// Every distractor is a named, common mistake. Each template has an independent solver in verify.ts.

const g = 9.81;
const deg = (x: number) => (x * Math.PI) / 180;

// ---------------------------------------------------------------- Water Resources & Environmental

const WRE: Template[] = [
  {
    id: "pump-system-power",
    version: 1,
    title: "Pump input power for a reservoir-to-reservoir system",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Closed-conduit hydraulics: energy equation, Darcy-Weisbach, pump power",
    generate(r) {
      for (;;) {
        const dz = r.range(10, 60, 1);
        const L = r.range(200, 2000, 50);
        const D = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]);
        const Q = r.range(0.04, 0.4, 0.01);
        const fr = r.range(0.015, 0.03, 0.001);
        const K = r.range(2, 10, 0.5);
        const eta = r.range(65, 85, 1);
        const V = Q / ((Math.PI * D * D) / 4);
        if (V < 0.6 || V > 3) continue;
        const hv = (V * V) / (2 * g);
        const hf = fr * (L / D) * hv;
        const hm = K * hv;
        const H = dz + hf + hm;
        const P = (g * Q * H) / (eta / 100);
        return {
          prompt: `Water is pumped from a lower reservoir to an upper reservoir whose surface is ${dz} m higher, through ${n(L)} m of pipe with diameter ${n(D)} m. The flow is ${n(Q)} m³/s, the Darcy friction factor is ${n(fr)}, and the minor loss coefficients (entrance, bends, valves, exit) sum to ${n(K)}. The pump efficiency is ${eta}%. What input power does the pump need?`,
          answer: P,
          unit: "kW",
          distractors: [
            (g * Q * dz) / (eta / 100), // used only the static lift, ignoring friction and minor losses
            g * Q * H, // left out the efficiency (water power, not input power)
            g * Q * H * (eta / 100), // multiplied by the efficiency instead of dividing
            (g * Q * (dz + hf)) / (eta / 100), // ignored the minor losses
          ],
          solution: `V = Q/A = ${n(Q)}/(π × ${n(D)}²/4) = ${f(V)} m/s, so V²/2g = ${f(hv)} m\nFriction: h_f = f(L/D)(V²/2g) = ${n(fr)} × (${n(L)}/${n(D)}) × ${f(hv)} = ${f(hf)} m\nMinor: h_m = ΣK(V²/2g) = ${n(K)} × ${f(hv)} = ${f(hm)} m\nTotal dynamic head H = ${dz} + ${f(hf)} + ${f(hm)} = ${f(H)} m\nP = γQH/η = (9.81)(${n(Q)})(${f(H)})/${eta / 100} = ${f(P)} kW`,
        };
      }
    },
  },
  {
    id: "hydraulic-jump-energy-loss",
    version: 1,
    title: "Hydraulic jump: sequent depth and energy loss",
    topics: { "pe-civil": "water-env" },
    reference: "Open-channel flow: hydraulic jump (rectangular channel)",
    generate(r) {
      const b = r.range(2, 8, 0.5);
      const y1 = r.range(0.2, 0.8, 0.05);
      const target = r.range(2.5, 7, 0.1);
      const Q = Math.round(target * Math.sqrt(g * y1) * y1 * b * 2) / 2;
      const V1 = Q / (b * y1);
      const Fr1 = V1 / Math.sqrt(g * y1);
      const y2 = (y1 / 2) * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
      const dE = (y2 - y1) ** 3 / (4 * y1 * y2);
      return {
        prompt: `A hydraulic jump forms in a rectangular channel ${n(b)} m wide carrying ${n(Q)} m³/s. The depth just upstream of the jump is ${n(y1)} m. What is the head loss across the jump?`,
        answer: dE,
        unit: "m",
        distractors: [
          y2 - y1, // reported the jump height instead of the energy loss
          (y2 - y1) ** 3 / (y1 * y2), // left out the 4 in the denominator
          (y2 - y1) ** 2 / (4 * y1 * y2), // squared instead of cubed the depth difference
        ],
        solution: `V₁ = Q/(by₁) = ${n(Q)}/(${n(b)} × ${n(y1)}) = ${f(V1)} m/s\nFr₁ = V₁/√(gy₁) = ${f(Fr1)} (supercritical)\ny₂ = (y₁/2)[√(1 + 8Fr₁²) − 1] = ${f(y2)} m\nΔE = (y₂ − y₁)³/(4y₁y₂) = (${f(y2)} − ${n(y1)})³/(4 × ${n(y1)} × ${f(y2)}) = ${f(dE)} m`,
      };
    },
  },
  {
    id: "thiem-confined-drawdown",
    version: 1,
    title: "Drawdown near a well in a confined aquifer (Thiem)",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Groundwater: steady flow to a well, confined aquifer (Thiem)",
    generate(r) {
      const bt = r.range(10, 40, 1);
      const K = r.range(5, 60, 1);
      const Q = r.range(500, 4000, 50);
      const r2 = r.range(60, 200, 10);
      const r1 = r.range(10, 40, 5);
      const s2 = r.range(0.4, 2.5, 0.1);
      const ds = (Q * Math.log(r2 / r1)) / (2 * Math.PI * K * bt);
      const s1 = s2 + ds;
      return {
        prompt: `A well fully penetrates a confined aquifer ${bt} m thick with hydraulic conductivity ${K} m/d and pumps steadily at ${n(Q)} m³/d. An observation well ${r2} m away shows ${n(s2)} m of drawdown. What is the drawdown ${r1} m from the pumping well?`,
        answer: s1,
        unit: "m",
        distractors: [
          s2 + (Q * Math.log10(r2 / r1)) / (2 * Math.PI * K * bt), // used log base 10 instead of ln
          s2 - ds, // subtracted: drawdown is larger closer to the well
          s2 + (Q * Math.log(r2 / r1)) / (K * bt), // left out 2π
          ds, // reported only the difference between the two wells
        ],
        solution: `Thiem: s₁ − s₂ = Q ln(r₂/r₁)/(2πKb)\n= ${n(Q)} × ln(${r2}/${r1})/(2π × ${K} × ${bt}) = ${f(ds)} m\ns₁ = ${n(s2)} + ${f(ds)} = ${f(s1)} m`,
      };
    },
  },
  {
    id: "streeter-phelps-do",
    version: 1,
    title: "Dissolved oxygen downstream of a wastewater discharge (Streeter-Phelps)",
    topics: { "pe-civil": "water-env" },
    reference: "Surface water quality: mixing and the oxygen sag equation",
    generate(r) {
      for (;;) {
        const Qr = r.range(2, 20, 0.5);
        const DOr = r.range(6.5, 8.5, 0.1);
        const Lr = r.range(1, 4, 0.5);
        const Qw = r.range(0.2, 2, 0.1);
        const DOw = r.range(0, 3, 0.5);
        const Lw = r.range(60, 250, 10);
        const DOs = r.range(8, 9.5, 0.1);
        const kd = r.range(0.2, 0.4, 0.01);
        const kr = r.range(kd + 0.15, 0.95, 0.01);
        const t = r.pick([0.5, 1, 1.5, 2, 2.5]);
        const L0 = (Qr * Lr + Qw * Lw) / (Qr + Qw);
        const DOm = (Qr * DOr + Qw * DOw) / (Qr + Qw);
        const D0 = DOs - DOm;
        const Dt = ((kd * L0) / (kr - kd)) * (Math.exp(-kd * t) - Math.exp(-kr * t)) + D0 * Math.exp(-kr * t);
        const DO = DOs - Dt;
        if (DO < 1 || D0 < 0) continue;
        return {
          prompt: `A river flowing ${n(Qr)} m³/s has DO = ${n(DOr)} mg/L and ultimate BOD = ${n(Lr)} mg/L. A treated wastewater discharges ${n(Qw)} m³/s with DO = ${n(DOw)} mg/L and ultimate BOD = ${n(Lw)} mg/L. After mixing, saturation DO is ${n(DOs)} mg/L, the deoxygenation rate is ${n(kd)} d⁻¹ and the reaeration rate is ${n(kr)} d⁻¹ (base e). What is the dissolved oxygen ${n(t)} days downstream?`,
          answer: DO,
          unit: "mg/L",
          distractors: [
            DOs - ((kd * L0) / (kr - kd)) * (Math.exp(-kd * t) - Math.exp(-kr * t)), // ignored the initial deficit after mixing
            Dt, // reported the deficit instead of the DO
            DOs - (((kd * Lw) / (kr - kd)) * (Math.exp(-kd * t) - Math.exp(-kr * t)) + D0 * Math.exp(-kr * t)), // used the waste BOD without mixing
          ],
          solution: `Mixed BOD: L₀ = (${n(Qr)} × ${n(Lr)} + ${n(Qw)} × ${n(Lw)})/(${n(Qr)} + ${n(Qw)}) = ${f(L0)} mg/L\nMixed DO = (${n(Qr)} × ${n(DOr)} + ${n(Qw)} × ${n(DOw)})/${f(Qr + Qw)} = ${f(DOm)} mg/L, so D₀ = ${n(DOs)} − ${f(DOm)} = ${f(D0)} mg/L\nD(t) = [k_d L₀/(k_r − k_d)](e^(−k_d t) − e^(−k_r t)) + D₀e^(−k_r t) = ${f(Dt)} mg/L\nDO = ${n(DOs)} − ${f(Dt)} = ${f(DO)} mg/L`,
        };
      }
    },
  },
  {
    id: "chlorine-ct",
    version: 1,
    title: "Disinfection CT in a baffled clearwell",
    topics: { "pe-civil": "water-env" },
    reference: "Drinking water treatment: disinfection CT and baffling factor",
    generate(r) {
      const C = r.range(0.5, 2.0, 0.1);
      const V = r.range(500, 3000, 50);
      const Q = r.range(5000, 40000, 500);
      const bf = r.pick([
        { t: "poor", v: 0.3 },
        { t: "average", v: 0.5 },
        { t: "superior", v: 0.7 },
      ] as const);
      const T = (V / Q) * 1440; // minutes
      const t10 = bf.v * T;
      const CT = C * t10;
      return {
        prompt: `A clearwell holds ${n(V)} m³ and treats ${n(Q)} m³/d. Its baffling is ${bf.t} (baffling factor T₁₀/T = ${bf.v}). The free chlorine residual at the outlet is ${n(C)} mg/L. What CT does the clearwell provide?`,
        answer: CT,
        unit: "mg·min/L",
        distractors: [
          C * T, // used the theoretical detention time instead of T₁₀
          (C * T) / bf.v, // divided by the baffling factor
          C * bf.v * (V / Q) * 24, // left the time in hours
        ],
        solution: `T = V/Q = ${n(V)}/${n(Q)} d × 1,440 min/d = ${f(T)} min\nT₁₀ = (T₁₀/T) × T = ${bf.v} × ${f(T)} = ${f(t10)} min\nCT = C × T₁₀ = ${n(C)} × ${f(t10)} = ${f(CT)} mg·min/L`,
      };
    },
  },
  {
    id: "hazen-williams-headloss-us",
    version: 1,
    title: "Head loss in a water main (Hazen-Williams, US units)",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Pressure conduits: Hazen-Williams equation",
    generate(r) {
      for (;;) {
        const Din = r.pick([8, 10, 12, 16, 18, 24]);
        const C = r.pick([100, 110, 120, 130, 140]);
        const Q = r.range(0.5, 8, 0.1);
        const L = r.range(500, 5000, 100);
        const D = Din / 12;
        const V = Q / ((Math.PI * D * D) / 4);
        if (V < 1.5 || V > 8) continue;
        const hf = (4.73 * L * Q ** 1.852) / (C ** 1.852 * D ** 4.87);
        return {
          prompt: `A ${Din}-in ductile iron water main ${n(L)} ft long carries ${n(Q)} cfs. With a Hazen-Williams C of ${C}, what is the friction head loss?`,
          answer: hf,
          unit: "ft",
          distractors: [
            (4.73 * L * Q ** 2) / (C ** 1.852 * D ** 4.87), // squared Q instead of using 1.852
            (4.73 * L * Q ** 1.852) / (C ** 1.852 * D ** 5), // used 5 instead of 4.87 on D
            (4.73 * L * Q ** 1.852) / (C * D ** 4.87), // didn't raise C to 1.852
          ],
          solution: `D = ${Din}/12 = ${f(D)} ft\nh_f = 4.73 L Q^1.852 / (C^1.852 D^4.87)\n= 4.73 × ${n(L)} × ${n(Q)}^1.852 / (${C}^1.852 × ${f(D)}^4.87) = ${f(hf)} ft`,
        };
      }
    },
  },
  {
    id: "contracted-weir-flow",
    version: 1,
    title: "Flow over a rectangular weir with end contractions",
    topics: { "pe-civil": "water-env", "fe-civil": "fluids" },
    reference: "Flow measurement: sharp-crested rectangular weir (Francis)",
    generate(r) {
      const L = r.range(2, 10, 0.5);
      const H = r.range(0.3, 1.5, 0.05);
      const Q = 3.33 * (L - 0.2 * H) * H ** 1.5;
      return {
        prompt: `A sharp-crested rectangular weir with a crest ${n(L)} ft long has end contractions on both sides. The head above the crest is ${n(H)} ft. Using the Francis equation (C = 3.33), what is the discharge?`,
        answer: Q,
        unit: "cfs",
        distractors: [
          3.33 * L * H ** 1.5, // ignored the end contractions
          3.33 * (L - 0.1 * H) * H ** 1.5, // corrected for only one contraction
          3.33 * (L - 0.2 * H) * H ** 2.5, // used the V-notch exponent 5/2
        ],
        solution: `Two end contractions: effective length L' = L − 0.2H = ${n(L)} − 0.2(${n(H)}) = ${f(L - 0.2 * H)} ft\nQ = 3.33 L' H^1.5 = 3.33 × ${f(L - 0.2 * H)} × ${n(H)}^1.5 = ${f(Q)} cfs`,
      };
    },
  },
  {
    id: "total-hardness",
    version: 1,
    title: "Total hardness as CaCO₃ from calcium and magnesium",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Water chemistry: hardness, equivalent weights",
    generate(r) {
      const Ca = r.range(20, 150, 1);
      const Mg = r.range(5, 60, 1);
      const TH = Ca * (50 / 20.04) + Mg * (50 / 12.15);
      return {
        prompt: `A groundwater contains ${Ca} mg/L of calcium (Ca²⁺) and ${Mg} mg/L of magnesium (Mg²⁺). What is its total hardness, expressed as mg/L CaCO₃? (Equivalent weights: Ca²⁺ 20.04, Mg²⁺ 12.15, CaCO₃ 50.0.)`,
        answer: TH,
        unit: "mg/L as CaCO₃",
        distractors: [
          Ca + Mg, // added the ions without converting to CaCO₃
          Ca * (50 / 40.08) + Mg * (50 / 24.31), // used atomic weights instead of equivalent weights
          Ca * (50 / 20.04), // left out magnesium
        ],
        solution: `Hardness as CaCO₃ = (mg/L ion) × (50.0 / equivalent weight)\nCa: ${Ca} × 50.0/20.04 = ${f(Ca * (50 / 20.04))}\nMg: ${Mg} × 50.0/12.15 = ${f(Mg * (50 / 12.15))}\nTotal = ${f(TH)} mg/L as CaCO₃`,
      };
    },
  },
];

// ---------------------------------------------------------------- Geotechnical

// Vesic (1973) bearing capacity factors, as tabulated in common geotechnical references.
const VESIC = [
  { phi: 30, Nq: 18.4, Ng: 22.4 },
  { phi: 32, Nq: 23.18, Ng: 30.22 },
  { phi: 34, Nq: 29.44, Ng: 41.06 },
  { phi: 36, Nq: 37.75, Ng: 56.31 },
] as const;

const GEO: Template[] = [
  {
    id: "strip-footing-bearing-wt",
    version: 1,
    title: "Allowable bearing pressure of a strip footing with the water table at its base",
    topics: { "pe-civil": "geotechnical" },
    reference: "Shallow foundations: general bearing capacity, water table correction",
    generate(r) {
      const v = r.pick(VESIC);
      const B = r.range(1, 3, 0.25);
      const Df = r.range(0.75, 2, 0.25);
      const gm = r.range(17, 19, 0.5);
      const gs = r.range(Math.max(19, gm + 0.5), 21, 0.5);
      const FS = 3;
      const q = gm * Df;
      const gp = gs - g;
      const qult = q * v.Nq + 0.5 * gp * B * v.Ng;
      const qa = qult / FS;
      return {
        prompt: `A strip footing ${n(B)} m wide is founded ${n(Df)} m deep in clean sand (c = 0, φ = ${v.phi}°). The sand above the footing weighs ${n(gm)} kN/m³; the water table is at the base of the footing, and the saturated unit weight below it is ${n(gs)} kN/m³. Using Nq = ${v.Nq} and Nγ = ${v.Ng} and a factor of safety of ${FS} on the ultimate capacity, what is the allowable bearing pressure? (γw = 9.81 kN/m³)`,
        answer: qa,
        unit: "kPa",
        distractors: [
          (q * v.Nq + 0.5 * gm * B * v.Ng) / FS, // used the moist unit weight below the water table
          qult, // forgot the factor of safety
          (q * v.Nq + gp * B * v.Ng) / FS, // left out the ½ on the Nγ term
          (q * v.Nq + 0.5 * gs * B * v.Ng) / FS, // used the saturated, not buoyant, unit weight
        ],
        solution: `Surcharge at footing level: q = γDf = ${n(gm)} × ${n(Df)} = ${f(q)} kPa\nBelow the water table use γ' = ${n(gs)} − 9.81 = ${f(gp)} kN/m³\nq_ult = qNq + ½γ'BNγ = ${f(q)}(${v.Nq}) + ½(${f(gp)})(${n(B)})(${v.Ng}) = ${f(qult)} kPa\nq_allow = ${f(qult)}/${FS} = ${f(qa)} kPa`,
      };
    },
  },
  {
    id: "consolidation-time",
    version: 1,
    title: "Time for a given degree of consolidation",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Consolidation: time factor Tv, drainage path",
    generate(r) {
      const H = r.range(2, 10, 0.5);
      const cv = r.range(0.5, 5, 0.1); // m²/yr
      const dbl = r.next() < 0.6;
      const U = r.pick([
        { u: 50, Tv: 0.197 },
        { u: 90, Tv: 0.848 },
      ] as const);
      const Hdr = dbl ? H / 2 : H;
      const t = (U.Tv * Hdr * Hdr) / cv;
      return {
        prompt: `A ${n(H)} m thick clay layer is drained ${dbl ? "at both its top and bottom (sand above and below)" : "only at its top (rock below)"}. Its coefficient of consolidation is ${n(cv)} m²/yr. How long until ${U.u}% of primary consolidation is complete? (Tv = ${U.Tv} for U = ${U.u}%.)`,
        answer: t,
        unit: "years",
        distractors: [
          (U.Tv * H * H) / cv, // used the full thickness as the drainage path
          (U.Tv * (H / 2) * (H / 2)) / cv, // halved the thickness for single drainage
          ((U.u === 50 ? 0.848 : 0.197) * Hdr * Hdr) / cv, // used the other time factor
        ],
        solution: `Drainage path: H_dr = ${dbl ? `H/2 = ${f(Hdr)}` : `H = ${n(H)}`} m (${dbl ? "double" : "single"} drainage)\nt = Tv H_dr²/cv = ${U.Tv} × ${f(Hdr)}²/${n(cv)} = ${f(t)} years`,
      };
    },
  },
  {
    id: "infinite-slope-seepage",
    version: 1,
    title: "Infinite slope safety factor with seepage parallel to the slope",
    topics: { "pe-civil": "geotechnical" },
    reference: "Slope stability: infinite slope, cohesionless, steady seepage",
    generate(r) {
      for (;;) {
        const phi = r.range(28, 38, 1);
        const beta = r.range(12, 24, 1);
        const gs = r.range(18.5, 21, 0.5);
        const gp = gs - g;
        const FS = (gp / gs) * (Math.tan(deg(phi)) / Math.tan(deg(beta)));
        if (FS < 0.7 || FS > 2) continue;
        return {
          prompt: `A long natural slope of cohesionless soil (c' = 0, φ' = ${phi}°) is inclined at ${beta}°. The soil is saturated with seepage parallel to the slope and the water table at the ground surface. The saturated unit weight is ${n(gs)} kN/m³. What is the factor of safety against a shallow slide? (γw = 9.81 kN/m³)`,
          answer: FS,
          unit: "",
          distractors: [
            Math.tan(deg(phi)) / Math.tan(deg(beta)), // used the dry-slope result (no seepage)
            (g / gs) * (Math.tan(deg(phi)) / Math.tan(deg(beta))), // used γw/γsat instead of γ'/γsat
            (gp / gs) * (Math.tan(deg(beta)) / Math.tan(deg(phi))), // inverted the tangents
          ],
          solution: `With seepage parallel to the slope and c' = 0:\nFS = (γ'/γ_sat)(tan φ'/tan β)\nγ' = ${n(gs)} − 9.81 = ${f(gp)} kN/m³\nFS = (${f(gp)}/${n(gs)})(tan ${phi}°/tan ${beta}°) = ${f(FS)}`,
        };
      }
    },
  },
  {
    id: "pile-alpha-capacity",
    version: 1,
    title: "Allowable capacity of a driven pile in clay (α method)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Deep foundations: α method skin friction and end bearing in clay",
    generate(r) {
      const D = r.range(0.3, 0.6, 0.05);
      const L = r.range(10, 30, 1);
      const cu = r.range(30, 120, 5);
      const alpha = r.range(0.5, 1.0, 0.05);
      const FS = 2.5;
      const Qs = alpha * cu * Math.PI * D * L;
      const Qp = 9 * cu * ((Math.PI * D * D) / 4);
      const Qa = (Qs + Qp) / FS;
      return {
        prompt: `A ${n(D)} m diameter round pile is driven ${L} m into a uniform clay with undrained shear strength ${cu} kPa. Use an adhesion factor α = ${n(alpha)}, end bearing of 9cu, and a factor of safety of ${FS}. What is the allowable axial capacity?`,
        answer: Qa,
        unit: "kN",
        distractors: [
          Qs / FS, // left out end bearing
          (cu * Math.PI * D * L + Qp) / FS, // forgot the adhesion factor
          Qs + Qp, // forgot the factor of safety
          (alpha * cu * Math.PI * D * L + 9 * cu * Math.PI * D * D) / FS, // used πD² for the tip area
        ],
        solution: `Skin friction: Q_s = α cu (πD) L = ${n(alpha)} × ${cu} × π(${n(D)}) × ${L} = ${f(Qs)} kN\nEnd bearing: Q_p = 9cu (πD²/4) = 9 × ${cu} × ${f((Math.PI * D * D) / 4)} = ${f(Qp)} kN\nQ_allow = (Q_s + Q_p)/FS = ${f(Qs + Qp)}/${FS} = ${f(Qa)} kN`,
      };
    },
  },
];

// ---------------------------------------------------------------- Structural

const E = 29000; // ksi

const STRUCT: Template[] = [
  {
    id: "aisc-column-capacity",
    version: 1,
    title: "Design compressive strength of a steel column (AISC 360, Chapter E)",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section E3: flexural buckling",
    generate(r) {
      const A = r.range(10, 30, 0.1);
      const ry = r.range(1.8, 3.5, 0.01);
      const KL = r.range(10, 26, 1);
      const Fy = 50;
      const slend = (KL * 12) / ry;
      const Fe = (Math.PI ** 2 * E) / slend ** 2;
      const limit = 4.71 * Math.sqrt(E / Fy);
      const Fcr = slend <= limit ? 0.658 ** (Fy / Fe) * Fy : 0.877 * Fe;
      const phiPn = 0.9 * Fcr * A;
      return {
        prompt: `A steel column (Fy = 50 ksi, E = 29,000 ksi) has gross area ${n(A)} in² and least radius of gyration ${n(ry)} in. Its effective length for buckling about that axis is ${KL} ft. Using AISC 360 (LRFD, φc = 0.90), what is the design compressive strength φPn?`,
        answer: phiPn,
        unit: "kips",
        distractors: [
          Fcr * A, // forgot φ
          0.9 * Math.min(Fe, Fy) * A, // used the elastic buckling stress Fe directly
          0.9 * Fy * A, // used the yield strength (squash load), ignoring buckling
        ],
        solution: `KL/r = (${KL} × 12)/${n(ry)} = ${f(slend)}\nFe = π²E/(KL/r)² = π²(29,000)/${f(slend)}² = ${f(Fe)} ksi\n4.71√(E/Fy) = ${f(limit)}; KL/r ${slend <= limit ? "≤" : ">"} this, so ${slend <= limit ? `Fcr = 0.658^(Fy/Fe) Fy = 0.658^(50/${f(Fe)}) × 50` : "Fcr = 0.877Fe"} = ${f(Fcr)} ksi\nφPn = 0.90 × ${f(Fcr)} × ${n(A)} = ${f(phiPn)} kips`,
      };
    },
  },
  {
    id: "beam-column-interaction",
    version: 1,
    title: "Beam-column interaction check (AISC 360, H1.1)",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section H1.1: doubly symmetric members in flexure and compression",
    generate(r) {
      const Pc = r.range(300, 1200, 10);
      const Pr = Math.round(Pc * r.range(0.06, 0.6, 0.01));
      const Mc = r.range(200, 800, 5);
      const Mr = Math.round(Mc * r.range(0.2, 0.7, 0.01));
      const ratio = Pr / Pc;
      const val = ratio >= 0.2 ? ratio + (8 / 9) * (Mr / Mc) : ratio / 2 + Mr / Mc;
      const other = ratio >= 0.2 ? ratio / 2 + Mr / Mc : ratio + (8 / 9) * (Mr / Mc);
      return {
        prompt: `A wide-flange beam-column carries a factored axial load Pr = ${Pr} kips and a factored strong-axis moment Mr = ${Mr} kip·ft (no weak-axis moment). Its design strengths are Pc = φPn = ${Pc} kips and Mc = φMn = ${Mc} kip·ft. Using the AISC 360 Section H1.1 interaction equations, what is the interaction ratio?`,
        answer: val,
        unit: "",
        distractors: [
          other, // used the wrong interaction equation for this Pr/Pc
          ratio + Mr / Mc, // added the ratios with no 8/9 or ½ factor
          Mr / Mc, // ignored the axial load
        ],
        solution: `Pr/Pc = ${Pr}/${Pc} = ${f(ratio)} ${ratio >= 0.2 ? "≥ 0.2, so use H1-1a: Pr/Pc + (8/9)(Mr/Mc)" : "< 0.2, so use H1-1b: Pr/(2Pc) + Mr/Mc"}\n= ${ratio >= 0.2 ? `${f(ratio)} + (8/9)(${Mr}/${Mc})` : `${f(ratio)}/2 + ${Mr}/${Mc}`} = ${f(val)}${val <= 1 ? "  (≤ 1.0: OK)" : "  (> 1.0: not adequate)"}`,
      };
    },
  },
  {
    id: "rc-beam-shear-vc",
    version: 1,
    title: "Concrete shear strength of a reinforced concrete beam (ACI 318)",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318-19 Section 22.5.5.1, one-way shear",
    generate(r) {
      const bw = r.range(10, 24, 2);
      const d = r.range(16, 36, 1);
      const fc = r.pick([3000, 4000, 5000, 6000]);
      const Vc = (2 * Math.sqrt(fc) * bw * d) / 1000;
      const phiVc = 0.75 * Vc;
      return {
        prompt: `A normalweight concrete beam has bw = ${bw} in, d = ${d} in and f'c = ${n(fc)} psi, and has at least the minimum shear reinforcement, so Vc = 2λ√f'c bw d may be used (λ = 1.0). What is the design shear strength provided by the concrete, φVc?`,
        answer: phiVc,
        unit: "kips",
        distractors: [
          Vc, // forgot φ = 0.75
          0.9 * Vc, // used the flexure φ of 0.90
          (0.75 * 2 * Math.sqrt(fc / 1000) * bw * d), // put f'c in ksi under the root, then didn't convert
        ],
        solution: `Vc = 2λ√f'c bw d = 2(1.0)(√${n(fc)})(${bw})(${d}) = ${f(Vc * 1000)} lb = ${f(Vc)} kips\nφVc = 0.75 × ${f(Vc)} = ${f(phiVc)} kips`,
      };
    },
  },
  {
    id: "ss-udl-deflection-us",
    version: 1,
    title: "Midspan deflection of a simply supported beam (US units)",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "Beam deflection formulas: simple span, uniform load",
    generate(r) {
      const w = r.range(0.5, 4, 0.1);
      const L = r.range(15, 40, 1);
      const I = r.range(300, 3000, 10);
      const delta = (5 * (w / 12) * (L * 12) ** 4) / (384 * E * I);
      return {
        prompt: `A simply supported steel beam (E = 29,000 ksi, I = ${n(I)} in⁴) spans ${L} ft and carries a uniform service load of ${n(w)} kip/ft. What is the maximum deflection?`,
        answer: delta,
        unit: "in",
        distractors: [
          (5 * w * (L * 12) ** 4) / (384 * E * I), // left w in kip/ft with L in inches
          (5 * (w / 12) * L ** 4) / (384 * E * I) * 1728, // converted L to inches but cubed instead of the 4th power
          ((w / 12) * (L * 12) * (L * 12) ** 3) / (48 * E * I), // used the point-load formula with P = wL
        ],
        solution: `Convert: w = ${n(w)}/12 = ${f(w / 12, 4)} kip/in, L = ${L} × 12 = ${L * 12} in\nΔ = 5wL⁴/(384EI) = 5(${f(w / 12, 4)})(${L * 12})⁴/(384 × 29,000 × ${n(I)}) = ${f(delta)} in`,
      };
    },
  },
  {
    id: "lrfd-governing-combination",
    version: 1,
    title: "Governing LRFD load combination for a roof beam",
    topics: { "pe-civil": "structural" },
    reference: "ASCE 7, Section 2.3: strength design load combinations",
    generate(r) {
      const D = r.range(0.3, 2, 0.05);
      const L = r.range(0, 1.2, 0.05);
      const S = r.range(0.2, 1.5, 0.05);
      const c1 = 1.4 * D;
      const c2 = 1.2 * D + 1.6 * L + 0.5 * S;
      const c3 = 1.2 * D + 1.6 * S + 1.0 * L;
      const gov = Math.max(c1, c2, c3);
      const sorted = [c1, c2, c3].sort((a, b) => b - a);
      return {
        prompt: `A roof beam carries uniform service loads of D = ${n(D)} kip/ft (dead), L = ${n(L)} kip/ft (live) and S = ${n(S)} kip/ft (snow). Considering only 1.4D, 1.2D + 1.6L + 0.5S, and 1.2D + 1.6S + 1.0L, what is the governing factored load?`,
        answer: gov,
        unit: "kip/ft",
        distractors: [
          D + L + S, // added service loads with no factors
          1.2 * D + 1.6 * L + 1.6 * S, // applied 1.6 to both L and S at once
          sorted[1], // picked the second-largest combination
        ],
        solution: `1.4D = ${f(c1)} kip/ft\n1.2D + 1.6L + 0.5S = ${f(c2)} kip/ft\n1.2D + 1.6S + 1.0L = ${f(c3)} kip/ft\nThe largest governs: ${f(gov)} kip/ft`,
      };
    },
  },
];

// ---------------------------------------------------------------- Transportation

const TRANS: Template[] = [
  {
    id: "crest-curve-length-ssd",
    version: 1,
    title: "Minimum crest vertical curve length for stopping sight distance",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "AASHTO Green Book: crest vertical curves (h₁ = 3.5 ft, h₂ = 2.0 ft)",
    generate(r) {
      for (;;) {
      const g1 = r.range(1, 5, 0.5);
      const g2 = -r.range(1, 5, 0.5);
      const A = g1 - g2;
      const S = r.pick([200, 305, 360, 425, 495, 570, 645, 730]);
      const long = (A * S * S) / 2158;
      const Lmin = long >= S ? long : 2 * S - 2158 / A;
      if (Lmin < 100) continue;
      return {
        prompt: `A crest vertical curve joins a +${n(g1)}% grade to a ${n(g2)}% grade. The required stopping sight distance is ${S} ft. Using AASHTO criteria (driver's eye 3.5 ft, object 2.0 ft), what is the minimum curve length?`,
        answer: Lmin,
        unit: "ft",
        distractors: [
          long >= S ? 2 * S - 2158 / A : long, // used the formula for the other case (didn't check S vs L)
          (A * S * S) / (400 + 3.5 * S), // used the sag (headlight) equation
          (A * S * S) / 1329, // used the passing-sight constant
        ],
        solution: `A = |g₂ − g₁| = ${f(A)}%\nTry S < L: L = AS²/2,158 = ${f(A)}(${S})²/2,158 = ${f(long)} ft\n${long >= S ? `L = ${f(long)} ≥ S = ${S}, so the assumption holds. L_min = ${f(Lmin)} ft` : `L = ${f(long)} < S = ${S}, so use S > L: L = 2S − 2,158/A = 2(${S}) − 2,158/${f(A)} = ${f(Lmin)} ft`}`,
      };
      }
    },
  },
  {
    id: "freeway-flow-rate",
    version: 1,
    title: "Freeway demand flow rate in passenger cars per hour per lane",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Highway Capacity Manual: demand flow rate, PHF and heavy vehicle factor",
    generate(r) {
      const V = r.range(1500, 5500, 50);
      const PHF = r.range(0.85, 0.97, 0.01);
      const N = r.pick([2, 3, 4]);
      const PT = r.range(3, 20, 1);
      const ET = 2.0;
      const fHV = 1 / (1 + (PT / 100) * (ET - 1));
      const vp = V / (PHF * N * fHV);
      return {
        prompt: `A ${N}-lane freeway segment (one direction) carries a peak-hour volume of ${n(V)} veh/h with a peak hour factor of ${n(PHF)}. Trucks are ${PT}% of traffic, with a passenger-car equivalent ET = ${ET.toFixed(1)}. What is the demand flow rate in pc/h/ln?`,
        answer: vp,
        unit: "pc/h/ln",
        distractors: [
          (V * PHF) / (N * fHV), // multiplied by the PHF instead of dividing
          V / (PHF * N), // ignored heavy vehicles
          V / (PHF * fHV), // didn't divide by the number of lanes
        ],
        solution: `f_HV = 1/[1 + P_T(E_T − 1)] = 1/[1 + ${PT / 100}(${ET.toFixed(1)} − 1)] = ${f(fHV, 4)}\nv_p = V/(PHF × N × f_HV) = ${n(V)}/(${n(PHF)} × ${N} × ${f(fHV, 4)}) = ${f(vp)} pc/h/ln`,
      };
    },
  },
  {
    id: "sag-curve-headlight",
    version: 1,
    title: "Minimum sag vertical curve length (headlight sight distance)",
    topics: { "pe-civil": "transportation" },
    reference: "AASHTO Green Book: sag vertical curves, headlight criterion",
    generate(r) {
      for (;;) {
      const g1 = -r.range(1, 5, 0.5);
      const g2 = r.range(1, 5, 0.5);
      const A = g2 - g1;
      const S = r.pick([200, 305, 360, 425, 495, 570, 645]);
      const long = (A * S * S) / (400 + 3.5 * S);
      const Lmin = long >= S ? long : 2 * S - (400 + 3.5 * S) / A;
      if (Lmin < 100) continue;
      return {
        prompt: `A sag vertical curve joins a ${n(g1)}% grade to a +${n(g2)}% grade. For a stopping sight distance of ${S} ft and the AASHTO headlight criterion (headlight height 2 ft, 1° upward beam), what is the minimum curve length?`,
        answer: Lmin,
        unit: "ft",
        distractors: [
          long >= S ? 2 * S - (400 + 3.5 * S) / A : long, // used the formula for the other case
          (A * S * S) / 2158, // used the crest equation
          (A * S * S) / (400 + S), // dropped the 3.5 on S
        ],
        solution: `A = ${f(A)}%\nTry S < L: L = AS²/(400 + 3.5S) = ${f(A)}(${S})²/(400 + 3.5 × ${S}) = ${f(long)} ft\n${long >= S ? `L ≥ S, so the assumption holds. L_min = ${f(Lmin)} ft` : `L < S, so use L = 2S − (400 + 3.5S)/A = ${f(Lmin)} ft`}`,
      };
      }
    },
  },
];

// ---------------------------------------------------------------- Construction

const CONSTR: Template[] = [
  {
    id: "wall-formwork-pressure",
    version: 1,
    title: "Lateral pressure on wall formwork (ACI 347)",
    topics: { "pe-civil": "construction" },
    reference: "ACI 347R: lateral pressure of fresh concrete, walls",
    generate(r) {
      const R = r.range(2, 7, 0.5);
      const T = r.range(40, 90, 5);
      const h = r.range(6, 14, 0.5);
      const raw = 150 + (9000 * R) / T;
      const p = Math.max(600, Math.min(raw, 150 * h));
      return {
        prompt: `Concrete (150 lb/ft³, Cw = 1.0, Cc = 1.0) is placed in ${n(h)} ft tall wall forms at ${n(R)} ft/h with a concrete temperature of ${T}°F. Using the ACI 347 wall equation p = CwCc(150 + 9,000R/T), with a minimum of 600Cw psf and a maximum of the full hydrostatic pressure, what lateral pressure should the forms be designed for?`,
        answer: p,
        unit: "psf",
        distractors: [
          150 * h, // used full hydrostatic pressure regardless of the rate equation
          raw === p ? 150 + (9000 * R) / (T + 32) : raw, // either added 32 to °F, or skipped the minimum/hydrostatic limits
          150 + (9000 * R) / ((T - 32) * (5 / 9)), // converted the temperature to °C
        ],
        solution: `p = 150 + 9,000R/T = 150 + 9,000(${n(R)})/${T} = ${f(raw)} psf\nLimits: minimum 600 psf; maximum hydrostatic 150h = 150(${n(h)}) = ${f(150 * h)} psf\nDesign pressure = ${f(p)} psf`,
        sig: 4,
      };
    },
  },
  {
    id: "haul-fleet-size",
    version: 1,
    title: "Number of trucks to keep a loader busy",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Construction operations: equipment balancing",
    generate(r) {
      const load = r.range(2.5, 6, 0.5);
      const haul = r.range(8, 20, 1);
      const dump = r.range(1, 3, 0.5);
      const ret = r.range(6, 15, 1);
      const cycle = load + haul + dump + ret;
      const N = Math.ceil(Number((cycle / load).toFixed(6)));
      return {
        prompt: `A loader fills a haul truck in ${n(load)} min. Each truck then travels ${haul} min to the fill, dumps in ${n(dump)} min, and returns in ${ret} min. How many trucks are needed so the loader never waits?`,
        answer: N,
        unit: "trucks",
        sig: 4,
        minGap: 0.001,
        distractors: [
          N - 1, // rounded down instead of up
          Math.ceil((haul + ret) / load), // counted only travel time
          Math.ceil(cycle / (load + dump)), // divided by load plus dump time
        ],
        solution: `Truck cycle = load + haul + dump + return = ${n(load)} + ${haul} + ${n(dump)} + ${ret} = ${f(cycle)} min\nTrucks = cycle/load time = ${f(cycle)}/${n(load)} = ${f(cycle / load, 4)}, round up to ${N}`,
      };
    },
  },
  {
    id: "estimate-at-completion",
    version: 1,
    title: "Estimate at completion from the cost performance index",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Project controls: earned value forecasting",
    generate(r) {
      const BAC = r.range(500, 20000, 100);
      const EV = Math.round(BAC * r.range(0.2, 0.8, 0.01));
      const AC = Math.round(EV * r.range(0.85, 1.25, 0.01));
      const CPI = EV / AC;
      const EAC = BAC / CPI;
      return {
        prompt: `A project has a budget at completion of $${n(BAC)}k. To date, earned value is $${n(EV)}k and actual cost is $${n(AC)}k. Assuming the current cost performance continues, what is the estimate at completion?`,
        answer: EAC,
        unit: "$k",
        distractors: [
          BAC * CPI, // multiplied the budget by CPI instead of dividing
          AC + (BAC - EV), // assumed the remaining work goes exactly to budget
          BAC, // assumed no overrun or underrun
        ],
        solution: `CPI = EV/AC = ${n(EV)}/${n(AC)} = ${f(CPI, 4)}\nEAC = BAC/CPI = ${n(BAC)}/${f(CPI, 4)} = $${f(EAC)}k`,
      };
    },
  },
];

export const PE_DEPTH: Template[] = [...WRE, ...GEO, ...STRUCT, ...TRANS, ...CONSTR];
