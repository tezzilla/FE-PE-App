import { f, n, type Template } from "./engine";

// Eighteenth batch. Formulas and factors are stated in the prompt. Each template has an independent
// solver in verify.ts.

/** Standard normal CDF (Abramowitz-Stegun 26.2.17). */
function phi(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export const BATCH_EIGHTEEN: Template[] = [
  {
    id: "plate-load-scaling",
    version: 1,
    title: "Footing settlement on sand from a plate load test",
    topics: { "pe-civil": "geotechnical" },
    reference: "Shallow foundations: Sf = Sp[2Bf/(Bf + Bp)]² for sand",
    generate(r) {
      const Sp = r.range(3, 20, 0.5);
      const Bp = 0.3;
      const Bf = r.range(1, 4, 0.25);
      const Sf = Sp * ((2 * Bf) / (Bf + Bp)) ** 2;
      return {
        prompt: `A 0.3 m square plate load test on sand settles ${n(Sp)} mm under a given bearing pressure. Using Sf = Sp[2Bf/(Bf + Bp)]², how much will a ${n(Bf)} m square footing settle at the same pressure?`,
        answer: Sf,
        unit: "mm",
        distractors: [
          Sp * (Bf / Bp), // scaled linearly with width (clay relationship)
          Sp * ((2 * Bf) / (Bf + Bp)), // didn't square the ratio
          Sp, // assumed the same settlement
        ],
        solution: `Sf = ${n(Sp)}[2(${n(Bf)})/(${n(Bf)} + 0.3)]² = ${n(Sp)} × ${f(((2 * Bf) / (Bf + Bp)) ** 2, 4)} = ${f(Sf)} mm`,
      };
    },
  },
  {
    id: "dam-uplift-force",
    version: 1,
    title: "Uplift force on the base of a concrete gravity dam",
    topics: { "pe-civil": "water-env" },
    reference: "Dams: linear uplift from headwater to tailwater, no drains",
    generate(r) {
      const h1 = r.range(10, 60, 1);
      const h2 = r.range(0, h1 * 0.3, 1);
      const B = r.range(8, 50, 1);
      const U = 0.5 * 9.81 * (h1 + h2) * B;
      return {
        prompt: `A concrete gravity dam has a ${B} m wide base. The headwater depth at the heel is ${h1} m and the tailwater depth at the toe is ${h2} m. With no drains and uplift varying linearly from heel to toe, what is the uplift force per metre of dam? (γw = 9.81 kN/m³)`,
        answer: U,
        unit: "kN/m",
        distractors: [
          0.5 * 9.81 * h1 * B, // ignored the tailwater
          9.81 * h1 * B, // used the full heel pressure across the base
          0.5 * 9.81 * (h1 - h2) * B > 0 ? 0.5 * 9.81 * (h1 - h2) * B : NaN, // subtracted the tailwater
        ],
        solution: `Uplift pressure: 9.81 × ${h1} = ${f(9.81 * h1, 4)} kPa at the heel, 9.81 × ${h2} = ${f(9.81 * h2, 4)} kPa at the toe\nU = ½(${f(9.81 * h1, 4)} + ${f(9.81 * h2, 4)}) × ${B} = ${f(U)} kN/m`,
      };
    },
  },
  {
    id: "pile-downdrag-load",
    version: 1,
    title: "Downdrag (negative skin friction) load on a pile",
    topics: { "pe-civil": "geotechnical" },
    reference: "Deep foundations: Qn = βσ'v,avg × perimeter × length",
    generate(r) {
      const D = r.range(0.3, 0.6, 0.05);
      const Lc = r.range(4, 15, 0.5);
      const gp = r.range(6, 9, 0.5);
      const fill = r.range(10, 60, 5);
      const beta = r.range(0.2, 0.35, 0.01);
      const sv = fill + (gp * Lc) / 2;
      const Q = beta * sv * Math.PI * D * Lc;
      return {
        prompt: `A ${n(D)} m diameter pile passes through ${n(Lc)} m of soft clay (γ' = ${n(gp)} kN/m³) that is consolidating under ${fill} kPa of new fill. Using β = ${n(beta)} and the average vertical effective stress in the clay (fill plus self-weight at mid-depth), what downdrag load acts on the pile?`,
        answer: Q,
        unit: "kN",
        distractors: [
          beta * fill * Math.PI * D * Lc, // used only the fill load
          beta * (fill + gp * Lc) * Math.PI * D * Lc, // used the stress at the bottom of the layer
          beta * sv * ((Math.PI * D * D) / 4) * Lc, // used the pile cross-sectional area
        ],
        solution: `σ'v,avg = ${fill} + ${n(gp)}(${n(Lc)})/2 = ${f(sv, 4)} kPa\nQn = ${n(beta)} × ${f(sv, 4)} × π(${n(D)}) × ${n(Lc)} = ${f(Q)} kN`,
      };
    },
  },
  {
    id: "collapse-potential",
    version: 1,
    title: "Collapse potential from a single oedometer test",
    topics: { "pe-civil": "geotechnical" },
    reference: "Problematic soils: CP = Δe/(1 + e₀) × 100%",
    generate(r) {
      const e0 = r.range(0.6, 1.2, 0.01);
      const e1 = Number((e0 - r.range(0.02, 0.08, 0.005)).toFixed(3));
      const e2 = Number((e1 - r.range(0.01, 0.12, 0.005)).toFixed(3));
      const CP = ((e1 - e2) / (1 + e0)) * 100;
      return {
        prompt: `In a collapse test, a soil specimen with initial void ratio ${n(e0)} is loaded to 200 kPa, reaching e = ${n(e1)}, then flooded, after which e = ${n(e2)}. Using CP = Δe/(1 + e₀) × 100, what is the collapse potential?`,
        answer: CP,
        unit: "%",
        distractors: [
          ((e0 - e2) / (1 + e0)) * 100, // included the compression before wetting
          ((e1 - e2) / (1 + e1)) * 100 === CP ? ((e1 - e2) / e0) * 100 : ((e1 - e2) / (1 + e1)) * 100, // used the wrong void ratio in the denominator
          (e1 - e2) * 100, // left out (1 + e₀)
        ],
        solution: `Δe from wetting = ${n(e1)} − ${n(e2)} = ${f(e1 - e2, 3)}\nCP = ${f(e1 - e2, 3)}/(1 + ${n(e0)}) × 100 = ${f(CP)}%`,
      };
    },
  },
  {
    id: "seismic-story-force",
    version: 1,
    title: "Vertical distribution of seismic base shear",
    topics: { "pe-civil": "structural" },
    reference: "ASCE 7 Section 12.8.3: Fx = CvxV, Cvx = wxhx^k/Σwihi^k (k = 1 for T ≤ 0.5 s)",
    generate(r) {
      const V = r.range(100, 800, 10);
      const h = r.range(10, 15, 1);
      const w = [r.range(400, 1200, 10), r.range(400, 1200, 10), r.range(200, 800, 10)];
      const hs = [h, 2 * h, 3 * h];
      const lvl = r.range(0, 2, 1);
      const sum = w.reduce((s, x, i) => s + x * hs[i], 0);
      const F = (V * w[lvl] * hs[lvl]) / sum;
      return {
        prompt: `A three-story building with ${h} ft story heights has a seismic base shear V = ${V} kips and T ≤ 0.5 s (k = 1). The seismic weights are ${w[0]} kips at level 2, ${w[1]} kips at level 3 and ${w[2]} kips at the roof. What lateral force acts at ${["level 2", "level 3", "the roof"][lvl]}?`,
        answer: F,
        unit: "kips",
        distractors: [
          (V * w[lvl]) / w.reduce((a, b) => a + b, 0), // distributed by weight only
          V / 3, // split the shear equally
          (V * hs[lvl]) / (hs[0] + hs[1] + hs[2]), // distributed by height only
        ],
        solution: `Σwh = ${w.map((x, i) => `${x}(${hs[i]})`).join(" + ")} = ${n(sum)} kip·ft\nF = V × w·h/Σwh = ${V} × ${n(w[lvl] * hs[lvl])}/${n(sum)} = ${f(F)} kips`,
      };
    },
  },
  {
    id: "slab-punching-capacity",
    version: 1,
    title: "Punching shear strength of a flat slab at an interior column",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Table 22.6.5.2: φVc = 0.75 × 4λ√f'c b₀d",
    generate(r) {
      const c = r.range(12, 30, 2);
      const d = r.range(5, 12, 0.5);
      const fc = r.pick([4000, 5000]);
      const b0 = 4 * (c + d);
      const Vc = (0.75 * 4 * Math.sqrt(fc) * b0 * d) / 1000;
      return {
        prompt: `A flat slab with d = ${n(d)} in is supported on a ${c} in square interior column, f'c = ${n(fc)} psi (normalweight). With no shear reinforcement and assuming the 4λ√f'c limit governs, what is φVc for punching shear at the critical perimeter d/2 from the column face?`,
        answer: Vc,
        unit: "kips",
        distractors: [
          (0.75 * 4 * Math.sqrt(fc) * 4 * c * d) / 1000, // used the column perimeter (no d/2 offset)
          (0.75 * 2 * Math.sqrt(fc) * b0 * d) / 1000, // used the one-way shear coefficient 2
          (4 * Math.sqrt(fc) * b0 * d) / 1000, // forgot φ
        ],
        solution: `b₀ = 4(c + d) = 4(${c} + ${n(d)}) = ${f(b0, 4)} in\nφVc = 0.75 × 4 × √${n(fc)} × ${f(b0, 4)} × ${n(d)} = ${f(Vc * 1000, 5)} lb = ${f(Vc)} kips`,
      };
    },
  },
  {
    id: "restrained-thermal-force",
    version: 1,
    title: "Axial force in a fully restrained member from a temperature rise",
    topics: { "pe-civil": "structural", "fe-civil": "mechanics-materials" },
    reference: "Mechanics of materials: thermal stress σ = EαΔT",
    generate(r) {
      const A = r.range(500, 8000, 50); // mm²
      const steel = r.next() < 0.5;
      const E = steel ? 200 : 70; // GPa
      const a = steel ? 12 : 23; // ×10⁻⁶ /°C
      const dT = r.range(10, 60, 1);
      const F = (E * 1000 * A * a * 1e-6 * dT) / 1000; // kN
      return {
        prompt: `A ${steel ? "steel" : "aluminum"} bar (E = ${E} GPa, α = ${a} × 10⁻⁶ /°C) with a cross-sectional area of ${n(A)} mm² is fixed between two rigid supports. Its temperature rises by ${dT}°C. What axial force develops?`,
        answer: F,
        unit: "kN",
        distractors: [
          E * 1000 * a * 1e-6 * dT, // gave the stress (MPa), not the force
          (E * 1000 * A * a * 1e-6 * dT) / 2000, // assumed one support could move halfway
          (E * A * a * 1e-6 * dT), // left E in GPa
        ],
        solution: `σ = EαΔT = ${E * 1000} MPa × ${a} × 10⁻⁶ × ${dT} = ${f(E * 1000 * a * 1e-6 * dT, 4)} MPa\nF = σA = ${f(E * 1000 * a * 1e-6 * dT, 4)} × ${n(A)} = ${f(F * 1000, 5)} N = ${f(F)} kN (compression)`,
      };
    },
  },
  {
    id: "swamee-jain-friction",
    version: 1,
    title: "Darcy friction factor from the Swamee-Jain equation",
    topics: { "pe-civil": "water-env", "fe-civil": "fluids" },
    reference: "Closed conduits: f = 0.25/[log(ε/3.7D + 5.74/Re^0.9)]²",
    generate(r) {
      const D = r.pick([0.1, 0.15, 0.2, 0.3, 0.4, 0.6]);
      const V = r.range(0.5, 3, 0.1);
      const eps = r.pick([0.0015, 0.045, 0.15, 0.26]); // mm
      const nu = 1.0e-6;
      const Re = (V * D) / nu;
      const fr = 0.25 / Math.log10(eps / 1000 / (3.7 * D) + 5.74 / Re ** 0.9) ** 2;
      return {
        prompt: `Water (ν = 1.0 × 10⁻⁶ m²/s) flows at ${n(V)} m/s in a ${n(D)} m pipe with roughness ε = ${eps} mm. Using the Swamee-Jain equation f = 0.25/[log(ε/3.7D + 5.74/Re^0.9)]², what is the Darcy friction factor?`,
        answer: fr,
        unit: "",
        sig: 3,
        distractors: [
          0.25 / Math.log10(eps / (3.7 * D) + 5.74 / Re ** 0.9) ** 2, // left ε in mm with D in m
          0.25 / Math.log(eps / 1000 / (3.7 * D) + 5.74 / Re ** 0.9) ** 2, // used the natural log
          64 / Re < fr * 0.97 || 64 / Re > fr * 1.03 ? 64 / Re : NaN, // used the laminar formula 64/Re
        ],
        solution: `Re = VD/ν = ${n(V)} × ${n(D)}/10⁻⁶ = ${f(Re, 4)}\nε/3.7D = ${f(eps / 1000 / (3.7 * D), 3)}; 5.74/Re^0.9 = ${f(5.74 / Re ** 0.9, 3)}\nf = 0.25/[log(${f(eps / 1000 / (3.7 * D) + 5.74 / Re ** 0.9, 3)})]² = ${f(fr)}`,
      };
    },
  },
  {
    id: "alternate-depth",
    version: 1,
    title: "Subcritical alternate depth in a rectangular channel",
    topics: { "pe-civil": "water-env" },
    reference: "Open channel: specific energy E = y + q²/(2gy²)",
    generate(r) {
      for (;;) {
        const q = r.range(1, 8, 0.5); // m²/s
        const y1 = r.range(0.2, 0.8, 0.05);
        const yc = (q * q / 9.81) ** (1 / 3);
        if (y1 >= 0.85 * yc) continue;
        const E = y1 + (q * q) / (2 * 9.81 * y1 * y1);
        let lo = yc, hi = E;
        for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (m + (q * q) / (2 * 9.81 * m * m) < E) lo = m; else hi = m; }
        const y2 = (lo + hi) / 2;
        return {
          prompt: `A wide rectangular channel carries ${n(q)} m³/s per metre of width at a supercritical depth of ${n(y1)} m. Ignoring losses, what is the subcritical (alternate) depth with the same specific energy?`,
          answer: y2,
          unit: "m",
          distractors: [
            E, // gave the specific energy
            (y1 / 2) * (Math.sqrt(1 + 8 * ((q / y1) / Math.sqrt(9.81 * y1)) ** 2) - 1), // gave the sequent (hydraulic jump) depth
            yc, // gave the critical depth
          ],
          solution: `E = y + q²/(2gy²) = ${n(y1)} + ${n(q)}²/(2 × 9.81 × ${n(y1)}²) = ${f(E, 4)} m\nSolve y + ${f((q * q) / (2 * 9.81), 4)}/y² = ${f(E, 4)} for y > yc (${f(yc, 3)} m): y = ${f(y2)} m`,
        };
      }
    },
  },
  {
    id: "population-geometric",
    version: 1,
    title: "Population projection by geometric growth",
    topics: { "pe-civil": "water-env" },
    reference: "Water demand: P = P₂(1 + r)ⁿ with r from two censuses",
    generate(r) {
      const P1 = r.range(5000, 200000, 500);
      const g = r.range(0.5, 4, 0.1) / 100;
      const P2 = Math.round(P1 * (1 + g) ** 10);
      const nY = r.pick([10, 15, 20, 25]);
      const rate = (P2 / P1) ** (1 / 10) - 1;
      const P = P2 * (1 + rate) ** nY;
      return {
        prompt: `A town had ${n(P1)} people in one census and ${n(P2)} ten years later. Assuming the same geometric (compound) growth rate continues, what population should be planned for ${nY} years after the second census?`,
        answer: P,
        unit: "people",
        distractors: [
          P2 + ((P2 - P1) / 10) * nY, // used arithmetic (linear) growth
          P2 * (1 + (P2 - P1) / P1 / 10) ** nY, // used a simple average rate
          P1 * (1 + rate) ** nY, // grew from the first census instead of the second
        ],
        solution: `r = (${n(P2)}/${n(P1)})^(1/10) − 1 = ${f(rate * 100, 4)}% per year\nP = ${n(P2)}(1 + ${f(rate, 4)})^${nY} = ${f(P, 5)}`,
      };
    },
  },
  {
    id: "harmon-peak-flow",
    version: 1,
    title: "Peak sanitary flow using the Harmon peaking factor",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater collection: PF = 1 + 14/(4 + √P), P in thousands",
    generate(r) {
      const P = r.range(1, 150, 1); // thousands
      const q = r.range(70, 120, 5); // gpcd
      const avg = (P * 1000 * q) / 1e6; // MGD
      const PF = 1 + 14 / (4 + Math.sqrt(P));
      return {
        prompt: `A sewer serves ${P},000 people at an average wastewater flow of ${q} gal/person/day. Using the Harmon peaking factor PF = 1 + 14/(4 + √P), with P in thousands, what is the peak flow?`,
        answer: avg * PF,
        unit: "MGD",
        distractors: [
          avg, // used the average flow
          avg * (1 + 14 / (4 + Math.sqrt(P * 1000))), // used the population in persons, not thousands
          avg * (14 / (4 + Math.sqrt(P))), // left out the 1
        ],
        solution: `Average flow = ${P},000 × ${q} = ${f(avg, 4)} MGD\nPF = 1 + 14/(4 + √${P}) = ${f(PF, 4)}\nPeak = ${f(avg, 4)} × ${f(PF, 4)} = ${f(avg * PF)} MGD`,
      };
    },
  },
  {
    id: "countermeasure-benefit-cost",
    version: 1,
    title: "Benefit-cost ratio of a safety countermeasure",
    topics: { "pe-civil": "transportation" },
    reference: "Highway safety: crashes avoided = N(1 − CMF), present worth of benefits",
    generate(r) {
      const N = r.range(3, 30, 0.5);
      const CMF = r.range(0.5, 0.9, 0.01);
      const cpc = r.range(20, 200, 5) * 1000;
      const yrs = r.pick([10, 15, 20]);
      const ip = r.pick([3, 4, 5, 7]);
      const cost = r.range(50, 2000, 10) * 1000;
      const i = ip / 100;
      const PA = ((1 + i) ** yrs - 1) / (i * (1 + i) ** yrs);
      const BC = (N * (1 - CMF) * cpc * PA) / cost;
      return {
        prompt: `A site averages ${n(N)} crashes per year at an average societal cost of $${n(cpc)} per crash. A countermeasure with CMF = ${n(CMF)} costs $${n(cost)} and lasts ${yrs} years. At ${ip}% interest, what is its benefit-cost ratio?`,
        answer: BC,
        unit: "",
        distractors: [
          (N * CMF * cpc * PA) / cost, // used CMF as the share of crashes avoided
          (N * (1 - CMF) * cpc * yrs) / cost, // didn't discount
          (N * (1 - CMF) * cpc) / cost, // counted one year of benefits
        ],
        solution: `Crashes avoided = ${n(N)}(1 − ${n(CMF)}) = ${f(N * (1 - CMF), 4)}/yr → $${f(N * (1 - CMF) * cpc, 5)}/yr\n(P/A, ${ip}%, ${yrs}) = ${f(PA, 5)}; PW benefits = $${f(N * (1 - CMF) * cpc * PA, 5)}\nB/C = ${f(BC)}`,
      };
    },
  },
  {
    id: "headway-density",
    version: 1,
    title: "Density from average headway and speed",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Traffic flow: q = 3,600/h, k = q/v",
    generate(r) {
      const h = r.range(1.5, 6, 0.1);
      const v = r.range(25, 70, 1);
      const q = 3600 / h;
      const k = q / v;
      return {
        prompt: `Vehicles in a freeway lane pass a point with an average time headway of ${n(h)} s at a space-mean speed of ${v} mph. What is the density?`,
        answer: k,
        unit: "veh/mi",
        distractors: [
          q, // gave the flow rate
          h * v, // multiplied headway by speed
          3600 / h / (1.47 * v), // divided by speed in ft/s instead of mph
        ],
        solution: `q = 3,600/h = 3,600/${n(h)} = ${f(q, 4)} veh/h\nk = q/v = ${f(q, 4)}/${v} = ${f(k)} veh/mi`,
      };
    },
  },
  {
    id: "pert-completion-probability",
    version: 1,
    title: "Probability of finishing by a target date (PERT)",
    topics: { "pe-civil": "construction" },
    reference: "Scheduling: te = (a + 4m + b)/6, σ = (b − a)/6, normal approximation",
    generate(r) {
      for (;;) {
        const acts = Array.from({ length: 3 }, () => {
          const m = r.range(5, 20, 1);
          const a = Math.max(1, m - r.range(1, 5, 1));
          const b = m + r.range(2, 10, 1);
          return { a, m, b };
        });
        const te = acts.reduce((s, x) => s + (x.a + 4 * x.m + x.b) / 6, 0);
        const sd = Math.sqrt(acts.reduce((s, x) => s + ((x.b - x.a) / 6) ** 2, 0));
        const T = Math.round(te + r.range(-1, 2.5, 0.5) * sd);
        const z = (T - te) / sd;
        const P = phi(z) * 100;
        if (P < 5 || P > 99) continue;
        return {
          prompt: `The critical path of a project has three activities with (optimistic, most likely, pessimistic) durations in days of ${acts.map((x) => `(${x.a}, ${x.m}, ${x.b})`).join(", ")}. Using PERT and a normal distribution, what is the probability of finishing the path within ${T} days?`,
          answer: P,
          unit: "%",
          distractors: [
            phi((T - acts.reduce((s, x) => s + x.m, 0)) / sd) * 100, // used the most likely durations as the mean
            phi((T - te) / acts.reduce((s, x) => s + (x.b - x.a) / 6, 0)) * 100, // added standard deviations instead of variances
            (1 - phi(z)) * 100, // gave the probability of finishing late
          ],
          solution: `te = Σ(a + 4m + b)/6 = ${f(te, 4)} days; σ = √Σ[(b − a)/6]² = ${f(sd, 4)} days\nz = (${T} − ${f(te, 4)})/${f(sd, 4)} = ${f(z, 3)} → P = ${f(P)}%`,
        };
      }
    },
  },
  {
    id: "footing-concrete-takeoff",
    version: 1,
    title: "Concrete order quantity for spread footings",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Estimating: quantity take-off with waste allowance",
    generate(r) {
      const nF = r.range(4, 40, 1);
      const B = r.range(4, 12, 0.5);
      const t = r.range(12, 36, 2); // in
      const waste = r.pick([3, 5, 8, 10]);
      const V = (nF * B * B * (t / 12) * (1 + waste / 100)) / 27;
      return {
        prompt: `A building has ${nF} square spread footings, each ${n(B)} ft × ${n(B)} ft × ${t} in thick. Allowing ${waste}% for waste, how much concrete should be ordered?`,
        answer: V,
        unit: "yd³",
        distractors: [
          (nF * B * B * (t / 12)) / 27, // left out waste
          (nF * B * B * t * (1 + waste / 100)) / 27, // left the thickness in inches
          nF * B * B * (t / 12) * (1 + waste / 100), // left the volume in ft³
        ],
        solution: `Volume per footing = ${n(B)} × ${n(B)} × ${f(t / 12, 4)} = ${f(B * B * (t / 12), 4)} ft³\nTotal with waste = ${nF} × ${f(B * B * (t / 12), 4)} × ${f(1 + waste / 100, 3)} = ${f(V * 27, 5)} ft³ = ${f(V)} yd³`,
      };
    },
  },
  {
    id: "crew-unit-cost",
    version: 1,
    title: "Unit cost of work from crew cost and production",
    topics: { "pe-civil": "construction" },
    reference: "Estimating: unit cost = hourly crew and equipment cost / hourly production",
    generate(r) {
      const workers = r.range(3, 8, 1);
      const wage = r.range(35, 75, 0.5);
      const equip = r.range(50, 300, 5);
      const prod = r.range(20, 200, 5);
      const unit = (workers * wage + equip) / prod;
      return {
        prompt: `A crew of ${workers} workers at $${wage.toFixed(2)}/h (burdened) runs equipment that costs $${equip}/h and places ${prod} ft² of slab per hour. What is the labor and equipment cost per square foot?`,
        answer: unit,
        unit: "$/ft²",
        distractors: [
          (workers * wage) / prod, // left out the equipment
          (wage + equip) / prod, // counted one worker
          (workers * wage + equip) * prod / 1000, // multiplied by production instead of dividing (per 1,000)
        ],
        solution: `Hourly cost = ${workers} × $${wage.toFixed(2)} + $${equip} = $${f(workers * wage + equip, 5)}/h\nUnit cost = ${f(workers * wage + equip, 5)}/${prod} = $${f(unit, 3)}/ft²`,
      };
    },
  },
];
