import { f, n, type Template } from "./engine";

// Second batch: fills FE topics that had no generators (math & statistics, dynamics, materials,
// construction) and adds surveying, statics, and drainage problems built on public-domain federal
// methods. All problem text is original. Methods are cited in `provenance.basis`.

const G = 9.81;
const deg = (x: number) => (x * Math.PI) / 180;

const MATH: Template[] = [
  {
    id: "sample-std-dev",
    version: 1,
    title: "Sample standard deviation",
    topics: { "fe-civil": "math-stats" },
    reference: "Probability and Statistics: Dispersion",
    provenance: { type: "original" },
    generate(r) {
      for (;;) {
        const k = r.pick([5, 6, 7]);
        const xs = Array.from({ length: k }, () => r.range(1, 30, 1));
        const mean = xs.reduce((a, b) => a + b, 0) / k;
        const ss = xs.reduce((a, x) => a + (x - mean) ** 2, 0);
        if (ss === 0) continue;
        const s = Math.sqrt(ss / (k - 1));
        const mad = xs.reduce((a, x) => a + Math.abs(x - mean), 0) / k;
        return {
          prompt: `Five-minute traffic counts at a site were ${xs.join(", ")} vehicles. What is the sample standard deviation?`,
          answer: s,
          unit: "",
          distractors: [
            Math.sqrt(ss / k), // population standard deviation (divided by n)
            ss / (k - 1), // reported the variance
            mad, // mean absolute deviation
          ],
          solution: `Mean = ${f(mean, 4)}\nΣ(x − x̄)² = ${f(ss, 4)}\ns² = Σ(x − x̄)²/(n − 1) = ${f(ss, 4)}/${k - 1} = ${f(ss / (k - 1), 4)}\ns = √${f(ss / (k - 1), 4)} = ${f(s)}\n(Dividing by n gives the population value, ${f(Math.sqrt(ss / k))}.)`,
        };
      }
    },
  },
  {
    id: "linear-interpolation",
    version: 1,
    title: "Linear interpolation in a table",
    topics: { "fe-civil": "math-stats" },
    reference: "Mathematics: Interpolation",
    provenance: { type: "original" },
    generate(r) {
      const x1 = r.range(10, 80, 10);
      const x2 = x1 + 10;
      const x = x1 + r.pick([1, 2, 3, 4, 6, 7, 8, 9]);
      let y1 = r.range(0.5, 5, 0.01);
      let y2 = r.range(0.5, 5, 0.01);
      if (Math.abs(y2 - y1) < 0.3) y2 = Number((y1 + 0.75).toFixed(2));
      if (y1 === y2) y1 += 0.1;
      const y = y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
      return {
        prompt: `A design table lists a coefficient of ${n(y1)} at ${x1}°C and ${n(y2)} at ${x2}°C. Using linear interpolation, what is the coefficient at ${x}°C?`,
        answer: y,
        unit: "",
        sig: 4,
        minGap: 0.01,
        distractors: [
          (y1 + y2) / 2, // averaged the two table values
          y2 - ((x - x1) * (y2 - y1)) / (x2 - x1), // applied the fraction from the wrong end
          x - x1 < x2 - x ? y1 : y2, // used the nearest table value without interpolating
        ],
        solution: `y = y₁ + (x − x₁)(y₂ − y₁)/(x₂ − x₁)\n= ${n(y1)} + (${x} − ${x1})(${n(y2)} − ${n(y1)})/(${x2} − ${x1}) = ${f(y, 4)}`,
      };
    },
  },
];

const DYNAMICS: Template[] = [
  {
    id: "projectile-range",
    version: 1,
    title: "Range of a projectile on level ground",
    topics: { "fe-civil": "dynamics" },
    reference: "Dynamics: Projectile Motion",
    provenance: { type: "original" },
    generate(r) {
      const v = r.range(10, 40, 1);
      const th = r.range(15, 75, 5);
      const R = (v * v * Math.sin(deg(2 * th))) / G;
      return {
        prompt: `A rock is launched from level ground at ${v} m/s and ${th}° above horizontal. Neglecting air resistance, how far away does it land?`,
        answer: R,
        unit: "m",
        distractors: [
          (v * v * Math.sin(deg(th))) / G, // used sin θ instead of sin 2θ
          (v * v * Math.sin(deg(2 * th))) / (2 * G), // divided by 2g
          (v * v) / G, // used the maximum range (45°) regardless of angle
          (v * Math.sin(deg(2 * th))) / G, // didn't square the launch speed
        ],
        solution: `R = v₀² sin(2θ)/g = (${v})² sin(${2 * th}°)/9.81 = ${f(v * v)} × ${f(Math.sin(deg(2 * th)), 4)}/9.81 = ${f(R)} m`,
      };
    },
  },
  {
    id: "braking-distance",
    version: 1,
    title: "Braking distance from work and energy",
    topics: { "fe-civil": "dynamics" },
    reference: "Dynamics: Work-Energy Principle",
    provenance: { type: "original" },
    generate(r) {
      const kmh = r.range(40, 120, 5);
      const mu = r.range(0.3, 0.8, 0.05);
      const m = r.range(900, 2500, 100);
      const v = kmh / 3.6;
      const d = (v * v) / (2 * mu * G);
      return {
        prompt: `A ${n(m)} kg car traveling ${kmh} km/h locks its wheels on a level road. The coefficient of kinetic friction is ${n(mu)}. How far does it slide before stopping?`,
        answer: d,
        unit: "m",
        distractors: [
          (kmh * kmh) / (2 * mu * G), // didn't convert km/h to m/s
          (v * v) / (mu * G), // dropped the ½ in kinetic energy
          v / (2 * mu * G), // didn't square the speed
        ],
        solution: `v = ${kmh}/3.6 = ${f(v, 4)} m/s\n½mv² = μmg·d, so the mass cancels: d = v²/(2μg) = (${f(v, 4)})²/(2 × ${n(mu)} × 9.81) = ${f(d)} m`,
      };
    },
  },
];

const MATERIALS: Template[] = [
  {
    id: "thermal-expansion",
    version: 1,
    title: "Thermal expansion of a member",
    topics: { "fe-civil": "materials" },
    reference: "Mechanics of Materials / Materials: Thermal Deformation",
    provenance: { type: "original" },
    generate(r) {
      const mat = r.pick([
        { name: "steel rail", a: 12 },
        { name: "aluminum handrail", a: 23 },
        { name: "concrete slab", a: 10 },
      ] as const);
      const L = r.range(5, 100, 5);
      const dT = r.range(10, 60, 5);
      const dL = mat.a * 1e-6 * L * dT * 1000;
      return {
        prompt: `A ${L} m ${mat.name} (α = ${mat.a} × 10⁻⁶ /°C) warms by ${dT}°C and is free to expand. How much longer does it get?`,
        answer: dL,
        unit: "mm",
        distractors: [
          dL / 1000, // left the answer in meters
          dL * 1.8, // converted the temperature change as if to °F
          (mat.a * 1e-6 * dT) * 1000, // computed strain, forgot to multiply by L
        ],
        solution: `δ = αLΔT = (${mat.a} × 10⁻⁶)(${L} m)(${dT}°C) = ${f(dL / 1000, 4)} m = ${f(dL)} mm`,
      };
    },
  },
  {
    id: "concrete-wc-ratio",
    version: 1,
    title: "Water-cement ratio of a batch",
    topics: { "fe-civil": "materials" },
    reference: "Materials: Concrete Mix Design",
    provenance: { type: "original" },
    generate(r) {
      const bags = r.range(4, 8, 0.5);
      const target = r.range(0.35, 0.65, 0.01);
      const gal = Math.round(((target * bags * 94) / 8.34) * 2) / 2;
      const wc = (gal * 8.34) / (bags * 94);
      return {
        prompt: `A concrete batch uses ${n(bags)} bags of portland cement (94 lb per bag) and ${n(gal)} gallons of water (8.34 lb/gal). What is the water-cement ratio by weight?`,
        answer: wc,
        unit: "",
        distractors: [
          gal / (bags * 94), // forgot to convert gallons to pounds
          (bags * 94) / (gal * 8.34), // inverted the ratio
          (gal * 8.34) / bags, // forgot the 94 lb per bag
        ],
        solution: `Water = ${n(gal)} gal × 8.34 lb/gal = ${f(gal * 8.34, 4)} lb\nCement = ${n(bags)} × 94 lb = ${f(bags * 94, 4)} lb\nw/c = ${f(gal * 8.34, 4)}/${f(bags * 94, 4)} = ${f(wc)}`,
      };
    },
  },
];

const CONSTRUCTION: Template[] = [
  {
    id: "earthwork-truck-loads",
    version: 1,
    title: "Truck loads to haul excavated soil (swell)",
    topics: { "fe-civil": "construction", "pe-civil": "construction" },
    reference: "Construction: Earthwork Quantities",
    provenance: { type: "original" },
    generate(r) {
      const B = r.range(500, 5000, 50);
      const sw = r.range(10, 40, 5);
      const C = r.pick([10, 12, 14, 16, 18, 20]);
      const loose = B * (1 + sw / 100);
      const loads = Math.ceil(loose / C);
      return {
        prompt: `An excavation removes ${n(B)} bank cubic yards of soil with ${sw}% swell. Trucks carry ${C} loose cubic yards each. How many truck loads are needed?`,
        answer: loads,
        unit: "loads",
        sig: 4,
        minGap: 0.001, // rounding down (one load short) is the classic mistake
        distractors: [
          Math.ceil(B / C), // ignored swell
          Math.ceil((B * (1 - sw / 100)) / C), // applied swell as shrinkage
          Math.floor(loose / C) === loads ? loads - 1 : Math.floor(loose / C), // rounded down
        ],
        solution: `Loose volume = ${n(B)} × (1 + ${sw / 100}) = ${f(loose, 5)} LCY\nLoads = ${f(loose, 5)}/${C} = ${f(loose / C, 4)}, round up to ${loads} loads`,
      };
    },
  },
  {
    id: "earned-value-index",
    version: 1,
    title: "Cost or schedule performance index (earned value)",
    topics: { "fe-civil": "construction", "pe-civil": "construction" },
    reference: "Construction: Earned Value Management",
    provenance: { type: "original" },
    generate(r) {
      const PV = r.range(100, 2000, 10);
      const EV = Math.round((PV * r.range(0.7, 1.1, 0.01)) / 10) * 10;
      const AC = Math.round((EV * r.range(0.8, 1.3, 0.01)) / 10) * 10;
      const askCpi = r.next() < 0.5;
      const ans = askCpi ? EV / AC : EV / PV;
      const name = askCpi ? "cost performance index (CPI)" : "schedule performance index (SPI)";
      return {
        prompt: `At a monthly status date, a project's planned value is $${n(PV)}k, earned value is $${n(EV)}k, and actual cost is $${n(AC)}k. What is the ${name}?`,
        answer: ans,
        unit: "",
        distractors: askCpi
          ? [AC / EV, EV / PV, PV / AC, AC / PV] // inverted, SPI instead, wrong pairs
          : [PV / EV, EV / AC, AC / PV, PV / AC], // inverted, CPI instead, wrong pairs
        solution: askCpi
          ? `CPI = EV/AC = ${n(EV)}/${n(AC)} = ${f(ans)}  (${ans < 1 ? "over budget" : "at or under budget"})`
          : `SPI = EV/PV = ${n(EV)}/${n(PV)} = ${f(ans)}  (${ans < 1 ? "behind schedule" : "on or ahead of schedule"})`,
      };
    },
  },
];

const SURVEY_STATICS: Template[] = [
  {
    id: "differential-leveling",
    version: 1,
    title: "Differential leveling with a turning point",
    topics: { "fe-civil": "surveying" },
    reference: "Surveying: Leveling",
    provenance: { type: "original" },
    generate(r) {
      const BM = r.range(100, 950, 0.01);
      const bs1 = r.range(1, 12, 0.01);
      const fs1 = r.range(1, 12, 0.01);
      const bs2 = r.range(1, 12, 0.01);
      const fs2 = r.range(1, 12, 0.01);
      const elev = BM + bs1 - fs1 + bs2 - fs2;
      return {
        prompt: `Starting from a benchmark at elevation ${BM.toFixed(2)} ft, a level run reads: backsight ${bs1.toFixed(2)} ft on the BM, foresight ${fs1.toFixed(2)} ft on a turning point, backsight ${bs2.toFixed(2)} ft on the turning point, and foresight ${fs2.toFixed(2)} ft on point P. What is the elevation of P?`,
        answer: elev,
        unit: "ft",
        sig: 5,
        minGap: 0.0005,
        distractors: [
          BM - bs1 + fs1 - bs2 + fs2, // reversed the signs of backsights and foresights
          BM + bs1 - fs2, // skipped the turning point
          BM + bs1 + bs2 - fs1, // forgot the last foresight
        ],
        solution: `Elev P = BM + ΣBS − ΣFS\n= ${BM.toFixed(2)} + (${bs1.toFixed(2)} + ${bs2.toFixed(2)}) − (${fs1.toFixed(2)} + ${fs2.toFixed(2)})\n= ${elev.toFixed(2)} ft`,
      };
    },
  },
  {
    id: "traverse-departure",
    version: 1,
    title: "Latitude or departure of a traverse course",
    topics: { "fe-civil": "surveying" },
    reference: "Surveying: Traverse Computations",
    provenance: { type: "original" },
    generate(r) {
      const th = r.range(5, 85, 1);
      const L = r.range(100, 1000, 0.5);
      const ns = r.pick(["N", "S"]);
      const ew = r.pick(["E", "W"]);
      const askDep = r.next() < 0.5;
      const ans = askDep ? L * Math.sin(deg(th)) : L * Math.cos(deg(th));
      const other = askDep ? L * Math.cos(deg(th)) : L * Math.sin(deg(th));
      return {
        prompt: `A traverse course has a bearing of ${ns} ${th}° ${ew} and a length of ${n(L)} ft. What is the magnitude of its ${askDep ? "departure (east-west component)" : "latitude (north-south component)"}?`,
        answer: ans,
        unit: "ft",
        sig: 4,
        distractors: [
          other, // swapped latitude and departure
          L * Math.tan(deg(th)), // used tangent
          L * (askDep ? Math.sin(th) : Math.cos(th)), // calculator left in radians mode
          L / (askDep ? Math.sin(deg(th)) : Math.cos(deg(th))), // divided by the trig function instead of multiplying
        ],
        solution: `Bearings are measured from north or south, so\nlatitude = L cos θ = ${n(L)} cos ${th}° = ${f(L * Math.cos(deg(th)), 4)} ft\ndeparture = L sin θ = ${n(L)} sin ${th}° = ${f(L * Math.sin(deg(th)), 4)} ft`,
      };
    },
  },
  {
    id: "resultant-two-forces",
    version: 1,
    title: "Resultant of two concurrent forces",
    topics: { "fe-civil": "statics" },
    reference: "Statics: Resultants of Force Systems",
    provenance: { type: "original" },
    generate(r) {
      const F1 = r.range(10, 200, 5);
      const F2 = r.range(10, 200, 5);
      const th = r.pick([30, 45, 60, 75, 105, 120, 135, 150]);
      const R = Math.sqrt(F1 * F1 + F2 * F2 + 2 * F1 * F2 * Math.cos(deg(th)));
      return {
        prompt: `Two forces act at a point: ${F1} N and ${F2} N, with ${th}° between their lines of action. What is the magnitude of the resultant?`,
        answer: R,
        unit: "N",
        distractors: [
          F1 + F2, // added magnitudes as scalars
          Math.sqrt(F1 * F1 + F2 * F2), // assumed the forces are perpendicular
          Math.sqrt(F1 * F1 + F2 * F2 - 2 * F1 * F2 * Math.cos(deg(th))), // law of cosines with the wrong angle
        ],
        solution: `R² = F₁² + F₂² + 2F₁F₂ cos θ (θ = angle between the forces)\n= ${F1}² + ${F2}² + 2(${F1})(${F2}) cos ${th}° = ${f(R * R, 5)}\nR = ${f(R)} N`,
      };
    },
  },
];

const DRAINAGE: Template[] = [
  {
    id: "tr55-sheet-flow",
    version: 1,
    title: "Sheet-flow travel time (NRCS TR-55)",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "NRCS TR-55, Time of Concentration: Sheet Flow",
    provenance: { type: "original", basis: "Method from USDA NRCS TR-55, Urban Hydrology for Small Watersheds (1986), eq. 3-3. US government work, public domain." },
    generate(r) {
      const surf = r.pick([
        { text: "smooth asphalt", n: 0.011 },
        { text: "fallow ground (no residue)", n: 0.05 },
        { text: "short-grass prairie", n: 0.15 },
        { text: "dense grass", n: 0.24 },
        { text: "woods with light underbrush", n: 0.4 },
      ] as const);
      const L = r.range(50, 300, 10);
      const P2 = r.range(2, 5, 0.1);
      const s = r.range(0.005, 0.05, 0.001);
      const Tt = (0.007 * (surf.n * L) ** 0.8) / (Math.sqrt(P2) * s ** 0.4); // hours
      return {
        prompt: `Runoff travels as sheet flow for ${L} ft over ${surf.text} (Manning's n = ${n(surf.n)}) on a slope of ${n(s)} ft/ft. The 2-year, 24-hour rainfall is ${n(P2)} in. Using the NRCS (TR-55) sheet-flow equation, what is the travel time?`,
        answer: Tt * 60,
        unit: "min",
        distractors: [
          ((0.007 * (surf.n * L) ** 0.8) / (P2 * s ** 0.4)) * 60, // didn't take the square root of P2
          ((0.007 * surf.n * L) / (Math.sqrt(P2) * s ** 0.4)) * 60, // dropped the 0.8 exponent
          Tt, // left the result in hours
        ],
        solution: `Tt = 0.007(nL)^0.8 / (P₂^0.5 s^0.4)   [hours]\n= 0.007(${n(surf.n)} × ${L})^0.8 / (${n(P2)}^0.5 × ${n(s)}^0.4)\n= ${f(Tt, 4)} hr = ${f(Tt * 60)} min`,
      };
    },
  },
  {
    id: "tr55-shallow-flow",
    version: 1,
    title: "Shallow concentrated flow travel time (NRCS TR-55)",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "NRCS TR-55, Time of Concentration: Shallow Concentrated Flow",
    provenance: { type: "original", basis: "Velocity equations from USDA NRCS TR-55 (1986), Appendix F. US government work, public domain." },
    generate(r) {
      const paved = r.next() < 0.5;
      const s = r.range(0.005, 0.1, 0.001);
      const L = r.range(200, 2000, 50);
      const k = paved ? 20.3282 : 16.1345;
      const V = k * Math.sqrt(s);
      const Tt = L / (60 * V); // minutes
      return {
        prompt: `After sheet flow, runoff travels ${n(L)} ft as shallow concentrated flow over ${paved ? "a paved" : "an unpaved"} surface sloping ${n(s)} ft/ft. Using the TR-55 velocity relationship (V = ${paved ? "20.3282" : "16.1345"}√s ft/s), what is the travel time?`,
        answer: Tt,
        unit: "min",
        distractors: [
          L / (60 * (paved ? 16.1345 : 20.3282) * Math.sqrt(s)), // used the other surface's coefficient
          L / (3600 * V), // converted to hours, labeled minutes
          L / (60 * k * s), // used s instead of √s
        ],
        solution: `V = ${paved ? "20.3282" : "16.1345"}√${n(s)} = ${f(V, 4)} ft/s\nTt = L/(60V) = ${n(L)}/(60 × ${f(V, 4)}) = ${f(Tt)} min`,
      };
    },
  },
  {
    id: "hec22-gutter-flow",
    version: 1,
    title: "Gutter flow capacity for a given spread (FHWA HEC-22)",
    topics: { "fe-civil": "water-env", "pe-civil": "water-env" },
    reference: "FHWA HEC-22, Gutter Flow (modified Manning / Izzard)",
    provenance: { type: "original", basis: "Equation from FHWA HEC-22, Urban Drainage Design Manual (eq. for uniform cross-slope gutters, Ku = 0.56 US). US government work, public domain." },
    generate(r) {
      const nn = r.pick([0.013, 0.015, 0.016]);
      const Sx = r.range(0.015, 0.04, 0.005);
      const SL = r.range(0.005, 0.05, 0.001);
      const T = r.range(4, 12, 0.5);
      const Q = (0.56 / nn) * Sx ** (5 / 3) * Math.sqrt(SL) * T ** (8 / 3);
      return {
        prompt: `A curb-and-gutter section has a uniform cross slope of ${n(Sx)} ft/ft, longitudinal slope ${n(SL)} ft/ft, and Manning's n = ${n(nn)}. Using the HEC-22 gutter flow equation (Ku = 0.56), what flow produces a spread of ${n(T)} ft?`,
        answer: Q,
        unit: "cfs",
        distractors: [
          Q * (0.376 / 0.56), // used the SI constant (0.376) with US units
          Q / 0.56, // left out Ku
          (0.56 / nn) * Sx ** (5 / 3) * Math.sqrt(SL) * T ** (5 / 3), // used the 5/3 exponent on T
        ],
        solution: `Q = (Ku/n) Sx^(5/3) SL^(1/2) T^(8/3)\n= (0.56/${n(nn)})(${n(Sx)})^(5/3)(${n(SL)})^(1/2)(${n(T)})^(8/3) = ${f(Q)} cfs`,
      };
    },
  },
];

export const EXPANDED: Template[] = [...MATH, ...DYNAMICS, ...MATERIALS, ...CONSTRUCTION, ...SURVEY_STATICS, ...DRAINAGE];
