import { f, n, type Template } from "./engine";

// Seventeenth batch. Formulas and factors are stated in the prompt. Each template has an independent
// solver in verify.ts.

const MAINS = [6, 8, 10, 12, 16, 18, 20, 24, 30, 36, 42, 48];

export const BATCH_SEVENTEEN: Template[] = [
  {
    id: "steel-ltb-elastic",
    version: 1,
    title: "Steel beam strength with elastic lateral-torsional buckling (Lb > Lr)",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Eq. F2-4: Fcr = Cbπ²E/(Lb/rts)² √[1 + 0.078(Jc/Sxho)(Lb/rts)²]",
    generate(r) {
      for (;;) {
        const Sx = r.range(30, 150, 1);
        const Zx = Math.round(Sx * r.range(1.1, 1.15, 0.01));
        const rts = r.range(1.5, 3, 0.01);
        const J = r.range(0.3, 4, 0.01);
        const ho = r.range(10, 22, 0.1);
        const Lb = r.range(25, 45, 1) * 12;
        const Cb = r.pick([1.0, 1.14, 1.3]);
        const E = 29000;
        const x = Lb / rts;
        const Fcr = ((Cb * Math.PI ** 2 * E) / x ** 2) * Math.sqrt(1 + 0.078 * ((J * 1) / (Sx * ho)) * x * x);
        if (Fcr > 0.7 * 50) continue; // keep it in the elastic range
        const Mn = Math.min(Fcr * Sx, 50 * Zx) / 12;
        return {
          prompt: `A W-shape (Fy = 50 ksi, Sx = ${Sx} in³, Zx = ${Zx} in³, rts = ${n(rts)} in, J = ${n(J)} in⁴, ho = ${n(ho)} in, c = 1.0) is braced at Lb = ${Lb / 12} ft, beyond Lr, with Cb = ${Cb}. Using Fcr = Cbπ²E/(Lb/rts)² √[1 + 0.078(Jc/Sxho)(Lb/rts)²], Mn = FcrSx ≤ Mp and φ = 0.90, what is φMn?`,
          answer: 0.9 * Mn,
          unit: "kip·ft",
          distractors: [
            (0.9 * ((Cb * Math.PI ** 2 * E) / x ** 2) * Sx) / 12, // left out the torsional (J) term
            (0.9 * Fcr * Sx) / 12 / Cb, // left out Cb
            (0.9 * Fcr * Zx) / 12, // multiplied by Zx instead of Sx
          ],
          solution: `Lb/rts = ${Lb}/${n(rts)} = ${f(x, 4)}\nFcr = ${Cb}π²(29,000)/${f(x, 4)}² × √[1 + 0.078(${n(J)}/(${Sx} × ${n(ho)}))(${f(x, 4)})²] = ${f(Fcr, 4)} ksi\nMn = FcrSx = ${f(Fcr * Sx, 5)} kip·in = ${f(Mn, 4)} kip·ft; φMn = ${f(0.9 * Mn)} kip·ft`,
        };
      }
    },
  },
  {
    id: "rc-tbeam-flexure",
    version: 1,
    title: "Design moment of a concrete T-beam with the stress block in the flange",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318: T-beam flexure, a = Asfy/(0.85f'cbeff) ≤ hf",
    generate(r) {
      for (;;) {
        const beff = r.range(36, 96, 6);
        const hf = r.range(4, 7, 0.5);
        const d = r.range(18, 34, 1);
        const As = r.range(2, 8, 0.1);
        const fc = r.pick([4, 5]);
        const a = (As * 60) / (0.85 * fc * beff);
        if (a > hf) continue;
        const M = (0.9 * As * 60 * (d - a / 2)) / 12;
        return {
          prompt: `A concrete T-beam has an effective flange width of ${beff} in, a ${n(hf)} in flange, d = ${d} in, As = ${n(As)} in² of Grade 60 steel and f'c = ${fc} ksi. Assuming the section is tension-controlled, what is φMn?`,
          answer: M,
          unit: "kip·ft",
          distractors: [
            (0.9 * As * 60 * (d - (As * 60) / (0.85 * fc * 12) / 2)) / 12, // used a 12 in web width for the compression block
            (0.9 * As * 60 * d) / 12, // left out a/2
            (As * 60 * (d - a / 2)) / 12, // forgot φ
          ],
          solution: `a = Asfy/(0.85f'cbeff) = ${n(As)}(60)/(0.85 × ${fc} × ${beff}) = ${f(a, 4)} in ≤ hf = ${n(hf)} in, so it behaves as a rectangular beam ${beff} in wide\nφMn = 0.9 × ${n(As)} × 60 × (${d} − ${f(a / 2, 4)})/12 = ${f(M)} kip·ft`,
        };
      }
    },
  },
  {
    id: "spiral-reinforcement-ratio",
    version: 1,
    title: "Minimum spiral reinforcement ratio for a round column",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Eq. 25.7.3.3: ρs ≥ 0.45(Ag/Ach − 1)f'c/fyt",
    generate(r) {
      const D = r.range(16, 36, 2);
      const cover = 1.5;
      const fc = r.pick([4000, 5000, 6000]);
      const fyt = r.pick([60000, 75000]);
      const Dc = D - 2 * cover;
      const ratio = (D * D) / (Dc * Dc);
      const rho = 0.45 * (ratio - 1) * (fc / fyt);
      return {
        prompt: `A ${D} in diameter spiral column has 1.5 in of clear cover to the spiral, f'c = ${n(fc)} psi and fyt = ${n(fyt)} psi. Using ρs ≥ 0.45(Ag/Ach − 1)f'c/fyt (Ach measured to the outside of the spiral), what is the minimum spiral reinforcement ratio?`,
        answer: rho * 100,
        unit: "%",
        distractors: [
          0.45 * ((D * D) / ((D - cover) ** 2) - 1) * (fc / fyt) * 100, // subtracted the cover only once
          0.45 * ratio * (fc / fyt) * 100, // left out the −1
          0.45 * (D / Dc - 1) * (fc / fyt) * 100, // used a diameter ratio instead of an area ratio
        ],
        solution: `Core diameter = ${D} − 2(1.5) = ${Dc} in; Ag/Ach = (${D}/${Dc})² = ${f(ratio, 4)}\nρs = 0.45(${f(ratio, 4)} − 1)(${n(fc)}/${n(fyt)}) = ${f(rho, 4)} = ${f(rho * 100)}%`,
      };
    },
  },
  {
    id: "timber-beam-shear-capacity",
    version: 1,
    title: "Allowable shear on a sawn lumber beam (NDS)",
    topics: { "pe-civil": "structural" },
    reference: "NDS 3.4.2: fv = 3V/(2bd) ≤ F'v",
    generate(r) {
      const b = r.pick([1.5, 3.5, 5.5]);
      const d = r.pick([7.25, 9.25, 11.25, 13.25]);
      const Fv = r.pick([135, 150, 170, 175, 180]);
      const CD = r.pick([0.9, 1.0, 1.15, 1.25]);
      const V = ((2 / 3) * Fv * CD * b * d) / 1000;
      return {
        prompt: `A ${b} in × ${d} in (actual) sawn lumber beam has Fv = ${Fv} psi, a load duration factor CD = ${CD.toFixed(2)} and all other shear factors equal to 1.0. Using fv = 3V/(2bd) ≤ F'v, what is the largest allowable shear force?`,
        answer: V,
        unit: "kips",
        distractors: [
          (Fv * CD * b * d) / 1000, // used V = F'v·b·d (no 2/3)
          ((2 / 3) * Fv * b * d) / 1000, // left out CD
          ((3 / 2) * Fv * CD * b * d) / 1000, // inverted the 3/2 factor
        ],
        solution: `F'v = ${Fv} × ${CD.toFixed(2)} = ${f(Fv * CD, 4)} psi\nV = (2/3)F'v·b·d = (2/3)(${f(Fv * CD, 4)})(${b})(${d}) = ${f(V * 1000, 4)} lb = ${f(V)} kips`,
      };
    },
  },
  {
    id: "water-main-size",
    version: 1,
    title: "Smallest standard water main for an allowable head loss (Hazen-Williams)",
    topics: { "pe-civil": "water-env" },
    reference: "Pressure conduits: Hazen-Williams sizing",
    generate(r) {
      for (;;) {
        const Q = r.range(0.5, 20, 0.1);
        const L = r.range(1000, 10000, 100);
        const hf = r.range(5, 40, 1);
        const C = r.pick([100, 120, 130, 140]);
        const Dreq = ((4.73 * L * Q ** 1.852) / (C ** 1.852 * hf)) ** (1 / 4.87) * 12;
        const idx = MAINS.findIndex((x) => x >= Dreq);
        if (idx < 3 || idx > MAINS.length - 4 || MAINS[idx] - Dreq < 0.3) continue;
        return {
          prompt: `A transmission main ${n(L)} ft long must carry ${n(Q)} cfs with no more than ${hf} ft of friction loss (Hazen-Williams C = ${C}). Standard sizes are ${MAINS.join(", ")} in. What is the smallest standard diameter that works?`,
          answer: MAINS[idx],
          unit: "in",
          sig: 4,
          minGap: 0.001,
          distractors: [MAINS[idx - 1], MAINS[idx + 1], MAINS[idx - 2], MAINS[idx + 2], MAINS[idx - 3], MAINS[idx + 3]],
          solution: `D = [4.73LQ^1.852/(C^1.852 h_f)]^(1/4.87) = ${f(Dreq / 12, 4)} ft = ${f(Dreq, 4)} in\nThe next standard size up is ${MAINS[idx]} in`,
        };
      }
    },
  },
  {
    id: "rational-method-idf",
    version: 1,
    title: "Peak runoff with intensity from an IDF equation",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Hydrology: rational method with i = a/(tc + b)",
    generate(r) {
      const a = r.range(80, 250, 5);
      const b = r.range(8, 30, 1);
      const tc = r.range(5, 60, 1);
      const C = r.range(0.3, 0.9, 0.05);
      const A = r.range(2, 150, 1);
      const i = a / (tc + b);
      const Q = C * i * A;
      return {
        prompt: `For the design storm, rainfall intensity follows i = ${a}/(t + ${b}) (i in in/h, t in minutes). A ${A}-acre watershed has C = ${n(C)} and a time of concentration of ${tc} minutes. What is the peak runoff by the rational method?`,
        answer: Q,
        unit: "cfs",
        distractors: [
          C * (a / b) * A, // used t = 0 (didn't add tc)
          C * (a / (tc / 60 + b)) * A, // put tc in hours
          (a / (tc + b)) * A, // left out C
        ],
        solution: `i = ${a}/(${tc} + ${b}) = ${f(i, 4)} in/h\nQ = CiA = ${n(C)} × ${f(i, 4)} × ${A} = ${f(Q)} cfs`,
      };
    },
  },
  {
    id: "breakpoint-chlorine-dose",
    version: 1,
    title: "Chlorine feed for breakpoint chlorination",
    topics: { "pe-civil": "water-env" },
    reference: "Disinfection: breakpoint at about 7.6 mg Cl₂ per mg NH₃-N",
    generate(r) {
      const N = r.range(0.2, 3, 0.1);
      const res = r.range(0.5, 2, 0.1);
      const Q = r.range(2000, 50000, 500);
      const dose = 7.6 * N + res;
      const kg = (dose * Q) / 1000;
      return {
        prompt: `Water containing ${n(N)} mg/L of ammonia nitrogen is chlorinated past the breakpoint to leave a free chlorine residual of ${n(res)} mg/L. Using 7.6 mg Cl₂ per mg NH₃-N to reach the breakpoint, how much chlorine is fed per day at ${n(Q)} m³/d?`,
        answer: kg,
        unit: "kg/d",
        distractors: [
          (7.6 * N * Q) / 1000, // left out the free residual
          ((5 * N + res) * Q) / 1000, // used the 5:1 monochloramine ratio
          (dose * Q) / 1e6, // converted g to kg twice
        ],
        solution: `Dose = 7.6 × ${n(N)} + ${n(res)} = ${f(dose, 4)} mg/L\nFeed = ${f(dose, 4)} g/m³ × ${n(Q)} m³/d = ${f(kg)} kg/d`,
      };
    },
  },
  {
    id: "digester-methane",
    version: 1,
    title: "Methane production from an anaerobic process",
    topics: { "pe-civil": "water-env" },
    reference: "Anaerobic treatment: 0.35 m³ CH₄ (STP) per kg of COD converted",
    generate(r) {
      for (;;) {
        const Q = r.range(100, 2000, 10);
        const S0 = r.range(2000, 15000, 100);
        const E = r.range(70, 95, 1);
        const Px = r.range(20, 500, 5);
        const conv = (Q * S0 * (E / 100)) / 1000 - 1.42 * Px;
        if (conv <= 0) continue;
        const CH4 = 0.35 * conv;
        return {
          prompt: `An anaerobic reactor treats ${n(Q)} m³/d of industrial wastewater with ${n(S0)} mg/L COD and removes ${E}% of it. It produces ${Px} kg/d of new biomass (VSS). Using 0.35 m³ CH₄ per kg COD converted at STP, and 1.42 kg COD per kg VSS, how much methane is produced?`,
          answer: CH4,
          unit: "m³/d",
          distractors: [
            (0.35 * Q * S0 * (E / 100)) / 1000, // didn't subtract the COD in new biomass
            (0.35 * Q * S0) / 1000 - 0.35 * 1.42 * Px, // used the influent COD instead of the removed COD
            0.35 * ((Q * S0 * (E / 100)) / 1000 - Px), // left out the 1.42 conversion
          ],
          solution: `COD removed = ${n(Q)} × ${n(S0)} × ${E / 100}/1,000 = ${f((Q * S0 * (E / 100)) / 1000, 5)} kg/d\nCOD to methane = ${f((Q * S0 * (E / 100)) / 1000, 5)} − 1.42 × ${Px} = ${f(conv, 5)} kg/d\nCH₄ = 0.35 × ${f(conv, 5)} = ${f(CH4)} m³/d`,
        };
      }
    },
  },
  {
    id: "trip-generation-regression",
    version: 1,
    title: "Trip generation from a fitted regression equation",
    topics: { "pe-civil": "transportation" },
    reference: "Trip generation: ln(T) = a ln(X) + b",
    generate(r) {
      const a = r.range(0.6, 1.0, 0.01);
      const b = r.range(0.5, 2.5, 0.01);
      const X = r.range(50, 800, 10);
      const T = Math.exp(b) * X ** a;
      return {
        prompt: `For a land use, peak-hour trips follow the fitted curve ln(T) = ${n(a)} ln(X) + ${n(b)}, where X is the number of dwelling units. How many peak-hour trips does a ${X}-unit development generate?`,
        answer: T,
        unit: "trips",
        distractors: [
          a * X + b, // used the coefficients as a linear equation
          Math.exp(b) * a * X, // treated the exponent as a multiplier
          10 ** b * X ** a, // used base-10 logs
        ],
        solution: `T = e^(${n(b)}) × ${X}^${n(a)} = ${f(Math.exp(b), 4)} × ${f(X ** a, 4)} = ${f(T)} trips`,
      };
    },
  },
  {
    id: "detector-occupancy-density",
    version: 1,
    title: "Density from loop detector occupancy",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic data: k = 52.8 × occupancy(%)/(Lv + Ld)",
    generate(r) {
      const occ = r.range(5, 40, 0.5);
      const Lv = r.range(16, 22, 0.5);
      const Ld = r.pick([6, 6, 8]);
      const k = (52.8 * occ) / (Lv + Ld);
      return {
        prompt: `A ${Ld} ft long loop detector reports ${n(occ)}% occupancy. The average vehicle length is ${n(Lv)} ft. Using k = 5,280 × (occupancy fraction)/(Lv + Ld), what is the traffic density?`,
        answer: k,
        unit: "veh/mi/ln",
        distractors: [
          (52.8 * occ) / Lv, // left out the detector length
          (5280 * occ) / (Lv + Ld), // used the percent as a fraction
          (52.8 * occ) / (Lv + Ld) * 2, // doubled it
        ],
        solution: `k = 5,280 × ${occ / 100}/(${n(Lv)} + ${Ld}) = ${f(k)} veh/mi/ln`,
      };
    },
  },
  {
    id: "required-rimpull",
    version: 1,
    title: "Rimpull needed for a hauler on a grade",
    topics: { "pe-civil": "construction" },
    reference: "Equipment: rolling resistance + grade resistance (20 lb/ton per % grade)",
    generate(r) {
      const W = r.range(20, 120, 1); // tons
      const RR = r.range(40, 200, 5); // lb/ton
      const G = r.range(1, 10, 0.5);
      const P = W * (RR + 20 * G);
      return {
        prompt: `A loaded hauler weighs ${W} tons and climbs a ${n(G)}% haul road with a rolling resistance of ${RR} lb/ton. Using 20 lb/ton of grade resistance per percent of grade, what rimpull is required?`,
        answer: P,
        unit: "lb",
        distractors: [
          W * RR, // ignored the grade
          W * 20 * G, // ignored rolling resistance
          W * (RR - 20 * G) > 0 ? W * (RR - 20 * G) : NaN, // treated the climb as a downgrade
        ],
        solution: `Total resistance = ${RR} + 20 × ${n(G)} = ${f(RR + 20 * G, 4)} lb/ton\nRimpull = ${W} × ${f(RR + 20 * G, 4)} = ${f(P)} lb`,
      };
    },
  },
  {
    id: "roller-compaction-production",
    version: 1,
    title: "Compaction roller production",
    topics: { "pe-civil": "construction" },
    reference: "Equipment production: CCY/h = 16.3WSLE/P",
    generate(r) {
      const W = r.range(5, 8, 0.5);
      const S = r.range(1.5, 4, 0.5);
      const L = r.range(6, 12, 1);
      const E = r.range(0.7, 0.9, 0.05);
      const P = r.range(4, 10, 1);
      const prod = (16.3 * W * S * L * E) / P;
      return {
        prompt: `A roller compacts an effective width of ${n(W)} ft at ${n(S)} mph, placing ${L} in compacted lifts. It needs ${P} passes, and job efficiency is ${n(E)}. Using CCY/h = 16.3WSLE/P, what is its production?`,
        answer: prod,
        unit: "CCY/h",
        distractors: [
          16.3 * W * S * L * E, // forgot to divide by the number of passes
          (16.3 * W * S * L) / P, // left out efficiency
          (16.3 * W * S * (L / 12) * E) / P, // put the lift thickness in feet
        ],
        solution: `CCY/h = 16.3 × ${n(W)} × ${n(S)} × ${L} × ${n(E)}/${P} = ${f(prod)} compacted yd³/h`,
      };
    },
  },
];
