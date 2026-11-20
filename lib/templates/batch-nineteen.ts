import { f, n, type Template } from "./engine";

// Nineteenth batch: the thinnest PE knowledge areas (roadside and cross-section design, health and
// safety, temporary structures, problematic soils, intersections, traffic control, signals, earthquake,
// site characterization). Formulas and factors are stated in the prompt. Each template has an independent
// solver in verify.ts.

const SOIL_SLOPES = [
  { type: "A", ratio: 0.75 },
  { type: "B", ratio: 1 },
  { type: "C", ratio: 1.5 },
] as const;

export const BATCH_NINETEEN: Template[] = [
  // ---------- Transportation: roadside and cross-section design ----------
  {
    id: "tangent-runout-length",
    version: 1,
    title: "Tangent runout length for superelevation transition",
    topics: { "pe-civil": "transportation" },
    reference: "Superelevation transition: Lt = (eNC/ed) × Lr",
    generate(r) {
      const ed = r.range(4, 10, 0.5);
      const eNC = r.pick([1.5, 2, 2.5]);
      const Lr = r.range(100, 300, 5);
      const Lt = (eNC / ed) * Lr;
      return {
        prompt: `A horizontal curve has design superelevation ed = ${n(ed)}% and a superelevation runoff length Lr = ${Lr} ft. The normal crown cross slope is eNC = ${n(eNC)}%. Using Lt = (eNC/ed)Lr, what is the tangent runout length?`,
        answer: Lt,
        unit: "ft",
        distractors: [
          (ed / eNC) * Lr, // inverted the ratio
          Lr, // assumed runout equals runoff
          2 * Lt, // counted the runout on both sides of the curve
        ],
        solution: `Lt = (eNC/ed)Lr = (${n(eNC)}/${n(ed)}) × ${Lr} = ${f(Lt)} ft`,
      };
    },
  },
  {
    id: "crown-to-shoulder-drop",
    version: 1,
    title: "Elevation drop from crown to shoulder edge",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "Cross-section design: drop = Σ(width × cross slope)",
    generate(r) {
      const W = r.pick([10, 11, 12]);
      const s = r.range(1.5, 2.5, 0.5);
      const Ws = r.range(4, 10, 1);
      const ss = r.range(3, 6, 0.5);
      const drop = (W * s + Ws * ss) / 100 * 12;
      return {
        prompt: `A two-lane road is crowned at the centerline. Each lane is W = ${W} ft wide with a cross slope of ${n(s)}%, and the outside shoulder is Ws = ${Ws} ft wide sloped at ${n(ss)}%. How far below the crown is the outer edge of the shoulder?`,
        answer: drop,
        unit: "in",
        distractors: [
          (W * s) / 100 * 12, // only the lane
          ((W + Ws) * s) / 100 * 12, // used the lane slope for the shoulder too
          ((W + Ws) * ss) / 100 * 12, // used the shoulder slope for the lane too
        ],
        solution: `Lane: ${W} × ${n(s)}% = ${f((W * s) / 100, 3)} ft\nShoulder: ${Ws} × ${n(ss)}% = ${f((Ws * ss) / 100, 3)} ft\nTotal = ${f((W * s + Ws * ss) / 100, 3)} ft = ${f(drop)} in`,
      };
    },
  },
  {
    id: "roadside-ditch-top-width",
    version: 1,
    title: "Top width of a trapezoidal roadside ditch",
    topics: { "pe-civil": "transportation" },
    reference: "Roadside design: top width = B + D(F + K) for slopes 1V:FH and 1V:KH",
    generate(r) {
      const B = r.range(2, 8, 1);
      const D = r.range(1.5, 4, 0.5);
      const F = r.pick([4, 5, 6]);
      const K = r.pick([2, 3, 4]);
      const T = B + D * (F + K);
      return {
        prompt: `A roadside ditch has a flat bottom B = ${B} ft wide and is D = ${n(D)} ft deep. The foreslope (road side) is 1V:${F}H and the backslope is 1V:${K}H. What is the top width of the ditch?`,
        answer: T,
        unit: "ft",
        distractors: [
          B + 2 * D * F, // used the foreslope on both sides
          D * (F + K), // left out the bottom width
          B + (D * (F + K)) / 2, // halved the side slope widths
        ],
        solution: `Foreslope width = ${n(D)} × ${F} = ${f(D * F)} ft; backslope width = ${n(D)} × ${K} = ${f(D * K)} ft\nTop width = ${B} + ${f(D * F)} + ${f(D * K)} = ${f(T)} ft`,
      };
    },
  },

  // ---------- Transportation: intersections, traffic control, signals ----------
  {
    id: "decel-lane-length",
    version: 1,
    title: "Deceleration length for a turn lane",
    topics: { "pe-civil": "transportation" },
    reference: "Intersection design: d = (v₁² − v₂²)/(2a), speeds in ft/s",
    generate(r) {
      const V1 = r.range(40, 65, 5);
      const V2 = r.range(15, 25, 5);
      const a = r.range(5, 8, 0.5);
      const d = ((V1 * 1.467) ** 2 - (V2 * 1.467) ** 2) / (2 * a);
      return {
        prompt: `A right-turn lane is designed for a vehicle that slows from ${V1} mph to ${V2} mph entirely within the lane at a constant deceleration of a = ${n(a)} ft/s². Using d = (v₁² − v₂²)/(2a) with speeds in ft/s (1 mph = 1.467 ft/s), what deceleration length is needed?`,
        answer: d,
        unit: "ft",
        distractors: [
          (V1 * V1 - V2 * V2) / (2 * a), // left the speeds in mph
          (V1 * 1.467) ** 2 / (2 * a), // decelerated to a stop
          ((V1 * 1.467) ** 2 - (V2 * 1.467) ** 2) / a, // forgot the 2
        ],
        solution: `v₁ = ${V1} × 1.467 = ${f(V1 * 1.467, 4)} ft/s; v₂ = ${V2} × 1.467 = ${f(V2 * 1.467, 4)} ft/s\nd = (${f((V1 * 1.467) ** 2, 4)} − ${f((V2 * 1.467) ** 2, 4)})/(2 × ${n(a)}) = ${f(d)} ft`,
      };
    },
  },
  {
    id: "warning-sign-placement",
    version: 1,
    title: "Advance placement of a warning sign",
    topics: { "pe-civil": "transportation" },
    reference: "Traffic control: D = 1.47Vt + 1.075(V² − Vc²)/a − Ls",
    generate(r) {
      for (;;) {
        const V = r.range(45, 65, 5);
        const Vc = r.range(20, 35, 5);
        if (V - Vc < 15) continue;
        const t = r.pick([2.5, 3]);
        const a = 11.2;
        const Ls = r.range(150, 250, 10);
        const prt = 1.47 * V * t;
        const brake = (1.075 * (V * V - Vc * Vc)) / a;
        const D = prt + brake - Ls;
        if (D < 60) continue;
        return {
          prompt: `Drivers approach a sharp curve at ${V} mph and must slow to ${Vc} mph at the curve. Place the warning sign using D = 1.47Vt + 1.075(V² − Vc²)/a − Ls, with perception-reaction time t = ${n(t)} s, deceleration a = 11.2 ft/s², and sign legibility distance Ls = ${Ls} ft. How far before the curve should the sign be?`,
          answer: D,
          unit: "ft",
          distractors: [
            prt + brake, // didn't subtract the legibility distance
            brake - Ls > 0 ? brake - Ls : NaN, // left out the perception-reaction distance
            prt + (1.075 * V * V) / a - Ls, // braked to a stop instead of to the curve speed
          ],
          solution: `Perception-reaction: 1.47 × ${V} × ${n(t)} = ${f(prt, 4)} ft\nBraking: 1.075(${V}² − ${Vc}²)/11.2 = ${f(brake, 4)} ft\nD = ${f(prt, 4)} + ${f(brake, 4)} − ${Ls} = ${f(D)} ft`,
        };
      }
    },
  },
  {
    id: "actuated-min-green",
    version: 1,
    title: "Minimum green for an actuated approach",
    topics: { "pe-civil": "transportation" },
    reference: "Actuated control: Gmin = l₁ + 2.0n, n = vehicles stored between detector and stop line",
    generate(r) {
      const k = r.range(2, 9, 1);
      const off = r.range(5, 20, 5);
      const dist = 25 * k + off;
      const l1 = r.range(2, 4, 0.5);
      const nveh = Math.ceil(dist / 25);
      const G = l1 + 2 * nveh;
      return {
        prompt: `An actuated approach has its stop-bar detector located ${dist} ft back from the stop line. Allow 25 ft of queue per vehicle (round up to whole vehicles), a startup lost time of ${n(l1)} s, and 2.0 s of headway per queued vehicle. What minimum green time is needed to clear the vehicles stored between the detector and the stop line?`,
        answer: G,
        unit: "s",
        sig: 4,
        distractors: [
          l1 + (2 * dist) / 25, // didn't round up to whole vehicles
          2 * nveh, // left out the startup lost time
          l1 + nveh, // used 1 s per vehicle
        ],
        solution: `n = ${dist}/25 = ${f(dist / 25, 3)} → ${nveh} vehicles\nGmin = ${n(l1)} + 2.0 × ${nveh} = ${f(G, 4)} s`,
      };
    },
  },

  // ---------- Construction: health and safety ----------
  {
    id: "ladder-length-4-to-1",
    version: 1,
    title: "Ladder length using the 4:1 rule",
    topics: { "pe-civil": "construction" },
    reference: "OSHA 1926.1053: base ≈ ¼ of working length; rails extend 3 ft above the landing",
    generate(r) {
      const h = r.range(8, 28, 1);
      const L = (4 * h) / Math.sqrt(15);
      const total = L + 3;
      return {
        prompt: `A worker needs to reach a roof whose eave is ${h} ft above level ground. The ladder's foot must be set out one-quarter of the ladder's working length (the length from the foot to the top support), and the side rails must extend 3 ft above the roof edge. What is the shortest ladder that works?`,
        answer: total,
        unit: "ft",
        distractors: [
          L, // forgot the 3 ft extension
          h + h / 4 + 3, // added the base offset to the height
        ],
        solution: `With base = L/4: h = √(L² − (L/4)²) = L√15/4, so L = 4h/√15 = 4(${h})/3.873 = ${f(L, 4)} ft\nLadder = ${f(L, 4)} + 3 = ${f(total)} ft`,
      };
    },
  },
  {
    id: "trench-sloped-top-width",
    version: 1,
    title: "Top width of a sloped excavation by soil type",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "OSHA Subpart P Appendix B: maximum allowable slopes by soil type",
    generate(r) {
      const soil = r.pick(SOIL_SLOPES);
      const H = r.range(6, 20, 1);
      const b = r.range(2, 6, 1);
      const T = b + 2 * soil.ratio * H;
      const other = SOIL_SLOPES.find((s) => s.type !== soil.type && s.ratio !== soil.ratio)!;
      return {
        prompt: `A trench in Type ${soil.type} soil will be excavated ${H} ft deep with a bottom width of ${b} ft, and both sides will be sloped at the maximum allowable slope of ${n(soil.ratio)}H:1V. What is the width at the top of the excavation?`,
        answer: T,
        unit: "ft",
        distractors: [
          b + soil.ratio * H, // sloped only one side
          b + (2 * H) / soil.ratio, // read the slope as V:H
          b + 2 * other.ratio * H, // used another soil type's slope
        ],
        solution: `Each side extends ${n(soil.ratio)} × ${H} = ${f(soil.ratio * H)} ft\nTop width = ${b} + 2 × ${f(soil.ratio * H)} = ${f(T)} ft`,
      };
    },
  },
  {
    id: "osha-incident-rate",
    version: 1,
    title: "OSHA total recordable incident rate",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Incident rate = cases × 200,000 / hours worked",
    generate(r) {
      const cases = r.range(2, 30, 1);
      const hours = r.range(50000, 2000000, 10000);
      const rate = (cases * 200000) / hours;
      return {
        prompt: `A contractor recorded ${cases} OSHA-recordable injuries during a year in which its crews worked ${hours.toLocaleString("en-US")} hours. Using the standard base of 200,000 hours (100 full-time workers), what is its total recordable incident rate?`,
        answer: rate,
        unit: "",
        distractors: [
          (cases * 100000) / hours, // used 100,000 hours as the base
          (cases * 1000000) / hours, // used 1,000,000 hours as the base
          (cases * 2000) / hours, // used one worker's 2,000 hours as the base
        ],
        solution: `TRIR = ${cases} × 200,000 / ${hours.toLocaleString("en-US")} = ${f(rate)}`,
      };
    },
  },
  {
    id: "noise-dose-osha",
    version: 1,
    title: "Daily noise dose from mixed exposures",
    topics: { "pe-civil": "construction" },
    reference: "OSHA 1910.95: T = 8/2^((L − 90)/5), D = 100 Σ C/T",
    generate(r) {
      const levels = [90, 92, 95, 97, 100, 102, 105];
      const segs: { L: number; C: number }[] = [];
      const used = new Set<number>();
      while (segs.length < 3) {
        const L = r.pick(levels);
        if (used.has(L)) continue;
        used.add(L);
        segs.push({ L, C: r.range(0.5, 4, 0.5) });
      }
      const T = (L: number) => 8 / 2 ** ((L - 90) / 5);
      const D = 100 * segs.reduce((a, s) => a + s.C / T(s.L), 0);
      const D3 = 100 * segs.reduce((a, s) => a + s.C / (8 / 2 ** ((s.L - 90) / 3)), 0);
      const list = segs.map((s) => `${n(s.C)} h at ${s.L} dBA`).join(", ");
      return {
        prompt: `An equipment operator's shift includes ${list}. Using the OSHA permissible exposure time T = 8/2^((L − 90)/5) hours and dose D = 100 Σ(C/T), what is the operator's daily noise dose?`,
        answer: D,
        unit: "%",
        distractors: [
          (100 * segs.reduce((a, s) => a + s.C, 0)) / 8, // ignored the sound levels
          D3, // used a 3 dB exchange rate
          100 * segs.reduce((a, s) => a + s.C / (8 * 2 ** ((s.L - 90) / 5)), 0), // let allowed time grow with level
        ],
        solution: segs.map((s) => `${s.L} dBA: T = ${f(T(s.L), 3)} h, C/T = ${f(s.C / T(s.L), 3)}`).join("\n") + `\nD = 100 × ${f(D / 100, 3)} = ${f(D)}%`,
      };
    },
  },

  // ---------- Structural: temporary structures ----------
  {
    id: "slab-shore-spacing",
    version: 1,
    title: "Square shore spacing under slab formwork",
    topics: { "pe-civil": "structural" },
    reference: "Formwork: tributary area = shore capacity / (concrete + formwork + construction live load)",
    generate(r) {
      const t = r.range(6, 12, 1);
      const fw = r.range(10, 15, 1);
      const LL = r.pick([50, 75]);
      const P = r.range(3000, 6000, 250);
      const w = (t / 12) * 150 + fw + LL;
      const s = Math.sqrt(P / w);
      return {
        prompt: `A ${t} in. thick concrete slab (150 pcf) is placed on formwork that weighs ${fw} psf, with a construction live load of ${LL} psf. Each shore has an allowable capacity of ${P.toLocaleString("en-US")} lb. What is the largest square shore spacing (same in both directions)?`,
        answer: s,
        unit: "ft",
        distractors: [
          Math.sqrt(P / ((t / 12) * 150 + fw)), // left out the construction live load
          Math.sqrt(P / ((t / 12) * 150)), // counted only the concrete
          Math.sqrt(P / (t * 150 / 12 * 2 + fw + LL)), // doubled the concrete weight
        ],
        solution: `Load = ${t}/12 × 150 + ${fw} + ${LL} = ${f(w, 4)} psf\nTributary area = ${P.toLocaleString("en-US")}/${f(w, 4)} = ${f(P / w, 4)} ft²\nSpacing = √${f(P / w, 4)} = ${f(s)} ft`,
      };
    },
  },
  {
    id: "outrigger-pad-size",
    version: 1,
    title: "Crane outrigger pad size for allowable bearing",
    topics: { "pe-civil": "structural" },
    reference: "Temporary support: pad area = reaction / allowable bearing pressure",
    generate(r) {
      const R = r.range(20, 120, 5);
      const q = r.range(2, 6, 0.5);
      const side = Math.sqrt(R / q);
      return {
        prompt: `A mobile crane's worst-case outrigger reaction during a lift is ${R} kips. The ground has an allowable bearing pressure of ${n(q)} ksf. What is the minimum side length of a square outrigger pad?`,
        answer: side,
        unit: "ft",
        distractors: [
          R / q, // reported the area as the side length
          Math.sqrt(R / (2 * q)), // split the reaction between two pads
          Math.sqrt((2 * R) / q), // doubled the reaction
        ],
        solution: `Area = ${R}/${n(q)} = ${f(R / q, 4)} ft²\nSide = √${f(R / q, 4)} = ${f(side)} ft`,
      };
    },
  },
  {
    id: "wall-brace-force",
    version: 1,
    title: "Axial force in a temporary wall brace",
    topics: { "pe-civil": "structural" },
    reference: "Temporary bracing: R = wsH²/(2hb), brace force = R/cos θ",
    generate(r) {
      const H = r.range(20, 35, 1);
      const w = r.range(10, 25, 1);
      const s = r.range(8, 15, 1);
      const hb = Math.round(H * r.range(0.6, 0.75, 0.05));
      const th = r.pick([45, 50, 55, 60]);
      const R = (w * s * H * H) / (2 * hb);
      const F = R / Math.cos((th * Math.PI) / 180);
      return {
        prompt: `A ${H} ft tall precast wall panel is pinned at its base and held by braces spaced ${s} ft apart. Each brace connects to the panel at a height of ${hb} ft and slopes down to the ground at an angle of ${th}° from horizontal. Under a wind pressure of ${w} psf over the full panel height, what is the axial force in each brace?`,
        answer: F,
        unit: "lb",
        distractors: [
          R, // the horizontal reaction, not the brace force
          R / Math.sin((th * Math.PI) / 180), // used sin instead of cos
          (w * s * H) / Math.cos((th * Math.PI) / 180), // put the whole wind force into the brace
        ],
        solution: `Moments about the base: R × ${hb} = ${w} × ${s} × ${H}²/2 → R = ${f(R, 4)} lb\nBrace force = R/cos ${th}° = ${f(R, 4)}/${f(Math.cos((th * Math.PI) / 180), 4)} = ${f(F)} lb`,
      };
    },
  },

  // ---------- Geotechnical: problematic soils ----------
  {
    id: "expansive-heave-layers",
    version: 1,
    title: "Heave of expansive clay from swell tests by layer",
    topics: { "pe-civil": "geotechnical" },
    reference: "Expansive soils: heave = Σ(swell % × layer thickness)",
    generate(r) {
      const layers = [0, 1, 2].map(() => ({ t: r.range(2, 6, 0.5), s: r.range(0.5, 6, 0.5) }));
      const heave = layers.reduce((a, l) => a + (l.s / 100) * l.t, 0) * 12;
      const total = layers.reduce((a, l) => a + l.t, 0);
      const desc = layers.map((l, i) => `layer ${i + 1} is ${n(l.t)} ft thick with ${n(l.s)}% swell`).join("; ");
      return {
        prompt: `Swell tests at the expected overburden stress on an expansive clay profile give: ${desc}. What total heave should be expected at the surface if all three layers become wetted?`,
        answer: heave,
        unit: "in",
        distractors: [
          (layers[0].s / 100) * total * 12, // applied the top layer's swell to the whole profile
          heave / 12, // reported feet as inches
          (layers[0].s / 100) * layers[0].t * 12, // counted only the top layer
        ],
        solution: layers.map((l, i) => `Layer ${i + 1}: ${n(l.s)}% × ${n(l.t)} ft = ${f((l.s / 100) * l.t, 3)} ft`).join("\n") + `\nTotal = ${f(heave / 12, 3)} ft = ${f(heave)} in`,
      };
    },
  },
  {
    id: "clay-activity",
    version: 1,
    title: "Activity of a clay",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Soil classification: A = PI / (% finer than 2 µm)",
    generate(r) {
      const PL = r.range(15, 35, 1);
      const PI = r.range(10, 50, 1);
      const LL = PL + PI;
      const c = r.range(10, 60, 1);
      const A = PI / c;
      return {
        prompt: `A clay has LL = ${LL} and PL = ${PL}, and it contains ${c}% (by weight) of particles finer than 2 µm. What is its activity?`,
        answer: A,
        unit: "",
        distractors: [
          LL / c, // used LL instead of PI
          PL / c, // used PL instead of PI
          c / PI, // inverted the ratio
        ],
        solution: `PI = ${LL} − ${PL} = ${PI}\nA = PI / clay fraction = ${PI}/${c} = ${f(A)}`,
      };
    },
  },

  // ---------- Geotechnical: earthquake engineering ----------
  {
    id: "vs30-average",
    version: 1,
    title: "Average shear wave velocity in the top 30 m",
    topics: { "pe-civil": "geotechnical" },
    reference: "Site class: V̄s30 = 30 / Σ(dᵢ/Vsᵢ)",
    generate(r) {
      for (;;) {
        const d1 = r.range(3, 12, 1);
        const d2 = r.range(5, 15, 1);
        const d3 = 30 - d1 - d2;
        if (d3 < 4) continue;
        const v = [r.range(150, 300, 10), r.range(250, 500, 10), r.range(400, 900, 10)];
        const d = [d1, d2, d3];
        const Vs = 30 / d.reduce((a, di, i) => a + di / v[i], 0);
        const desc = d.map((di, i) => `${di} m with Vs = ${v[i]} m/s`).join(", then ");
        return {
          prompt: `The top 30 m at a site consists of ${desc}. What is the average shear wave velocity V̄s30 = 30/Σ(dᵢ/Vsᵢ)?`,
          answer: Vs,
          unit: "m/s",
          distractors: [
            d.reduce((a, di, i) => a + di * v[i], 0) / 30, // thickness-weighted arithmetic mean
            (v[0] + v[1] + v[2]) / 3, // simple average of the velocities
            3 / v.reduce((a, vi) => a + 1 / vi, 0), // ignored the layer thicknesses
          ],
          solution: d.map((di, i) => `${di}/${v[i]} = ${f(di / v[i], 4)} s`).join("\n") + `\nV̄s30 = 30/${f(30 / Vs, 4)} = ${f(Vs)} m/s`,
        };
      }
    },
  },
  {
    id: "site-fundamental-period",
    version: 1,
    title: "Fundamental period of a soil layer",
    topics: { "pe-civil": "geotechnical", "fe-civil": "geotechnical" },
    reference: "Site response: T = 4H/Vs",
    generate(r) {
      const H = r.range(10, 60, 2);
      const Vs = r.range(150, 500, 10);
      const T = (4 * H) / Vs;
      return {
        prompt: `A uniform soil deposit ${H} m thick with shear wave velocity Vs = ${Vs} m/s lies on bedrock. Using T = 4H/Vs, what is the fundamental period of the soil column?`,
        answer: T,
        unit: "s",
        distractors: [
          H / Vs, // left out the factor of 4
          (2 * H) / Vs, // used 2H
          Vs / (4 * H), // computed the frequency instead
        ],
        solution: `T = 4 × ${H}/${Vs} = ${f(T)} s`,
      };
    },
  },

  // ---------- Geotechnical: site characterization ----------
  {
    id: "cpt-friction-ratio",
    version: 1,
    title: "CPT friction ratio",
    topics: { "pe-civil": "geotechnical" },
    reference: "Cone penetration test: Rf = fs/qc × 100%",
    generate(r) {
      const qc = r.range(1, 25, 0.5);
      const fs = r.range(10, 250, 5);
      const Rf = (fs / (qc * 1000)) * 100;
      return {
        prompt: `At one depth, a cone penetration test reads tip resistance qc = ${n(qc)} MPa and sleeve friction fs = ${fs} kPa. What is the friction ratio Rf = fs/qc?`,
        answer: Rf,
        unit: "%",
        distractors: [
          (fs / qc) / 1000, // didn't convert to percent
          (qc * 1000) / fs, // inverted the ratio
          (fs / (qc * 100)) * 100, // converted MPa to kPa with 100
        ],
        solution: `qc = ${n(qc)} MPa = ${f(qc * 1000, 5)} kPa\nRf = ${fs}/${f(qc * 1000, 5)} × 100 = ${f(Rf)}%`,
      };
    },
  },
];
