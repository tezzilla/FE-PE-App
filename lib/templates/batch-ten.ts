import { f, n, type Template } from "./engine";

// Tenth batch: lab and field geotechnics, deep foundation driving and load tests, sign and marking
// design, slope staking, oxygen sag minimum, moving loads, live load reduction and distribution
// storage. Formulas and factors are stated in the prompt. Each template has an independent solver.

export const BATCH_TEN: Template[] = [
  {
    id: "liquidity-index",
    version: 1,
    title: "Liquidity index of a clay",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Index properties: LI = (w − PL)/(LL − PL)",
    generate(r) {
      for (;;) {
        const PL = r.range(15, 35, 1);
        const LL = r.range(PL + 10, PL + 50, 1);
        const w = r.range(PL - 3, LL + 8, 0.5);
        const LI = (w - PL) / (LL - PL);
        if (LI < 0.1 || LI > 1.4) continue;
        return {
          prompt: `A clay sample has a natural moisture content of ${n(w)}%, a liquid limit of ${LL} and a plastic limit of ${PL}. What is its liquidity index?`,
          answer: LI,
          unit: "",
          distractors: [
            (LL - w) / (LL - PL), // gave the consistency index
            (w - PL) / LL, // divided by LL instead of the plasticity index
            w / (LL - PL), // didn't subtract the plastic limit
          ],
          solution: `PI = LL − PL = ${LL} − ${PL} = ${LL - PL}\nLI = (w − PL)/PI = (${n(w)} − ${PL})/${LL - PL} = ${f(LI)}${LI >= 1 ? " (at or above the liquid limit: very soft, sensitive)" : ""}`,
        };
      }
    },
  },
  {
    id: "compression-index-oedometer",
    version: 1,
    title: "Compression index from consolidation test data",
    topics: { "pe-civil": "geotechnical" },
    reference: "Consolidation testing: Cc = Δe/Δlog σ' on the virgin compression line",
    generate(r) {
      const s1 = r.pick([100, 150, 200, 250]);
      const s2 = s1 * r.pick([2, 4, 8]);
      const e1 = r.range(0.8, 1.6, 0.01);
      const Cc = r.range(0.15, 0.7, 0.01);
      const e2 = Number((e1 - Cc * Math.log10(s2 / s1)).toFixed(3));
      const ans = (e1 - e2) / Math.log10(s2 / s1);
      return {
        prompt: `On the virgin compression part of a consolidation test, the void ratio is ${n(e1)} at an effective stress of ${s1} kPa and ${n(e2)} at ${s2} kPa. What is the compression index Cc?`,
        answer: ans,
        unit: "",
        distractors: [
          (e1 - e2) / Math.log(s2 / s1), // used the natural log
          (e1 - e2) / Math.log10(s2 / s1) / (1 + e1), // gave the compression ratio Cc/(1 + e₀)
          (e1 - e2) / Math.log10(s2 - s1), // took the log of the stress difference instead of the ratio
        ],
        solution: `Cc = (e₁ − e₂)/log(σ'₂/σ'₁) = (${n(e1)} − ${n(e2)})/log(${s2}/${s1}) = ${f(e1 - e2, 4)}/${f(Math.log10(s2 / s1), 4)} = ${f(ans)}`,
      };
    },
  },
  {
    id: "modified-gates-pile",
    version: 1,
    title: "Nominal pile resistance from a driving formula (FHWA-modified Gates)",
    topics: { "pe-civil": "geotechnical", "fe-civil": "construction" },
    reference: "Pile driving formulas: Rn = 1.75√Ed log(10Nb) − 100 (kips)",
    generate(r) {
      for (;;) {
        const Ed = r.range(15000, 90000, 500);
        const Nb = r.range(2, 15, 0.5);
        const Rn = 1.75 * Math.sqrt(Ed) * Math.log10(10 * Nb) - 100;
        if (Rn < 100) continue;
        return {
          prompt: `During driving, a pile hammer delivers a developed energy of ${n(Ed)} ft·lb per blow, and the final set is ${n(Nb)} blows per inch. Using the FHWA-modified Gates formula Rn = 1.75√Ed log₁₀(10Nb) − 100 (Rn in kips, Ed in ft·lb), what is the nominal pile resistance?`,
          answer: Rn,
          unit: "kips",
          distractors: [
            1.75 * Math.sqrt(Ed) * Math.log10(10 * Nb), // forgot to subtract 100
            1.75 * Math.sqrt(Ed) * Math.log10(Nb) - 100 > 0 ? 1.75 * Math.sqrt(Ed) * Math.log10(Nb) - 100 : NaN, // dropped the 10 in the log
            0.4 * Rn, // applied the resistance factor (the question asks for nominal)
          ],
          solution: `√Ed = √${n(Ed)} = ${f(Math.sqrt(Ed), 4)}; log₁₀(10 × ${n(Nb)}) = ${f(Math.log10(10 * Nb), 4)}\nRn = 1.75 × ${f(Math.sqrt(Ed), 4)} × ${f(Math.log10(10 * Nb), 4)} − 100 = ${f(Rn)} kips`,
        };
      }
    },
  },
  {
    id: "davisson-offset",
    version: 1,
    title: "Davisson failure-line settlement for a pile load test",
    topics: { "pe-civil": "geotechnical" },
    reference: "Static load tests: Davisson offset limit, s = PL/AE + 0.15 + D/120 (in)",
    generate(r) {
      const steel = r.next() < 0.5;
      const D = steel ? r.pick([10, 12, 14, 16]) : r.pick([12, 14, 16, 18, 24]);
      const A = steel ? r.range(12, 30, 0.5) : D * D;
      const E = steel ? 29000 : r.pick([4000, 4500, 5000]);
      const L = r.range(30, 100, 5);
      const P = r.range(100, 600, 10);
      const s = (P * L * 12) / (A * E) + 0.15 + D / 120;
      return {
        prompt: `A ${steel ? `steel H-pile (A = ${n(A)} in², E = 29,000 ksi, width ${D} in)` : `${D} in square prestressed concrete pile (E = ${n(E)} ksi)`} is ${L} ft long. In a static load test, what pile-head settlement marks the Davisson failure line at a load of ${P} kips? Use s = PL/(AE) + 0.15 in + D/120 in.`,
        answer: s,
        unit: "in",
        distractors: [
          (P * L * 12) / (A * E), // gave only the elastic compression
          (P * L) / (A * E) + 0.15 + D / 120, // left L in feet
          (P * L * 12) / (A * E) + 0.15, // left out the D/120 term
        ],
        solution: `Elastic compression PL/AE = ${P} × ${L * 12}/(${n(A)} × ${n(E)}) = ${f((P * L * 12) / (A * E), 4)} in\nOffset = 0.15 + ${D}/120 = ${f(0.15 + D / 120, 4)} in\ns = ${f(s)} in`,
      };
    },
  },
  {
    id: "sign-letter-height",
    version: 1,
    title: "Letter height for a guide sign from legibility distance",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic control design: legibility of about 30 ft per inch of letter height",
    generate(r) {
      const V = r.range(35, 75, 5);
      const t = r.range(2, 6, 0.5);
      const extra = r.range(0, 200, 25);
      const d = 1.47 * V * t + extra;
      const h = d / 30;
      return {
        prompt: `Drivers approaching a guide sign at ${V} mph need ${n(t)} s to read it, and it must be fully read ${extra} ft before they reach it. Using 1.47 ft/s per mph and a legibility of 30 ft per inch of letter height, what letter height is required?`,
        answer: h,
        unit: "in",
        distractors: [
          (1.47 * V * t) / 30, // left out the extra distance before the sign
          (V * t + extra) / 30, // didn't convert mph to ft/s
          d / 40, // used 40 ft per inch
        ],
        solution: `Legibility distance = 1.47Vt + ${extra} = 1.47 × ${V} × ${n(t)} + ${extra} = ${f(d, 4)} ft\nLetter height = ${f(d, 4)}/30 = ${f(h)} in`,
      };
    },
  },
  {
    id: "pavement-marking-quantity",
    version: 1,
    title: "Quantity of pavement markings for a two-lane road",
    topics: { "pe-civil": "transportation", "fe-civil": "construction" },
    reference: "Pavement markings: broken lines 10 ft long on 40 ft cycles",
    generate(r) {
      const L = r.range(0.5, 12, 0.1);
      const pass = r.range(30, 80, 5);
      const ft = L * 5280;
      const center = ft * (1 - pass / 100) + ft * (pass / 100) * 0.25; // solid where no passing, broken elsewhere
      const total = center + 2 * ft;
      return {
        prompt: `A ${n(L)}-mile two-lane highway gets new markings: a solid edge line on both sides and a yellow centerline that is broken (10 ft stripes on 40 ft cycles) where passing is allowed, ${pass}% of the length, and a single solid line elsewhere. How many linear feet of marking are needed in total?`,
        answer: total,
        unit: "ft",
        distractors: [
          center, // left out the edge lines
          3 * ft, // treated the centerline as solid throughout
          center + ft, // included only one edge line
        ],
        solution: `Length = ${n(L)} × 5,280 = ${f(ft, 5)} ft\nCenterline: ${f(ft * (1 - pass / 100), 5)} ft solid + ${f(ft * (pass / 100), 5)} ft × 10/40 = ${f(center, 5)} ft\nEdge lines: 2 × ${f(ft, 5)} = ${f(2 * ft, 5)} ft\nTotal = ${f(total, 5)} ft`,
      };
    },
  },
  {
    id: "slope-stake-offset",
    version: 1,
    title: "Slope stake offset in a level cut section",
    topics: { "pe-civil": "construction", "fe-civil": "surveying" },
    reference: "Construction layout: slope staking",
    generate(r) {
      const w = r.range(24, 60, 2);
      const h = r.range(2, 20, 0.1);
      const s = r.pick([1.5, 2, 3, 4]);
      const d = w / 2 + s * h;
      return {
        prompt: `A roadway subgrade is ${w} ft wide. At a station on level ground, the cut at the centerline is ${n(h)} ft, and the cut slopes are ${s}H:1V. How far from the centerline is the slope stake (catch point) on each side?`,
        answer: d,
        unit: "ft",
        distractors: [
          w + s * h, // used the full width instead of half
          w / 2 + h / s, // inverted the slope ratio
          s * h, // left out the half-width
        ],
        solution: `On level ground the slope rises the full cut depth ${n(h)} ft from the subgrade edge.\nOffset = w/2 + s × h = ${w / 2} + ${s} × ${n(h)} = ${f(d)} ft`,
      };
    },
  },
  {
    id: "oxygen-sag-minimum-do",
    version: 1,
    title: "Minimum dissolved oxygen downstream of a discharge (critical point)",
    topics: { "pe-civil": "water-env" },
    reference: "Water quality: Streeter-Phelps critical time and critical deficit",
    generate(r) {
      for (;;) {
        const L0 = r.range(8, 40, 0.5);
        const D0 = r.range(0.5, 3, 0.1);
        const kd = r.range(0.2, 0.4, 0.01);
        const kr = r.range(kd + 0.1, 0.9, 0.01);
        const DOs = r.range(7.5, 9.5, 0.1);
        const arg = (kr / kd) * (1 - (D0 * (kr - kd)) / (kd * L0));
        if (arg <= 1.05) continue;
        const tc = Math.log(arg) / (kr - kd);
        const Dc = (kd / kr) * L0 * Math.exp(-kd * tc);
        const DO = DOs - Dc;
        if (DO < 0.5) continue;
        return {
          prompt: `Just below a wastewater outfall, the mixed river has ultimate BOD L₀ = ${n(L0)} mg/L and an oxygen deficit D₀ = ${n(D0)} mg/L. The deoxygenation rate is ${n(kd)} d⁻¹ and the reaeration rate is ${n(kr)} d⁻¹ (base e); saturation DO is ${n(DOs)} mg/L. What is the minimum dissolved oxygen in the river?`,
          answer: DO,
          unit: "mg/L",
          distractors: [
            DOs - D0, // used the initial deficit (DO just below the outfall)
            Dc, // gave the critical deficit, not the DO
            DOs - (kd / kr) * L0, // left out the e^(−kd·tc) term
          ],
          solution: `t_c = [1/(k_r − k_d)] ln{(k_r/k_d)[1 − D₀(k_r − k_d)/(k_d L₀)]} = ${f(tc, 4)} d\nD_c = (k_d/k_r)L₀e^(−k_d t_c) = (${n(kd)}/${n(kr)})(${n(L0)})e^(−${n(kd)} × ${f(tc, 4)}) = ${f(Dc, 4)} mg/L\nMinimum DO = ${n(DOs)} − ${f(Dc, 4)} = ${f(DO)} mg/L`,
        };
      }
    },
  },
  {
    id: "two-axle-max-moment",
    version: 1,
    title: "Maximum moment from two moving wheel loads on a simple span",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "Moving loads: place the resultant and a load symmetric about midspan",
    generate(r) {
      for (;;) {
        const P = r.range(5, 40, 1);
        const L = r.range(20, 80, 1);
        const a = r.range(4, 20, 1);
        if (a > 0.5 * L) continue;
        const M = ((2 * P) / L) * (L / 2 - a / 4) ** 2;
        return {
          prompt: `A simple span of ${L} ft carries a moving pair of equal ${P}-kip axle loads spaced ${a} ft apart. What is the absolute maximum bending moment the axles can produce?`,
          answer: M,
          unit: "kip·ft",
          distractors: [
            (P * (L - a)) / 2, // placed the two loads symmetric about midspan
            (2 * P * L) / 4, // lumped both loads at midspan
            (P * L) / 4, // used one axle only
          ],
          solution: `Max moment occurs under one load when midspan bisects the distance between that load and the resultant (a/4 from midspan).\nLoad at x = L/2 − a/4 = ${f(L / 2 - a / 4, 4)} ft from a support\nM_max = (2P/L)(L/2 − a/4)² = (${2 * P}/${L})(${f(L / 2 - a / 4, 4)})² = ${f(M)} kip·ft`,
        };
      }
    },
  },
  {
    id: "live-load-reduction-column",
    version: 1,
    title: "Reduced live load on an interior column",
    topics: { "pe-civil": "structural" },
    reference: "ASCE 7 Section 4.7.2: L = L₀(0.25 + 15/√(K_LL A_T))",
    generate(r) {
      for (;;) {
        const AT = r.range(150, 1600, 10);
        const L0 = r.pick([40, 50, 80, 100]);
        const KLL = 4;
        if (KLL * AT < 400) continue;
        const f1 = 0.25 + 15 / Math.sqrt(KLL * AT);
        const Lr = Math.max(f1, 0.5) * L0;
        const P = (Lr * AT) / 1000;
        return {
          prompt: `An interior column (K_LL = 4) supports one floor with a tributary area of ${n(AT)} ft² and an unreduced live load of ${L0} psf (not assembly or storage). Using L = L₀(0.25 + 15/√(K_LL A_T)), not less than 0.50L₀ for members supporting one floor, what is the reduced live load on the column?`,
          answer: P,
          unit: "kips",
          distractors: [
            (L0 * AT) / 1000, // didn't reduce the live load
            (Math.max(0.25 + 15 / Math.sqrt(AT), 0.5) * L0 * AT) / 1000, // used K_LL = 1
            f1 < 0.5 ? (f1 * L0 * AT) / 1000 : 2 * AT >= 400 ? (Math.max(0.25 + 15 / Math.sqrt(2 * AT), 0.5) * L0 * AT) / 1000 : NaN, // ignored the 0.50 limit, or used the edge-column K_LL = 2
          ],
          solution: `K_LL A_T = 4 × ${n(AT)} = ${n(KLL * AT)} ft² (≥ 400, so reduction is allowed)\nFactor = 0.25 + 15/√${n(KLL * AT)} = ${f(f1, 4)}${f1 < 0.5 ? " → use the 0.50 minimum" : ""}\nL = ${f(Math.max(f1, 0.5), 4)} × ${L0} = ${f(Lr, 4)} psf; P = ${f(Lr, 4)} × ${n(AT)} = ${f(P * 1000, 5)} lb = ${f(P)} kips`,
        };
      }
    },
  },
  {
    id: "distribution-storage-volume",
    version: 1,
    title: "Distribution storage volume (equalization, fire and emergency)",
    topics: { "pe-civil": "water-env" },
    reference: "Water distribution: storage components",
    generate(r) {
      const MDD = r.range(1, 20, 0.5); // MGD
      const eqp = r.pick([15, 20, 25]);
      const ff = r.pick([1500, 2000, 2500, 3000, 3500, 4000]);
      const hr = r.pick([2, 3, 4]);
      const emp = r.pick([0, 10, 25]);
      const eq = (eqp / 100) * MDD;
      const fire = (ff * 60 * hr) / 1e6;
      const em = (emp / 100) * (eq + fire);
      const total = eq + fire + em;
      return {
        prompt: `A town's maximum day demand is ${n(MDD)} MGD. Size distribution storage as equalization of ${eqp}% of maximum day demand, plus a fire flow of ${n(ff)} gpm for ${hr} hours${emp ? `, plus emergency storage of ${emp}% of the equalization and fire volumes combined` : ""}. What total storage is needed?`,
        answer: total,
        unit: "MG",
        distractors: [
          eq + em, // left out fire storage
          eq + (ff * hr) / 1e6 + (emp / 100) * (eq + (ff * hr) / 1e6), // didn't convert gpm × hours to gallons (×60)
          eq + fire, // left out emergency storage
          MDD + fire + em, // used the full maximum day demand for equalization
        ],
        solution: `Equalization = ${eqp / 100} × ${n(MDD)} = ${f(eq, 4)} MG\nFire = ${n(ff)} gpm × 60 × ${hr} h = ${n(ff * 60 * hr)} gal = ${f(fire, 4)} MG\n${emp ? `Emergency = ${emp / 100} × ${f(eq + fire, 4)} = ${f(em, 4)} MG\n` : ""}Total = ${f(total)} MG`,
      };
    },
  },
];
