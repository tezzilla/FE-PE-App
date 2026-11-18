import { f, n, type Template } from "./engine";

// Twelfth batch from docs/EXAM-COVERAGE.md. Formulas and factors are stated in the prompt. Each
// template has an independent solver in verify.ts.

export const BATCH_TWELVE: Template[] = [
  {
    id: "shear-wall-uplift",
    version: 1,
    title: "Hold-down uplift at the end of a shear wall (ASD)",
    topics: { "pe-civil": "structural" },
    reference: "Lateral systems: overturning with 0.6D resisting",
    generate(r) {
      for (;;) {
        const L = r.range(10, 30, 1);
        const h = r.range(8, 30, 1);
        const V = r.range(5, 60, 1);
        const W = r.range(10, 150, 5);
        const T = (V * h - 0.6 * W * (L / 2)) / L;
        if (T < 1) continue;
        return {
          prompt: `A ${L} ft long shear wall carries an ASD lateral force of ${V} kips applied ${h} ft above its base. The dead load on the wall is ${W} kips, acting at its center. Using the ASD combination with 0.6D resisting overturning and hold-downs at the wall ends (moment arm L), what uplift must each hold-down resist?`,
          answer: T,
          unit: "kips",
          distractors: [
            (V * h - W * (L / 2)) / L > 0 ? (V * h - W * (L / 2)) / L : NaN, // used the full dead load (no 0.6)
            (V * h) / L, // ignored the dead load
            (V * h - 0.6 * W * (L / 2)) / (L / 2), // used L/2 as the moment arm
          ],
          solution: `Overturning moment = Vh = ${V} × ${h} = ${n(V * h)} kip·ft\nResisting moment = 0.6 × ${W} × ${L}/2 = ${f(0.6 * W * (L / 2), 4)} kip·ft\nT = (${n(V * h)} − ${f(0.6 * W * (L / 2), 4)})/${L} = ${f(T)} kips`,
        };
      }
    },
  },
  {
    id: "base-plate-bearing",
    version: 1,
    title: "Design bearing strength of concrete under a column base plate",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section J8: φcPp = 0.65 × 0.85f'cA₁√(A₂/A₁), with √(A₂/A₁) ≤ 2",
    generate(r) {
      const B = r.range(12, 24, 1);
      const N = r.range(B, 26, 1);
      const B2 = r.range(B, B * 2.5, 1);
      const N2 = Math.round((B2 * N) / B);
      const fc = r.pick([3, 4, 5]);
      const A1 = B * N;
      const A2 = B2 * N2;
      const k = Math.min(Math.sqrt(A2 / A1), 2);
      const P = 0.65 * 0.85 * fc * A1 * k;
      return {
        prompt: `A ${B} in × ${N} in column base plate sits concentrically on a ${B2} in × ${N2} in concrete pier (geometrically similar, f'c = ${fc} ksi). Using AISC φcPp = 0.65 × 0.85f'cA₁√(A₂/A₁), with √(A₂/A₁) not more than 2, what is the design bearing strength?`,
        answer: P,
        unit: "kips",
        distractors: [
          0.65 * 0.85 * fc * A1, // left out the confinement factor √(A₂/A₁)
          0.85 * fc * A1 * k, // forgot φ = 0.65
          Math.sqrt(A2 / A1) > 2 ? 0.65 * 0.85 * fc * A1 * Math.sqrt(A2 / A1) : 0.65 * 0.85 * fc * A1 * (A2 / A1), // didn't cap at 2, or forgot the square root
        ],
        solution: `A₁ = ${B} × ${N} = ${A1} in²; A₂ = ${B2} × ${N2} = ${A2} in²\n√(A₂/A₁) = ${f(Math.sqrt(A2 / A1), 4)}${Math.sqrt(A2 / A1) > 2 ? " → capped at 2" : ""}\nφcPp = 0.65 × 0.85 × ${fc} × ${A1} × ${f(k, 4)} = ${f(P)} kips`,
      };
    },
  },
  {
    id: "development-length-tension",
    version: 1,
    title: "Tension development length of a deformed bar (simplified ACI)",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Table 25.4.2.3: ℓd = fyψtψe db/(20λ√f'c) for #7 and larger, /25 for #6 and smaller",
    generate(r) {
      const bar = r.pick([4, 5, 6, 7, 8, 9, 10, 11]);
      const db = bar === 9 ? 1.128 : bar === 10 ? 1.27 : bar === 11 ? 1.41 : bar / 8;
      const fc = r.pick([3000, 4000, 5000, 6000]);
      const top = r.next() < 0.5;
      const epoxy = r.next() < 0.4;
      const pt = top ? 1.3 : 1.0;
      const pe = epoxy ? 1.5 : 1.0;
      const prod = Math.min(pt * pe, 1.7);
      const div = bar >= 7 ? 20 : 25;
      const ld = Math.max((60000 * prod * db) / (div * Math.sqrt(fc)), 12);
      return {
        prompt: `A #${bar} Grade 60 bar (db = ${db} in) in normalweight concrete with f'c = ${n(fc)} psi is ${top ? "a top bar (more than 12 in of fresh concrete below it)" : "not a top bar"} and ${epoxy ? "epoxy-coated with cover less than 3db" : "uncoated"}. Clear spacing and cover meet the code minimums with stirrups. Using ℓd = fyψtψe db/(20λ√f'c) for #7 and larger bars or /25 for #6 and smaller, with ψtψe ≤ 1.7 and ℓd ≥ 12 in, what is the tension development length?`,
        answer: ld,
        unit: "in",
        distractors: [
          Math.max((60000 * prod * db) / ((bar >= 7 ? 25 : 20) * Math.sqrt(fc)), 12), // used the divisor for the other bar size range
          Math.max((60000 * db) / (div * Math.sqrt(fc)), 12), // left out ψt and ψe
          pt * pe > 1.7 ? Math.max((60000 * pt * pe * db) / (div * Math.sqrt(fc)), 12) : NaN, // didn't cap ψtψe at 1.7
          (60000 * prod * db) / (div * Math.sqrt(fc)) < 12 ? (60000 * prod * db) / (div * Math.sqrt(fc)) : NaN, // ignored the 12 in minimum
        ],
        solution: `ψt = ${pt}, ψe = ${pe}; ψtψe = ${f(pt * pe, 3)}${pt * pe > 1.7 ? " → capped at 1.7" : ""}\nℓd = 60,000 × ${f(prod, 3)} × ${db}/(${div} × 1.0 × √${n(fc)}) = ${f((60000 * prod * db) / (div * Math.sqrt(fc)), 4)} in${(60000 * prod * db) / (div * Math.sqrt(fc)) < 12 ? " → 12 in minimum" : ""}`,
      };
    },
  },
  {
    id: "web-local-yielding",
    version: 1,
    title: "Web local yielding under an interior concentrated load",
    topics: { "pe-civil": "structural" },
    reference: "AISC 360 Section J10.2: φRn = 1.0Fytw(5k + ℓb) away from the member end",
    generate(r) {
      const tw = r.range(0.3, 0.75, 0.01);
      const k = r.range(0.8, 1.6, 0.01);
      const lb = r.range(4, 12, 0.5);
      const Rn = 50 * tw * (5 * k + lb);
      return {
        prompt: `A W-shape beam (Fy = 50 ksi, tw = ${n(tw)} in, k = ${n(k)} in) carries a concentrated load from a column bearing on its top flange well away from the beam ends. The bearing length is ${n(lb)} in. Using φRn = 1.0 × Fy tw(5k + ℓb), what is the design strength for web local yielding?`,
        answer: Rn,
        unit: "kips",
        distractors: [
          50 * tw * (2.5 * k + lb), // used the end-of-member expression (2.5k)
          0.9 * Rn, // used φ = 0.90
          50 * tw * 5 * k, // left out the bearing length
        ],
        solution: `φRn = 1.0 × 50 × ${n(tw)} × (5 × ${n(k)} + ${n(lb)}) = 50 × ${n(tw)} × ${f(5 * k + lb, 4)} = ${f(Rn)} kips`,
      };
    },
  },
  {
    id: "filter-backwash-percent",
    version: 1,
    title: "Backwash water as a percentage of filter production",
    topics: { "pe-civil": "water-env" },
    reference: "Drinking water treatment: filter run and backwash volumes",
    generate(r) {
      const fr = r.range(5, 15, 0.5);
      const run = r.range(24, 72, 4);
      const bw = r.range(30, 60, 5);
      const tb = r.range(8, 15, 1);
      const pct = ((bw * (tb / 60)) / (fr * run)) * 100;
      return {
        prompt: `A rapid filter runs ${run} hours at ${n(fr)} m/h, then is backwashed at ${bw} m/h for ${tb} minutes. What percentage of the water it filters is used for backwashing?`,
        answer: pct,
        unit: "%",
        distractors: [
          ((bw * tb) / (fr * run)) * 100, // left the backwash time in minutes
          ((fr * run) / (bw * (tb / 60))) , // inverted the ratio (not a percentage)
          ((bw * (tb / 60)) / (fr * run - bw * (tb / 60))) * 100, // divided by net production instead of total filtered
        ],
        solution: `Per m² of filter: filtered = ${n(fr)} m/h × ${run} h = ${f(fr * run, 4)} m³; backwash = ${bw} m/h × ${tb}/60 h = ${f((bw * tb) / 60, 4)} m³\nBackwash share = ${f((bw * tb) / 60, 4)}/${f(fr * run, 4)} = ${f(pct)}%`,
      };
    },
  },
  {
    id: "ion-exchange-run-volume",
    version: 1,
    title: "Water treated per run by an ion exchange softener",
    topics: { "pe-civil": "water-env" },
    reference: "Ion exchange: resin capacity in equivalents vs. hardness in meq/L",
    generate(r) {
      const V = r.range(1, 10, 0.5);
      const cap = r.range(1, 2, 0.1);
      const H = r.range(150, 400, 10);
      const eq = V * 1000 * cap;
      const vol = eq / (H / 50);
      return {
        prompt: `A softener holds ${n(V)} m³ of cation exchange resin with an operating capacity of ${n(cap)} eq/L. The raw water hardness is ${H} mg/L as CaCO₃, and all of it is removed. How much water can be treated before regeneration?`,
        answer: vol,
        unit: "m³",
        distractors: [
          eq / (H / 100), // used the molecular weight 100 instead of the equivalent weight 50
          (V * cap) / (H / 50), // forgot to convert resin m³ to L
          eq / H, // divided by mg/L without converting to meq/L
        ],
        solution: `Resin capacity = ${n(V)} m³ × 1,000 L/m³ × ${n(cap)} eq/L = ${f(eq, 5)} eq\nHardness = ${H}/50 = ${f(H / 50, 4)} meq/L = ${f(H / 50, 4)} eq/m³\nVolume = ${f(eq, 5)}/${f(H / 50, 4)} = ${f(vol)} m³`,
      };
    },
  },
  {
    id: "landfill-leachate-balance",
    version: 1,
    title: "Annual leachate volume from a landfill water balance",
    topics: { "pe-civil": "water-env" },
    reference: "Solid waste: cover water balance, percolation = P − R − ET − ΔS",
    generate(r) {
      for (;;) {
        const P = r.range(600, 1500, 10);
        const R = r.range(50, 300, 5);
        const ET = r.range(300, 800, 10);
        const dS = r.range(-30, 60, 5);
        const perc = P - R - ET - dS;
        if (perc < 30) continue;
        const A = r.range(2, 40, 0.5);
        const vol = (perc / 1000) * A * 10000;
        return {
          prompt: `A ${n(A)} ha landfill cell receives ${P} mm/yr of precipitation. Annual runoff is ${R} mm, evapotranspiration is ${ET} mm, and the cover's soil moisture storage changes by ${dS > 0 ? "+" : ""}${dS} mm over the year. How much water percolates into the waste each year?`,
          answer: vol,
          unit: "m³/yr",
          distractors: [
            ((P - R - dS) / 1000) * A * 10000, // left out evapotranspiration
            ((P - R - ET + dS) / 1000) * A * 10000, // added the storage change instead of subtracting it
            (perc / 1000) * A * 1000, // used 1,000 m² per hectare
          ],
          solution: `Percolation = P − R − ET − ΔS = ${P} − ${R} − ${ET} − (${dS}) = ${perc} mm/yr\nVolume = ${perc}/1,000 m × ${n(A)} ha × 10,000 m²/ha = ${f(vol)} m³/yr`,
        };
      }
    },
  },
  {
    id: "trickling-filter-organic-loading",
    version: 1,
    title: "Organic loading rate on a trickling filter",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater treatment: attached growth loading rates",
    generate(r) {
      const Q = r.range(2000, 20000, 500);
      const BOD = r.range(80, 200, 5);
      const D = r.range(15, 40, 1);
      const H = r.range(1.5, 6, 0.5);
      const Vf = ((Math.PI * D * D) / 4) * H;
      const OLR = ((Q * BOD) / 1000) / Vf;
      return {
        prompt: `A trickling filter ${D} m in diameter with ${n(H)} m of media treats ${n(Q)} m³/d of primary effluent with a BOD₅ of ${BOD} mg/L (recirculation doesn't add BOD load). What is the organic loading rate?`,
        answer: OLR,
        unit: "kg BOD/m³·d",
        distractors: [
          ((Q * BOD) / 1000) / ((Math.PI * D * D) / 4), // divided by area instead of volume
          (Q * BOD) / Vf, // forgot to convert g to kg
          ((Q * BOD) / 1000) / (Math.PI * D * D * H), // used πD² instead of πD²/4
        ],
        solution: `BOD load = ${n(Q)} m³/d × ${BOD} g/m³ = ${f((Q * BOD) / 1000, 5)} kg/d\nMedia volume = π(${D})²/4 × ${n(H)} = ${f(Vf, 5)} m³\nOLR = ${f((Q * BOD) / 1000, 5)}/${f(Vf, 5)} = ${f(OLR)} kg BOD/m³·d`,
      };
    },
  },
  {
    id: "epdo-crash-index",
    version: 1,
    title: "Equivalent property damage only (EPDO) crash index",
    topics: { "pe-civil": "transportation" },
    reference: "Highway safety: EPDO weighting of crash severity",
    generate(r) {
      const F = r.range(0, 3, 1);
      const I = r.range(2, 30, 1);
      const PDO = r.range(10, 80, 1);
      const wF = r.pick([12, 542]);
      const wI = wF === 12 ? 3 : r.pick([11, 13]);
      const E = F * wF + I * wI + PDO;
      return {
        prompt: `Over 3 years, an intersection had ${F} fatal, ${I} injury and ${PDO} property-damage-only crashes. Using EPDO weights of ${wF} for fatal and ${wI} for injury crashes (PDO = 1), what is the EPDO index?`,
        answer: E,
        unit: "",
        sig: 4,
        distractors: [
          F + I + PDO, // added the crashes without weights
          F * wF + I * wI, // left out the PDO crashes
          (F * wF + I * wI + PDO) / 3, // divided by the number of years (the question asks for the total)
        ],
        solution: `EPDO = ${F}(${wF}) + ${I}(${wI}) + ${PDO}(1) = ${F * wF} + ${I * wI} + ${PDO} = ${E}`,
      };
    },
  },
  {
    id: "concrete-pump-time",
    version: 1,
    title: "Placement time for a pumped concrete pour",
    topics: { "pe-civil": "construction" },
    reference: "Construction operations: equipment production with efficiency",
    generate(r) {
      const V = r.range(100, 1500, 10);
      const rate = r.range(60, 150, 5);
      const E = r.range(50, 80, 5);
      const truck = r.pick([8, 9, 10]);
      const t = V / (rate * (E / 100));
      return {
        prompt: `A mat foundation needs ${n(V)} yd³ of concrete placed by one boom pump rated at ${rate} yd³/h. Truck changeovers, moves and cleanouts limit the pump to ${E}% of its rated output on average. Trucks carry ${truck} yd³. How many hours will the placement take?`,
        answer: t,
        unit: "h",
        distractors: [
          V / rate, // used the rated output (100% efficiency)
          (V / rate) * (E / 100), // multiplied by the efficiency instead of dividing
          V / truck / (rate / truck), // ignored the efficiency (counted truckloads)
        ],
        solution: `Effective output = ${rate} × ${E / 100} = ${f(rate * (E / 100), 4)} yd³/h\nTime = ${n(V)}/${f(rate * (E / 100), 4)} = ${f(t)} h (${Math.ceil(V / truck)} truckloads)`,
      };
    },
  },
  {
    id: "rock-socket-side-resistance",
    version: 1,
    title: "Side resistance of a drilled shaft socketed in rock",
    topics: { "pe-civil": "geotechnical" },
    reference: "AASHTO LRFD 10.8.3.5.4b: qs = 0.65αE pa(qu/pa)^0.5",
    generate(r) {
      const qu = r.range(100, 1500, 10); // ksf
      const aE = r.range(0.6, 1.0, 0.05);
      const D = r.range(3, 8, 0.5);
      const L = r.range(5, 30, 1);
      const pa = 2.12;
      const qs = 0.65 * aE * pa * Math.sqrt(qu / pa);
      const Qs = qs * Math.PI * D * L;
      return {
        prompt: `A ${n(D)} ft diameter drilled shaft has a ${L} ft socket in rock with an unconfined compressive strength of ${qu} ksf. The joint reduction factor αE is ${n(aE)}. Using qs = 0.65αE pa(qu/pa)^0.5 with pa = 2.12 ksf (concrete strength doesn't govern), what is the nominal side resistance of the socket?`,
        answer: Qs,
        unit: "kips",
        distractors: [
          0.65 * pa * Math.sqrt(qu / pa) * Math.PI * D * L, // left out αE
          aE * pa * Math.sqrt(qu / pa) * Math.PI * D * L, // left out the 0.65
          qs * 2 * Math.PI * D * L, // used 2πD (treated the diameter as a radius) for the perimeter
        ],
        solution: `qs = 0.65 × ${n(aE)} × 2.12 × √(${qu}/2.12) = ${f(qs, 4)} ksf\nQs = qs × πD × L = ${f(qs, 4)} × π(${n(D)}) × ${L} = ${f(Qs)} kips`,
      };
    },
  },
];
