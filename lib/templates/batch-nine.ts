import { f, n, type Template } from "./engine";

// Ninth batch: the thinnest PE knowledge areas on the module pages (earthquake, seepage, earth
// structures, deep foundations, construction loads, intersections, groundwater, water quality, load
// effects, dewatering, project economics). Formulas are stated in the prompt. Each template has an
// independent solver in verify.ts.

const gw = 9.81;
const rad = (x: number) => (x * Math.PI) / 180;

export const BATCH_NINE: Template[] = [
  {
    id: "liquefaction-factor-of-safety",
    version: 1,
    title: "Factor of safety against liquefaction",
    topics: { "pe-civil": "geotechnical" },
    reference: "Seismic analysis: simplified procedure, FS = CRR₇.₅ × MSF/CSR",
    generate(r) {
      const z = r.range(3, 9, 0.5);
      const dw = r.range(0.5, z - 1, 0.5);
      const gm = r.range(17, 19, 0.5);
      const gs = r.range(19, 21, 0.5);
      const a = r.range(0.15, 0.45, 0.01);
      const M = r.pick([6, 6.5, 7, 7.5, 8]);
      const CRR = r.range(0.1, 0.4, 0.01);
      const sv = gm * dw + gs * (z - dw);
      const se = sv - gw * (z - dw);
      const rd = 1 - 0.00765 * z;
      const CSR = 0.65 * a * (sv / se) * rd;
      const MSF = 10 ** 2.24 / M ** 2.56;
      const FS = (CRR * MSF) / CSR;
      return {
        prompt: `A saturated sand at ${n(z)} m depth (water table ${n(dw)} m deep; γ = ${n(gm)} kN/m³ above it and ${n(gs)} kN/m³ below) has CRR₇.₅ = ${n(CRR)} from SPT correlations. The design earthquake has magnitude ${M} and amax = ${n(a)}g. Using CSR = 0.65(amax/g)(σv/σ'v)rd with rd = 1 − 0.00765z, and MSF = 10^2.24/M^2.56, what is the factor of safety against liquefaction?`,
        answer: FS,
        unit: "",
        distractors: [
          CRR / CSR, // left out the magnitude scaling factor
          (CRR / MSF) / CSR, // divided by MSF instead of multiplying
          (CRR * MSF) / (0.65 * a * (sv / se)), // left rd out of CSR
        ],
        solution: `σv = ${f(sv, 4)} kPa; σ'v = ${f(se, 4)} kPa; rd = ${f(rd, 4)}\nCSR = 0.65(${n(a)})(${f(sv / se, 4)})(${f(rd, 4)}) = ${f(CSR, 4)}\nMSF = 10^2.24/${M}^2.56 = ${f(MSF, 4)}\nFS = ${n(CRR)} × ${f(MSF, 4)}/${f(CSR, 4)} = ${f(FS)}`,
      };
    },
  },
  {
    id: "pseudo-static-infinite-slope",
    version: 1,
    title: "Pseudo-static factor of safety of a dry infinite slope",
    topics: { "pe-civil": "geotechnical" },
    reference: "Seismic slope stability: pseudo-static infinite slope (c = 0)",
    generate(r) {
      for (;;) {
        const phi = r.range(30, 40, 1);
        const beta = r.range(15, 28, 1);
        const kh = r.range(0.05, 0.25, 0.01);
        const b = rad(beta);
        const FS = ((Math.cos(b) - kh * Math.sin(b)) * Math.tan(rad(phi))) / (Math.sin(b) + kh * Math.cos(b));
        if (FS < 0.6 || FS > 2) continue;
        return {
          prompt: `A long, dry cohesionless slope (φ' = ${phi}°) is inclined at ${beta}°. Using a pseudo-static horizontal seismic coefficient kh = ${n(kh)} acting out of the slope, FS = (cos β − kh sin β) tan φ'/(sin β + kh cos β). What is the seismic factor of safety?`,
          answer: FS,
          unit: "",
          distractors: [
            Math.tan(rad(phi)) / Math.tan(b), // ignored the seismic load (static FS)
            ((Math.cos(b) + kh * Math.sin(b)) * Math.tan(rad(phi))) / (Math.sin(b) - kh * Math.cos(b)) > 0
              ? ((Math.cos(b) + kh * Math.sin(b)) * Math.tan(rad(phi))) / (Math.sin(b) - kh * Math.cos(b))
              : NaN, // applied kh in the wrong direction
            Math.tan(rad(phi)) / Math.tan(b) - kh, // subtracted kh from the static FS
          ],
          solution: `Normal: cos ${beta}° − ${n(kh)} sin ${beta}° = ${f(Math.cos(b) - kh * Math.sin(b), 4)}\nDriving: sin ${beta}° + ${n(kh)} cos ${beta}° = ${f(Math.sin(b) + kh * Math.cos(b), 4)}\nFS = ${f(Math.cos(b) - kh * Math.sin(b), 4)} × tan ${phi}°/${f(Math.sin(b) + kh * Math.cos(b), 4)} = ${f(FS)}`,
        };
      }
    },
  },
  {
    id: "heave-exit-gradient",
    version: 1,
    title: "Factor of safety against heave from the exit gradient",
    topics: { "pe-civil": "geotechnical" },
    reference: "Seepage: critical gradient i_c = γ'/γw",
    generate(r) {
      for (;;) {
        const dh = r.range(0.5, 4, 0.1);
        const L = r.range(1, 6, 0.25);
        const gs = r.range(18.5, 21, 0.5);
        const i = dh / L;
        const ic = (gs - gw) / gw;
        const FS = ic / i;
        if (FS < 0.5 || FS > 4) continue;
        return {
          prompt: `Seepage flows upward toward the base of an excavation. Over the last ${n(L)} m of the flow path the head drops ${n(dh)} m. The sand has a saturated unit weight of ${n(gs)} kN/m³. What is the factor of safety against heave (quick condition)? (γw = 9.81 kN/m³)`,
          answer: FS,
          unit: "",
          distractors: [
            (gs / gw) / i, // used γsat/γw for the critical gradient
            i / ic, // inverted the ratio
            1 / i, // assumed i_c = 1.0 exactly
          ],
          solution: `Exit gradient i = Δh/L = ${n(dh)}/${n(L)} = ${f(i, 4)}\nCritical gradient i_c = γ'/γw = (${n(gs)} − 9.81)/9.81 = ${f(ic, 4)}\nFS = i_c/i = ${f(FS)}`,
        };
      }
    },
  },
  {
    id: "mse-reinforcement-tension",
    version: 1,
    title: "Maximum tension in an MSE wall reinforcement layer",
    topics: { "pe-civil": "geotechnical" },
    reference: "MSE walls: internal stability, T = σh × Sv",
    generate(r) {
      const z = r.range(1, 8, 0.25);
      const gm = r.range(18, 21, 0.5);
      const phi = r.range(30, 36, 1);
      const q = r.range(0, 20, 5);
      const Sv = r.pick([0.4, 0.5, 0.6, 0.75]);
      const Ka = Math.tan(rad(45 - phi / 2)) ** 2;
      const sh = Ka * (gm * z + q);
      const T = sh * Sv;
      return {
        prompt: `An MSE wall uses geosynthetic (extensible) reinforcement with a vertical spacing of ${n(Sv)} m. For the layer ${n(z)} m below the top, the reinforced fill weighs ${n(gm)} kN/m³ with φ = ${phi}°, and a uniform surcharge of ${q} kPa acts on top. Using Rankine Ka (K = Ka for geosynthetics), what is the maximum tension in that layer per metre of wall?`,
        answer: T,
        unit: "kN/m",
        distractors: [
          Ka * gm * z * Sv, // left out the surcharge
          sh, // gave the horizontal stress, not the force per layer
          (1 - Math.sin(rad(phi))) * (gm * z + q) * Sv, // used K₀ instead of Ka
        ],
        solution: `Ka = tan²(45° − ${phi}°/2) = ${f(Ka, 4)}\nσh = Ka(γz + q) = ${f(Ka, 4)}(${n(gm)} × ${n(z)} + ${q}) = ${f(sh, 4)} kPa\nT = σh × Sv = ${f(sh, 4)} × ${n(Sv)} = ${f(T)} kN/m`,
      };
    },
  },
  {
    id: "pile-elastic-shortening",
    version: 1,
    title: "Elastic shortening of a pile",
    topics: { "pe-civil": "geotechnical" },
    reference: "Deep foundations: settlement from elastic compression of the pile",
    generate(r) {
      const L = r.range(10, 35, 1);
      const d = r.pick([0.3, 0.35, 0.4, 0.45, 0.5]);
      const E = r.pick([25, 28, 30, 32]); // GPa concrete
      const Qp = r.range(200, 1200, 10);
      const Qs = r.range(300, 1500, 10);
      const xi = r.pick([0.5, 0.67]);
      const A = d * d;
      const s = ((Qp + xi * Qs) * L) / (A * E * 1e6) * 1000;
      return {
        prompt: `A ${n(d)} m square precast concrete pile (E = ${E} GPa) is ${L} m long. Under working load it carries ${Qp} kN in end bearing and ${Qs} kN in skin friction, with skin friction distributed so that ξ = ${xi}. Using s = (Qp + ξQs)L/(AE), what is the elastic shortening of the pile?`,
        answer: s,
        unit: "mm",
        distractors: [
          ((Qp + Qs) * L) / (A * E * 1e6) * 1000, // used the full load over the whole length (ξ = 1)
          (Qp * L) / (A * E * 1e6) * 1000, // left out the skin friction
          ((Qp + xi * Qs) * L) / (((Math.PI * d * d) / 4) * E * 1e6) * 1000, // used a round area for a square pile
        ],
        solution: `A = ${n(d)}² = ${f(A, 4)} m²; AE = ${f(A, 4)} × ${E} × 10⁶ kN/m² = ${f(A * E * 1e6, 5)} kN\ns = (${Qp} + ${xi} × ${Qs})(${L})/${f(A * E * 1e6, 5)} = ${f(s / 1000, 4)} m = ${f(s)} mm`,
      };
    },
  },
  {
    id: "shoring-post-load",
    version: 1,
    title: "Load on a shore supporting a fresh concrete slab",
    topics: { "pe-civil": "construction" },
    reference: "Formwork and shoring: dead, formwork and construction live loads (ACI 347)",
    generate(r) {
      const t = r.range(6, 14, 0.5);
      const sx = r.range(3, 6, 0.5);
      const sy = r.range(3, 6, 0.5);
      const form = r.pick([10, 15]);
      const live = r.pick([50, 75]);
      const w = (150 * t) / 12 + form + live;
      const P = (w * sx * sy) / 1000;
      return {
        prompt: `Shores spaced ${n(sx)} ft × ${n(sy)} ft support a ${n(t)} in normalweight concrete slab (150 pcf) during placement. Include a formwork dead load of ${form} psf and a construction live load of ${live} psf. What load does each interior shore carry?`,
        answer: P,
        unit: "kips",
        distractors: [
          ((150 * t) / 12) * sx * sy / 1000, // used only the concrete weight
          (150 * t + form + live) * sx * sy / 1000, // left the slab thickness in inches
          (w * sx * sy) / 2 / 1000, // split the tributary area between two shores
        ],
        solution: `Concrete: 150 × ${n(t)}/12 = ${f((150 * t) / 12, 4)} psf\nTotal = ${f((150 * t) / 12, 4)} + ${form} + ${live} = ${f(w, 4)} psf\nTributary area = ${n(sx)} × ${n(sy)} = ${f(sx * sy, 4)} ft²\nP = ${f(w * sx * sy, 5)} lb = ${f(P)} kips`,
      };
    },
  },
  {
    id: "left-turn-storage",
    version: 1,
    title: "Left-turn lane storage length at a signal",
    topics: { "pe-civil": "transportation" },
    reference: "Intersection geometry: turn-lane storage from vehicles per cycle",
    generate(r) {
      const V = r.range(60, 400, 10);
      const C = r.range(60, 150, 10);
      const pT = r.range(0, 15, 1);
      const per = (V * C) / 3600;
      const L = 2 * per * (25 * (1 - pT / 100) + 40 * (pT / 100));
      return {
        prompt: `A signalized approach has ${V} left turns per hour and a ${C} s cycle. Size the left-turn storage as 2 × the average number of left turns per cycle, using 25 ft per passenger car and 40 ft per truck, with trucks making up ${pT}% of turns. What storage length is needed?`,
        answer: L,
        unit: "ft",
        distractors: [
          per * (25 * (1 - pT / 100) + 40 * (pT / 100)), // left out the factor of 2
          2 * per * 25, // ignored trucks
          2 * (V / C) * 25, // divided by the cycle in seconds instead of cycles per hour
        ],
        solution: `Cycles per hour = 3,600/${C} = ${f(3600 / C, 4)}; left turns per cycle = ${V}/${f(3600 / C, 4)} = ${f(per, 4)}\nAverage length per vehicle = 25(${f(1 - pT / 100, 3)}) + 40(${f(pT / 100, 3)}) = ${f(25 * (1 - pT / 100) + 40 * (pT / 100), 4)} ft\nStorage = 2 × ${f(per, 4)} × ${f(25 * (1 - pT / 100) + 40 * (pT / 100), 4)} = ${f(L)} ft`,
      };
    },
  },
  {
    id: "cooper-jacob-drawdown",
    version: 1,
    title: "Drawdown after a time of pumping (Cooper-Jacob)",
    topics: { "pe-civil": "water-env" },
    reference: "Groundwater: transient drawdown, Cooper-Jacob approximation",
    generate(r) {
      for (;;) {
        const Q = r.range(500, 4000, 50);
        const T = r.range(100, 1500, 10);
        const S = r.pick([1e-4, 2e-4, 5e-4, 1e-3]);
        const rr = r.range(10, 150, 5);
        const t = r.pick([0.5, 1, 2, 5, 10, 30]);
        const u = (rr * rr * S) / (4 * T * t);
        if (u > 0.05) continue;
        const s = ((2.3 * Q) / (4 * Math.PI * T)) * Math.log10((2.25 * T * t) / (rr * rr * S));
        return {
          prompt: `A well pumps ${n(Q)} m³/d from a confined aquifer with transmissivity ${n(T)} m²/d and storativity ${S.toExponential(0).replace("e-", " × 10^-")}. Using the Cooper-Jacob equation s = [2.3Q/(4πT)] log(2.25Tt/(r²S)), what is the drawdown ${rr} m from the well after ${t} day${t === 1 ? "" : "s"} of pumping?`,
          answer: s,
          unit: "m",
          distractors: [
            ((2.3 * Q) / (4 * Math.PI * T)) * Math.log((2.25 * T * t) / (rr * rr * S)), // used ln with the 2.3 factor (double counting)
            ((2.3 * Q) / (2 * Math.PI * T)) * Math.log10((2.25 * T * t) / (rr * rr * S)), // used 2π instead of 4π
            ((2.3 * Q) / (4 * Math.PI * T)) * Math.log10((2.25 * T * t) / (rr * S)), // forgot to square r
          ],
          solution: `u = r²S/(4Tt) = ${f(u, 3)} (< 0.05, so Cooper-Jacob applies)\n2.25Tt/(r²S) = 2.25(${n(T)})(${t})/(${rr}² × ${S}) = ${f((2.25 * T * t) / (rr * rr * S), 4)}\ns = [2.3 × ${n(Q)}/(4π × ${n(T)})] × log(${f((2.25 * T * t) / (rr * rr * S), 4)}) = ${f(s)} m`,
        };
      }
    },
  },
  {
    id: "groundwater-travel-time",
    version: 1,
    title: "Contaminant travel time from Darcy seepage velocity",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Groundwater flow: Darcy velocity and seepage (average linear) velocity",
    generate(r) {
      const K = r.range(1, 100, 1);
      const h1 = r.range(20, 60, 0.5);
      const drop = r.range(0.5, 6, 0.1);
      const L = r.range(100, 2000, 50);
      const ne = r.range(0.15, 0.35, 0.01);
      const i = drop / L;
      const v = (K * i) / ne;
      const t = L / v;
      return {
        prompt: `Two monitoring wells ${n(L)} m apart in a sand aquifer have water levels of ${n(h1)} m and ${n(h1 - drop)} m. The hydraulic conductivity is ${K} m/d and the effective porosity is ${n(ne)}. Ignoring dispersion and retardation, how long does dissolved contamination take to travel from the upgradient well to the downgradient well?`,
        answer: t / 365,
        unit: "years",
        distractors: [
          L / (K * i) / 365, // used the Darcy velocity (forgot porosity)
          L / ((K * i) * ne) / 365, // multiplied by porosity instead of dividing
          t, // left the answer in days
        ],
        solution: `i = ${f(drop, 3)}/${n(L)} = ${f(i, 4)}\nDarcy velocity q = Ki = ${K} × ${f(i, 4)} = ${f(K * i, 4)} m/d; seepage velocity v = q/n_e = ${f(v, 4)} m/d\nt = L/v = ${n(L)}/${f(v, 4)} = ${f(t, 4)} d = ${f(t / 365)} years`,
      };
    },
  },
  {
    id: "tmdl-load-reduction",
    version: 1,
    title: "Required load reduction to meet a TMDL",
    topics: { "pe-civil": "water-env" },
    reference: "Water quality: loads in lb/day = Q (MGD) × C (mg/L) × 8.34",
    generate(r) {
      for (;;) {
        const Q = r.range(5, 200, 1);
        const Cnow = r.range(0.5, 6, 0.1);
        const Ctgt = r.range(0.1, Cnow * 0.8, 0.05);
        const mos = r.pick([5, 10, 15]);
        const now = Q * Cnow * 8.34;
        const tmdl = Q * Ctgt * 8.34;
        const allowable = tmdl * (1 - mos / 100);
        const red = now - allowable;
        if (red <= 0) continue;
        return {
          prompt: `At the critical low flow of ${Q} MGD, a stream carries total phosphorus at ${n(Cnow)} mg/L. The water quality target is ${n(Ctgt)} mg/L, and ${mos}% of the TMDL is set aside as a margin of safety. How much must the phosphorus load (all sources combined) be reduced?`,
          answer: red,
          unit: "lb/day",
          distractors: [
            now - tmdl, // left out the margin of safety
            Q * (Cnow - Ctgt), // forgot the 8.34 conversion
            now - tmdl * (1 + mos / 100), // added the margin of safety instead of reserving it
          ],
          solution: `Current load = ${Q} × ${n(Cnow)} × 8.34 = ${f(now, 5)} lb/day\nTMDL = ${Q} × ${n(Ctgt)} × 8.34 = ${f(tmdl, 5)} lb/day; allocable after ${mos}% MOS = ${f(allowable, 5)} lb/day\nReduction = ${f(now, 5)} − ${f(allowable, 5)} = ${f(red)} lb/day`,
        };
      }
    },
  },
  {
    id: "propped-cantilever-reaction",
    version: 1,
    title: "Reactions of a propped cantilever under uniform load",
    topics: { "pe-civil": "structural", "fe-civil": "structural" },
    reference: "Indeterminate beams: propped cantilever, R = 3wL/8",
    generate(r) {
      const w = r.range(0.5, 6, 0.1);
      const L = r.range(10, 40, 1);
      const ask = r.pick(["prop", "moment"] as const);
      const R = (3 * w * L) / 8;
      const M = (w * L * L) / 8;
      return ask === "prop"
        ? {
            prompt: `A beam is fixed at one end and simply supported (propped) at the other. It spans ${L} ft and carries a uniform load of ${n(w)} kip/ft. What is the reaction at the propped end?`,
            answer: R,
            unit: "kips",
            distractors: [(w * L) / 2, (5 * w * L) / 8, (w * L) / 8],
            solution: `For a propped cantilever under uniform load, R_prop = 3wL/8 = 3(${n(w)})(${L})/8 = ${f(R)} kips (the fixed end takes 5wL/8)`,
          }
        : {
            prompt: `A beam is fixed at one end and simply supported (propped) at the other. It spans ${L} ft and carries a uniform load of ${n(w)} kip/ft. What is the magnitude of the moment at the fixed end?`,
            answer: M,
            unit: "kip·ft",
            distractors: [(w * L * L) / 12, (9 * w * L * L) / 128, (w * L * L) / 2],
            solution: `For a propped cantilever under uniform load, M_fixed = wL²/8 = (${n(w)})(${L})²/8 = ${f(M)} kip·ft (the maximum positive moment is 9wL²/128)`,
          };
    },
  },
  {
    id: "dewatering-pump-power",
    version: 1,
    title: "Brake horsepower for a dewatering pump",
    topics: { "pe-civil": "construction" },
    reference: "Construction dewatering: bhp = Q(gpm) × H(ft)/(3,960η)",
    generate(r) {
      const Q = r.range(100, 3000, 50);
      const lift = r.range(10, 60, 1);
      const fr = r.range(3, 30, 1);
      const eta = r.range(55, 80, 1);
      const H = lift + fr;
      const bhp = (Q * H) / (3960 * (eta / 100));
      return {
        prompt: `A dewatering pump must deliver ${n(Q)} gpm against a static lift of ${lift} ft plus ${fr} ft of friction and minor losses in the discharge line. The pump efficiency is ${eta}%. What brake horsepower is required?`,
        answer: bhp,
        unit: "hp",
        distractors: [
          (Q * lift) / (3960 * (eta / 100)), // used only the static lift
          (Q * H) / 3960, // left out the efficiency (water horsepower)
          (Q * H * (eta / 100)) / 3960, // multiplied by the efficiency
        ],
        solution: `Total dynamic head = ${lift} + ${fr} = ${H} ft\nbhp = QH/(3,960η) = ${n(Q)} × ${H}/(3,960 × ${eta / 100}) = ${f(bhp)} hp`,
      };
    },
  },
  {
    id: "euac-alternative",
    version: 1,
    title: "Equivalent uniform annual cost of an alternative",
    topics: { "pe-civil": "transportation", "fe-civil": "economics" },
    reference: "Engineering economics: EUAC = P(A/P) + annual cost − S(A/F)",
    generate(r) {
      const P = r.range(50, 2000, 10) * 1000;
      const M = r.range(2, 80, 1) * 1000;
      const S = Math.round((P * r.range(0.05, 0.25, 0.01)) / 1000) * 1000;
      const N = r.pick([10, 15, 20, 25, 30]);
      const ip = r.pick([4, 5, 6, 7, 8]);
      const i = ip / 100;
      const AP = (i * (1 + i) ** N) / ((1 + i) ** N - 1);
      const AF = i / ((1 + i) ** N - 1);
      const E = P * AP + M - S * AF;
      return {
        prompt: `A pavement rehabilitation alternative costs $${n(P)} now, $${n(M)} per year to maintain, and has a salvage value of $${n(S)} at the end of its ${N}-year life. At ${ip}% interest, what is its equivalent uniform annual cost?`,
        answer: E,
        unit: "$",
        distractors: [
          P * AP + M, // ignored the salvage value
          P / N + M - S / N, // spread costs evenly with no interest
          P * AP + M + S * AF, // added the salvage value instead of subtracting it
        ],
        solution: `(A/P, ${ip}%, ${N}) = ${f(AP, 5)}; (A/F, ${ip}%, ${N}) = ${f(AF, 5)}\nEUAC = ${n(P)}(${f(AP, 5)}) + ${n(M)} − ${n(S)}(${f(AF, 5)}) = $${f(E, 5)}`,
      };
    },
  },
];
