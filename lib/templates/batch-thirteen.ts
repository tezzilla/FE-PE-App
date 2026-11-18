import { f, n, type Template } from "./engine";

// Thirteenth batch from docs/EXAM-COVERAGE.md. Formulas and factors are stated in the prompt. Each
// template has an independent solver in verify.ts.

export const BATCH_THIRTEEN: Template[] = [
  {
    id: "moment-magnification-nonsway",
    version: 1,
    title: "Magnified moment in a slender nonsway concrete column",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Section 6.6.4.5: δ = Cm/(1 − Pu/0.75Pc) ≥ 1",
    generate(r) {
      for (;;) {
        const Pu = r.range(100, 700, 10);
        const EI = r.range(1, 12, 0.5) * 1e6; // kip·in²
        const Lu = r.range(10, 22, 0.5);
        const M2 = r.range(50, 300, 5);
        const M1 = Math.round(M2 * r.range(0.2, 0.9, 0.05));
        const single = r.next() < 0.5;
        const ratio = single ? M1 / M2 : -M1 / M2;
        const Cm = 0.6 - 0.4 * ratio;
        const Pc = (Math.PI ** 2 * EI) / (Lu * 12) ** 2;
        if (Pu / (0.75 * Pc) > 0.8) continue;
        const d = Math.max(1, Cm / (1 - Pu / (0.75 * Pc)));
        const Mc = d * M2;
        if (d === 1 && r.next() < 0.7) continue; // mostly cases where magnification matters
        return {
          prompt: `A braced (nonsway) column has an unsupported length of ${n(Lu)} ft (k = 1.0) and (EI)eff = ${n(EI / 1e6)} × 10⁶ kip·in². It carries Pu = ${Pu} kips with end moments M₁ = ${M1} kip·ft and M₂ = ${M2} kip·ft, bent in ${single ? "single" : "double"} curvature, and no transverse loads. Using Cm = 0.6 − 0.4M₁/M₂ (M₁/M₂ positive for single curvature), δ = Cm/(1 − Pu/0.75Pc) ≥ 1.0 and Pc = π²(EI)eff/(kℓu)², what is the magnified design moment (M₂ exceeds the minimum moment)?`,
          answer: Mc,
          unit: "kip·ft",
          distractors: [
            Math.max(1, Cm / (1 - Pu / Pc)) * M2, // left out the 0.75 stiffness reduction
            Math.max(1, 1 / (1 - Pu / (0.75 * Pc))) * M2, // took Cm = 1.0
            Math.max(1, (0.6 + 0.4 * ratio) / (1 - Pu / (0.75 * Pc))) * M2, // flipped the sign on M₁/M₂
            M2, // didn't magnify
          ],
          solution: `Pc = π²(${n(EI)})/(1.0 × ${n(Lu * 12)})² = ${f(Pc, 5)} kips\nCm = 0.6 − 0.4(${single ? "" : "−"}${M1}/${M2}) = ${f(Cm, 4)}\nδ = ${f(Cm, 4)}/(1 − ${Pu}/(0.75 × ${f(Pc, 5)})) = ${f(Cm / (1 - Pu / (0.75 * Pc)), 4)}${Cm / (1 - Pu / (0.75 * Pc)) < 1 ? " → use 1.0" : ""}\nMc = δM₂ = ${f(d, 4)} × ${M2} = ${f(Mc)} kip·ft`,
        };
      }
    },
  },
  {
    id: "wood-bolt-group-capacity",
    version: 1,
    title: "Adjusted capacity of a bolted wood connection (NDS, ASD)",
    topics: { "pe-civil": "structural" },
    reference: "NDS Chapter 12: Z' = Z × CD × CM × Ct × Cg × CΔ",
    generate(r) {
      const Z = r.range(500, 2000, 10);
      const nb = r.range(2, 8, 1);
      const CD = r.pick([0.9, 1.0, 1.15, 1.6]);
      const CM = r.pick([1.0, 0.7]);
      const Cg = r.range(0.85, 1.0, 0.01);
      const Zt = (nb * Z * CD * CM * Cg) / 1000;
      return {
        prompt: `A wood splice uses ${nb} bolts in a row, each with a reference lateral design value Z = ${n(Z)} lb. Adjustment factors: CD = ${CD.toFixed(2)}, CM = ${CM.toFixed(1)}, Ct = 1.0, group action factor Cg = ${n(Cg)}, and geometry factor CΔ = 1.0. What is the allowable lateral capacity of the connection?`,
        answer: Zt,
        unit: "kips",
        distractors: [
          (nb * Z * CM * Cg) / 1000, // left out the load duration factor
          (nb * Z * CD * CM) / 1000, // left out the group action factor
          (Z * CD * CM * Cg) / 1000, // gave the capacity of one bolt
        ],
        solution: `Z' per bolt = ${n(Z)} × ${CD.toFixed(2)} × ${CM.toFixed(1)} × 1.0 × ${n(Cg)} × 1.0 = ${f(Z * CD * CM * Cg, 4)} lb\nConnection = ${nb} × ${f(Z * CD * CM * Cg, 4)} = ${f(Zt * 1000, 5)} lb = ${f(Zt)} kips`,
      };
    },
  },
  {
    id: "base-plate-thickness",
    version: 1,
    title: "Required thickness of a column base plate (LRFD)",
    topics: { "pe-civil": "structural" },
    reference: "AISC Design Guide 1: tp = ℓ√(2Pu/(0.9FyBN)), ℓ = max(m, n)",
    generate(r) {
      for (;;) {
        const d = r.range(10, 14.5, 0.1);
        const bf = r.range(8, 14.5, 0.1);
        const N = r.range(Math.ceil(d + 4), Math.ceil(d + 12), 1);
        const B = r.range(Math.ceil(bf + 4), Math.ceil(bf + 12), 1);
        const Pu = r.range(200, 1200, 10);
        const m = (N - 0.95 * d) / 2;
        const nn = (B - 0.8 * bf) / 2;
        const l = Math.max(m, nn);
        const tp = l * Math.sqrt((2 * Pu) / (0.9 * 36 * B * N));
        if (Math.abs(m - nn) / l < 0.08) continue;
        return {
          prompt: `A W-shape column (d = ${n(d)} in, bf = ${n(bf)} in) carries Pu = ${Pu} kips on a ${B} in × ${N} in base plate (B × N, Fy = 36 ksi). Using m = (N − 0.95d)/2, n = (B − 0.8bf)/2, ℓ = max(m, n) (λn' doesn't govern) and tp = ℓ√(2Pu/(0.9FyBN)), what plate thickness is required?`,
          answer: tp,
          unit: "in",
          distractors: [
            Math.min(m, nn) * Math.sqrt((2 * Pu) / (0.9 * 36 * B * N)), // used the smaller cantilever
            l * Math.sqrt((2 * Pu) / (36 * B * N)), // left out φ = 0.9
            l * Math.sqrt(Pu / (0.9 * 36 * B * N)), // left out the 2
          ],
          solution: `m = (${N} − 0.95 × ${n(d)})/2 = ${f(m, 4)} in; n = (${B} − 0.8 × ${n(bf)})/2 = ${f(nn, 4)} in; ℓ = ${f(l, 4)} in\ntp = ${f(l, 4)}√(2 × ${Pu}/(0.9 × 36 × ${B} × ${N})) = ${f(tp)} in`,
        };
      }
    },
  },
  {
    id: "sequent-peak-storage",
    version: 1,
    title: "Reservoir storage required for a constant demand (sequent peak)",
    topics: { "pe-civil": "water-env" },
    reference: "Hydrology: reservoir yield, sequent peak algorithm",
    generate(r) {
      for (;;) {
        const k = r.range(6, 8, 1);
        const flows = Array.from({ length: k }, () => r.range(2, 30, 1));
        const D = r.range(8, 20, 1);
        let K = 0, maxK = 0;
        const Ks: number[] = [];
        for (const q of flows) { K = Math.max(0, K + D - q); Ks.push(K); maxK = Math.max(maxK, K); }
        const deficits = flows.reduce((a, q) => a + Math.max(0, D - q), 0);
        if (maxK < 3 || deficits === maxK) continue;
        return {
          prompt: `A water supply reservoir must release a constant ${D} million m³ per month. Monthly inflows over the critical dry period are ${flows.join(", ")} million m³. Ignoring evaporation and seepage, and starting full, what active storage is needed so the demand is always met? (Track the running shortfall, resetting to zero whenever the reservoir refills.)`,
          answer: maxK,
          unit: "million m³",
          sig: 4,
          distractors: [
            deficits, // added every monthly deficit, ignoring refill between them
            Math.max(...flows.map((q) => D - q)), // took only the worst single month
            Math.max(1, D * k - flows.reduce((a, b) => a + b, 0)) === maxK ? maxK + D : Math.max(1, D * k - flows.reduce((a, b) => a + b, 0)), // used total demand minus total inflow
          ],
          solution: `Running shortfall Kₜ = max(0, Kₜ₋₁ + ${D} − inflow):\n${flows.map((q, i) => `month ${i + 1}: inflow ${q} → K = ${Ks[i]}`).join("\n")}\nThe largest running shortfall is ${maxK} million m³, so that is the storage required.`,
        };
      }
    },
  },
  {
    id: "sediment-basin-stokes",
    version: 1,
    title: "Sediment basin surface area from Stokes' law",
    topics: { "pe-civil": "water-env" },
    reference: "Sedimentation: Stokes settling velocity and overflow rate",
    generate(r) {
      const d = r.range(0.01, 0.06, 0.005); // mm
      const Q = r.range(0.05, 1, 0.05);
      const mu = 1.002e-3, rho = 998, rhos = 2650;
      const dm = d / 1000;
      const vs = (9.81 * (rhos - rho) * dm * dm) / (18 * mu);
      const A = Q / vs;
      return {
        prompt: `A construction sediment basin must capture soil particles ${n(d)} mm in diameter (specific gravity 2.65) from a design inflow of ${n(Q)} m³/s. Water at 20°C has ρ = 998 kg/m³ and μ = 1.002 × 10⁻³ N·s/m². Using Stokes' law and setting the overflow rate equal to the settling velocity, what basin surface area is needed?`,
        answer: A,
        unit: "m²",
        distractors: [
          Q / ((9.81 * rhos * dm * dm) / (18 * mu)), // used ρs instead of (ρs − ρw)
          Q / ((9.81 * (rhos - rho) * dm * dm) / (9 * mu)), // used 9 instead of 18
          Q / ((9.81 * (rhos - rho) * dm) / (18 * mu)), // didn't square the diameter
        ],
        solution: `vs = g(ρs − ρw)d²/(18μ) = 9.81(2,650 − 998)(${f(dm, 3)})²/(18 × 1.002 × 10⁻³) = ${f(vs, 4)} m/s\nA = Q/vs = ${n(Q)}/${f(vs, 4)} = ${f(A)} m²`,
      };
    },
  },
  {
    id: "network-node-pressure",
    version: 1,
    title: "Pressure at a distribution node fed from a reservoir",
    topics: { "pe-civil": "water-env" },
    reference: "Distribution systems: HGL, Hazen-Williams, p = 0.433(HGL − z)",
    generate(r) {
      for (;;) {
        const Ws = r.range(300, 500, 1);
        const L = r.range(1000, 8000, 100);
        const Din = r.pick([8, 10, 12, 16, 18, 24]);
        const C = r.pick([100, 110, 120, 130]);
        const Q = r.range(0.5, 8, 0.1);
        const z = r.range(Ws - 200, Ws - 60, 1);
        const D = Din / 12;
        const hf = (4.73 * L * Q ** 1.852) / (C ** 1.852 * D ** 4.87);
        const p = 0.433 * (Ws - hf - z);
        if (p < 20 || p > 120 || hf < 3) continue;
        return {
          prompt: `A reservoir with its water surface at elevation ${Ws} ft feeds a node at ground elevation ${z} ft through ${n(L)} ft of ${Din}-in main (Hazen-Williams C = ${C}) carrying ${n(Q)} cfs. Ignoring minor losses, what is the pressure at the node?`,
          answer: p,
          unit: "psi",
          distractors: [
            0.433 * (Ws - z), // gave the static pressure (no friction loss)
            (Ws - hf - z) / 0.433, // divided by 0.433 instead of multiplying
            0.433 * (Ws - z - (4.73 * L * Q ** 2) / (C ** 1.852 * D ** 4.87)), // squared Q in Hazen-Williams
          ],
          solution: `h_f = 4.73LQ^1.852/(C^1.852D^4.87) = ${f(hf, 4)} ft\nHGL at node = ${Ws} − ${f(hf, 4)} = ${f(Ws - hf, 5)} ft\np = 0.433(${f(Ws - hf, 5)} − ${z}) = ${f(p)} psi`,
        };
      }
    },
  },
  {
    id: "parking-peak-accumulation",
    version: 1,
    title: "Peak parking accumulation from arrival and departure counts",
    topics: { "pe-civil": "transportation" },
    reference: "Parking studies: accumulation = initial + arrivals − departures",
    generate(r) {
      for (;;) {
        const N0 = r.range(10, 80, 1);
        const k = 6;
        const arr = Array.from({ length: k }, () => r.range(5, 90, 1));
        const dep = Array.from({ length: k }, () => r.range(5, 70, 1));
        let occ = N0, peak = N0;
        const path: number[] = [];
        for (let i = 0; i < k; i++) { occ += arr[i] - dep[i]; if (occ < 0) break; path.push(occ); peak = Math.max(peak, occ); }
        if (path.length < k || peak === path[k - 1]) continue;
        return {
          prompt: `A parking lot holds ${N0} vehicles at 7:00 a.m. Hourly counts from 7:00 to 1:00 show arrivals of ${arr.join(", ")} and departures of ${dep.join(", ")}. What is the peak accumulation during the study?`,
          answer: peak,
          unit: "vehicles",
          sig: 4,
          minGap: 0.001,
          distractors: [
            path[k - 1], // gave the final accumulation
            N0 + arr.reduce((a, b) => a + b, 0), // added all arrivals and ignored departures
            Math.max(...arr) + N0, // added only the busiest hour of arrivals
          ],
          solution: `Accumulation at the end of each hour: ${path.join(", ")}\nPeak = ${peak} vehicles`,
        };
      }
    },
  },
  {
    id: "walkway-pedestrian-space",
    version: 1,
    title: "Pedestrian space on a walkway (HCM)",
    topics: { "pe-civil": "transportation" },
    reference: "Highway Capacity Manual: pedestrian space Ap = S/vp",
    generate(r) {
      const P15 = r.range(100, 1500, 10);
      const W = r.range(6, 20, 0.5);
      const shy = r.range(1.5, 4, 0.5);
      const We = W - shy;
      const S = r.range(240, 300, 5);
      const vp = P15 / (15 * We);
      const Ap = S / vp;
      return {
        prompt: `A ${n(W)} ft sidewalk loses ${n(shy)} ft of width to street furniture and shy distance. In the peak 15 minutes, ${P15} pedestrians use it, walking at an average ${S} ft/min. Using vp = (peak 15-min flow)/(15 × effective width) and Ap = S/vp, what is the average space per pedestrian?`,
        answer: Ap,
        unit: "ft²/p",
        distractors: [
          S / (P15 / (15 * W)), // used the total width
          S / (P15 / (60 * We)), // divided the 15-minute count by 60 minutes
          S / (P15 / We), // didn't convert to a per-minute flow
        ],
        solution: `Effective width = ${n(W)} − ${n(shy)} = ${f(We, 4)} ft\nvp = ${P15}/(15 × ${f(We, 4)}) = ${f(vp, 4)} p/min/ft\nAp = ${S}/${f(vp, 4)} = ${f(Ap)} ft²/p`,
      };
    },
  },
  {
    id: "spot-speed-85th",
    version: 1,
    title: "85th percentile speed from a spot speed study",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Speed studies: normal distribution, z₀.₈₅ = 1.036",
    generate(r) {
      const m = r.range(28, 68, 0.5);
      const s = r.range(3, 8, 0.1);
      const v85 = m + 1.036 * s;
      return {
        prompt: `A spot speed study finds a mean speed of ${n(m)} mph and a standard deviation of ${n(s)} mph, and the speeds are approximately normal. What is the 85th percentile speed?`,
        answer: v85,
        unit: "mph",
        sig: 4,
        minGap: 0.01,
        distractors: [
          m + s, // added one standard deviation
          m + 1.645 * s, // used the 95th percentile z value
          m + 1.282 * s, // used the 90th percentile z value
        ],
        solution: `v₈₅ = mean + 1.036σ = ${n(m)} + 1.036 × ${n(s)} = ${f(v85, 4)} mph`,
      };
    },
  },
  {
    id: "space-mean-speed",
    version: 1,
    title: "Space-mean speed from spot speeds",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Traffic flow: space-mean speed is the harmonic mean of spot speeds",
    generate(r) {
      for (;;) {
        const v = Array.from({ length: r.range(4, 6, 1) }, () => r.range(25, 70, 1));
        const sms = v.length / v.reduce((a, x) => a + 1 / x, 0);
        const tms = v.reduce((a, b) => a + b, 0) / v.length;
        if ((tms - sms) / sms < 0.03) continue;
        return {
          prompt: `Vehicles passing a point are clocked at ${v.join(", ")} mph. What is their space-mean speed?`,
          answer: sms,
          unit: "mph",
          sig: 4,
          minGap: 0.01,
          distractors: [
            tms, // gave the time-mean (arithmetic) speed
            [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)], // gave the median
            Math.sqrt(v.reduce((a, x) => a + x * x, 0) / v.length), // used the root-mean-square
          ],
          solution: `Space-mean speed = n/Σ(1/vᵢ) = ${v.length}/(${v.map((x) => `1/${x}`).join(" + ")}) = ${f(sms, 4)} mph\n(The time-mean speed, ${f(tms, 4)} mph, is always at least as large.)`,
        };
      }
    },
  },
  {
    id: "cost-loaded-cumulative",
    version: 1,
    title: "Cumulative planned cost from a cost-loaded schedule",
    topics: { "pe-civil": "construction" },
    reference: "Project controls: cost-loaded schedule, cash flow curve",
    generate(r) {
      for (;;) {
        const acts = ["A", "B", "C", "D"].map((id, i) => {
          const start = i === 0 ? 0 : r.range(0, 8, 1);
          const dur = r.range(2, 8, 1);
          const cost = r.range(10, 200, 5) * 1000;
          return { id, start, dur, cost };
        });
        const wk = r.range(3, 10, 1);
        const planned = acts.reduce((a, x) => a + x.cost * Math.min(1, Math.max(0, (wk - x.start) / x.dur)), 0);
        const started = acts.filter((x) => x.start < wk).reduce((a, x) => a + x.cost, 0);
        const finished = acts.filter((x) => x.start + x.dur <= wk).reduce((a, x) => a + x.cost, 0);
        if (planned === started || planned === finished || planned === 0) continue;
        return {
          prompt: `A cost-loaded schedule spreads each activity's cost evenly over its duration: ${acts.map((x) => `${x.id} starts at week ${x.start}, lasts ${x.dur} weeks, costs $${n(x.cost)}`).join("; ")}. What is the cumulative planned cost (planned value) at the end of week ${wk}?`,
          answer: planned,
          unit: "$",
          distractors: [
            started, // counted the full cost of every activity that had started
            finished > 0 ? finished : NaN, // counted only completed activities
            acts.reduce((a, x) => a + x.cost, 0) * (wk / Math.max(...acts.map((x) => x.start + x.dur))), // prorated the total budget by elapsed time
          ],
          solution: `${acts.map((x) => `${x.id}: ${f(Math.min(1, Math.max(0, (wk - x.start) / x.dur)) * 100, 3)}% of $${n(x.cost)}`).join("; ")}\nPlanned value at week ${wk} = $${f(planned, 5)}`,
        };
      }
    },
  },
  {
    id: "preload-surcharge-time",
    version: 1,
    title: "Time to reach the permanent settlement under a surcharge",
    topics: { "pe-civil": "geotechnical" },
    reference: "Ground improvement: preloading, Tv from U",
    generate(r) {
      for (;;) {
        const sTot = r.range(200, 800, 10); // mm, fill + surcharge, ultimate
        const sPerm = Math.round(sTot * r.range(0.4, 0.85, 0.01));
        const U = sPerm / sTot;
        const H = r.range(3, 12, 0.5);
        const dbl = r.next() < 0.6;
        const cv = r.range(0.5, 4, 0.1);
        const Tv = U <= 0.6 ? (Math.PI / 4) * U * U : 1.781 - 0.933 * Math.log10(100 * (1 - U));
        const Hdr = dbl ? H / 2 : H;
        const t = (Tv * Hdr * Hdr) / cv;
        if (t < 0.1) continue;
        return {
          prompt: `Under the permanent fill alone, a ${n(H)} m clay layer (drained ${dbl ? "top and bottom" : "at the top only"}, cv = ${n(cv)} m²/yr) will settle ${sPerm} mm. A temporary surcharge raises the ultimate settlement to ${sTot} mm. How long must the surcharge stay in place for the permanent settlement to occur? Use Tv = (π/4)U² for U ≤ 0.6 and Tv = 1.781 − 0.933 log(100 − U%) otherwise.`,
          answer: t,
          unit: "years",
          distractors: [
            (Tv * H * H) / cv === t ? (Tv * (H / 2) * (H / 2)) / cv : (Tv * H * H) / cv, // used the wrong drainage path
            ((Math.PI / 4) * U * U * Hdr * Hdr) / cv === t ? (0.848 * Hdr * Hdr) / cv : ((Math.PI / 4) * U * U * Hdr * Hdr) / cv, // used the wrong Tv branch (or Tv for 90%)
            (0.848 * Hdr * Hdr) / cv === t ? (0.197 * Hdr * Hdr) / cv : (0.848 * Hdr * Hdr) / cv, // used Tv for 90% consolidation
          ],
          solution: `Required U = ${sPerm}/${sTot} = ${f(U * 100, 3)}%\nTv = ${U <= 0.6 ? `(π/4)(${f(U, 4)})²` : `1.781 − 0.933 log(${f(100 - U * 100, 4)})`} = ${f(Tv, 4)}\nH_dr = ${f(Hdr, 3)} m; t = Tv H_dr²/cv = ${f(Tv, 4)} × ${f(Hdr, 3)}²/${n(cv)} = ${f(t)} years`,
        };
      }
    },
  },
];
