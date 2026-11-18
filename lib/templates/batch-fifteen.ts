import { f, n, type Template } from "./engine";

// Fifteenth batch from docs/EXAM-COVERAGE.md. Formulas and factors are stated in the prompt. Each
// template has an independent solver in verify.ts.

const rad = (x: number) => (x * Math.PI) / 180;

export const BATCH_FIFTEEN: Template[] = [
  {
    id: "block-shear-plate",
    version: 1,
    title: "Block shear rupture of a bolted plate (AISC J4.3)",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section J4.3: Rn = 0.6FuAnv + UbsFuAnt ≤ 0.6FyAgv + UbsFuAnt",
    generate(r) {
      for (;;) {
        const nb = r.range(2, 5, 1);
        const s = 3;
        const Le = r.pick([1.25, 1.5, 2]);
        const e2 = r.pick([1.25, 1.5, 2, 2.5]);
        const t = r.pick([0.375, 0.5, 0.625, 0.75]);
        const d = r.pick([0.75, 0.875]);
        const dh = d + 0.125;
        const st = r.pick([{ Fy: 36, Fu: 58 }, { Fy: 50, Fu: 65 }] as const);
        const Agv = (Le + (nb - 1) * s) * t;
        const Anv = Agv - (nb - 0.5) * dh * t;
        const Ant = (e2 - 0.5 * dh) * t;
        const rup = 0.6 * st.Fu * Anv + st.Fu * Ant;
        const yld = 0.6 * st.Fy * Agv + st.Fu * Ant;
        const Rn = Math.min(rup, yld);
        return {
          prompt: `A ${n(t)} in plate (Fy = ${st.Fy} ksi, Fu = ${st.Fu} ksi) is connected by one line of ${nb} bolts (${n(d)} in diameter, holes d + 1/8 in) parallel to the load at ${s} in spacing. The end distance is ${n(Le)} in and the distance from the bolt line to the plate's side edge is ${n(e2)} in. Using AISC block shear with Ubs = 1.0 and φ = 0.75, what is the design block shear strength along the bolt line and out to the side edge?`,
          answer: 0.75 * Rn,
          unit: "kips",
          distractors: [
            0.75 * rup === 0.75 * Rn ? 0.75 * yld : 0.75 * rup, // didn't take the lesser of rupture and yield on the shear plane
            0.75 * (0.6 * st.Fu * Agv + st.Fu * Ant), // used gross shear area for shear rupture
            Rn, // forgot φ
          ],
          solution: `Agv = (${n(Le)} + ${nb - 1} × ${s}) × ${n(t)} = ${f(Agv, 4)} in²; Anv = ${f(Agv, 4)} − ${nb - 0.5} × ${n(dh)} × ${n(t)} = ${f(Anv, 4)} in²\nAnt = (${n(e2)} − 0.5 × ${n(dh)}) × ${n(t)} = ${f(Ant, 4)} in²\nRupture: 0.6(${st.Fu})(${f(Anv, 4)}) + ${st.Fu}(${f(Ant, 4)}) = ${f(rup, 4)}; limit: 0.6(${st.Fy})(${f(Agv, 4)}) + ${st.Fu}(${f(Ant, 4)}) = ${f(yld, 4)}\nφRn = 0.75 × ${f(Rn, 4)} = ${f(0.75 * Rn)} kips`,
        };
      }
    },
  },
  {
    id: "shear-studs-full-composite",
    version: 1,
    title: "Number of shear studs for full composite action",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Chapter I: ΣQn = min(0.85f'cAc, AsFy), studs on each side of maximum moment",
    generate(r) {
      for (;;) {
        const As = r.range(10, 30, 0.1);
        const beff = r.range(60, 120, 6);
        const t = r.range(3.5, 6, 0.5);
        const fc = r.pick([3, 4, 5]);
        const Qn = r.range(15, 26, 0.1);
        const C = Math.min(0.85 * fc * beff * t, As * 50);
        const half = Math.ceil(Number((C / Qn).toFixed(6)));
        if (half < 8) continue;
        return {
          prompt: `A simply supported composite beam (As = ${n(As)} in², Fy = 50 ksi) has an effective slab width of ${beff} in and a ${n(t)} in solid slab with f'c = ${fc} ksi. Each stud has Qn = ${n(Qn)} kips. For full composite action, ΣQn = min(0.85f'cAc, AsFy) is needed between the point of maximum moment and each support. How many studs does the whole beam need?`,
          answer: 2 * half,
          unit: "studs",
          sig: 4,
          minGap: 0.001,
          distractors: [
            half, // provided studs on only one side of midspan
            2 * Math.ceil((Math.max(0.85 * fc * beff * t, As * 50)) / Qn), // used the larger force instead of the smaller
            2 * Math.floor(C / Qn) < 2 * half ? 2 * Math.floor(C / Qn) : NaN, // rounded the stud count down
          ],
          solution: `0.85f'cAc = 0.85 × ${fc} × ${beff} × ${n(t)} = ${f(0.85 * fc * beff * t, 5)} kips; AsFy = ${n(As)} × 50 = ${f(As * 50, 5)} kips\nΣQn = ${f(C, 5)} kips → ${f(C, 5)}/${n(Qn)} = ${f(C / Qn, 4)}, so ${half} studs each side\nTotal = 2 × ${half} = ${2 * half} studs`,
        };
      }
    },
  },
  {
    id: "coulomb-active-thrust",
    version: 1,
    title: "Coulomb active thrust on a wall with wall friction",
    topics: { "pe-civil": "geotechnical" },
    reference: "Lateral earth pressure: Coulomb Ka, vertical back face, level backfill",
    generate(r) {
      const H = r.range(3, 8, 0.25);
      const gm = r.range(17, 20, 0.5);
      const phi = r.range(28, 38, 1);
      const dl = Math.round((phi * r.pick([0.5, 0.67])) * 10) / 10;
      const p = rad(phi), d = rad(dl);
      const Ka = Math.cos(p) ** 2 / (Math.cos(d) * (1 + Math.sqrt((Math.sin(p + d) * Math.sin(p)) / Math.cos(d))) ** 2);
      const Pa = 0.5 * Ka * gm * H * H;
      return {
        prompt: `A wall with a vertical back face retains ${n(H)} m of level granular backfill (γ = ${n(gm)} kN/m³, φ = ${phi}°). The wall friction angle is δ = ${n(dl)}°. Using Coulomb's Ka = cos²φ/{cos δ[1 + √(sin(φ + δ)sin φ/cos δ)]²} for this geometry, what is the total active thrust per metre?`,
        answer: Pa,
        unit: "kN/m",
        distractors: [
          0.5 * Math.tan(rad(45 - phi / 2)) ** 2 * gm * H * H, // used Rankine (ignored wall friction)
          Ka * gm * H * H, // left out the ½
          0.5 * (Math.cos(p) ** 2 / (1 + Math.sqrt(Math.sin(p + d) * Math.sin(p))) ** 2) * gm * H * H, // dropped the cos δ terms
        ],
        solution: `Ka = cos²${phi}°/{cos ${n(dl)}°[1 + √(sin ${f(phi + dl, 4)}° sin ${phi}°/cos ${n(dl)}°)]²} = ${f(Ka, 4)}\nPa = ½KaγH² = ½(${f(Ka, 4)})(${n(gm)})(${n(H)})² = ${f(Pa)} kN/m (inclined δ from horizontal)`,
      };
    },
  },
  {
    id: "mononobe-okabe-thrust",
    version: 1,
    title: "Seismic active thrust (Mononobe-Okabe)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Seismic earth pressure: Mononobe-Okabe, vertical wall, level backfill",
    generate(r) {
      for (;;) {
        const H = r.range(3, 8, 0.25);
        const gm = r.range(17, 20, 0.5);
        const phi = r.range(30, 38, 1);
        const dl = Math.round(phi / 2);
        const kh = r.range(0.05, 0.3, 0.01);
        const th = Math.atan(kh); // kv = 0
        const p = rad(phi), d = rad(dl);
        if (p - th <= 0.05) continue;
        const KAE = Math.cos(p - th) ** 2 / (Math.cos(th) * Math.cos(d + th) * (1 + Math.sqrt((Math.sin(p + d) * Math.sin(p - th)) / Math.cos(d + th))) ** 2);
        const PAE = 0.5 * gm * H * H * KAE;
        return {
          prompt: `A ${n(H)} m tall wall with a vertical back face retains level dry backfill (γ = ${n(gm)} kN/m³, φ = ${phi}°, wall friction δ = ${dl}°). For a horizontal seismic coefficient kh = ${n(kh)} and kv = 0, use θ = arctan(kh) and KAE = cos²(φ − θ)/{cos θ cos(δ + θ)[1 + √(sin(φ + δ)sin(φ − θ)/cos(δ + θ))]²}. What is the total seismic active thrust PAE = ½γH²KAE?`,
          answer: PAE,
          unit: "kN/m",
          distractors: [
            0.5 * gm * H * H * (Math.cos(p) ** 2 / (Math.cos(d) * (1 + Math.sqrt((Math.sin(p + d) * Math.sin(p)) / Math.cos(d))) ** 2)), // gave the static Coulomb thrust
            gm * H * H * KAE, // left out the ½
            0.5 * gm * H * H * KAE * (1 - kh), // applied (1 − kh) as if it were (1 − kv)
          ],
          solution: `θ = arctan(${n(kh)}) = ${f((th * 180) / Math.PI, 4)}°\nKAE = ${f(KAE, 4)}\nPAE = ½(${n(gm)})(${n(H)})²(${f(KAE, 4)}) = ${f(PAE)} kN/m`,
        };
      }
    },
  },
  {
    id: "secondary-compression",
    version: 1,
    title: "Secondary compression settlement",
    topics: { "pe-civil": "geotechnical" },
    reference: "Consolidation: Ss = [Cα/(1 + ep)]H log(t₂/t₁)",
    generate(r) {
      const H = r.range(2, 10, 0.5);
      const Ca = r.range(0.005, 0.04, 0.001);
      const ep = r.range(0.7, 2.5, 0.05);
      const t1 = r.range(1, 5, 0.5);
      const t2 = r.pick([10, 20, 30, 50]);
      const S = (Ca / (1 + ep)) * H * Math.log10(t2 / t1) * 1000;
      return {
        prompt: `A ${n(H)} m organic clay layer finishes primary consolidation after ${n(t1)} years, when its void ratio is ${n(ep)}. Its secondary compression index Cα is ${n(Ca)}. How much secondary compression settlement occurs between the end of primary consolidation and ${t2} years?`,
        answer: S,
        unit: "mm",
        distractors: [
          Ca * H * Math.log10(t2 / t1) * 1000, // left out (1 + ep)
          (Ca / (1 + ep)) * H * Math.log(t2 / t1) * 1000, // used the natural log
          (Ca / (1 + ep)) * H * Math.log10(t2) * 1000, // measured time from zero instead of from t₁
        ],
        solution: `Ss = [Cα/(1 + ep)]H log(t₂/t₁) = [${n(Ca)}/${f(1 + ep, 4)}](${n(H)}) log(${t2}/${n(t1)}) = ${f(S / 1000, 4)} m = ${f(S)} mm`,
      };
    },
  },
  {
    id: "infiltration-trench-length",
    version: 1,
    title: "Length of an infiltration trench to store a runoff volume",
    topics: { "pe-civil": "water-env" },
    reference: "Stormwater BMPs: trench storage = void space of the stone",
    generate(r) {
      const A = r.range(0.5, 5, 0.1); // acres
      const C = r.range(0.5, 0.95, 0.05);
      const P = r.range(0.5, 2, 0.1); // inches
      const W = r.range(3, 8, 0.5);
      const D = r.range(3, 6, 0.5);
      const nv = r.range(0.3, 0.4, 0.01);
      const V = C * (P / 12) * A * 43560;
      const L = V / (nv * W * D);
      return {
        prompt: `An infiltration trench must store the runoff from a ${n(A)} acre parking area (runoff coefficient ${n(C)}) for a ${n(P)} in water quality storm, ignoring infiltration during the storm. The trench is ${n(W)} ft wide and ${n(D)} ft deep, filled with stone of porosity ${n(nv)}. How long must it be?`,
        answer: L,
        unit: "ft",
        distractors: [
          V / (W * D), // ignored the stone (used the full trench volume)
          (P / 12) * A * 43560 / (nv * W * D), // left out the runoff coefficient
          V / (nv * D), // left out the trench width
        ],
        solution: `Runoff volume = C × P × A = ${n(C)} × (${n(P)}/12 ft) × ${n(A)} × 43,560 = ${f(V, 5)} ft³\nStorage per foot of trench = n × W × D = ${n(nv)} × ${n(W)} × ${n(D)} = ${f(nv * W * D, 4)} ft³/ft\nL = ${f(V, 5)}/${f(nv * W * D, 4)} = ${f(L)} ft`,
      };
    },
  },
  {
    id: "aerated-grit-chamber",
    version: 1,
    title: "Length of an aerated grit chamber",
    topics: { "pe-civil": "water-env" },
    reference: "Preliminary treatment: aerated grit chamber detention at peak flow",
    generate(r) {
      const Q = r.range(0.2, 3, 0.05); // m³/s peak
      const t = r.range(2, 5, 0.5); // min
      const D = r.range(2, 4.5, 0.25);
      const ratio = r.pick([1.0, 1.2, 1.5]);
      const W = D * ratio;
      const V = Q * t * 60;
      const L = V / (W * D);
      return {
        prompt: `An aerated grit chamber handles a peak flow of ${n(Q)} m³/s with ${n(t)} minutes of detention at peak. It is ${n(D)} m deep with a width-to-depth ratio of ${ratio.toFixed(1)}:1. How long must it be?`,
        answer: L,
        unit: "m",
        distractors: [
          (Q * t) / (W * D), // left the detention time in minutes
          V / (D * D), // used the depth for the width
          (Q * t * 3600) / (W * D), // converted minutes with 3,600
        ],
        solution: `Volume = Q × t = ${n(Q)} × ${n(t)} × 60 = ${f(V, 4)} m³\nWidth = ${ratio.toFixed(1)} × ${n(D)} = ${f(W, 4)} m; L = ${f(V, 4)}/(${f(W, 4)} × ${n(D)}) = ${f(L)} m`,
      };
    },
  },
  {
    id: "wet-well-volume",
    version: 1,
    title: "Active wet well volume for a lift station",
    topics: { "pe-civil": "water-env" },
    reference: "Lift stations: minimum cycle time, V = θq/4",
    generate(r) {
      const q = r.range(200, 3000, 50);
      const theta = r.pick([6, 10, 15, 20]);
      const V = (theta * q) / 4;
      return {
        prompt: `A constant-speed pump in a lift station delivers ${n(q)} gpm. To limit motor starts, the minimum cycle time (time between successive starts) is ${theta} minutes. Using V = θq/4, what active wet well volume is needed between pump-on and pump-off levels?`,
        answer: V,
        unit: "gal",
        distractors: [
          theta * q, // left out the 4
          (theta * q) / 2, // used 2 instead of 4
          ((theta * q) / 4) / 7.48, // converted to cubic feet
        ],
        solution: `The worst case is inflow = q/2, which gives the shortest cycle.\nV = θq/4 = ${theta} × ${n(q)}/4 = ${f(V)} gal (${f(V / 7.48)} ft³)`,
      };
    },
  },
  {
    id: "freeway-merge-flow",
    version: 1,
    title: "Flow in lanes 1 and 2 upstream of an on-ramp merge (HCM)",
    topics: { "pe-civil": "transportation" },
    reference: "Highway Capacity Manual: merge influence area, v₁₂ = vF·PFM, vR12 = v₁₂ + vR",
    generate(r) {
      const vF = r.range(2000, 6500, 50);
      const PFM = r.range(0.55, 1.0, 0.01);
      const vR = r.range(300, 1500, 10);
      const v12 = vF * PFM;
      const vR12 = v12 + vR;
      return {
        prompt: `Upstream of an on-ramp, a freeway carries vF = ${n(vF)} pc/h. The share of freeway flow in lanes 1 and 2 is PFM = ${n(PFM)}, and the ramp adds vR = ${n(vR)} pc/h. What is the total flow entering the merge influence area, vR12 = vF·PFM + vR? (HCM compares it with 4,600 pc/h.)`,
        answer: vR12,
        unit: "pc/h",
        distractors: [
          vF + vR, // used all of the freeway flow
          v12, // left out the ramp flow
          vF * PFM * 2 + vR, // doubled the two-lane flow
        ],
        solution: `v₁₂ = ${n(vF)} × ${n(PFM)} = ${f(v12, 5)} pc/h\nvR12 = ${f(v12, 5)} + ${n(vR)} = ${f(vR12, 5)} pc/h${vR12 > 4600 ? " (exceeds 4,600: merge area at capacity)" : ""}`,
      };
    },
  },
  {
    id: "required-superelevation",
    version: 1,
    title: "Superelevation needed for a given curve radius",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Horizontal curves: e = V²/(15R) − f",
    generate(r) {
      for (;;) {
        const V = r.range(30, 70, 5);
        const R = r.range(300, 3000, 50);
        const fr = r.range(0.08, 0.17, 0.01);
        const e = ((V * V) / (15 * R) - fr) * 100;
        if (e < 1 || e > 12) continue;
        return {
          prompt: `A horizontal curve with radius ${n(R)} ft is designed for ${V} mph with a side friction factor of ${n(fr)}. Using R = V²/[15(e + f)], what superelevation rate is required?`,
          answer: e,
          unit: "%",
          distractors: [
            ((V * V) / (15 * R)) * 100, // ignored side friction
            ((V * V) / (15 * R) + fr) * 100, // added f instead of subtracting
            ((V * V) / (127 * R) - fr) * 100 > 0 ? ((V * V) / (127 * R) - fr) * 100 : NaN, // used the metric constant 127
          ],
          solution: `e + f = V²/(15R) = ${V}²/(15 × ${n(R)}) = ${f((V * V) / (15 * R), 4)}\ne = ${f((V * V) / (15 * R), 4)} − ${n(fr)} = ${f(e / 100, 4)} = ${f(e)}%`,
        };
      }
    },
  },
  {
    id: "earthwork-overhaul",
    version: 1,
    title: "Overhaul quantity beyond the free-haul distance",
    topics: { "pe-civil": "construction" },
    reference: "Earthwork: mass haul, free haul and overhaul in station-yards",
    generate(r) {
      const V = r.range(2000, 40000, 500);
      const FH = r.pick([500, 600, 1000]);
      const d = FH + r.range(200, 3000, 50); // the haul must exceed free haul for overhaul to exist
      const price = r.range(0.2, 1.5, 0.05);
      const sy = (V * (d - FH)) / 100;
      const cost = sy * price;
      return {
        prompt: `On a mass diagram, ${n(V)} yd³ of excavation is moved beyond the free-haul limit. The distance between the centroids of that cut and its fill is ${n(d)} ft, and the free-haul distance is ${FH} ft. Overhaul is paid at $${price.toFixed(2)} per station-yard. What is the overhaul payment?`,
        answer: cost,
        unit: "$",
        distractors: [
          ((V * d) / 100) * price, // didn't subtract the free-haul distance
          V * (d - FH) * price, // left the distance in feet (not stations)
          ((V * (d - FH / 2)) / 100) * price, // subtracted only half the free haul
        ],
        solution: `Overhaul distance = ${n(d)} − ${FH} = ${n(d - FH)} ft = ${f((d - FH) / 100, 4)} stations\nOverhaul = ${n(V)} yd³ × ${f((d - FH) / 100, 4)} = ${f(sy, 5)} station-yd\nPayment = ${f(sy, 5)} × $${price.toFixed(2)} = $${f(cost, 4)}`,
      };
    },
  },
];
