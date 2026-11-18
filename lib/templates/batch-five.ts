import { f, n, type Template } from "./engine";

// Fifth batch from docs/EXAM-COVERAGE.md: superelevation runoff, vertical curve elevations, composite
// and tension steel members, unconfined and multiple wells, clarifier solids loading, aeration oxygen
// demand, wall pressure with surcharge and water, overconsolidated clay settlement, 2:1 stress spread,
// and linear scheduling. All problem text is original. Each template has an independent solver.

const gw = 9.81;
const rad = (x: number) => (x * Math.PI) / 180;

// AASHTO maximum relative gradients (percent) by design speed (mph), as tabulated in the Green Book.
const DELTA: Record<number, number> = { 30: 0.67, 35: 0.62, 40: 0.58, 45: 0.54, 50: 0.5, 55: 0.47, 60: 0.45, 65: 0.43, 70: 0.4 };
const BW: Record<number, number> = { 1: 1.0, 2: 0.75, 3: 0.67 };

export const BATCH_FIVE: Template[] = [
  // ---------------------------------------------------------------- Transportation
  {
    id: "superelevation-runoff-length",
    version: 1,
    title: "Superelevation runoff length",
    topics: { "pe-civil": "transportation" },
    reference: "AASHTO Green Book: superelevation runoff, Lr = (wn₁)e_d b_w/Δ",
    generate(r) {
      const V = r.pick([30, 35, 40, 45, 50, 55, 60, 65, 70]);
      const n1 = r.pick([1, 2, 3]);
      const e = r.pick([4, 6, 8]);
      const D = DELTA[V], bw = BW[n1];
      const Lr = (12 * n1 * e * bw) / D;
      return {
        prompt: `A ${V} mph highway curve has a design superelevation of ${e}%. The pavement is rotated about its centerline, and ${n1} 12 ft lane${n1 > 1 ? "s are" : " is"} rotated on the side considered. Use a maximum relative gradient Δ = ${D}% and an adjustment factor b_w = ${bw.toFixed(2)} for the number of lanes rotated. What is the minimum superelevation runoff length?`,
        answer: Lr,
        unit: "ft",
        distractors: [
          (12 * n1 * e) / D, // left out the adjustment factor b_w
          (12 * e * bw) / D, // counted only one lane
          (12 * n1 * e * bw) / D / 2, // halved it (treated it as tangent runout)
        ],
        solution: `Lr = (w n₁) e_d b_w/Δ = (12 × ${n1}) × ${e} × ${bw.toFixed(2)}/${D} = ${f(Lr)} ft`,
      };
    },
  },
  {
    id: "vertical-curve-elevation",
    version: 1,
    title: "Elevation of a point on a vertical curve",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Vertical curves: y = y_PVC + g₁x + (g₂ − g₁)x²/(2L)",
    generate(r) {
      for (;;) {
        const g1 = r.range(-5, 5, 0.25);
        const g2 = r.range(-5, 5, 0.25);
        if (Math.abs(g2 - g1) < 1) continue;
        const L = r.range(300, 1200, 50);
        const E = r.range(200, 900, 0.01);
        const x = r.range(50, L - 50, 10);
        const y = E + (g1 / 100) * x + ((g2 - g1) / 100) * (x * x) / (2 * L);
        return {
          prompt: `A ${n(L)} ft vertical curve connects a ${g1 > 0 ? "+" : ""}${n(g1)}% grade to a ${g2 > 0 ? "+" : ""}${n(g2)}% grade. The PVC is at elevation ${E.toFixed(2)} ft. What is the elevation of the curve ${x} ft past the PVC?`,
          answer: y,
          unit: "ft",
          sig: 5,
          minGap: 0.0002,
          distractors: [
            E + (g1 / 100) * x, // gave the tangent elevation (no curve offset)
            E + (g1 / 100) * x + ((g2 - g1) / 100) * (x * x) / L, // used L instead of 2L
            E + (g1 / 100) * x - ((g2 - g1) / 100) * (x * x) / (2 * L), // flipped the sign of the offset
            E + ((g2 - g1) / 100) * (x * x) / (2 * L), // left out the g₁x term
            E + (g2 / 100) * x, // projected the outgoing grade from the PVC
            E + (g1 / 100) * x + ((g2 - g1) / 100) * ((L - x) * (L - x)) / (2 * L), // measured x from the PVT for the offset
          ],
          solution: `y = y_PVC + g₁x + (g₂ − g₁)x²/(2L)\n= ${E.toFixed(2)} + (${g1 / 100})(${x}) + (${f((g2 - g1) / 100, 4)})(${x})²/(2 × ${n(L)})\n= ${E.toFixed(2)} + ${f((g1 / 100) * x, 4)} + ${f(((g2 - g1) / 100) * (x * x) / (2 * L), 4)} = ${y.toFixed(2)} ft`,
        };
      }
    },
  },
  {
    id: "crest-high-point",
    version: 1,
    title: "Location of the high point on a crest vertical curve",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Vertical curves: turning point x = g₁L/(g₁ − g₂)",
    generate(r) {
      for (;;) {
        const g1 = r.range(0.5, 5, 0.25);
        const g2 = -r.range(0.5, 5, 0.25);
        const L = r.range(300, 1500, 50);
        const x = (g1 * L) / (g1 - g2);
        if (Math.abs(x - L / 2) / (L / 2) < 0.08) continue; // avoid symmetric curves where L/2 is the answer
        return {
          prompt: `A ${n(L)} ft crest vertical curve joins a +${n(g1)}% grade to a ${n(g2)}% grade. How far past the PVC is the high point of the curve?`,
          answer: x,
          unit: "ft",
          distractors: [
            L / 2, // assumed the high point is at mid-curve
            (-g2 * L) / (g1 - g2), // measured from the PVT instead
            (g1 * L) / (g1 + g2) > 0 ? (g1 * L) / (g1 + g2) : NaN, // added the grades (sign error)
          ],
          solution: `The slope of the curve is zero where g₁ + (g₂ − g₁)x/L = 0, so x = g₁L/(g₁ − g₂)\n= ${n(g1)} × ${n(L)}/(${n(g1)} − (${n(g2)})) = ${f(x)} ft`,
        };
      }
    },
  },

  // ---------------------------------------------------------------- Structural
  {
    id: "composite-beam-phi-mn",
    version: 1,
    title: "Flexural strength of a fully composite steel beam",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Chapter I: composite beams, plastic stress distribution",
    generate(r) {
      for (;;) {
        const As = r.range(10, 30, 0.1);
        const d = r.range(14, 24, 0.1);
        const t = r.range(4, 6, 0.5);
        const L = r.range(25, 45, 1);
        const s = r.range(6, 12, 0.5);
        const fc = 4;
        const beff = Math.min((L * 12) / 4, s * 12);
        const a = (As * 50) / (0.85 * fc * beff);
        if (a > t) continue;
        const Mn = (As * 50 * (d / 2 + t - a / 2)) / 12;
        return {
          prompt: `An interior steel beam (As = ${n(As)} in², d = ${n(d)} in, Fy = 50 ksi) spans ${L} ft, simply supported, with beams spaced ${n(s)} ft on center. It acts fully compositely with a ${n(t)} in normalweight concrete slab (f'c = 4 ksi) cast directly on the top flange. Take the effective width as the lesser of span/4 and beam spacing, assume the plastic neutral axis is in the slab, and use φ = 0.90. What is φMn?`,
          answer: 0.9 * Mn,
          unit: "kip·ft",
          distractors: [
            Mn, // forgot φ
            (0.9 * As * 50 * (d / 2 + t - (As * 50) / (0.85 * fc * Math.max((L * 12) / 4, s * 12)) / 2)) / 12, // used the larger effective width
            (0.9 * As * 50 * (d + t - a / 2)) / 12, // measured to the bottom of the steel (d, not d/2)
            (0.9 * As * 50 * (d / 2 + t)) / 12, // left out a/2
          ],
          solution: `b_eff = min(${L} × 12/4, ${n(s)} × 12) = ${f(beff, 4)} in\na = AsFy/(0.85f'c b_eff) = ${n(As)}(50)/(0.85 × 4 × ${f(beff, 4)}) = ${f(a, 4)} in ≤ t = ${n(t)} in (PNA in slab)\nMn = AsFy(d/2 + t − a/2) = ${f(As * 50, 4)}(${f(d / 2, 4)} + ${n(t)} − ${f(a / 2, 4)}) = ${f(Mn * 12, 5)} kip·in = ${f(Mn)} kip·ft\nφMn = 0.90 × ${f(Mn)} = ${f(0.9 * Mn)} kip·ft`,
        };
      }
    },
  },
  {
    id: "plate-tension-capacity",
    version: 1,
    title: "Design tensile strength of a bolted plate (yield vs. rupture)",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "AISC 360 Chapter D: tension members",
    generate(r) {
      for (;;) {
      const b = r.range(4, 12, 0.5);
      const t = r.pick([0.375, 0.5, 0.625, 0.75, 1.0]);
      const nh = r.range(1, 4, 1);
      const db = r.pick([0.75, 0.875, 1.0]);
      const st = r.pick([
        { Fy: 36, Fu: 58 },
        { Fy: 50, Fu: 65 },
      ] as const);
      if (b - nh * (db + 0.125) < 0.5 * b) continue;
      const Ag = b * t;
      const An = (b - nh * (db + 0.125)) * t;
      const y = 0.9 * st.Fy * Ag, ru = 0.75 * st.Fu * An;
      return {
        prompt: `A ${n(b)} in × ${n(t)} in plate (Fy = ${st.Fy} ksi, Fu = ${st.Fu} ksi) is connected through one line of ${nh} bolt${nh > 1 ? "s" : ""} across its width, ${n(db)} in in diameter. Use hole diameters of d + 1/8 in for the net area, U = 1.0, φ = 0.90 for yielding and φ = 0.75 for rupture. What is the design tensile strength?`,
        answer: Math.min(y, ru),
        unit: "kips",
        distractors: [
          Math.max(y, ru), // took the larger of yield and rupture
          0.75 * st.Fu * (b - nh * db) * t, // deducted the bolt diameter, not the hole
          0.75 * st.Fu * Ag, // didn't deduct the holes for rupture
        ],
        solution: `Yield: φPn = 0.90FyAg = 0.90 × ${st.Fy} × ${f(Ag, 4)} = ${f(y)} kips\nNet area: An = [${n(b)} − ${nh}(${n(db)} + 0.125)] × ${n(t)} = ${f(An, 4)} in²; Ae = UAn = ${f(An, 4)} in²\nRupture: φPn = 0.75FuAe = 0.75 × ${st.Fu} × ${f(An, 4)} = ${f(ru)} kips\n${y <= ru ? "Yielding" : "Rupture"} governs: ${f(Math.min(y, ru))} kips`,
      };
      }
    },
  },

  // ---------------------------------------------------------------- Water Resources & Environmental
  {
    id: "thiem-unconfined-flow",
    version: 1,
    title: "Well yield in an unconfined aquifer (Thiem)",
    topics: { "pe-civil": "water-env" },
    reference: "Groundwater: steady flow to a well in an unconfined aquifer",
    generate(r) {
      for (;;) {
        const K = r.range(5, 60, 1);
        const r1 = r.range(10, 40, 5);
        const r2 = r.range(60, 200, 10);
        const h2 = r.range(15, 40, 0.5);
        const h1 = r.range(h2 - 8, h2 - 0.5, 0.5);
        if (h1 <= 5) continue;
        const Q = (Math.PI * K * (h2 * h2 - h1 * h1)) / Math.log(r2 / r1);
        return {
          prompt: `A well pumps steadily from an unconfined aquifer with hydraulic conductivity ${K} m/d. Two observation wells ${r1} m and ${r2} m from the pumping well show water table heights of ${n(h1)} m and ${n(h2)} m above the aquifer base. What is the pumping rate?`,
          answer: Q,
          unit: "m³/d",
          distractors: [
            (Math.PI * K * (h2 * h2 - h1 * h1)) / Math.log10(r2 / r1), // used log base 10
            (Math.PI * K * (h2 - h1) ** 2) / Math.log(r2 / r1), // squared the difference instead of differencing the squares
            (K * (h2 * h2 - h1 * h1)) / Math.log(r2 / r1), // left out π
          ],
          solution: `Q = πK(h₂² − h₁²)/ln(r₂/r₁) = π(${K})(${n(h2)}² − ${n(h1)}²)/ln(${r2}/${r1})\n= π(${K})(${f(h2 * h2 - h1 * h1, 4)})/${f(Math.log(r2 / r1), 4)} = ${f(Q)} m³/d`,
        };
      }
    },
  },
  {
    id: "two-well-superposition",
    version: 1,
    title: "Drawdown from two pumping wells (superposition)",
    topics: { "pe-civil": "water-env" },
    reference: "Groundwater: superposition of steady drawdowns (confined)",
    generate(r) {
      const T = r.range(100, 1500, 50);
      const R = r.range(400, 1500, 50);
      const Q1 = r.range(500, 3000, 50);
      const Q2 = r.range(500, 3000, 50);
      const d1 = r.range(20, 150, 5);
      const d2 = r.range(20, 150, 5);
      const s1 = (Q1 / (2 * Math.PI * T)) * Math.log(R / d1);
      const s2 = (Q2 / (2 * Math.PI * T)) * Math.log(R / d2);
      return {
        prompt: `Two wells pump steadily from a confined aquifer with transmissivity ${n(T)} m²/d and a radius of influence of ${n(R)} m. Well 1 pumps ${n(Q1)} m³/d and is ${d1} m from point P; well 2 pumps ${n(Q2)} m³/d and is ${d2} m from P. Using s = [Q/(2πT)]ln(R/r) for each well, what is the total drawdown at P?`,
        answer: s1 + s2,
        unit: "m",
        distractors: [
          d1 <= d2 ? s1 : s2, // counted only the nearer well
          ((Q1 + Q2) / (2 * Math.PI * T)) * Math.log(R / ((d1 + d2) / 2)), // combined the flows at the average distance
          (Q1 / (2 * Math.PI * T)) * Math.log10(R / d1) + (Q2 / (2 * Math.PI * T)) * Math.log10(R / d2), // used log base 10
        ],
        solution: `Well 1: s₁ = ${n(Q1)}/(2π × ${n(T)}) × ln(${n(R)}/${d1}) = ${f(s1, 4)} m\nWell 2: s₂ = ${n(Q2)}/(2π × ${n(T)}) × ln(${n(R)}/${d2}) = ${f(s2, 4)} m\nTotal = ${f(s1 + s2)} m`,
      };
    },
  },
  {
    id: "clarifier-solids-loading",
    version: 1,
    title: "Solids loading rate on a secondary clarifier",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater treatment: secondary clarifier solids loading",
    generate(r) {
      const Q = r.range(5000, 40000, 500);
      const Rr = r.range(0.3, 1.0, 0.05);
      const X = r.range(2000, 4000, 100);
      const D = r.range(15, 45, 1);
      const A = (Math.PI * D * D) / 4;
      const SLR = ((Q * (1 + Rr) * X) / 1000) / A;
      return {
        prompt: `A circular secondary clarifier ${D} m in diameter receives ${n(Q)} m³/d of plant flow plus return activated sludge at a recycle ratio of ${n(Rr)}. The MLSS is ${n(X)} mg/L. What is the solids loading rate?`,
        answer: SLR,
        unit: "kg/m²·d",
        distractors: [
          ((Q * X) / 1000) / A, // left out the return sludge flow
          ((Q * Rr * X) / 1000) / A, // used only the return flow
          ((Q * (1 + Rr) * X) / 1000) / (Math.PI * D * D), // used πD² for the area
        ],
        solution: `Flow into the clarifier = Q(1 + R) = ${n(Q)} × ${f(1 + Rr, 4)} = ${f(Q * (1 + Rr), 5)} m³/d\nSolids = ${f(Q * (1 + Rr), 5)} × ${n(X)} g/m³ = ${f((Q * (1 + Rr) * X) / 1000, 5)} kg/d\nA = π(${D})²/4 = ${f(A, 4)} m²\nSLR = ${f(SLR)} kg/m²·d`,
      };
    },
  },
  {
    id: "aeration-oxygen-demand",
    version: 1,
    title: "Carbonaceous oxygen demand of an activated sludge process",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater treatment: oxygen requirement, O₂ = Q(S₀ − S)/f − 1.42P_x",
    generate(r) {
      const Q = r.range(5000, 40000, 500);
      const S0 = r.range(150, 280, 5);
      const S = r.range(5, 20, 1);
      const Y = r.range(0.4, 0.7, 0.05);
      const kd = r.range(0.04, 0.1, 0.01);
      const th = r.range(5, 15, 1);
      const fr = 0.68;
      const Px = (Y * Q * (S0 - S)) / (1 + kd * th) / 1000;
      const O2 = (Q * (S0 - S)) / fr / 1000 - 1.42 * Px;
      return {
        prompt: `An activated sludge plant treats ${n(Q)} m³/d, reducing BOD₅ from ${S0} mg/L to ${S} mg/L. Kinetic values: Y = ${n(Y)} g VSS/g BOD₅, kd = ${n(kd)} d⁻¹, SRT = ${th} d. BOD₅ is 0.68 of ultimate BOD. Using O₂ = Q(S₀ − S)/f − 1.42P_x, with P_x = YQ(S₀ − S)/(1 + kd·SRT), what is the carbonaceous oxygen requirement?`,
        answer: O2,
        unit: "kg O₂/d",
        distractors: [
          (Q * (S0 - S)) / fr / 1000, // didn't subtract the oxygen equivalent of the wasted biomass
          (Q * (S0 - S)) / 1000 - 1.42 * Px, // didn't convert BOD₅ to ultimate BOD
          (Q * (S0 - S)) / fr / 1000 - 1.42 * ((Y * Q * (S0 - S)) / 1000), // left out decay when computing P_x
        ],
        solution: `P_x = YQ(S₀ − S)/(1 + kd·SRT) = ${n(Y)} × ${n(Q)} × ${S0 - S}/(1 + ${n(kd)} × ${th})/1,000 = ${f(Px, 4)} kg VSS/d\nUltimate BOD removed = ${n(Q)} × ${S0 - S}/0.68/1,000 = ${f((Q * (S0 - S)) / fr / 1000, 5)} kg/d\nO₂ = ${f((Q * (S0 - S)) / fr / 1000, 5)} − 1.42 × ${f(Px, 4)} = ${f(O2)} kg/d`,
      };
    },
  },

  // ---------------------------------------------------------------- Geotechnical
  {
    id: "wall-thrust-surcharge-water",
    version: 1,
    title: "Total lateral force on a wall with surcharge and a water table",
    topics: { "pe-civil": "geotechnical" },
    reference: "Lateral earth pressure: Rankine active with surcharge and hydrostatic pressure",
    generate(r) {
      const H = r.range(4, 8, 0.5);
      const dw = r.range(1, H - 1, 0.5);
      const q = r.range(10, 30, 5);
      const gm = r.range(17, 19, 0.5);
      const gs = r.range(19, 21, 0.5);
      const phi = r.range(28, 36, 1);
      const Ka = Math.tan(rad(45 - phi / 2)) ** 2;
      const hw = H - dw;
      const Psur = Ka * q * H;
      const P1 = 0.5 * Ka * gm * dw * dw;
      const P2 = Ka * gm * dw * hw;
      const P3 = 0.5 * Ka * (gs - gw) * hw * hw;
      const Pw = 0.5 * gw * hw * hw;
      const total = Psur + P1 + P2 + P3 + Pw;
      return {
        prompt: `A ${n(H)} m tall smooth vertical wall retains level granular backfill (φ = ${phi}°) carrying a uniform surcharge of ${q} kPa. The water table behind the wall is ${n(dw)} m below the top. The soil weighs ${n(gm)} kN/m³ above the water table and ${n(gs)} kN/m³ (saturated) below it. Using Rankine active pressure and including water pressure, what is the total lateral force on the wall per metre?`,
        answer: total,
        unit: "kN/m",
        distractors: [
          total - Pw, // left out the water pressure
          Psur + 0.5 * Ka * gm * dw * dw + Ka * gm * dw * hw + 0.5 * Ka * gs * hw * hw, // used the saturated weight with no water force
          total - Psur, // left out the surcharge
        ],
        solution: `Ka = tan²(45° − ${phi}°/2) = ${f(Ka, 4)}\nSurcharge: Ka q H = ${f(Psur, 4)} kN/m\nSoil above water: ½Kaγ(${n(dw)})² = ${f(P1, 4)}; soil below water from the overburden above: Kaγ(${n(dw)})(${f(hw)}) = ${f(P2, 4)}\nBuoyant soil below water: ½Ka(γsat − γw)(${f(hw)})² = ${f(P3, 4)}; water: ½γw(${f(hw)})² = ${f(Pw, 4)}\nTotal = ${f(total)} kN/m`,
      };
    },
  },
  {
    id: "oc-clay-settlement",
    version: 1,
    title: "Settlement of an overconsolidated clay loaded past its preconsolidation stress",
    topics: { "pe-civil": "geotechnical" },
    reference: "Consolidation: recompression and virgin compression",
    generate(r) {
      for (;;) {
        const H = r.range(2, 8, 0.5);
        const Cc = r.range(0.2, 0.6, 0.01);
        const Cr = Number((Cc * r.range(0.1, 0.2, 0.01)).toFixed(3));
        const e0 = r.range(0.6, 1.4, 0.05);
        const s0 = r.range(50, 150, 5);
        const sp = s0 + r.range(20, 100, 5);
        const ds = r.range(40, 200, 5);
        if (s0 + ds <= sp + 10) continue;
        const k = H / (1 + e0);
        const S = k * (Cr * Math.log10(sp / s0) + Cc * Math.log10((s0 + ds) / sp)) * 1000;
        return {
          prompt: `A ${n(H)} m thick clay layer has e₀ = ${n(e0)}, Cc = ${n(Cc)} and Cr = ${n(Cr)}. At mid-layer the current effective stress is ${s0} kPa and the preconsolidation stress is ${sp} kPa. A new building adds ${ds} kPa at mid-layer. What is the primary consolidation settlement?`,
          answer: S,
          unit: "mm",
          distractors: [
            k * Cc * Math.log10((s0 + ds) / s0) * 1000, // treated the clay as normally consolidated
            k * Cr * Math.log10((s0 + ds) / s0) * 1000, // used Cr for the whole stress range
            k * Cc * Math.log10((s0 + ds) / sp) * 1000, // left out the recompression part
          ],
          solution: `Final stress ${s0 + ds} kPa exceeds σ'p = ${sp} kPa, so use both parts:\nS = [H/(1 + e₀)][Cr log(σ'p/σ'₀) + Cc log(σ'f/σ'p)]\n= [${n(H)}/${f(1 + e0)}][${n(Cr)} log(${sp}/${s0}) + ${n(Cc)} log(${s0 + ds}/${sp})] = ${f(S / 1000, 4)} m = ${f(S)} mm`,
        };
      }
    },
  },
  {
    id: "stress-21-method",
    version: 1,
    title: "Stress increase below a footing (2:1 method)",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Stress distribution: 2V:1H approximation",
    generate(r) {
      const B = r.range(1, 4, 0.25);
      const L = r.range(B, 6, 0.25);
      const P = r.range(200, 3000, 50);
      const z = r.range(0.5, 8, 0.5);
      const ds = P / ((B + z) * (L + z));
      return {
        prompt: `A ${n(B)} m × ${n(L)} m footing carries a total load of ${n(P)} kN. Using the 2V:1H stress distribution, what is the average vertical stress increase ${n(z)} m below the base of the footing?`,
        answer: ds,
        unit: "kPa",
        distractors: [
          P / (B * L), // gave the contact pressure (no spreading)
          P / ((B + 2 * z) * (L + 2 * z)), // spread at 1V:1H on each side (B + 2z)
          P / ((B + z / 2) * (L + z / 2)), // spread only z/2 in total
        ],
        solution: `At depth z the load spreads over (B + z)(L + z) = (${n(B)} + ${n(z)})(${n(L)} + ${n(z)}) = ${f((B + z) * (L + z), 4)} m²\nΔσ = ${n(P)}/${f((B + z) * (L + z), 4)} = ${f(ds)} kPa`,
      };
    },
  },

  // ---------------------------------------------------------------- Construction
  {
    id: "linear-schedule-lag",
    version: 1,
    title: "Minimum start lag between two crews on a linear schedule",
    topics: { "pe-civil": "construction" },
    reference: "Project scheduling: linear (time-location) scheduling",
    generate(r) {
      const Lt = r.range(1000, 6000, 100);
      const a = r.range(50, 150, 5);
      const b = Math.round(a * r.range(1.2, 2.0, 0.05));
      const lag = Lt / a - Lt / b;
      return {
        prompt: `A pipeline crew lays ${a} m/day along a ${n(Lt)} m route. The backfill crew that follows works at ${b} m/day. Ignoring any required buffer, what is the minimum number of days the backfill crew must start after the pipe crew so it never catches up before the end of the route?`,
        answer: lag,
        unit: "days",
        distractors: [
          Lt / (b - a), // divided by the difference in rates
          Lt / a, // used the lead crew's full duration
          Lt / b, // used the following crew's duration
        ],
        solution: `The faster crew catches up at the end of the route at the latest, so both must finish together at worst:\nlag = L/a − L/b = ${n(Lt)}/${a} − ${n(Lt)}/${b} = ${f(Lt / a, 4)} − ${f(Lt / b, 4)} = ${f(lag)} days`,
      };
    },
  },
];
