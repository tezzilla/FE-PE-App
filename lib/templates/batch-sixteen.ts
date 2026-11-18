import { f, n, type Template } from "./engine";

// Sixteenth batch. Formulas and factors are stated in the prompt. Each template has an independent
// solver in verify.ts.

export const BATCH_SIXTEEN: Template[] = [
  {
    id: "rc-beam-deflection-ie",
    version: 1,
    title: "Immediate deflection of a cracked concrete beam (effective I)",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318-19 Table 24.2.3.5: Ie = Icr/[1 − ((2/3)Mcr/Ma)²(1 − Icr/Ig)]",
    generate(r) {
      for (;;) {
        const b = r.range(12, 24, 2);
        const h = r.range(18, 36, 2);
        const fc = r.pick([4000, 5000]);
        const Ig = (b * h ** 3) / 12;
        const Icr = Math.round(Ig * r.range(0.25, 0.5, 0.01));
        const L = r.range(18, 36, 1);
        const w = r.range(0.8, 4, 0.1); // kip/ft service
        const Ec = (57000 * Math.sqrt(fc)) / 1000; // ksi
        const fr = (7.5 * Math.sqrt(fc)) / 1000; // ksi
        const Mcr = (fr * Ig) / (h / 2) / 12; // kip·ft
        const Ma = (w * L * L) / 8;
        if (Ma < 1.2 * Mcr) continue;
        const Ie = Icr / (1 - ((2 / 3) * Mcr / Ma) ** 2 * (1 - Icr / Ig));
        const d = (5 * (w / 12) * (L * 12) ** 4) / (384 * Ec * Ie);
        return {
          prompt: `A simply supported ${b} in × ${h} in normalweight concrete beam (f'c = ${n(fc)} psi) spans ${L} ft and carries a service load of ${n(w)} kip/ft. Its cracked moment of inertia is Icr = ${n(Icr)} in⁴. Using Ec = 57,000√f'c, fr = 7.5√f'c, Mcr = frIg/yt, Ie = Icr/[1 − ((2/3)Mcr/Ma)²(1 − Icr/Ig)] and Δ = 5wL⁴/(384EcIe), what is the immediate midspan deflection?`,
          answer: d,
          unit: "in",
          distractors: [
            (5 * (w / 12) * (L * 12) ** 4) / (384 * Ec * Ig), // used the gross moment of inertia
            (5 * (w / 12) * (L * 12) ** 4) / (384 * Ec * Icr), // used the cracked moment of inertia
            (5 * (w / 12) * (L * 12) ** 4) / (384 * Ec * (Icr / (1 - (Mcr / Ma) ** 2 * (1 - Icr / Ig)))), // left out the 2/3
          ],
          solution: `Ig = ${b}(${h})³/12 = ${f(Ig, 5)} in⁴; Ec = ${f(Ec, 4)} ksi; fr = ${f(fr * 1000, 4)} psi\nMcr = frIg/(h/2) = ${f(Mcr, 4)} kip·ft; Ma = wL²/8 = ${f(Ma, 4)} kip·ft\nIe = ${n(Icr)}/[1 − (${f((2 / 3) * Mcr / Ma, 4)})²(1 − ${f(Icr / Ig, 4)})] = ${f(Ie, 5)} in⁴\nΔ = 5(${f(w / 12, 4)})(${L * 12})⁴/(384 × ${f(Ec, 4)} × ${f(Ie, 5)}) = ${f(d)} in`,
        };
      }
    },
  },
  {
    id: "cantilever-stem-moment",
    version: 1,
    title: "Factored moment at the base of a cantilever retaining wall stem",
    topics: { "pe-civil": "structural" },
    reference: "Retaining walls: stem design moment with 1.6H",
    generate(r) {
      const h = r.range(2, 6, 0.25);
      const gm = r.range(17, 20, 0.5);
      const Ka = r.range(0.27, 0.36, 0.01);
      const q = r.range(0, 15, 5);
      const M = 1.6 * ((Ka * gm * h ** 3) / 6 + (Ka * q * h * h) / 2);
      return {
        prompt: `The stem of a cantilever retaining wall retains ${n(h)} m of backfill (γ = ${n(gm)} kN/m³, Ka = ${n(Ka)})${q ? ` with a ${q} kPa uniform surcharge` : ""}. Using a load factor of 1.6 on lateral earth pressure, what is the factored moment at the base of the stem per metre of wall?`,
        answer: M,
        unit: "kN·m/m",
        distractors: [
          (Ka * gm * h ** 3) / 6 + (Ka * q * h * h) / 2, // left out the load factor
          1.6 * ((Ka * gm * h ** 3) / 2 + (Ka * q * h * h) / 2), // used h/1 instead of h/3 for the triangular resultant
          1.6 * ((Ka * gm * h ** 3) / 6), // left out the surcharge
        ],
        solution: `Triangular soil pressure: resultant ½Kaγh² acting h/3 up → M = Kaγh³/6 = ${f((Ka * gm * h ** 3) / 6, 4)} kN·m/m\nSurcharge: Kaqh acting h/2 up → M = Kaqh²/2 = ${f((Ka * q * h * h) / 2, 4)} kN·m/m\nMu = 1.6 × ${f((Ka * gm * h ** 3) / 6 + (Ka * q * h * h) / 2, 4)} = ${f(M)} kN·m/m`,
      };
    },
  },
  {
    id: "linear-reservoir-routing",
    version: 1,
    title: "Routing through a linear reservoir (S = KO)",
    topics: { "pe-civil": "water-env" },
    reference: "Hydrology: storage routing, (I₁ + I₂)/2 − (O₁ + O₂)/2 = (S₂ − S₁)/Δt",
    generate(r) {
      const K = r.range(1, 8, 0.5); // h
      const dt = r.range(0.5, 2, 0.5);
      const I1 = r.range(50, 600, 10);
      const I2 = r.range(50, 600, 10);
      const O1 = r.range(20, 400, 10);
      const O2 = (I1 + I2 + (2 * K / dt - 1) * O1) / (2 * K / dt + 1);
      return {
        prompt: `A detention pond behaves as a linear reservoir, S = KO with K = ${n(K)} h. Over a ${n(dt)} h step, inflow goes from ${I1} to ${I2} cfs and the outflow at the start is ${O1} cfs. Using the continuity equation (I₁ + I₂)/2 − (O₁ + O₂)/2 = (S₂ − S₁)/Δt, what is the outflow at the end of the step?`,
        answer: O2,
        unit: "cfs",
        distractors: [
          (I1 + I2) / 2, // took outflow as the average inflow
          (I1 + I2 + (2 * K / dt + 1) * O1) / (2 * K / dt - 1) > 0 ? (I1 + I2 + (2 * K / dt + 1) * O1) / (2 * K / dt - 1) : NaN, // swapped the ± in the coefficients
          (I2 + (K / dt) * O1) / (K / dt + 1), // used a one-sided (Euler) step
        ],
        solution: `Substitute S = KO: (I₁ + I₂) + (2K/Δt − 1)O₁ = (2K/Δt + 1)O₂\n2K/Δt = ${f((2 * K) / dt, 4)}\nO₂ = [${I1} + ${I2} + ${f(2 * K / dt - 1, 4)}(${O1})]/${f(2 * K / dt + 1, 4)} = ${f(O2)} cfs`,
      };
    },
  },
  {
    id: "water-hammer-pressure",
    version: 1,
    title: "Pressure rise from rapid valve closure (Joukowsky)",
    topics: { "pe-civil": "water-env" },
    reference: "Closed conduits: water hammer, Δp = ρaΔV; critical time 2L/a",
    generate(r) {
      const a = r.range(800, 1400, 10);
      const V = r.range(0.5, 3, 0.1);
      const L = r.range(200, 3000, 50);
      const tc = r.range(0.1, (2 * L) / a * 0.9, 0.05);
      const dp = (1000 * a * V) / 1000; // kPa
      return {
        prompt: `Water flowing at ${n(V)} m/s in a ${n(L)} m pipeline is stopped by a valve that closes in ${n(tc)} s. The pressure wave speed is ${a} m/s. What is the maximum pressure rise? (ρ = 1,000 kg/m³)`,
        answer: dp,
        unit: "kPa",
        distractors: [
          (1000 * a * V) / 1000 / 9.81, // gave the head rise in m, labeled as kPa
          (1000 * a * V * ((2 * L) / a / (tc + (2 * L) / a))) / 1000, // reduced it as if closure were slow
          (1000 * a * V) / 2000, // halved it
        ],
        solution: `Critical time 2L/a = 2(${n(L)})/${a} = ${f((2 * L) / a, 4)} s; closure (${n(tc)} s) is faster, so the full Joukowsky rise applies\nΔp = ρaΔV = 1,000 × ${a} × ${n(V)} = ${f(dp * 1000, 5)} Pa = ${f(dp)} kPa (head rise ${f(dp / 9.81, 4)} m)`,
      };
    },
  },
  {
    id: "orifice-outlet-diameter",
    version: 1,
    title: "Orifice diameter for a detention pond outlet",
    topics: { "pe-civil": "water-env" },
    reference: "Stormwater: orifice equation Q = CdA√(2gh)",
    generate(r) {
      const Q = r.range(1, 40, 0.5);
      const h = r.range(2, 12, 0.5);
      const Cd = 0.6;
      const A = Q / (Cd * Math.sqrt(2 * 32.2 * h));
      const D = Math.sqrt((4 * A) / Math.PI) * 12;
      return {
        prompt: `A pond outlet must pass ${n(Q)} cfs when the water is ${n(h)} ft above the orifice center. With Cd = 0.6, what orifice diameter is needed?`,
        answer: D,
        unit: "in",
        distractors: [
          Math.sqrt((4 * (Q / Math.sqrt(2 * 32.2 * h))) / Math.PI) * 12, // left out Cd
          Math.sqrt((4 * (Q / (Cd * Math.sqrt(32.2 * h)))) / Math.PI) * 12, // used √(gh)
          Math.sqrt(A / Math.PI) * 12, // gave the radius
        ],
        solution: `A = Q/(Cd√(2gh)) = ${n(Q)}/(0.6√(2 × 32.2 × ${n(h)})) = ${f(A, 4)} ft²\nD = √(4A/π) = ${f(D / 12, 4)} ft = ${f(D)} in`,
      };
    },
  },
  {
    id: "gravity-model-trips",
    version: 1,
    title: "Trip distribution by the gravity model",
    topics: { "pe-civil": "transportation" },
    reference: "Transportation planning: Tij = Pi(AjFij)/Σ(AkFik)",
    generate(r) {
      const P = r.range(1000, 10000, 100);
      const A = [r.range(500, 6000, 100), r.range(500, 6000, 100), r.range(500, 6000, 100)];
      const F = [r.range(0.2, 2, 0.1), r.range(0.2, 2, 0.1), r.range(0.2, 2, 0.1)];
      const k = r.range(0, 2, 1);
      const sum = A.reduce((s, a, i) => s + a * F[i], 0);
      const T = (P * A[k] * F[k]) / sum;
      return {
        prompt: `Zone 1 produces ${n(P)} trips. Attractions and friction factors to the three destination zones are: zone A ${n(A[0])} attractions (F = ${n(F[0])}), zone B ${n(A[1])} (F = ${n(F[1])}), zone C ${n(A[2])} (F = ${n(F[2])}). Using the gravity model, how many trips go from zone 1 to zone ${"ABC"[k]}?`,
        answer: T,
        unit: "trips",
        distractors: [
          (P * A[k]) / A.reduce((s, a) => s + a, 0), // ignored the friction factors
          (P * F[k]) / F.reduce((s, x) => s + x, 0), // ignored the attractions
          P * (A[k] * F[k]) / (A[k] * F[k] + sum) , // double-counted the zone in the denominator
        ],
        solution: `Σ AF = ${A.map((a, i) => `${n(a)}(${n(F[i])})`).join(" + ")} = ${f(sum, 5)}\nT = ${n(P)} × ${n(A[k])}(${n(F[k])})/${f(sum, 5)} = ${f(T)} trips`,
      };
    },
  },
  {
    id: "crest-curve-available-ssd",
    version: 1,
    title: "Sight distance available on an existing crest vertical curve",
    topics: { "pe-civil": "transportation" },
    reference: "AASHTO crest curves: S = √(2,158L/A) when S < L",
    generate(r) {
      for (;;) {
        const A = r.range(3, 10, 0.5);
        const L = r.range(400, 1600, 50);
        const S = Math.sqrt((2158 * L) / A);
        if (S >= L) continue;
        return {
          prompt: `An existing crest vertical curve is ${n(L)} ft long with an algebraic grade difference of ${n(A)}%. Using AASHTO criteria (eye 3.5 ft, object 2.0 ft), what stopping sight distance does it provide?`,
          answer: S,
          unit: "ft",
          distractors: [
            (L + 2158 / A) / 2, // used the S > L form
            Math.sqrt((1329 * L) / A), // used the passing-sight constant
            L, // assumed the sight distance equals the curve length
          ],
          solution: `For S < L: L = AS²/2,158, so S = √(2,158L/A) = √(2,158 × ${n(L)}/${n(A)}) = ${f(S)} ft (< L, so the form applies)`,
        };
      }
    },
  },
  {
    id: "skid-mark-speed",
    version: 1,
    title: "Initial speed from skid mark length",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Crash reconstruction: d = V²/[30(f ± G)]",
    generate(r) {
      const d = r.range(40, 300, 5);
      const fr = r.range(0.4, 0.75, 0.05);
      const G = r.range(-5, 5, 1);
      const V = Math.sqrt(30 * d * (fr + G / 100));
      return {
        prompt: `A vehicle left skid marks ${d} ft long before stopping on a ${G > 0 ? "+" : ""}${G}% grade (positive is uphill). The coefficient of friction is ${n(fr)}. Using d = V²/[30(f + G)], what was its speed when the skid began?`,
        answer: V,
        unit: "mph",
        distractors: [
          Math.sqrt(30 * d * fr), // ignored the grade
          Math.sqrt(30 * d * (fr - G / 100)), // used the grade with the wrong sign
          Math.sqrt(15 * d * (fr + G / 100)), // used 15 instead of 30
        ],
        solution: `V = √[30d(f + G)] = √[30 × ${d} × (${n(fr)} + ${G / 100})] = ${f(V)} mph`,
      };
    },
  },
  {
    id: "form-tie-spacing",
    version: 1,
    title: "Maximum square spacing of form ties",
    topics: { "pe-civil": "construction" },
    reference: "Formwork: tie load = lateral pressure × tributary area",
    generate(r) {
      const p = r.range(400, 1500, 50); // psf
      const T = r.pick([2250, 3000, 3750, 4500, 6000]);
      const A = T / p;
      const s = Math.sqrt(A) * 12;
      return {
        prompt: `Wall forms are designed for a lateral concrete pressure of ${p} psf. Each form tie has a safe working load of ${n(T)} lb. If the ties are placed on a square grid, what is the maximum tie spacing?`,
        answer: s,
        unit: "in",
        distractors: [
          A * 12, // took the tributary area as a length
          Math.sqrt(T / (p / 2)) * 12, // used half the pressure
          Math.sqrt(A / 2) * 12, // split each tie's load between two ties
        ],
        solution: `Tributary area per tie = ${n(T)}/${p} = ${f(A, 4)} ft²\nSquare spacing = √${f(A, 4)} = ${f(Math.sqrt(A), 4)} ft = ${f(s)} in`,
      };
    },
  },
  {
    id: "cost-plus-incentive-fee",
    version: 1,
    title: "Contractor fee under a cost-plus-incentive-fee contract",
    topics: { "pe-civil": "construction" },
    reference: "Contracts: incentive fee = target fee + share × (target cost − actual cost)",
    generate(r) {
      for (;;) {
      const TC = r.range(2, 40, 0.5) * 1e6;
      const TF = Math.round(TC * r.range(0.04, 0.1, 0.005) / 1000) * 1000;
      const share = r.pick([20, 25, 30, 40, 50]);
      const AC = Math.round(TC * r.range(0.85, 1.15, 0.01) / 1000) * 1000;
      const fee = TF + (share / 100) * (TC - AC);
      if (fee <= 0) continue;
      return {
        prompt: `A cost-plus-incentive-fee contract has a target cost of $${n(TC)} and a target fee of $${n(TF)}. The contractor's share of any underrun or overrun is ${share}%. The actual cost is $${n(AC)}. What fee does the contractor earn?`,
        answer: fee,
        unit: "$",
        distractors: [
          TF, // ignored the incentive
          TF + ((100 - share) / 100) * (TC - AC), // used the owner's share
          TF - (share / 100) * (TC - AC) > 0 ? TF - (share / 100) * (TC - AC) : NaN, // applied the incentive with the wrong sign
        ],
        solution: `${AC < TC ? "Underrun" : "Overrun"} = ${n(TC)} − ${n(AC)} = $${n(TC - AC)}\nFee = ${n(TF)} + ${share / 100} × ${n(TC - AC)} = $${n(Math.round(fee))}`,
      };
      }
    },
  },
  {
    id: "braced-cut-clay-peck",
    version: 1,
    title: "Strut load in a braced cut in soft to medium clay (Peck)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Braced excavations: σa = γH − 4cu ≥ 0.3γH for γH/cu > 4",
    generate(r) {
      for (;;) {
        const H = r.range(6, 14, 0.5);
        const gm = r.range(17, 19, 0.5);
        const cu = r.range(15, 45, 1);
        if ((gm * H) / cu <= 4) continue;
        const sa = Math.max(gm * H - 4 * cu, 0.3 * gm * H);
        const sv = r.range(2, 3, 0.25);
        const sh = r.range(2, 5, 0.5);
        const P = sa * sv * sh;
        return {
          prompt: `A ${n(H)} m deep braced cut is made in soft to medium clay (γ = ${n(gm)} kN/m³, cu = ${cu} kPa). Using Peck's apparent pressure for this clay, σa = γH − 4cu but not less than 0.3γH, what is the load in a strut in the lower (full-pressure) zone that carries a tributary height of ${n(sv)} m and is spaced ${n(sh)} m horizontally?`,
          answer: P,
          unit: "kN",
          distractors: [
            gm * H * sv * sh, // used γH with no cohesion reduction
            0.3 * gm * H * sv * sh === P ? (gm * H - 4 * cu) * sv * sh : 0.3 * gm * H * sv * sh, // used the wrong branch of the max
            (gm * H - 2 * cu) * sv * sh, // used 2cu
          ],
          solution: `γH/cu = ${f((gm * H) / cu, 4)} > 4 → soft to medium clay\nγH − 4cu = ${f(gm * H - 4 * cu, 4)} kPa; 0.3γH = ${f(0.3 * gm * H, 4)} kPa → σa = ${f(sa, 4)} kPa\nP = ${f(sa, 4)} × ${n(sv)} × ${n(sh)} = ${f(P)} kN`,
        };
      }
    },
  },
  {
    id: "pile-group-settlement",
    version: 1,
    title: "Consolidation settlement of a pile group (equivalent footing)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Deep foundations: equivalent footing at 2L/3 depth, 2:1 spread",
    generate(r) {
      const Bg = r.range(2, 5, 0.25);
      const Lg = r.range(Bg, 7, 0.25);
      const Q = r.range(1500, 8000, 100);
      const z = r.range(2, 8, 0.5); // from equivalent footing to clay mid-layer
      const Hc = r.range(2, 8, 0.5);
      const Cc = r.range(0.2, 0.5, 0.01);
      const e0 = r.range(0.7, 1.3, 0.05);
      const s0 = r.range(80, 250, 5);
      const ds = Q / ((Bg + z) * (Lg + z));
      const S = ((Cc * Hc) / (1 + e0)) * Math.log10((s0 + ds) / s0) * 1000;
      return {
        prompt: `A pile group with plan dimensions ${n(Bg)} m × ${n(Lg)} m carries ${n(Q)} kN. Treat the load as an equivalent footing at two-thirds of the pile length, spreading at 2V:1H. A normally consolidated clay layer ${n(Hc)} m thick (Cc = ${n(Cc)}, e₀ = ${n(e0)}) has its mid-depth ${n(z)} m below the equivalent footing, where σ'₀ = ${s0} kPa. What is the consolidation settlement of the clay?`,
        answer: S,
        unit: "mm",
        distractors: [
          ((Cc * Hc) / (1 + e0)) * Math.log10((s0 + Q / (Bg * Lg)) / s0) * 1000, // didn't spread the load with depth
          (Cc * Hc) * Math.log10((s0 + ds) / s0) * 1000, // left out (1 + e₀)
          ((Cc * Hc) / (1 + e0)) * Math.log10((s0 + Q / ((Bg + 2 * z) * (Lg + 2 * z))) / s0) * 1000, // spread at 1:1 on each side
        ],
        solution: `Δσ = Q/[(Bg + z)(Lg + z)] = ${n(Q)}/[(${f(Bg + z, 4)})(${f(Lg + z, 4)})] = ${f(ds, 4)} kPa\nS = [${n(Cc)} × ${n(Hc)}/${f(1 + e0, 4)}] log[(${s0} + ${f(ds, 4)})/${s0}] = ${f(S / 1000, 4)} m = ${f(S)} mm`,
      };
    },
  },
];
