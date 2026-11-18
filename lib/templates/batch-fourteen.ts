import { f, n, type Template } from "./engine";

// Fourteenth batch from docs/EXAM-COVERAGE.md. Formulas and factors are stated in the prompt. Each
// template has an independent solver in verify.ts.

export const BATCH_FOURTEEN: Template[] = [
  {
    id: "sway-moment-magnification",
    version: 1,
    title: "Magnified end moment in a sway frame column",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Section 6.6.4.6: δs = 1/(1 − ΣPu/0.75ΣPc) ≥ 1",
    generate(r) {
      for (;;) {
        const SPu = r.range(1000, 8000, 50);
        const SPc = r.range(SPu * 2, SPu * 8, 50);
        const Mns = r.range(20, 200, 5);
        const Ms = r.range(30, 300, 5);
        const ds = 1 / (1 - SPu / (0.75 * SPc));
        if (ds < 1.05 || ds > 2) continue;
        const M2 = Mns + ds * Ms;
        return {
          prompt: `A story of an unbraced (sway) concrete frame has total factored gravity load ΣPu = ${n(SPu)} kips and ΣPc = ${n(SPc)} kips for its columns. For one column, the end moment from gravity (nonsway) loads is ${Mns} kip·ft and from lateral (sway) loads is ${Ms} kip·ft. Using δs = 1/(1 − ΣPu/0.75ΣPc) and M₂ = M₂ns + δsM₂s, what is the design end moment?`,
          answer: M2,
          unit: "kip·ft",
          distractors: [
            ds * (Mns + Ms), // magnified the gravity moment too
            Mns + Ms / (1 - SPu / SPc), // left out the 0.75
            Mns + Ms, // didn't magnify
          ],
          solution: `δs = 1/(1 − ${n(SPu)}/(0.75 × ${n(SPc)})) = ${f(ds, 4)}\nM₂ = ${Mns} + ${f(ds, 4)} × ${Ms} = ${f(M2)} kip·ft (only the sway moment is magnified)`,
        };
      }
    },
  },
  {
    id: "timber-beam-stability-cl",
    version: 1,
    title: "Beam stability factor CL for a sawn lumber beam (NDS)",
    topics: { "pe-civil": "structural" },
    reference: "NDS Section 3.3.3: RB = √(ℓe d/b²), FbE = 1.20E'min/RB²",
    generate(r) {
      for (;;) {
        const b = r.pick([1.5, 3.5, 5.5]);
        const d = r.pick([7.25, 9.25, 11.25, 13.25, 15.25]);
        const le = r.range(60, 300, 10);
        const Emin = r.pick([440000, 510000, 580000, 620000]);
        const Fbs = r.range(800, 2000, 10);
        const RB = Math.sqrt((le * d) / (b * b));
        if (RB > 50 || d / b < 2) continue;
        const FbE = (1.2 * Emin) / (RB * RB);
        const a = FbE / Fbs;
        const CL = (1 + a) / 1.9 - Math.sqrt(((1 + a) / 1.9) ** 2 - a / 0.95);
        if (CL > 0.98) continue;
        return {
          prompt: `A ${b} in × ${d} in (actual) sawn lumber beam has an effective unbraced length ℓe = ${le} in. E'min = ${n(Emin)} psi and F*b (Fb times all factors except CL and CV) = ${n(Fbs)} psi. Using RB = √(ℓe d/b²), FbE = 1.20E'min/RB² and CL = (1 + α)/1.9 − √[((1 + α)/1.9)² − α/0.95] with α = FbE/F*b, what is the beam stability factor CL?`,
          answer: CL,
          unit: "",
          distractors: [
            (1 + a) / 1.6 - Math.sqrt(((1 + a) / 1.6) ** 2 - a / 0.8), // used the column (Cp) constants
            Math.min(1, a), // took CL = FbE/F*b
            ((): number => { const a2 = (1.2 * Emin) / ((le * d) / b) / Fbs; return (1 + a2) / 1.9 - Math.sqrt(((1 + a2) / 1.9) ** 2 - a2 / 0.95); })(), // forgot to square b in RB
          ],
          solution: `RB = √(${le} × ${d}/${b}²) = ${f(RB, 4)} (≤ 50 OK)\nFbE = 1.20 × ${n(Emin)}/${f(RB, 4)}² = ${f(FbE, 4)} psi; α = ${f(FbE, 4)}/${n(Fbs)} = ${f(a, 4)}\nCL = (1 + α)/1.9 − √[((1 + α)/1.9)² − α/0.95] = ${f(CL)}`,
        };
      }
    },
  },
  {
    id: "hardy-cross-correction",
    version: 1,
    title: "Hardy Cross flow correction for one pipe loop",
    topics: { "pe-civil": "water-env" },
    reference: "Pipe networks: ΔQ = −Σh/(1.852Σh/Q) with h = kQ^1.852",
    generate(r) {
      for (;;) {
        const k = Array.from({ length: 4 }, () => r.range(1, 20, 0.5));
        const Q = Array.from({ length: 4 }, (_, i) => (i < 2 ? 1 : -1) * r.range(0.5, 4, 0.1));
        const h = Q.map((q, i) => Math.sign(q) * k[i] * Math.abs(q) ** 1.852);
        const num = h.reduce((a, b) => a + b, 0);
        const den = 1.852 * h.reduce((a, x, i) => a + Math.abs(x / Q[i]), 0);
        const dQ = -num / den;
        if (Math.abs(dQ) < 0.05 || dQ <= 0) continue;
        return {
          prompt: `A single pipe loop has four pipes with head loss h = kQ^1.852 (Q in cfs, h in ft). Taking clockwise flow as positive, the assumed flows are ${Q.map((q, i) => `pipe ${String.fromCharCode(65 + i)}: ${q > 0 ? "+" : ""}${n(q)} cfs (k = ${n(k[i])})`).join("; ")}. Using the Hardy Cross correction ΔQ = −Σh/(1.852Σ|h/Q|), what correction should be applied (clockwise positive)?`,
          answer: dQ,
          unit: "cfs",
          distractors: [
            -num / h.reduce((a, x, i) => a + Math.abs(x / Q[i]), 0), // left out the 1.852
            -num / (2 * h.reduce((a, x, i) => a + Math.abs(x / Q[i]), 0)), // used the Darcy exponent 2
            -num / (1.852 * h.reduce((a, x) => a + Math.abs(x), 0)), // divided by Σ|h| instead of Σ|h/Q|
          ],
          solution: `h = sign(Q)kQ^1.852: ${h.map((x, i) => `${String.fromCharCode(65 + i)} ${f(x, 4)}`).join(", ")} → Σh = ${f(num, 4)} ft\nΣ|h/Q| = ${f(den / 1.852, 4)}; 1.852Σ|h/Q| = ${f(den, 4)}\nΔQ = −(${f(num, 4)})/${f(den, 4)} = ${f(dQ)} cfs (add to clockwise flows)`,
        };
      }
    },
  },
  {
    id: "pump-operating-point",
    version: 1,
    title: "Pump operating point from pump and system curves",
    topics: { "pe-civil": "water-env" },
    reference: "Pumps: intersection of H = H₀ − aQ² and H = Hs + KQ²",
    generate(r) {
      for (;;) {
        const H0 = r.range(80, 250, 5);
        const a = r.range(0.5, 6, 0.1);
        const Hs = r.range(20, H0 - 30, 5);
        const K = r.range(0.5, 6, 0.1);
        const Q = Math.sqrt((H0 - Hs) / (a + K));
        if (Q < 1) continue;
        return {
          prompt: `A pump's head curve is H = ${H0} − ${n(a)}Q² and the system curve is H = ${Hs} + ${n(K)}Q² (H in ft, Q in cfs). At what flow does the pump operate?`,
          answer: Q,
          unit: "cfs",
          distractors: [
            Math.sqrt(H0 / (a + K)), // left out the static head
            Math.sqrt((H0 - Hs) / Math.abs(K - a)) > 0 && K !== a ? Math.sqrt((H0 - Hs) / Math.abs(K - a)) : NaN, // subtracted the coefficients
            (H0 - Hs) / (a + K), // forgot the square root
          ],
          solution: `Set ${H0} − ${n(a)}Q² = ${Hs} + ${n(K)}Q²\nQ² = (${H0} − ${Hs})/(${n(a)} + ${n(K)}) = ${f((H0 - Hs) / (a + K), 4)}\nQ = ${f(Q)} cfs (head ${f(Hs + K * Q * Q, 4)} ft)`,
        };
      }
    },
  },
  {
    id: "gumbel-flood-frequency",
    version: 1,
    title: "Design flood from annual peaks (Gumbel distribution)",
    topics: { "pe-civil": "water-env" },
    reference: "Hydrology: Gumbel frequency factor K = −(√6/π)[0.5772 + ln(ln(T/(T − 1)))]",
    generate(r) {
      const mean = r.range(500, 20000, 100);
      const sd = Math.round(mean * r.range(0.2, 0.6, 0.01) / 10) * 10;
      const T = r.pick([10, 25, 50, 100]);
      const K = -(Math.sqrt(6) / Math.PI) * (0.5772 + Math.log(Math.log(T / (T - 1))));
      const x = mean + K * sd;
      return {
        prompt: `Annual peak flows at a gauge have a mean of ${n(mean)} cfs and a standard deviation of ${n(sd)} cfs. Using the Gumbel distribution, xT = x̄ + Ks with K = −(√6/π)[0.5772 + ln(ln(T/(T − 1)))], what is the ${T}-year flood?`,
        answer: x,
        unit: "cfs",
        distractors: [
          mean + sd, // used K = 1
          mean - (Math.sqrt(6) / Math.PI) * (0.5772 + Math.log(Math.log(T))) * sd, // used ln(ln T) instead of ln(ln(T/(T − 1)))
          mean + (Math.sqrt(6) / Math.PI) * (0.5772 + Math.log(Math.log(T / (T - 1)))) * sd, // flipped the sign of K
        ],
        solution: `ln(T/(T − 1)) = ln(${T}/${T - 1}) = ${f(Math.log(T / (T - 1)), 4)}; ln of that = ${f(Math.log(Math.log(T / (T - 1))), 4)}\nK = −(√6/π)(0.5772 + ${f(Math.log(Math.log(T / (T - 1))), 4)}) = ${f(K, 4)}\nx${T} = ${n(mean)} + ${f(K, 4)} × ${n(sd)} = ${f(x)} cfs`,
      };
    },
  },
  {
    id: "signal-uniform-delay",
    version: 1,
    title: "Average uniform delay at a pretimed signal (D/D/1)",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic signals: deterministic queuing, d = r²/(2C(1 − v/s))",
    generate(r) {
      for (;;) {
        const C = r.range(60, 150, 5);
        const g = r.range(20, C - 20, 1);
        const red = C - g;
        const v = r.range(200, 900, 10);
        const s = 1800;
        if ((v * C) / (s * g) > 0.95) continue;
        const d = (red * red) / (2 * C * (1 - v / s));
        return {
          prompt: `A pretimed signal approach has a ${C} s cycle with ${g} s of effective green. Arrivals are uniform at ${v} veh/h/ln and the saturation flow is 1,800 veh/h/ln. Using deterministic (D/D/1) queuing, d = r²/[2C(1 − v/s)], what is the average delay per vehicle?`,
          answer: d,
          unit: "s/veh",
          distractors: [
            (red * red) / (2 * C), // left out the (1 − v/s) term
            red / 2, // took half the red time
            (red * red) / (2 * C * (1 - (v * C) / (s * g))), // used the v/c ratio instead of v/s
          ],
          solution: `Effective red r = ${C} − ${g} = ${red} s; v/s = ${v}/1,800 = ${f(v / s, 4)}\nd = ${red}²/[2 × ${C} × (1 − ${f(v / s, 4)})] = ${f(d)} s/veh`,
        };
      }
    },
  },
  {
    id: "learning-curve-unit-time",
    version: 1,
    title: "Unit time from a learning curve",
    topics: { "pe-civil": "construction" },
    reference: "Productivity: unit learning curve Tn = T₁n^b, b = log(rate)/log(2)",
    generate(r) {
      const T1 = r.range(20, 200, 1);
      const rate = r.pick([75, 80, 85, 90, 95]);
      const N = r.pick([4, 6, 8, 10, 12, 16, 20, 32]);
      const b = Math.log(rate / 100) / Math.log(2);
      const Tn = T1 * N ** b;
      return {
        prompt: `A crew takes ${T1} hours to form the first of a series of identical bridge piers and improves along a ${rate}% unit learning curve. How long should pier number ${N} take?`,
        answer: Tn,
        unit: "h",
        distractors: [
          T1 * (rate / 100) ** (N - 1), // applied the rate once per unit instead of per doubling
          T1 * (rate / 100) ** (N / 2), // applied the rate every second unit instead of per doubling
          T1 * (rate / 100), // applied a single reduction
        ],
        solution: `b = log(${rate / 100})/log 2 = ${f(b, 4)}\nT${N} = ${T1} × ${N}^${f(b, 4)} = ${f(Tn)} h`,
      };
    },
  },
  {
    id: "cost-index-capacity-scaling",
    version: 1,
    title: "Estimating a plant cost with a cost index and capacity scaling",
    topics: { "pe-civil": "construction", "fe-civil": "economics" },
    reference: "Cost estimating: cost indexes and the six-tenths rule",
    generate(r) {
      const C1 = r.range(1, 50, 0.5);
      const S1 = r.range(2, 20, 0.5);
      const S2 = r.range(S1 * 0.4, S1 * 3, 0.5);
      const I1 = r.range(8000, 11000, 10);
      const I2 = r.range(I1 * 1.05, I1 * 1.6, 10);
      const x = 0.6;
      const C2 = C1 * (S2 / S1) ** x * (I2 / I1);
      return {
        prompt: `A ${n(S1)} MGD treatment plant built when the cost index was ${n(I1)} cost $${n(C1)} million. Estimate the cost of a ${n(S2)} MGD plant today (index ${n(I2)}) using the six-tenths capacity exponent.`,
        answer: C2,
        unit: "$M",
        distractors: [
          C1 * (S2 / S1) * (I2 / I1), // scaled linearly with capacity
          C1 * (S2 / S1) ** x, // didn't escalate with the index
          C1 * (S2 / S1) ** x * (I1 / I2), // inverted the index ratio
        ],
        solution: `Capacity: (${n(S2)}/${n(S1)})^0.6 = ${f((S2 / S1) ** x, 4)}\nEscalation: ${n(I2)}/${n(I1)} = ${f(I2 / I1, 4)}\nCost = ${n(C1)} × ${f((S2 / S1) ** x, 4)} × ${f(I2 / I1, 4)} = $${f(C2)} million`,
      };
    },
  },
  {
    id: "crane-lift-percent-capacity",
    version: 1,
    title: "Percent of rated crane capacity for a lift",
    topics: { "pe-civil": "construction" },
    reference: "Lift planning: gross load includes rigging, hook block and jib deductions",
    generate(r) {
      const load = r.range(5, 60, 0.5);
      const rig = r.range(0.2, 2, 0.1);
      const hook = r.range(0.5, 3, 0.1);
      const jib = r.pick([0, 0, 1.5, 2.5]);
      const cap = r.range(load + 5, load * 2.5, 0.5);
      const gross = load + rig + hook + jib;
      const pct = (gross / cap) * 100;
      return {
        prompt: `A crane will lift a ${n(load)}-ton precast panel. The rigging weighs ${n(rig)} tons and the hook block ${n(hook)} tons${jib ? `, and the stowed jib requires a ${jib}-ton deduction` : ""}. The load chart capacity at the planned radius is ${n(cap)} tons. What percentage of chart capacity is the lift? (Many lift plans treat more than 75% as a critical lift.)`,
        answer: pct,
        unit: "%",
        distractors: [
          (load / cap) * 100, // used the panel weight only
          ((load + rig) / cap) * 100, // left out the hook block and deductions
          (cap / gross) * 100, // inverted the ratio
        ],
        solution: `Gross load = ${n(load)} + ${n(rig)} + ${n(hook)}${jib ? ` + ${jib}` : ""} = ${f(gross, 4)} tons\nPercent of capacity = ${f(gross, 4)}/${n(cap)} = ${f(pct)}%${pct > 75 ? " (critical lift)" : ""}`,
      };
    },
  },
  {
    id: "dynamic-compaction-depth",
    version: 1,
    title: "Depth of improvement from dynamic compaction",
    topics: { "pe-civil": "geotechnical" },
    reference: "Ground improvement: D = n√(WH), W in tonnes, H in m",
    generate(r) {
      const W = r.range(5, 30, 1);
      const H = r.range(10, 30, 1);
      const nn = r.range(0.3, 0.8, 0.05);
      const D = nn * Math.sqrt(W * H);
      return {
        prompt: `A dynamic compaction program drops a ${W}-tonne weight from ${H} m. For the site's soils, use an empirical coefficient n = ${n(nn)} in D = n√(WH) (W in tonnes, H in m). What is the estimated depth of improvement?`,
        answer: D,
        unit: "m",
        distractors: [
          Math.sqrt(W * H), // left out n
          nn * Math.sqrt(W * H * 3.281), // used the drop height in feet
          nn * Math.sqrt(W * 9.81 * H), // converted W to kN
        ],
        solution: `D = ${n(nn)}√(${W} × ${H}) = ${n(nn)} × ${f(Math.sqrt(W * H), 4)} = ${f(D)} m`,
      };
    },
  },
  {
    id: "mse-pullout-resistance",
    version: 1,
    title: "Pullout resistance of geogrid reinforcement behind the failure surface",
    topics: { "pe-civil": "geotechnical" },
    reference: "MSE walls: Pr = F*ασ'v Le C Rc (AASHTO)",
    generate(r) {
      const z = r.range(1, 8, 0.25);
      const gm = r.range(18, 21, 0.5);
      const Le = r.range(1, 5, 0.25);
      const Fs = r.range(0.4, 1.2, 0.05);
      const alpha = 0.8;
      const sv = gm * z;
      const Pr = Fs * alpha * sv * Le * 2 * 1.0;
      return {
        prompt: `A geogrid layer ${n(z)} m below the top of an MSE wall (fill γ = ${n(gm)} kN/m³, no surcharge) extends ${n(Le)} m beyond the potential failure surface. Using Pr = F*ασ'v Le C Rc with F* = ${n(Fs)}, α = 0.8, C = 2 (two faces) and full coverage Rc = 1.0, what is the pullout resistance per metre of wall?`,
        answer: Pr,
        unit: "kN/m",
        distractors: [
          Fs * alpha * sv * Le, // counted only one face (C = 1)
          Fs * sv * Le * 2, // left out α
          Fs * alpha * gm * Le * 2, // forgot to multiply γ by depth for σ'v
        ],
        solution: `σ'v = ${n(gm)} × ${n(z)} = ${f(sv, 4)} kPa\nPr = ${n(Fs)} × 0.8 × ${f(sv, 4)} × ${n(Le)} × 2 × 1.0 = ${f(Pr)} kN/m`,
      };
    },
  },
];
