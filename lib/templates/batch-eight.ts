import { f, n, type Template } from "./engine";

// Eighth batch: PE knowledge areas that the module pages (lib/content/pe-spec.ts) showed as thin.
// All problem text is original; formulas and factors are stated in the prompt. Each template has an
// independent solver in verify.ts.

export const BATCH_EIGHT: Template[] = [
  {
    id: "segment-crash-rate",
    version: 1,
    title: "Crash rate per 100 million vehicle-miles on a road segment",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic safety analysis: segment crash rates",
    generate(r) {
      const C = r.range(5, 80, 1);
      const N = r.range(1, 5, 1);
      const V = r.range(2000, 40000, 500);
      const L = r.range(0.5, 10, 0.1);
      const R = (C * 1e8) / (365 * N * V * L);
      return {
        prompt: `A ${n(L)}-mile highway segment with an ADT of ${n(V)} had ${C} crashes over ${N} year${N > 1 ? "s" : ""}. What is its crash rate per 100 million vehicle-miles traveled?`,
        answer: R,
        unit: "crashes/100M VMT",
        distractors: [
          (C * 1e6) / (365 * N * V * L), // used 10⁶ (per million VMT)
          (C * 1e8) / (365 * V * L), // forgot the number of years
          (C * 1e8) / (365 * N * V), // left out the segment length (intersection formula)
        ],
        solution: `R = (C × 10⁸)/(365 × N × ADT × L) = (${C} × 10⁸)/(365 × ${N} × ${n(V)} × ${n(L)}) = ${f(R)} crashes per 100 million VMT`,
      };
    },
  },
  {
    id: "aadt-design-hour-volume",
    version: 1,
    title: "Future directional design hourly volume",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic forecasts: growth, K factor and directional distribution",
    generate(r) {
      const A0 = r.range(5000, 60000, 500);
      const g = r.range(1, 5, 0.5);
      const yrs = r.pick([10, 15, 20, 25]);
      const K = r.range(0.08, 0.12, 0.005);
      const D = r.range(0.52, 0.65, 0.01);
      const An = A0 * (1 + g / 100) ** yrs;
      const DDHV = An * K * D;
      return {
        prompt: `A highway carries an AADT of ${n(A0)} today, growing ${n(g)}% per year (compounded). For the design year ${yrs} years out, use K = ${n(K)} and a peak-direction split D = ${n(D)}. What is the directional design hourly volume (DDHV)?`,
        answer: DDHV,
        unit: "veh/h",
        distractors: [
          A0 * K * D, // didn't grow the traffic
          An * K, // left out the directional split
          A0 * (1 + (g / 100) * yrs) * K * D, // used simple instead of compound growth
        ],
        solution: `Design-year AADT = ${n(A0)}(1 + ${g / 100})^${yrs} = ${f(An, 5)}\nDDHV = AADT × K × D = ${f(An, 5)} × ${n(K)} × ${n(D)} = ${f(DDHV)} veh/h`,
      };
    },
  },
  {
    id: "work-zone-taper-length",
    version: 1,
    title: "Work zone taper length (MUTCD)",
    topics: { "pe-civil": "transportation" },
    reference: "MUTCD Part 6: taper length criteria",
    generate(r) {
      const W = r.pick([10, 11, 12]);
      const S = r.pick([25, 30, 35, 40, 45, 50, 55, 60, 65, 70]);
      const kind = r.pick([
        { t: "merging", k: 1 },
        { t: "shifting", k: 0.5 },
        { t: "shoulder", k: 1 / 3 },
      ] as const);
      const L = S >= 45 ? W * S : (W * S * S) / 60;
      const T = kind.k * L;
      return {
        prompt: `A work zone on a road with a posted speed of ${S} mph needs a ${kind.t} taper to offset traffic by ${W} ft. Using the MUTCD criteria (L = WS for 45 mph or more, L = WS²/60 for 40 mph or less; merging taper at least L, shifting at least L/2, shoulder at least L/3), what is the minimum taper length?`,
        answer: T,
        unit: "ft",
        distractors: [
          kind.k * (S >= 45 ? (W * S * S) / 60 : W * S), // used the formula for the other speed range
          L === T ? L / 2 : L, // used the wrong taper fraction
          kind.k * W * S * 2, // doubled the length (used it as the total for both directions)
        ],
        solution: `${S} mph ${S >= 45 ? "≥ 45" : "≤ 40"}: L = ${S >= 45 ? `WS = ${W} × ${S}` : `WS²/60 = ${W} × ${S}²/60`} = ${f(L)} ft\nA ${kind.t} taper needs ${kind.k === 1 ? "at least L" : kind.k === 0.5 ? "at least L/2" : "at least L/3"} = ${f(T)} ft`,
      };
    },
  },
  {
    id: "triaxial-friction-angle",
    version: 1,
    title: "Friction angle of sand from a drained triaxial test",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Shear strength: Mohr-Coulomb failure for c = 0",
    generate(r) {
      for (;;) {
        const s3 = r.range(50, 300, 10);
        const dev = r.range(100, 900, 10);
        const s1 = s3 + dev;
        const phi = (Math.asin((s1 - s3) / (s1 + s3)) * 180) / Math.PI;
        if (phi < 25 || phi > 45) continue;
        return {
          prompt: `A consolidated-drained triaxial test on a clean sand (c' = 0) fails at a deviator stress of ${dev} kPa under a cell pressure of ${s3} kPa. What is the effective friction angle?`,
          answer: phi,
          unit: "°",
          distractors: [
            (Math.atan(dev / (s1 + s3)) * 180) / Math.PI, // used tan instead of sin
            (Math.asin(dev / s1) * 180) / Math.PI, // divided by σ₁ only
            (Math.asin(s3 / s1) * 180) / Math.PI, // used σ₃/σ₁
          ],
          solution: `σ₁ = σ₃ + Δσ = ${s3} + ${dev} = ${s1} kPa\nsin φ' = (σ₁ − σ₃)/(σ₁ + σ₃) = ${dev}/${s1 + s3} = ${f(dev / (s1 + s3), 4)}\nφ' = ${f(phi)}°`,
        };
      }
    },
  },
  {
    id: "sand-cone-relative-compaction",
    version: 1,
    title: "Relative compaction from a sand cone test",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Field density: sand cone method (ASTM D1556)",
    generate(r) {
      const Ms = r.range(1500, 3500, 10); // g of sand to fill the hole
      const rs = r.range(1.4, 1.6, 0.01); // g/cm³
      const V = Ms / rs;
      const rd = r.range(1.65, 2.05, 0.01);
      const w = r.range(6, 18, 0.5);
      const Mw = Math.round(rd * (1 + w / 100) * V);
      const rdf = Mw / (1 + w / 100) / V;
      const rmax = r.range(1.75, 2.15, 0.01);
      const RC = (rdf / rmax) * 100;
      return {
        prompt: `In a sand cone test, ${n(Ms)} g of calibrated sand (bulk density ${n(rs)} g/cm³) fills the test hole. The soil dug from the hole weighs ${n(Mw)} g moist, with a moisture content of ${n(w)}%. The laboratory maximum dry density is ${n(rmax)} g/cm³. What is the relative compaction?`,
        answer: RC,
        unit: "%",
        distractors: [
          ((Mw / V) / rmax) * 100, // used the moist density
          ((Mw * (1 - w / 100)) / V / rmax) * 100, // removed water as a share of moist mass
          (rmax / rdf) * 100, // inverted the ratio
        ],
        solution: `Hole volume = ${n(Ms)}/${n(rs)} = ${f(V, 5)} cm³\nDry mass = ${n(Mw)}/(1 + ${w / 100}) = ${f(Mw / (1 + w / 100), 5)} g; ρd = ${f(rdf, 4)} g/cm³\nRC = ${f(rdf, 4)}/${n(rmax)} = ${f(RC)}%`,
      };
    },
  },
  {
    id: "rqd-from-core-run",
    version: 1,
    title: "Rock quality designation from core pieces",
    topics: { "pe-civil": "geotechnical" },
    reference: "Rock characterization: RQD (pieces ≥ 4 in)",
    generate(r) {
      for (;;) {
        const run = r.pick([48, 60, 72, 120]);
        const pieces: number[] = [];
        let used = 0;
        while (used < run * 0.95) {
          const p = r.range(1, 14, 0.5);
          if (used + p > run) break;
          pieces.push(p);
          used += p;
        }
        const good = pieces.filter((p) => p >= 4).reduce((a, b) => a + b, 0);
        const rqd = (100 * good) / run;
        if (rqd < 20 || rqd > 90 || pieces.length < 5) continue;
        return {
          prompt: `A ${run} in rock core run recovers intact pieces of ${pieces.map((p) => n(p)).join(", ")} in. What is the RQD?`,
          answer: rqd,
          unit: "%",
          distractors: [
            (100 * used) / run, // gave the core recovery
            (100 * pieces.filter((p) => p > 4).reduce((a, b) => a + b, 0)) / run === rqd ? (100 * pieces.filter((p) => p >= 2).reduce((a, b) => a + b, 0)) / run : (100 * pieces.filter((p) => p > 4).reduce((a, b) => a + b, 0)) / run, // used the wrong length cutoff
            (100 * good) / used, // divided by the recovered length instead of the run
          ],
          solution: `Pieces 4 in or longer: ${pieces.filter((p) => p >= 4).map((p) => n(p)).join(" + ")} = ${n(good)} in\nRQD = ${n(good)}/${run} = ${f(rqd)}%`,
        };
      }
    },
  },
  {
    id: "flat-roof-snow-load",
    version: 1,
    title: "Flat roof snow load",
    topics: { "pe-civil": "structural" },
    reference: "ASCE 7-22 Chapter 7: pf = 0.7CeCtpg",
    generate(r) {
      const pg = r.range(15, 120, 5);
      const Ce = r.pick([0.8, 0.9, 1.0, 1.1, 1.2]);
      const Ct = r.pick([1.0, 1.1, 1.2, 1.3]);
      const pf = 0.7 * Ce * Ct * pg;
      return {
        prompt: `A heated building with a low-slope roof has a ground snow load pg = ${pg} psf (for its risk category). The exposure factor Ce = ${Ce.toFixed(1)} and the thermal factor Ct = ${Ct.toFixed(1)}. Using pf = 0.7CeCtpg and assuming the minimum roof snow load doesn't govern, what is the flat roof snow load?`,
        answer: pf,
        unit: "psf",
        distractors: [
          Ce * Ct * pg, // left out the 0.7
          (0.7 * pg) / (Ce * Ct), // divided by the factors
          0.7 * pg, // ignored Ce and Ct
        ],
        solution: `pf = 0.7CeCtpg = 0.7 × ${Ce.toFixed(1)} × ${Ct.toFixed(1)} × ${pg} = ${f(pf)} psf`,
      };
    },
  },
  {
    id: "rusle-soil-loss",
    version: 1,
    title: "Annual soil loss from a construction site (RUSLE)",
    topics: { "pe-civil": "water-env" },
    reference: "Erosion and sediment control: Revised Universal Soil Loss Equation",
    generate(r) {
      const R = r.range(50, 400, 10);
      const K = r.range(0.1, 0.5, 0.01);
      const LS = r.range(0.2, 5, 0.1);
      const C = r.pick([1.0, 0.45, 0.2, 0.05]);
      const P = r.pick([1.0, 0.8, 0.6, 0.5]);
      const ac = r.range(2, 40, 0.5);
      const A = R * K * LS * C * P;
      return {
        prompt: `A ${n(ac)}-acre graded site has rainfall erosivity R = ${R}, soil erodibility K = ${n(K)}, slope factor LS = ${n(LS)}, cover factor C = ${C} and practice factor P = ${P}. Using RUSLE (A = RKLSCP in tons/acre/year), what is the total annual soil loss from the site?`,
        answer: A * ac,
        unit: "tons/yr",
        distractors: [
          A, // gave the loss per acre, not for the whole site
          R * K * LS * C * ac, // left out the practice factor
          R * K * LS * P * ac, // left out the cover factor
        ],
        solution: `A = RKLSCP = ${R} × ${n(K)} × ${n(LS)} × ${C} × ${P} = ${f(A, 4)} tons/acre/yr\nSite total = ${f(A, 4)} × ${n(ac)} = ${f(A * ac)} tons/yr`,
      };
    },
  },
  {
    id: "maturity-nurse-saul",
    version: 1,
    title: "Concrete maturity index (Nurse-Saul)",
    topics: { "pe-civil": "construction" },
    reference: "ASTM C1074: temperature-time factor",
    generate(r) {
      const T0 = r.pick([-10, 0]);
      const k = r.range(4, 6, 1);
      const dt = r.pick([6, 12, 24]);
      const temps = Array.from({ length: k }, () => r.range(4, 30, 1));
      const M = temps.reduce((a, t) => a + (t - T0) * dt, 0);
      return {
        prompt: `Thermocouples in a slab record average concrete temperatures of ${temps.join(", ")} °C over consecutive ${dt}-hour intervals. Using the Nurse-Saul function with a datum temperature of ${T0} °C, what is the temperature-time factor at the end of the record?`,
        answer: M,
        unit: "°C·h",
        distractors: [
          temps.reduce((a, t) => a + t * dt, 0) === M ? temps.reduce((a, t) => a + (t + 10) * dt, 0) : temps.reduce((a, t) => a + t * dt, 0), // ignored the datum temperature (or used the other datum)
          temps.reduce((a, t) => a + (t - T0), 0), // left out the time interval
          temps.reduce((a, t) => a + (t - T0) * dt, 0) / 24, // reported °C·days
        ],
        solution: `M = Σ(T − T₀)Δt = ${temps.map((t) => `(${t} − (${T0}))(${dt})`).join(" + ")} = ${f(M, 5)} °C·h`,
      };
    },
  },
  {
    id: "grade-stake-cut",
    version: 1,
    title: "Cut at a grade stake from a level setup",
    topics: { "pe-civil": "construction", "fe-civil": "surveying" },
    reference: "Construction layout: differential leveling and design grades",
    generate(r) {
      for (;;) {
        const BM = r.range(400, 900, 0.01);
        const BS = r.range(3, 10, 0.01);
        const HI = BM + BS;
        const rod = r.range(1, 8, 0.01);
        const ground = HI - rod;
        const E0 = Number((ground - r.range(1, 6, 0.01) + r.range(-2, 2, 0.01)).toFixed(2));
        const g = r.range(-3, 3, 0.25);
        const x = r.range(50, 400, 25);
        const design = E0 + (g / 100) * x;
        const cut = ground - design;
        if (cut < 0.5) continue;
        return {
          prompt: `A level is set up and a backsight of ${BS.toFixed(2)} ft is taken on a benchmark at elevation ${BM.toFixed(2)} ft. The rod reading on the ground at a stake is ${rod.toFixed(2)} ft. The design subgrade starts at elevation ${E0.toFixed(2)} ft and runs at ${g > 0 ? "+" : ""}${n(g)}%; the stake is ${x} ft along it. How much cut is needed at the stake?`,
          answer: cut,
          unit: "ft",
          sig: 3,
          minGap: 0.005,
          distractors: [
            BM - rod - design, // forgot to add the backsight (HI = BM + BS)
            ground - (E0 - (g / 100) * x), // applied the grade with the wrong sign
            ground - E0, // ignored the grade along the alignment
          ],
          solution: `HI = ${BM.toFixed(2)} + ${BS.toFixed(2)} = ${HI.toFixed(2)} ft; ground = HI − rod = ${ground.toFixed(2)} ft\nDesign at the stake = ${E0.toFixed(2)} + (${g / 100})(${x}) = ${design.toFixed(2)} ft\nCut = ${ground.toFixed(2)} − ${design.toFixed(2)} = ${cut.toFixed(2)} ft`,
        };
      }
    },
  },
  {
    id: "pressure-pipe-wall-thickness",
    version: 1,
    title: "Required wall thickness of a pressure pipe (Barlow)",
    topics: { "pe-civil": "water-env" },
    reference: "Piping materials: hoop stress, t = PD/(2S)",
    generate(r) {
      const P = r.range(100, 400, 10);
      const D = r.pick([6, 8, 12, 16, 24, 30, 36, 48]);
      const S = r.range(12000, 30000, 1000);
      const ca = 0.0625;
      const t = (P * D) / (2 * S) + ca;
      return {
        prompt: `A ${D}-in (outside diameter) steel water main has a design pressure of ${P} psi, including surge. The allowable hoop stress is ${n(S)} psi. Using Barlow's formula t = PD/(2S) plus a corrosion allowance of 0.0625 in, what wall thickness is required?`,
        answer: t,
        unit: "in",
        distractors: [
          (P * D) / (2 * S), // left out the corrosion allowance
          (P * D) / S + ca, // left out the 2 (used the diameter as if it were the radius)
          (P * (D / 2)) / (2 * S) + ca, // used the radius in place of the diameter
        ],
        solution: `t = PD/(2S) = ${P} × ${D}/(2 × ${n(S)}) = ${f((P * D) / (2 * S), 4)} in\nPlus corrosion allowance: ${f((P * D) / (2 * S), 4)} + 0.0625 = ${f(t)} in`,
      };
    },
  },
];
