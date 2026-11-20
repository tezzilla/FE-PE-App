import { f, n, type Template } from "./engine";

// Twentieth batch: the next-thinnest PE knowledge areas. Formulas and factors are stated in the prompt.
// Each template has an independent solver in verify.ts.

const PLANKS = [
  { name: "2×10", b: 9.25 },
  { name: "2×12", b: 11.25 },
] as const;

export const BATCH_TWENTY: Template[] = [
  // ---------- Transportation: roadside and cross-section ----------
  {
    id: "barrier-length-of-need",
    version: 1,
    title: "Guardrail length of need with a flared barrier",
    topics: { "pe-civil": "transportation" },
    reference: "Roadside barrier layout: X = [LA + (b/a)L1 − L2] / [(b/a) + (LA/LR)]",
    generate(r) {
      const LA = r.range(18, 32, 1);
      const L2 = r.range(6, 12, 1);
      const L1 = r.range(10, 50, 5);
      const F = r.pick([10, 15, 20]);
      const LR = r.range(200, 450, 10);
      const X = (LA + L1 / F - L2) / (1 / F + LA / LR);
      const parallel = (LR * (LA - L2)) / LA;
      return {
        prompt: `A hazard extends to LA = ${LA} ft from the edge of the traveled way. The barrier face is L2 = ${L2} ft from the edge, runs parallel for L1 = ${L1} ft upstream of the hazard, then flares away at a flare rate of 1:${F} (b/a = 1/${F}). The runout length is LR = ${LR} ft. Using X = [LA + (b/a)L1 − L2]/[(b/a) + (LA/LR)], what length of need X is required upstream of the hazard?`,
        answer: X,
        unit: "ft",
        distractors: [
          parallel, // used the parallel-barrier equation and ignored the flare
          (LA + L1 / F) / (1 / F + LA / LR), // forgot to subtract L2
          (LA - L2) / (1 / F + LA / LR), // dropped the (b/a)L1 term
        ],
        solution: `Numerator = ${LA} + ${L1}/${F} − ${L2} = ${f(LA + L1 / F - L2, 4)} ft\nDenominator = 1/${F} + ${LA}/${LR} = ${f(1 / F + LA / LR, 4)}\nX = ${f(LA + L1 / F - L2, 4)}/${f(1 / F + LA / LR, 4)} = ${f(X)} ft`,
      };
    },
  },
  {
    id: "fill-slope-toe-offset",
    version: 1,
    title: "Offset to the toe of an embankment fill slope",
    topics: { "pe-civil": "transportation" },
    reference: "Cross-section: offset = shoulder width + fill height × slope ratio",
    generate(r) {
      const Sh = r.range(4, 10, 1);
      const H = r.range(3, 15, 0.5);
      const S = r.pick([3, 4, 6]);
      const off = Sh + H * S;
      return {
        prompt: `A roadway on fill has a ${Sh} ft shoulder beyond the edge of the traveled way. From the shoulder edge, a 1V:${S}H fill slope drops ${n(H)} ft to existing ground. Ignoring the shoulder's cross slope, how far is the toe of the fill slope from the edge of the traveled way?`,
        answer: off,
        unit: "ft",
        distractors: [
          H * S, // left out the shoulder
          Sh + H / S, // read the slope as H:V
        ],
        solution: `Slope run = ${n(H)} × ${S} = ${f(H * S)} ft\nOffset = ${Sh} + ${f(H * S)} = ${f(off)} ft`,
      };
    },
  },

  // ---------- Transportation: intersections, traffic control, signals ----------
  {
    id: "isd-multilane-left-turn",
    version: 1,
    title: "Intersection sight distance for a left turn across several lanes",
    topics: { "pe-civil": "transportation" },
    reference: "Intersection sight distance (case B1): ISD = 1.47 V tg, tg adjusted for lanes crossed",
    generate(r) {
      const V = r.range(35, 65, 5);
      const N = r.range(2, 4, 1);
      const tg = 7.5 + 0.5 * (N - 1);
      const ISD = 1.47 * V * tg;
      return {
        prompt: `A passenger car turns left from a stop onto a major road with a design speed of ${V} mph, crossing ${N} lanes to reach its lane. Use a base time gap of 7.5 s plus 0.5 s for each lane crossed beyond the first, and ISD = 1.47 V tg. What intersection sight distance is needed?`,
        answer: ISD,
        unit: "ft",
        distractors: [
          1.47 * V * 7.5, // didn't adjust the gap for extra lanes
          1.47 * V * (7.5 + 0.5 * N), // added 0.5 s for every lane, including the first
          V * tg, // left the speed in mph
        ],
        solution: `tg = 7.5 + 0.5(${N} − 1) = ${f(tg, 3)} s\nISD = 1.47 × ${V} × ${f(tg, 3)} = ${f(ISD)} ft`,
      };
    },
  },
  {
    id: "taper-device-count",
    version: 1,
    title: "Channelizing devices needed for a lane-closure taper",
    topics: { "pe-civil": "transportation" },
    reference: "Work zones: L = WS for speeds of 45 mph or more; devices = ⌈L/spacing⌉ + 1",
    generate(r) {
      const W = r.pick([10, 11, 12]);
      const S = r.range(45, 70, 5);
      const sp = r.pick([30, 40, 50]);
      const L = W * S;
      const count = Math.ceil(L / sp) + 1;
      return {
        prompt: `A merging taper closes a ${W} ft lane on a ${S} mph highway. Using L = WS (for 45 mph or more) and channelizing devices at a maximum spacing of ${sp} ft, with a device at each end of the taper, how many devices does the taper need?`,
        answer: count,
        unit: "devices",
        distractors: [
          Math.ceil(L / sp), // forgot the device at the start of the taper
          Math.ceil((W * S * S) / 60 / sp) + 1, // used the low-speed taper formula
          Math.ceil(L / sp) + 2, // added an extra device at each end
        ],
        solution: `L = ${W} × ${S} = ${L} ft\nSpaces = ⌈${L}/${sp}⌉ = ${Math.ceil(L / sp)}; devices = ${Math.ceil(L / sp)} + 1 = ${count}`,
      };
    },
  },
  {
    id: "striping-paint-quantity",
    version: 1,
    title: "Paint needed for pavement striping",
    topics: { "pe-civil": "transportation" },
    reference: "Quantities: gallons = line length × line width / coverage",
    generate(r) {
      const mi = r.range(1, 10, 0.5);
      const lines = r.pick([2, 3, 4]);
      const w = r.pick([4, 6]);
      const C = r.range(90, 110, 5);
      const gal = (mi * 5280 * lines * (w / 12)) / C;
      return {
        prompt: `A ${n(mi)} mile road segment gets ${lines} continuous ${w} in. wide stripes. At the specified film thickness, the paint covers ${C} ft² per gallon. How many gallons are needed?`,
        answer: gal,
        unit: "gal",
        distractors: [
          (mi * 5280 * (w / 12)) / C, // painted only one line
          (mi * 5000 * lines * (w / 12)) / C, // used 5,000 ft per mile
          (mi * 5280 * lines * w) / C, // used the stripe width in inches as feet
        ],
        solution: `Area = ${n(mi)} × 5,280 × ${lines} × ${w}/12 = ${f(mi * 5280 * lines * (w / 12), 5)} ft²\nPaint = ${f(mi * 5280 * lines * (w / 12), 5)}/${C} = ${f(gal)} gal`,
      };
    },
  },
  {
    id: "effective-green-time",
    version: 1,
    title: "Effective green time of a signal phase",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Signal timing: g = G + Y + AR − tL",
    generate(r) {
      const G = r.range(15, 60, 1);
      const Y = r.range(3, 5, 0.5);
      const AR = r.range(1, 2, 0.5);
      const tL = r.range(3, 5, 0.5);
      const g = G + Y + AR - tL;
      return {
        prompt: `A signal phase displays ${G} s of green, a ${n(Y)} s yellow and a ${n(AR)} s all-red. The total lost time for the phase is ${n(tL)} s. What is the effective green time g = G + Y + AR − tL?`,
        answer: g,
        unit: "s",
        sig: 4,
        distractors: [
          G - tL, // left out the yellow and all-red
          G + Y + AR, // ignored the lost time
          G + Y - tL, // left out the all-red
        ],
        solution: `g = ${G} + ${n(Y)} + ${n(AR)} − ${n(tL)} = ${f(g, 4)} s`,
      };
    },
  },
  {
    id: "lane-group-capacity",
    version: 1,
    title: "Capacity of a signalized lane group",
    topics: { "pe-civil": "transportation" },
    reference: "Signalized intersections: c = N s (g/C)",
    generate(r) {
      const s = r.range(1600, 1900, 50);
      const N = r.range(1, 3, 1);
      const C = r.range(60, 150, 5);
      const g = r.range(20, Math.min(50, C - 25), 1);
      {
        const c = (N * s * g) / C;
        return {
          prompt: `A lane group has ${N} lane${N > 1 ? "s" : ""} with an adjusted saturation flow of ${s.toLocaleString("en-US")} veh/h per lane. It receives ${g} s of effective green in a ${C} s cycle. What is the lane group's capacity, c = N s (g/C)?`,
          answer: c,
          unit: "veh/h",
          distractors: [
            (s * g) / C, // capacity of one lane only
            N * s, // ignored the green ratio
            (N * s * g) / (C + g), // divided by cycle plus green
          ],
          solution: `c = ${N} × ${s.toLocaleString("en-US")} × ${g}/${C} = ${f(c)} veh/h`,
        };
      }
    },
  },

  // ---------- Structural: temporary structures ----------
  {
    id: "scaffold-plank-span",
    version: 1,
    title: "Maximum span of a scaffold plank under a point load",
    topics: { "pe-civil": "structural" },
    reference: "Bending: M = PL/4 at midspan, S = bd²/6 for a plank laid flat",
    generate(r) {
      const pl = r.pick(PLANKS);
      const Fb = r.range(1000, 1500, 50);
      const P = r.range(250, 400, 25);
      const S = (pl.b * 1.5 * 1.5) / 6;
      const L = (4 * Fb * S) / P / 12;
      return {
        prompt: `A ${pl.name} scaffold plank (actual 1.5 in. × ${pl.b} in.) is laid flat and simply supported. A worker with tools applies a ${P} lb point load at midspan, and the allowable bending stress is Fb = ${Fb.toLocaleString("en-US")} psi. Neglecting the plank's own weight, what is the longest allowable span?`,
        answer: L,
        unit: "ft",
        distractors: [
          (4 * Fb * ((1.5 * pl.b * pl.b) / 6)) / P / 12, // used the plank on edge
          (8 * Fb * S) / P / 12, // used M = PL/8 (uniform-load formula)
          (2 * Fb * S) / P / 12, // used M = PL/2
        ],
        solution: `S = ${pl.b} × 1.5²/6 = ${f(S, 4)} in³\nM allowed = ${Fb} × ${f(S, 4)} = ${f(Fb * S, 4)} lb-in = PL/4\nL = 4 × ${f(Fb * S, 4)}/${P} = ${f(L * 12, 4)} in = ${f(L)} ft`,
      };
    },
  },

  // ---------- Geotechnical: problematic soil and rock ----------
  {
    id: "collapsible-soil-settlement",
    version: 1,
    title: "Collapse settlement of a soil layer on wetting",
    topics: { "pe-civil": "geotechnical" },
    reference: "Collapsible soils: ΔH = (collapse potential) × H",
    generate(r) {
      const H = r.range(3, 15, 0.5);
      const CP = r.range(1, 10, 0.5);
      const dH = (CP / 100) * H * 12;
      return {
        prompt: `A ${n(H)} ft thick layer of loess has a collapse potential of ${n(CP)}% at the stress it will carry under a new building. If the whole layer becomes wetted, how much collapse settlement should be expected?`,
        answer: dH,
        unit: "in",
        distractors: [
          (CP / 100) * H, // reported feet as inches
          (CP / 100) * H * 12 * 0.5, // assumed only half the layer wets
        ],
        solution: `ΔH = ${n(CP)}% × ${n(H)} ft = ${f((CP / 100) * H, 3)} ft = ${f(dH)} in`,
      };
    },
  },
  {
    id: "loss-on-ignition",
    version: 1,
    title: "Organic content by loss on ignition",
    topics: { "pe-civil": "geotechnical" },
    reference: "Organic soils: LOI = (dry mass − ash mass)/dry mass × 100%",
    generate(r) {
      const Md = r.range(20, 60, 0.5);
      const oc = r.range(2, 30, 0.5);
      const Ma = Number((Md * (1 - oc / 100)).toFixed(2));
      const LOI = ((Md - Ma) / Md) * 100;
      return {
        prompt: `An oven-dried soil specimen weighs ${n(Md)} g. After ignition in a muffle furnace, the remaining ash weighs ${n(Ma)} g. What is the organic content by loss on ignition?`,
        answer: LOI,
        unit: "%",
        distractors: [
          ((Md - Ma) / Ma) * 100, // divided by the ash mass
          (Ma / Md) * 100, // reported the ash fraction
          Md - Ma, // reported the mass lost in grams
        ],
        solution: `LOI = (${n(Md)} − ${n(Ma)})/${n(Md)} × 100 = ${f(LOI)}%`,
      };
    },
  },
  {
    id: "rock-plane-failure-fs",
    version: 1,
    title: "Factor of safety of a rock block on a planar joint",
    topics: { "pe-civil": "geotechnical" },
    reference: "Plane failure: FS = (cA + W cos ψ tan φ)/(W sin ψ)",
    generate(r) {
      for (;;) {
        const psi = r.range(25, 45, 1);
        const phi = r.range(25, 40, 1);
        const c = r.range(0, 30, 5);
        const A = r.range(8, 25, 1);
        const W = r.range(300, 2000, 50);
        const rad = Math.PI / 180;
        const FS = (c * A + W * Math.cos(psi * rad) * Math.tan(phi * rad)) / (W * Math.sin(psi * rad));
        if (FS < 0.6 || FS > 3) continue;
        return {
          prompt: `A rock block weighing W = ${W} kN per metre of slope rests on a joint dipping ψ = ${psi}° toward the cut face. The joint is ${A} m long (per metre of slope) with cohesion c = ${c} kPa and friction angle φ = ${phi}°. With no water pressure, what is the factor of safety FS = (cA + W cos ψ tan φ)/(W sin ψ)?`,
          answer: FS,
          unit: "",
          distractors: [
            (W * Math.cos(psi * rad) * Math.tan(phi * rad)) / (W * Math.sin(psi * rad)), // ignored cohesion
            (c * A + W * Math.sin(psi * rad) * Math.tan(phi * rad)) / (W * Math.cos(psi * rad)), // swapped sin and cos
            (c * A + W * Math.tan(phi * rad)) / (W * Math.sin(psi * rad)), // left cos ψ out of the normal force
          ],
          solution: `Resisting = ${c} × ${A} + ${W} cos ${psi}° tan ${phi}° = ${f(c * A + W * Math.cos(psi * rad) * Math.tan(phi * rad), 4)} kN\nDriving = ${W} sin ${psi}° = ${f(W * Math.sin(psi * rad), 4)} kN\nFS = ${f(FS)}`,
        };
      }
    },
  },

  // ---------- Geotechnical: construction QA/QC ----------
  {
    id: "zero-air-voids-unit-weight",
    version: 1,
    title: "Zero-air-voids dry unit weight",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Compaction: γzav = Gs γw / (1 + w Gs)",
    generate(r) {
      const Gs = r.range(2.6, 2.8, 0.01);
      const w = r.range(8, 25, 0.5);
      const zav = (Gs * 62.4) / (1 + (w / 100) * Gs);
      return {
        prompt: `A compacted fill has specific gravity of solids Gs = ${n(Gs)}. What is the zero-air-voids dry unit weight at a water content of ${n(w)}%? (γw = 62.4 pcf)`,
        answer: zav,
        unit: "pcf",
        distractors: [
          (Gs * 62.4) / (1 + w / 100), // left Gs out of the denominator
          (Gs * 62.4 * (1 + w / 100)) / (1 + (w / 100) * Gs), // gave the moist unit weight
        ],
        solution: `γzav = ${n(Gs)} × 62.4/(1 + ${f(w / 100, 3)} × ${n(Gs)}) = ${f(Gs * 62.4, 4)}/${f(1 + (w / 100) * Gs, 4)} = ${f(zav)} pcf`,
      };
    },
  },

  // ---------- Construction: quality control and scheduling ----------
  {
    id: "required-average-strength",
    version: 1,
    title: "Required average compressive strength for a concrete mix",
    topics: { "pe-civil": "construction" },
    reference: "Mix proportioning (f'c ≤ 5,000 psi): f'cr = max(f'c + 1.34s, f'c + 2.33s − 500)",
    generate(r) {
      const fc = r.range(3000, 5000, 500);
      const s = r.range(300, 750, 10);
      const a = fc + 1.34 * s;
      const b = fc + 2.33 * s - 500;
      const fcr = Math.max(a, b);
      return {
        prompt: `A concrete supplier's record of 30 or more consecutive tests has a standard deviation of s = ${s} psi. The specified strength is f'c = ${fc.toLocaleString("en-US")} psi. Using f'cr = the larger of f'c + 1.34s and f'c + 2.33s − 500 psi, what required average strength must the mix be proportioned for?`,
        answer: fcr,
        unit: "psi",
        sig: 4,
        distractors: [
          Math.min(a, b), // took the smaller value
          fc + 2.33 * s, // left out the −500
          fc, // designed for the specified strength
        ],
        solution: `f'c + 1.34s = ${fc} + 1.34(${s}) = ${f(a, 5)} psi\nf'c + 2.33s − 500 = ${fc} + 2.33(${s}) − 500 = ${f(b, 5)} psi\nf'cr = ${f(fcr, 5)} psi`,
      };
    },
  },
  {
    id: "xbar-control-limit",
    version: 1,
    title: "Upper control limit on an X-bar chart",
    topics: { "pe-civil": "construction" },
    reference: "Statistical process control: UCL = x̿ + A₂R̄",
    generate(r) {
      const xbb = r.range(4000, 6000, 50);
      const Rb = r.range(200, 800, 10);
      const A2 = 0.577;
      const ucl = xbb + A2 * Rb;
      return {
        prompt: `Concrete cylinders are tested in subgroups of five. Across the project, the grand average strength is x̿ = ${xbb.toLocaleString("en-US")} psi and the average subgroup range is R̄ = ${Rb} psi. With A₂ = 0.577 for subgroups of five, what is the upper control limit for the subgroup averages?`,
        answer: ucl,
        unit: "psi",
        sig: 4,
        distractors: [
          xbb - A2 * Rb, // computed the lower control limit
          xbb + Rb, // left out A₂
          xbb + 3 * A2 * Rb, // multiplied by 3 again (A₂ already includes it)
        ],
        solution: `UCL = ${xbb} + 0.577 × ${Rb} = ${f(ucl, 5)} psi`,
      };
    },
  },
  {
    id: "activity-free-float",
    version: 1,
    title: "Free float of an activity",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "CPM: FF = (earliest ES of successors) − EF",
    generate(r) {
      const ES = r.range(0, 20, 1);
      const dur = r.range(2, 10, 1);
      const EF = ES + dur;
      const esD = EF + r.range(1, 6, 1);
      const esE = EF + r.range(1, 9, 1);
      const FF = Math.min(esD, esE) - EF;
      return {
        prompt: `Activity C has an early start of day ${ES} and a duration of ${dur} days. Its only successors are activity D, with an early start of day ${esD}, and activity E, with an early start of day ${esE}. What is the free float of activity C?`,
        answer: FF,
        unit: "days",
        distractors: [
          Math.max(esD, esE) - EF, // used the later successor
          Math.min(esD, esE) - ES, // subtracted the early start instead of the early finish
          esD + esE - 2 * EF, // added the gaps to both successors
        ],
        solution: `EF = ${ES} + ${dur} = ${EF}\nFF = min(${esD}, ${esE}) − ${EF} = ${FF} days`,
      };
    },
  },

  // ---------- Water resources: groundwater and water quality ----------
  {
    id: "capture-zone-width",
    version: 1,
    title: "Width of a pumping well's capture zone",
    topics: { "pe-civil": "water-env" },
    reference: "Groundwater remediation: far-upgradient capture width W = Q/(K b i)",
    generate(r) {
      const Q = r.range(200, 3000, 50);
      const K = r.range(5, 50, 1);
      const b = r.range(10, 40, 1);
      const i = r.range(0.001, 0.01, 0.0005);
      const W = Q / (K * b * i);
      return {
        prompt: `A recovery well pumps ${Q.toLocaleString("en-US")} m³/day from a confined aquifer ${b} m thick with hydraulic conductivity K = ${K} m/day. The regional hydraulic gradient is i = ${n(i)}. What is the maximum width of the capture zone far upgradient, W = Q/(Kbi)?`,
        answer: W,
        unit: "m",
        distractors: [
          W / 2, // the width along the line of the well
          W / (2 * Math.PI), // gave the downgradient stagnation-point distance Q/(2πKbi)
        ],
        solution: `W = ${Q}/(${K} × ${b} × ${n(i)}) = ${Q}/${f(K * b * i, 4)} = ${f(W)} m`,
      };
    },
  },
  {
    id: "stream-mixing-concentration",
    version: 1,
    title: "Concentration below a discharge (complete mixing)",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Mass balance: C = (QuCu + QwCw)/(Qu + Qw)",
    generate(r) {
      const Qu = r.range(2, 20, 0.5);
      const Cu = r.range(0, 5, 0.5);
      const Qw = r.range(0.1, 2, 0.1);
      const Cw = r.range(20, 200, 5);
      const C = (Qu * Cu + Qw * Cw) / (Qu + Qw);
      return {
        prompt: `A river flowing ${n(Qu)} m³/s carries ${n(Cu)} mg/L of ammonia upstream of a wastewater outfall. The plant discharges ${n(Qw)} m³/s containing ${Cw} mg/L. Assuming complete mixing, what is the ammonia concentration just downstream?`,
        answer: C,
        unit: "mg/L",
        distractors: [
          (Cu + Cw) / 2, // averaged the concentrations
          (Qu * Cu + Qw * Cw) / Qu, // didn't add the discharge to the flow
          (Qw * Cw) / (Qu + Qw), // ignored the upstream load
        ],
        solution: `Load = ${n(Qu)} × ${n(Cu)} + ${n(Qw)} × ${Cw} = ${f(Qu * Cu + Qw * Cw, 4)} g/s\nC = ${f(Qu * Cu + Qw * Cw, 4)}/${f(Qu + Qw, 4)} = ${f(C)} mg/L`,
      };
    },
  },
  {
    id: "downstream-first-order-decay",
    version: 1,
    title: "First-order decay of a pollutant downstream",
    topics: { "pe-civil": "water-env" },
    reference: "Plug flow in a river: C = C₀e^(−kt), t = distance/velocity",
    generate(r) {
      const C0 = r.range(5, 40, 1);
      const k = r.range(0.1, 1, 0.05);
      const x = r.range(5, 60, 1);
      const v = r.range(0.1, 0.6, 0.05);
      const t = (x * 1000) / (v * 86400);
      const C = C0 * Math.exp(-k * t);
      return {
        prompt: `Just below an outfall, a river carries ${C0} mg/L of a pollutant that decays by first-order kinetics with k = ${n(k)} /day. The river flows at ${n(v)} m/s. What concentration remains ${x} km downstream?`,
        answer: C,
        unit: "mg/L",
        distractors: [
          C0 * (1 - k * t) > 0 ? C0 * (1 - k * t) : NaN, // used linear decay
          C0 * 10 ** (-k * t), // used base-10 decay
          C0 * Math.exp((-k * t) / 24), // treated the travel time as hours
        ],
        solution: `t = ${x} × 1,000/(${n(v)} × 86,400) = ${f(t, 4)} days\nC = ${C0}e^(−${n(k)} × ${f(t, 4)}) = ${f(C)} mg/L`,
      };
    },
  },
];
