import { f, n, type Template } from "./engine";

// Eleventh batch from docs/EXAM-COVERAGE.md. Formulas and factors are stated in the prompt. Each
// template has an independent solver in verify.ts.

export const BATCH_ELEVEN: Template[] = [
  {
    id: "bolt-group-eccentric",
    version: 1,
    title: "Force on the critical bolt of an eccentrically loaded bolt group (elastic method)",
    topics: { "pe-civil": "structural" },
    reference: "Connections: elastic method for eccentric shear",
    generate(r) {
      const nb = r.range(3, 7, 1);
      const s = 3;
      const P = r.range(10, 60, 1);
      const e = r.range(4, 14, 0.5);
      const ys = Array.from({ length: nb }, (_, i) => (i - (nb - 1) / 2) * s);
      const sum = ys.reduce((a, y) => a + y * y, 0);
      const ymax = ((nb - 1) / 2) * s;
      const Rv = P / nb;
      const Rh = (P * e * ymax) / sum;
      const R = Math.hypot(Rv, Rh);
      return {
        prompt: `A bracket is bolted to a column flange with a single vertical line of ${nb} bolts at ${s} in spacing. It carries a vertical load of ${P} kips acting ${n(e)} in from the bolt line. Using the elastic method, what is the resultant force on the most heavily loaded bolt?`,
        answer: R,
        unit: "kips",
        distractors: [
          Rv, // considered only direct shear
          Rv + Rh, // added the components arithmetically
          Math.hypot(Rv, (P * e) / (nb * ymax)), // used n·y_max instead of Σy² for the polar term
        ],
        solution: `Direct shear per bolt = ${P}/${nb} = ${f(Rv, 4)} kips (vertical)\nΣy² = ${ys.map((y) => `${y}²`).join(" + ")} = ${f(sum, 4)} in²; y_max = ${f(ymax, 4)} in\nTorsional force on the end bolt = Pe·y_max/Σy² = ${P}(${n(e)})(${f(ymax, 4)})/${f(sum, 4)} = ${f(Rh, 4)} kips (horizontal)\nR = √(${f(Rv, 4)}² + ${f(Rh, 4)}²) = ${f(R)} kips`,
      };
    },
  },
  {
    id: "prestress-elastic-shortening",
    version: 1,
    title: "Elastic shortening loss in a pretensioned beam",
    topics: { "pe-civil": "structural" },
    reference: "Prestressed concrete: ΔfpES = (Ep/Eci)fcgp",
    generate(r) {
      for (;;) {
        const Pi = r.range(300, 1200, 10);
        const A = r.range(200, 800, 10);
        const I = r.range(8000, 60000, 500);
        const e = r.range(4, 15, 0.5);
        const MD = r.range(50, 400, 5);
        const Eci = r.range(3500, 5000, 100);
        const Ep = 28500;
        const fcgp = Pi / A + (Pi * e * e) / I - (MD * 12 * e) / I;
        if (fcgp < 0.3) continue;
        const loss = (Ep / Eci) * fcgp;
        return {
          prompt: `A pretensioned beam has A = ${n(A)} in², I = ${n(I)} in⁴, and strands at an eccentricity of ${n(e)} in at midspan. Just after transfer, the prestress force is ${Pi} kips and the self-weight moment at midspan is ${MD} kip·ft. With Ep = 28,500 ksi and Eci = ${n(Eci)} ksi, what is the elastic shortening loss, ΔfpES = (Ep/Eci)fcgp, where fcgp = P/A + Pe²/I − M_De/I?`,
          answer: loss,
          unit: "ksi",
          distractors: [
            (Ep / Eci) * (Pi / A + (Pi * e * e) / I), // ignored the self-weight moment
            (Ep / Eci) * (Pi / A), // used only the axial term P/A
            (Ep / Eci) * (Pi / A + (Pi * e * e) / I - (MD * e) / I), // left the moment in kip·ft
          ],
          solution: `fcgp = ${Pi}/${n(A)} + ${Pi}(${n(e)})²/${n(I)} − (${MD} × 12)(${n(e)})/${n(I)}\n= ${f(Pi / A, 4)} + ${f((Pi * e * e) / I, 4)} − ${f((MD * 12 * e) / I, 4)} = ${f(fcgp, 4)} ksi\nΔfpES = (28,500/${n(Eci)}) × ${f(fcgp, 4)} = ${f(loss)} ksi`,
        };
      }
    },
  },
  {
    id: "two-way-slab-thickness",
    version: 1,
    title: "Minimum thickness of a two-way flat plate",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Table 8.3.1.1 (fy = 60 ksi, no drop panels)",
    generate(r) {
      const L = r.range(14, 32, 0.5);
      const c = r.range(12, 30, 2);
      const panel = r.pick([
        { t: "an exterior panel without edge beams", k: 30 },
        { t: "an exterior panel with edge beams", k: 33 },
        { t: "an interior panel", k: 33 },
      ] as const);
      const ln = L * 12 - c;
      const h = Math.max(ln / panel.k, 5);
      return {
        prompt: `A flat plate (no drop panels, no interior beams, Grade 60 steel) has ${n(L)} ft column spacing in the long direction, center to center, with ${c} in square columns. For ${panel.t}, using ACI minimum thickness (ℓn/30 for exterior panels without edge beams, ℓn/33 otherwise, and not less than 5 in), what is the minimum slab thickness?`,
        answer: h,
        unit: "in",
        distractors: [
          Math.max((L * 12) / panel.k, 5), // used the center-to-center span instead of the clear span
          Math.max(ln / (panel.k === 30 ? 33 : 30), 5), // used the other divisor
          Math.max(ln / 36, 5), // used ℓn/36 (with drop panels)
        ],
        solution: `ℓn = ${n(L)} × 12 − ${c} = ${f(ln, 4)} in (clear span, face to face of columns)\n${panel.t}: h = ℓn/${panel.k} = ${f(ln / panel.k, 4)} in${ln / panel.k < 5 ? " → 5 in minimum governs" : ""}\nh_min = ${f(h)} in`,
      };
    },
  },
  {
    id: "lime-softening-dose",
    version: 1,
    title: "Lime dose for lime-soda softening",
    topics: { "pe-civil": "water-env" },
    reference: "Drinking water treatment: lime-soda softening stoichiometry",
    generate(r) {
      const CO2 = r.range(5, 40, 1);
      const alk = r.range(100, 300, 5);
      const Mg = r.range(20, 120, 5);
      const ex = 35;
      const Q = r.range(5000, 60000, 1000);
      const limeC = CO2 + alk + Mg + ex;
      const kg = (limeC * (56 / 100) * Q) / 1000;
      return {
        prompt: `A groundwater treated at ${n(Q)} m³/d has (all as mg/L CaCO₃) CO₂ = ${CO2}, bicarbonate alkalinity = ${alk}, and magnesium hardness = ${Mg}. For softening that removes all magnesium, use lime (as CaCO₃) = CO₂ + HCO₃⁻ + Mg²⁺ + ${ex} mg/L excess. How much quicklime (CaO, 100% pure) is needed per day?`,
        answer: kg,
        unit: "kg/d",
        distractors: [
          (limeC * Q) / 1000, // reported lime as CaCO₃ (didn't convert to CaO)
          ((CO2 + alk + ex) * (56 / 100) * Q) / 1000, // left out the magnesium
          ((alk + Mg + ex) * (56 / 100) * Q) / 1000, // left out the carbon dioxide
        ],
        solution: `Lime as CaCO₃ = ${CO2} + ${alk} + ${Mg} + ${ex} = ${limeC} mg/L\nAs CaO: ${limeC} × 56/100 = ${f(limeC * 0.56, 4)} mg/L (CaO equivalent weight 28, CaCO₃ 50)\nDaily: ${f(limeC * 0.56, 4)} g/m³ × ${n(Q)} m³/d = ${f(kg)} kg/d`,
      };
    },
  },
  {
    id: "sludge-thickening-volume",
    version: 1,
    title: "Sludge volume after thickening",
    topics: { "pe-civil": "water-env" },
    reference: "Solids handling: volume vs. percent solids",
    generate(r) {
      const V1 = r.range(50, 800, 10);
      const s1 = r.range(0.5, 3, 0.1);
      const s2 = r.range(4, 8, 0.5);
      const V2 = (V1 * s1) / s2;
      return {
        prompt: `A treatment plant produces ${V1} m³/d of waste sludge at ${n(s1)}% solids. A gravity belt thickener raises it to ${n(s2)}% solids. Assuming the sludge density stays about the same, what volume of thickened sludge is produced per day?`,
        answer: V2,
        unit: "m³/d",
        distractors: [
          (V1 * s2) / s1, // inverted the ratio
          V1 - (V1 * s1) / s2, // gave the volume of water removed
          V1 * (1 - (s2 - s1) / 100), // subtracted the change in percent solids directly
        ],
        solution: `Dry solids are unchanged: V₁s₁ = V₂s₂\nV₂ = ${V1} × ${n(s1)}/${n(s2)} = ${f(V2)} m³/d (${f(V1 - V2)} m³/d of water removed)`,
      };
    },
  },
  {
    id: "contact-basin-volume",
    version: 1,
    title: "Chlorine contact basin volume for a required CT",
    topics: { "pe-civil": "water-env" },
    reference: "Disinfection: V = (CT/C) × Q/(T₁₀/T)",
    generate(r) {
      const CT = r.range(20, 200, 5);
      const C = r.range(0.5, 2, 0.1);
      const Q = r.range(5000, 60000, 500);
      const bf = r.pick([0.3, 0.5, 0.7]);
      const t10 = CT / C;
      const V = (t10 / bf) * (Q / 1440);
      return {
        prompt: `A plant must provide CT = ${CT} mg·min/L at a peak flow of ${n(Q)} m³/d with a free chlorine residual of ${n(C)} mg/L. The contact basin will have a baffling factor (T₁₀/T) of ${bf}. What basin volume is required?`,
        answer: V,
        unit: "m³",
        distractors: [
          t10 * (Q / 1440), // ignored the baffling factor
          t10 * bf * (Q / 1440), // multiplied by the baffling factor
          (t10 / bf) * (Q / 24), // treated minutes as hours
        ],
        solution: `Required T₁₀ = CT/C = ${CT}/${n(C)} = ${f(t10, 4)} min\nTheoretical detention T = T₁₀/BF = ${f(t10, 4)}/${bf} = ${f(t10 / bf, 4)} min\nV = Q × T = (${n(Q)}/1,440 m³/min) × ${f(t10 / bf, 4)} = ${f(V)} m³`,
      };
    },
  },
  {
    id: "thickener-diameter",
    version: 1,
    title: "Diameter of a gravity thickener from its solids loading rate",
    topics: { "pe-civil": "water-env" },
    reference: "Solids handling: gravity thickener sizing",
    generate(r) {
      const Q = r.range(50, 1500, 10);
      const s = r.range(0.5, 4, 0.1);
      const SLR = r.range(30, 140, 5);
      const M = Q * (s / 100) * 1000;
      const A = M / SLR;
      const D = Math.sqrt((4 * A) / Math.PI);
      return {
        prompt: `A gravity thickener receives ${n(Q)} m³/d of sludge at ${n(s)}% solids (density about 1,000 kg/m³). The design solids loading rate is ${SLR} kg/m²·d. What diameter is needed?`,
        answer: D,
        unit: "m",
        distractors: [
          A, // gave the area, not the diameter
          Math.sqrt(A / Math.PI), // gave the radius
          Math.sqrt((4 * (Q * s * 1000)) / SLR / Math.PI), // used the percent as a whole number
        ],
        solution: `Solids = ${n(Q)} m³/d × ${s / 100} × 1,000 kg/m³ = ${f(M, 5)} kg/d\nArea = ${f(M, 5)}/${SLR} = ${f(A, 4)} m²\nD = √(4A/π) = ${f(D)} m`,
      };
    },
  },
  {
    id: "spiral-curve-length",
    version: 1,
    title: "Length of a spiral (transition) curve",
    topics: { "pe-civil": "transportation" },
    reference: "Horizontal alignment: spiral length Ls = 3.15V³/(RC)",
    generate(r) {
      const V = r.range(40, 75, 5);
      const R = r.range(600, 3000, 50);
      const C = r.pick([1, 1.5, 2, 3]);
      const Ls = (3.15 * V ** 3) / (R * C);
      return {
        prompt: `A horizontal curve with radius ${n(R)} ft on a ${V} mph highway gets spiral transitions. Using Ls = 3.15V³/(RC) with a rate of increase of lateral acceleration C = ${C} ft/s³, what spiral length is required?`,
        answer: Ls,
        unit: "ft",
        distractors: [
          (3.15 * V ** 3) / R, // left out C
          (3.15 * V ** 2) / (R * C), // squared V instead of cubing
          (3.15 * V ** 3 * C) / R, // multiplied by C
        ],
        solution: `Ls = 3.15(${V})³/(${n(R)} × ${C}) = 3.15 × ${n(V ** 3)}/${n(R * C)} = ${f(Ls)} ft`,
      };
    },
  },
  {
    id: "roundabout-entry-capacity",
    version: 1,
    title: "Entry capacity and v/c of a single-lane roundabout entry",
    topics: { "pe-civil": "transportation" },
    reference: "Highway Capacity Manual: single-lane roundabout entry, c = 1,380e^(−0.00102vc)",
    generate(r) {
      for (;;) {
        const vc = r.range(100, 1100, 10);
        const ve = r.range(200, 1000, 10);
        const c = 1380 * Math.exp(-0.00102 * vc);
        const x = ve / c;
        if (x < 0.3 || x > 1.3) continue;
        return {
          prompt: `At a single-lane roundabout entry, the entering flow is ${ve} pc/h and the conflicting circulating flow is ${vc} pc/h. Using c = 1,380e^(−1.02 × 10⁻³ vc) pc/h, what is the entry's volume-to-capacity ratio?`,
          answer: x,
          unit: "",
          distractors: [
            ve / 1380, // used the capacity with no circulating traffic
            ve / (1380 - vc) > 0 ? ve / (1380 - vc) : NaN, // subtracted the circulating flow directly
            (ve + vc) / c, // added the circulating flow to the demand
          ],
          solution: `c = 1,380e^(−0.00102 × ${vc}) = ${f(c, 4)} pc/h\nv/c = ${ve}/${f(c, 4)} = ${f(x)}`,
        };
      }
    },
  },
  {
    id: "toll-booth-queue-wait",
    version: 1,
    title: "Average wait in queue at a single booth (M/M/1)",
    topics: { "pe-civil": "transportation" },
    reference: "Queuing: M/M/1, Wq = λ/[μ(μ − λ)]",
    generate(r) {
      for (;;) {
        const mu = r.range(300, 700, 10);
        const lam = r.range(mu * 0.5, mu * 0.95, 10);
        if (lam >= mu) continue;
        const Wq = (lam / (mu * (mu - lam))) * 3600;
        return {
          prompt: `Vehicles arrive at a single toll booth at ${lam} veh/h (Poisson arrivals) and are served at an average rate of ${mu} veh/h (exponential service times). What is the average time a vehicle waits in the queue before reaching the booth?`,
          answer: Wq,
          unit: "s",
          distractors: [
            (1 / (mu - lam)) * 3600, // gave the time in the system (queue plus service)
            (3600 / mu), // gave the average service time
            ((lam * lam) / (mu * (mu - lam))), // gave the average queue length (vehicles)
          ],
          solution: `ρ = λ/μ = ${lam}/${mu} = ${f(lam / mu, 4)}\nWq = λ/[μ(μ − λ)] = ${lam}/[${mu}(${mu - lam})] = ${f(lam / (mu * (mu - lam)), 4)} h = ${f(Wq)} s`,
        };
      }
    },
  },
  {
    id: "geotextile-aos",
    version: 1,
    title: "Maximum apparent opening size for a geotextile filter",
    topics: { "pe-civil": "geotechnical" },
    reference: "Geosynthetics: retention criterion O₉₅ ≤ B × D₈₅",
    generate(r) {
      const D85 = r.range(0.1, 0.6, 0.01);
      const Cu = r.range(1.5, 10, 0.5);
      const B = Cu <= 2 || Cu >= 8 ? 1 : Cu <= 4 ? 0.5 * Cu : 8 / Cu;
      const O95 = B * D85;
      return {
        prompt: `A geotextile filter will retain a sandy soil (less than 50% passing the No. 200 sieve) with D₈₅ = ${n(D85)} mm and Cu = ${n(Cu)}. Use O₉₅ ≤ B × D₈₅ with B = 1 for Cu ≤ 2 or Cu ≥ 8, B = 0.5Cu for 2 ≤ Cu ≤ 4, and B = 8/Cu for 4 < Cu < 8. What is the largest allowable apparent opening size O₉₅?`,
        answer: O95,
        unit: "mm",
        distractors: [
          D85, // used B = 1 regardless of Cu
          0.5 * Cu * D85, // applied B = 0.5Cu regardless of the Cu range
          (Cu <= 4 ? 8 / Cu : 0.5 * Cu) * D85, // used the formula for the other Cu range
        ],
        solution: `Cu = ${n(Cu)} → B = ${Cu <= 2 || Cu >= 8 ? "1" : Cu <= 4 ? `0.5Cu = ${f(B, 4)}` : `8/Cu = ${f(B, 4)}`}\nO₉₅ ≤ ${f(B, 4)} × ${n(D85)} = ${f(O95)} mm`,
      };
    },
  },
  {
    id: "equipment-owning-cost",
    version: 1,
    title: "Hourly ownership cost of a piece of equipment",
    topics: { "pe-civil": "construction" },
    reference: "Equipment economics: depreciation plus interest, insurance and taxes on average annual investment",
    generate(r) {
      const P = r.range(100, 800, 5) * 1000;
      const S = Math.round((P * r.range(0.1, 0.3, 0.01)) / 1000) * 1000;
      const N = r.range(4, 10, 1);
      const hrs = r.range(1200, 2200, 100);
      const rate = r.range(10, 18, 1);
      const AAI = (P * (N + 1) + S * (N - 1)) / (2 * N);
      const hourly = ((P - S) / N + (rate / 100) * AAI) / hrs;
      return {
        prompt: `A loader costs $${n(P)} delivered, will be sold for $${n(S)} after ${N} years, and works ${n(hrs)} hours per year. Interest, insurance and taxes total ${rate}% of the average annual investment, AAI = [P(n + 1) + S(n − 1)]/(2n). With straight-line depreciation, what is the hourly ownership cost?`,
        answer: hourly,
        unit: "$/h",
        distractors: [
          ((P - S) / N) / hrs, // included depreciation only
          ((P - S) / N + (rate / 100) * P) / hrs, // charged interest on the full purchase price
          (P / N + (rate / 100) * AAI) / hrs, // ignored the salvage value in depreciation
        ],
        solution: `Depreciation = (${n(P)} − ${n(S)})/${N} = $${f((P - S) / N, 5)}/yr\nAAI = [${n(P)}(${N + 1}) + ${n(S)}(${N - 1})]/(2 × ${N}) = $${f(AAI, 5)}; × ${rate}% = $${f((rate / 100) * AAI, 5)}/yr\nHourly = (${f((P - S) / N, 5)} + ${f((rate / 100) * AAI, 5)})/${n(hrs)} = $${f(hourly, 4)}/h`,
      };
    },
  },
];
