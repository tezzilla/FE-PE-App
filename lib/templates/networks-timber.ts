import { f, n, type Template } from "./engine";

// Fourth batch from docs/EXAM-COVERAGE.md: pipe networks, gravity sewers, timber members, pile groups,
// earthwork balance, AASHTO group index, and FE gaps (orifices, buoyancy, momentum, area by coordinates,
// rotation, beam shear stress). All problem text is original. Code factors are stated in the prompt.
// Each template has an independent solver in verify.ts.

const g = 9.81;
const rad = (x: number) => (x * Math.PI) / 180;

export const NETWORKS_TIMBER: Template[] = [
  // ---------------------------------------------------------------- Water Resources & Environmental
  {
    id: "parallel-pipes-hw",
    version: 1,
    title: "Flow split between two parallel pipes (Hazen-Williams)",
    topics: { "pe-civil": "water-env" },
    reference: "Pipe networks: parallel pipes, equal head loss",
    generate(r) {
      for (;;) {
        const D1 = r.pick([6, 8, 10, 12, 16]);
        const D2 = r.pick([6, 8, 10, 12, 16]);
        const L1 = r.range(500, 3000, 100);
        const L2 = r.range(500, 3000, 100);
        const C1 = r.pick([100, 110, 120, 130]);
        const C2 = r.pick([100, 110, 120, 130]);
        const Q = r.range(1, 10, 0.1);
        const k = (C: number, D: number, L: number) => (C * (D / 12) ** 2.63) / L ** 0.54;
        const k1 = k(C1, D1, L1), k2 = k(C2, D2, L2);
        const Q1 = (Q * k1) / (k1 + k2);
        if (Q1 / Q < 0.1 || Q1 / Q > 0.9) continue;
        return {
          prompt: `A total flow of ${n(Q)} cfs divides between two parallel pipes that rejoin downstream. Pipe 1 is ${D1} in diameter, ${n(L1)} ft long, C = ${C1}. Pipe 2 is ${D2} in diameter, ${n(L2)} ft long, C = ${C2}. Using Hazen-Williams and ignoring minor losses, what flow does pipe 1 carry?`,
          answer: Q1,
          unit: "cfs",
          distractors: [
            (Q * D1 ** 2) / (D1 ** 2 + D2 ** 2), // split by cross-sectional area
            (Q * C1 * D1 ** 2.63) / (C1 * D1 ** 2.63 + C2 * D2 ** 2.63), // ignored the pipe lengths
            Q / 2, // split the flow equally
            Q - Q1, // gave the flow in pipe 2
            (Q * L2) / (L1 + L2), // split inversely by length only
          ],
          solution: `Both pipes have the same head loss. From Hazen-Williams, Q ∝ C D^2.63 (h/L)^0.54, so each pipe's share is proportional to k = C D^2.63/L^0.54.\nk₁ = ${C1}(${f(D1 / 12, 4)})^2.63/${n(L1)}^0.54 = ${f(k1, 4)}\nk₂ = ${C2}(${f(D2 / 12, 4)})^2.63/${n(L2)}^0.54 = ${f(k2, 4)}\nQ₁ = ${n(Q)} × ${f(k1, 4)}/(${f(k1, 4)} + ${f(k2, 4)}) = ${f(Q1)} cfs`,
        };
      }
    },
  },
  {
    id: "series-pipes-darcy",
    version: 1,
    title: "Head loss through two pipes in series (Darcy-Weisbach)",
    topics: { "pe-civil": "water-env", "fe-civil": "fluids" },
    reference: "Closed conduits: pipes in series",
    generate(r) {
      for (;;) {
        const Q = r.range(0.02, 0.3, 0.01);
        const D1 = r.pick([0.2, 0.25, 0.3, 0.4]);
        const D2 = r.pick([0.15, 0.2, 0.25, 0.3]);
        if (D2 >= D1) continue;
        const L1 = r.range(100, 1500, 50);
        const L2 = r.range(100, 1500, 50);
        const f1 = r.range(0.015, 0.025, 0.001);
        const f2 = r.range(0.015, 0.03, 0.001);
        const V1 = Q / ((Math.PI * D1 * D1) / 4), V2 = Q / ((Math.PI * D2 * D2) / 4);
        if (V2 > 4 || V1 < 0.4) continue;
        const h1 = f1 * (L1 / D1) * (V1 * V1) / (2 * g), h2 = f2 * (L2 / D2) * (V2 * V2) / (2 * g);
        return {
          prompt: `A flow of ${n(Q)} m³/s passes through ${n(L1)} m of ${n(D1)} m pipe (f = ${n(f1)}) followed by ${n(L2)} m of ${n(D2)} m pipe (f = ${n(f2)}). Ignoring minor losses, what is the total friction head loss?`,
          answer: h1 + h2,
          unit: "m",
          distractors: [
            (f1 * ((L1 + L2) / D1) * V1 * V1) / (2 * g), // used the first pipe's size for the whole length
            h2, // counted only the smaller (higher-loss) pipe
            f1 * (L1 / D1) * V1 / (2 * g) + f2 * (L2 / D2) * V2 / (2 * g), // forgot to square the velocity
          ],
          solution: `V₁ = ${n(Q)}/(π × ${n(D1)}²/4) = ${f(V1, 4)} m/s; V₂ = ${n(Q)}/(π × ${n(D2)}²/4) = ${f(V2, 4)} m/s\nh₁ = ${n(f1)}(${n(L1)}/${n(D1)})(${f(V1, 4)}²/19.62) = ${f(h1, 4)} m\nh₂ = ${n(f2)}(${n(L2)}/${n(D2)})(${f(V2, 4)}²/19.62) = ${f(h2, 4)} m\nTotal = ${f(h1 + h2)} m`,
        };
      }
    },
  },
  {
    id: "sewer-full-flow-capacity",
    version: 1,
    title: "Full-flow capacity of a circular gravity sewer (Manning, US)",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Wastewater collection: Manning equation for full circular pipes",
    generate(r) {
      const Din = r.pick([8, 10, 12, 15, 18, 21, 24, 30, 36]);
      const nn = r.pick([0.011, 0.012, 0.013, 0.015]);
      const S = r.range(0.001, 0.01, 0.0001);
      const D = Din / 12;
      const A = (Math.PI * D * D) / 4;
      const Q = (1.486 / nn) * A * (D / 4) ** (2 / 3) * Math.sqrt(S);
      return {
        prompt: `A ${Din}-in circular sewer (n = ${nn}) is laid at a slope of ${n(S)} ft/ft. What is its capacity flowing full?`,
        answer: Q,
        unit: "cfs",
        distractors: [
          (1.486 / nn) * A * (D / 2) ** (2 / 3) * Math.sqrt(S), // used R = D/2 instead of D/4
          (1 / nn) * A * (D / 4) ** (2 / 3) * Math.sqrt(S), // used the SI constant 1.0 with US units
          (1.486 / nn) * D * D * (D / 4) ** (2 / 3) * Math.sqrt(S), // used A = D² instead of πD²/4
        ],
        solution: `D = ${Din}/12 = ${f(D, 4)} ft; A = πD²/4 = ${f(A, 4)} ft²; R = D/4 = ${f(D / 4, 4)} ft (full pipe)\nQ = (1.486/n)AR^(2/3)S^(1/2) = (1.486/${nn})(${f(A, 4)})(${f(D / 4, 4)})^(2/3)(${n(S)})^(1/2) = ${f(Q)} cfs`,
      };
    },
  },
  {
    id: "sewer-min-slope",
    version: 1,
    title: "Minimum sewer slope for self-cleansing velocity",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater collection: minimum slope for 2 ft/s flowing full",
    generate(r) {
      const Din = r.pick([8, 10, 12, 15, 18, 21, 24, 30, 36]);
      const nn = r.pick([0.012, 0.013, 0.015]);
      const D = Din / 12;
      const S = ((2 * nn) / (1.486 * (D / 4) ** (2 / 3))) ** 2;
      return {
        prompt: `What is the minimum slope for a ${Din}-in sewer (n = ${nn}) to reach a self-cleansing velocity of 2.0 ft/s when flowing full?`,
        answer: S,
        unit: "ft/ft",
        distractors: [
          (2 * nn) / (1.486 * (D / 4) ** (2 / 3)), // forgot to square
          ((2 * nn) / (1.486 * (D / 2) ** (2 / 3))) ** 2, // used R = D/2
          ((2 * nn) / (1.486 * (Din / 4) ** (2 / 3))) ** 2, // left the diameter in inches
        ],
        solution: `V = (1.486/n)R^(2/3)S^(1/2), so S = [nV/(1.486R^(2/3))]²\nR = D/4 = (${Din}/12)/4 = ${f(D / 4, 4)} ft\nS = [${nn} × 2.0/(1.486 × ${f(D / 4, 4)}^(2/3))]² = ${f(S)} ft/ft`,
      };
    },
  },

  // ---------------------------------------------------------------- Structural (timber, NDS ASD)
  {
    id: "timber-joist-allowable-moment",
    version: 1,
    title: "Allowable moment of a sawn lumber joist (NDS, ASD)",
    topics: { "pe-civil": "structural" },
    reference: "NDS Chapter 4: adjusted bending design value F'b",
    generate(r) {
      const d = r.pick([5.5, 7.25, 9.25, 11.25]);
      const b = 1.5;
      const Fb = r.pick([875, 900, 1000, 1150, 1350]);
      const CF = r.pick([1.0, 1.1, 1.2, 1.3]);
      const dur = r.pick([
        { t: "snow", CD: 1.15 },
        { t: "occupancy live", CD: 1.0 },
        { t: "construction", CD: 1.25 },
      ] as const);
      const Cr = 1.15;
      const Fbp = Fb * dur.CD * CF * Cr;
      const S = (b * d * d) / 6;
      const M = (Fbp * S) / 12;
      return {
        prompt: `Floor joists ${b} in × ${d} in (actual size) are spaced 16 in on center with sheathing, so the repetitive member factor Cr = 1.15 applies. The reference bending value is Fb = ${Fb} psi, the size factor CF = ${CF.toFixed(1)}, and the governing load is ${dur.t} (CD = ${dur.CD.toFixed(2)}). The joists are dry, at normal temperature and fully braced (all other factors 1.0). What is the allowable bending moment per joist?`,
        answer: M,
        unit: "lb·ft",
        distractors: [
          (Fb * CF * Cr * S) / 12, // left out the load duration factor
          (Fb * dur.CD * CF * S) / 12, // left out the repetitive member factor
          (Fbp * ((b * d * d) / 12)) / 12, // used bd²/12 for the section modulus
        ],
        solution: `F'b = Fb × CD × CF × Cr = ${Fb} × ${dur.CD.toFixed(2)} × ${CF.toFixed(1)} × 1.15 = ${f(Fbp, 4)} psi\nS = bd²/6 = ${b}(${d})²/6 = ${f(S, 4)} in³\nM = F'b S = ${f(Fbp * S, 5)} lb·in = ${f(M)} lb·ft`,
      };
    },
  },
  {
    id: "timber-column-capacity",
    version: 1,
    title: "Allowable axial load on a sawn timber column (NDS column stability)",
    topics: { "pe-civil": "structural" },
    reference: "NDS Section 3.7: column stability factor Cp",
    generate(r) {
      for (;;) {
        const d = r.pick([5.5, 7.5, 9.5]);
        const Fc = r.pick([600, 700, 800, 925, 1000]);
        const Emin = r.pick([440000, 470000, 510000, 580000]);
        const le = r.range(8, 16, 0.5);
        const CD = r.pick([1.0, 1.15]);
        const slender = (le * 12) / d;
        if (slender > 50) continue;
        const FcStar = Fc * CD;
        const FcE = (0.822 * Emin) / slender ** 2;
        const a = FcE / FcStar;
        const c = 0.8;
        const Cp = (1 + a) / (2 * c) - Math.sqrt(((1 + a) / (2 * c)) ** 2 - a / c);
        const P = (FcStar * Cp * d * d) / 1000;
        return {
          prompt: `A square sawn timber post, ${d} in × ${d} in actual, has an effective length of ${n(le)} ft about both axes. Fc = ${Fc} psi, E'min = ${n(Emin)} psi, and the load duration factor is CD = ${CD.toFixed(2)} (all other factors on Fc are 1.0). Using the NDS column stability factor with c = 0.8, what is the allowable axial load?`,
          answer: P,
          unit: "kips",
          distractors: [
            (FcStar * d * d) / 1000, // left out Cp (no buckling reduction)
            (FcStar * ((1 + a) / 1.8 - Math.sqrt(((1 + a) / 1.8) ** 2 - a / 0.9)) * d * d) / 1000, // used c = 0.9 (glulam)
            (Math.min(FcE, FcStar) * d * d) / 1000, // used the smaller of FcE and Fc* instead of Cp
          ],
          solution: `le/d = ${n(le)} × 12/${d} = ${f(slender, 4)} (≤ 50 OK)\nFc* = Fc × CD = ${f(FcStar, 4)} psi; FcE = 0.822E'min/(le/d)² = ${f(FcE, 4)} psi; α = FcE/Fc* = ${f(a, 4)}\nCp = (1 + α)/(2c) − √[((1 + α)/(2c))² − α/c] = ${f(Cp, 4)}\nP = Fc* Cp A = ${f(FcStar, 4)} × ${f(Cp, 4)} × ${f(d * d, 4)} = ${f(P * 1000, 4)} lb = ${f(P)} kips`,
        };
      }
    },
  },

  // ---------------------------------------------------------------- Geotechnical / Construction
  {
    id: "pile-group-efficiency",
    version: 1,
    title: "Pile group capacity with the Converse-Labarre efficiency",
    topics: { "pe-civil": "geotechnical" },
    reference: "Deep foundations: pile group efficiency (Converse-Labarre)",
    generate(r) {
      const m = r.range(2, 4, 1);
      const nc = r.range(2, 5, 1);
      const D = r.range(0.3, 0.6, 0.05);
      const s = Number((D * r.range(2.5, 4, 0.5)).toFixed(3));
      const Q = r.range(300, 1500, 50);
      const th = (Math.atan(D / s) * 180) / Math.PI;
      const Eg = 1 - (th * ((nc - 1) * m + (m - 1) * nc)) / (90 * m * nc);
      const Qg = Eg * m * nc * Q;
      return {
        prompt: `A pile group has ${m} rows of ${nc} piles. Each pile is ${n(D)} m in diameter, the center-to-center spacing is ${n(s)} m, and a single pile's capacity is ${Q} kN. Using the Converse-Labarre efficiency, E = 1 − θ[(n − 1)m + (m − 1)n]/(90mn) with θ = arctan(D/s) in degrees, what is the group capacity?`,
        answer: Qg,
        unit: "kN",
        distractors: [
          m * nc * Q, // ignored group efficiency
          (1 - (Math.atan(D / s) * ((nc - 1) * m + (m - 1) * nc)) / (90 * m * nc)) * m * nc * Q, // used θ in radians
          Eg * Q, // applied the efficiency to a single pile
        ],
        solution: `θ = arctan(${n(D)}/${n(s)}) = ${f(th, 4)}°\nE = 1 − ${f(th, 4)}[(${nc} − 1)(${m}) + (${m} − 1)(${nc})]/(90 × ${m} × ${nc}) = ${f(Eg, 4)}\nQ_group = E × m × n × Q = ${f(Eg, 4)} × ${m * nc} × ${Q} = ${f(Qg)} kN`,
      };
    },
  },
  {
    id: "earthwork-waste-shrinkage",
    version: 1,
    title: "Excess cut to waste after accounting for shrinkage",
    topics: { "pe-civil": "construction", "fe-civil": "surveying" },
    reference: "Earthwork: bank, loose and compacted volumes; shrinkage",
    generate(r) {
      for (;;) {
        const cut = r.range(20000, 100000, 500);
        const fill = r.range(10000, 90000, 500);
        const sh = r.range(10, 25, 1);
        const need = fill / (1 - sh / 100);
        const waste = cut - need;
        if (waste < 1000) continue;
        return {
          prompt: `A road project has ${n(cut)} bank yd³ of cut and needs ${n(fill)} compacted yd³ of fill. The cut material shrinks ${sh}% from bank to compacted volume. If all fill comes from the cut, how many bank cubic yards of excess cut must be wasted?`,
          answer: waste,
          unit: "bank yd³",
          distractors: [
            cut - fill, // ignored shrinkage
            cut - fill * (1 + sh / 100), // multiplied by (1 + shrinkage) instead of dividing by (1 − shrinkage)
            cut - fill * (1 - sh / 100), // applied shrinkage in the wrong direction
          ],
          solution: `Compacted = bank × (1 − shrinkage), so bank needed = ${n(fill)}/(1 − ${sh / 100}) = ${f(need, 5)} bank yd³\nWaste = ${n(cut)} − ${f(need, 5)} = ${f(waste)} bank yd³`,
        };
      }
    },
  },
  {
    id: "aashto-group-index",
    version: 1,
    title: "AASHTO group index of a fine-grained soil",
    topics: { "pe-civil": "transportation", "fe-civil": "geotechnical" },
    reference: "AASHTO M 145: soil classification, group index",
    generate(r) {
      for (;;) {
        const F = r.range(40, 95, 1);
        const LL = r.range(30, 75, 1);
        const PI = r.range(11, Math.max(12, Math.min(45, LL - 10)), 1);
        const raw = (F - 35) * (0.2 + 0.005 * (LL - 40)) + 0.01 * (F - 15) * (PI - 10);
        const GI = Math.max(0, Math.round(raw));
        if (GI < 2) continue;
        const t1 = (F - 35) * (0.2 + 0.005 * (LL - 40));
        const t2 = 0.01 * (F - 15) * (PI - 10);
        return {
          prompt: `A fine-grained soil has ${F}% passing the No. 200 sieve, a liquid limit of ${LL} and a plasticity index of ${PI}. Using GI = (F − 35)[0.2 + 0.005(LL − 40)] + 0.01(F − 15)(PI − 10), what is its AASHTO group index (nearest whole number)?`,
          answer: GI,
          unit: "",
          sig: 4,
          distractors: [
            Math.round(t1), // left out the plasticity term
            Math.round(F * (0.2 + 0.005 * (LL - 40)) + 0.01 * F * (PI - 10)), // used F without subtracting 35 and 15
            Math.round(t2), // left out the liquid limit term
          ],
          solution: `First term: (${F} − 35)[0.2 + 0.005(${LL} − 40)] = ${f(t1, 4)}\nSecond term: 0.01(${F} − 15)(${PI} − 10) = ${f(t2, 4)}\nGI = ${f(raw, 4)} → ${GI}`,
        };
      }
    },
  },

  // ---------------------------------------------------------------- FE gaps
  {
    id: "orifice-discharge",
    version: 1,
    title: "Discharge through a sharp-edged orifice",
    topics: { "fe-civil": "fluids" },
    reference: "FE Reference Handbook: Fluid Mechanics, orifices",
    generate(r) {
      const d = r.range(25, 150, 5);
      const h = r.range(0.5, 6, 0.1);
      const Cd = r.range(0.6, 0.65, 0.01);
      const A = (Math.PI * (d / 1000) ** 2) / 4;
      const Q = Cd * A * Math.sqrt(2 * g * h) * 1000;
      return {
        prompt: `Water discharges from a tank through a ${d} mm sharp-edged orifice in its side. The water surface is held ${n(h)} m above the orifice center, and the discharge coefficient is ${n(Cd)}. What is the flow rate?`,
        answer: Q,
        unit: "L/s",
        distractors: [
          A * Math.sqrt(2 * g * h) * 1000, // left out Cd
          Cd * A * Math.sqrt(g * h) * 1000, // used √(gh) instead of √(2gh)
          Cd * Math.PI * (d / 1000) ** 2 * Math.sqrt(2 * g * h) * 1000, // used the diameter as the radius in the area
        ],
        solution: `A = π(${d / 1000})²/4 = ${f(A, 4)} m²\nQ = C_d A √(2gh) = ${n(Cd)} × ${f(A, 4)} × √(2 × 9.81 × ${n(h)}) = ${f(Q / 1000, 4)} m³/s = ${f(Q)} L/s`,
      };
    },
  },
  {
    id: "floating-block-freeboard",
    version: 1,
    title: "Freeboard of a floating block (buoyancy)",
    topics: { "fe-civil": "fluids" },
    reference: "FE Reference Handbook: Fluid Mechanics, buoyancy",
    generate(r) {
      const H = r.range(0.2, 2, 0.05);
      const s = r.range(0.4, 0.9, 0.01);
      const sea = r.next() < 0.5;
      const sf = sea ? 1.025 : 1.0;
      const fb = H - (s / sf) * H;
      return {
        prompt: `A solid rectangular block ${n(H)} m tall, with specific gravity ${n(s)}, floats upright in ${sea ? "seawater (specific gravity 1.025)" : "fresh water"}. How far does the top of the block sit above the water surface?`,
        answer: fb,
        unit: "m",
        distractors: [
          (s / sf) * H, // gave the submerged depth instead
          H - s * sf * H, // multiplied by the fluid specific gravity
          H - (sea ? s : s / 1.025) * H, // used the wrong fluid density
        ],
        solution: `Floating: weight = buoyancy, so s × H = s_f × draft\nDraft = (${n(s)}/${sf}) × ${n(H)} = ${f((s / sf) * H, 4)} m\nFreeboard = ${n(H)} − ${f((s / sf) * H, 4)} = ${f(fb)} m`,
      };
    },
  },
  {
    id: "pipe-bend-force",
    version: 1,
    title: "Resultant force on a 90° pipe bend (momentum)",
    topics: { "fe-civil": "fluids", "pe-civil": "water-env" },
    reference: "FE Reference Handbook: Fluid Mechanics, impulse-momentum",
    generate(r) {
      const D = r.pick([0.15, 0.2, 0.25, 0.3, 0.4, 0.5]);
      const V = r.range(1, 4, 0.1);
      const p = r.range(100, 800, 10);
      const A = (Math.PI * D * D) / 4;
      const Q = V * A;
      const each = p * A + (1000 * Q * V) / 1000; // kN
      const R = Math.SQRT2 * each;
      return {
        prompt: `Water flows at ${n(V)} m/s through a horizontal 90° bend in a ${n(D)} m pipe. The gage pressure is ${p} kPa at both the inlet and outlet (ignore losses and the weight of the water). What is the resultant force the water exerts on the bend?`,
        answer: R,
        unit: "kN",
        distractors: [
          Math.SQRT2 * p * A, // left out the momentum term
          each, // took one component only (no √2)
          2 * each, // added the two components instead of combining them as vectors
        ],
        solution: `A = π(${n(D)})²/4 = ${f(A, 4)} m²; Q = VA = ${f(Q, 4)} m³/s\nEach direction: pA + ρQV = ${p}(${f(A, 4)}) + (1,000)(${f(Q, 4)})(${n(V)})/1,000 = ${f(each, 4)} kN\nR = √2 × ${f(each, 4)} = ${f(R)} kN`,
      };
    },
  },
  {
    id: "area-by-coordinates",
    version: 1,
    title: "Area of a parcel by coordinates",
    topics: { "fe-civil": "surveying" },
    reference: "FE Reference Handbook: Surveying, area by coordinates",
    generate(r) {
      for (;;) {
        const cx = 500, cy = 500;
        const angs = [0, 1, 2, 3].map((k) => k * 90 + r.range(-30, 30, 1));
        const pts = angs.map((a) => {
          const rr = r.range(150, 380, 5);
          return [Math.round(cx + rr * Math.cos(rad(a))), Math.round(cy + rr * Math.sin(rad(a)))];
        });
        let s = 0;
        for (let i = 0; i < 4; i++) {
          const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 4];
          s += x1 * y2 - x2 * y1;
        }
        const area = Math.abs(s) / 2;
        if (area < 20000) continue;
        const L = ["A", "B", "C", "D"];
        const list = pts.map(([e, nn], i) => `${L[i]} (E ${e}, N ${nn})`).join(", ");
        return {
          prompt: `The corners of a parcel, in order around its boundary, have coordinates (in ft) of ${list}. What is the parcel's area?`,
          answer: area,
          unit: "ft²",
          sig: 4,
          distractors: [
            Math.abs(s), // forgot to halve the cross-product sum
            (Math.max(...pts.map((q) => q[0])) - Math.min(...pts.map((q) => q[0]))) * (Math.max(...pts.map((q) => q[1])) - Math.min(...pts.map((q) => q[1]))), // used the bounding rectangle
            Math.abs(pts.reduce((t, [x1], i) => t + x1 * pts[(i + 1) % 4][1], 0)) / 2, // used only one direction of the cross products
          ],
          solution: `Area = ½|Σ(E_i N_(i+1) − E_(i+1) N_i)| going around A → B → C → D → A\n= ½|${f(s, 7)}| = ${f(area, 6)} ft² (${f(area / 43560, 4)} ac)`,
        };
      }
    },
  },
  {
    id: "disk-spin-up-time",
    version: 1,
    title: "Time for a disk to reach a speed under constant torque",
    topics: { "fe-civil": "dynamics" },
    reference: "FE Reference Handbook: Dynamics, rigid body rotation, mass moment of inertia",
    generate(r) {
      const m = r.range(5, 200, 5);
      const R = r.range(0.1, 1, 0.05);
      const T = r.range(2, 80, 1);
      const rpm = r.range(100, 3000, 50);
      const I = 0.5 * m * R * R;
      const w = (rpm * 2 * Math.PI) / 60;
      const t = w / (T / I);
      return {
        prompt: `A solid uniform disk of mass ${m} kg and radius ${n(R)} m starts from rest. A constant torque of ${T} N·m acts on it (ignore friction). How long does it take to reach ${n(rpm)} rpm?`,
        answer: t,
        unit: "s",
        distractors: [
          w / (T / (m * R * R)), // used I = mR² (a thin ring)
          rpm / (T / I), // didn't convert rpm to rad/s
          w / (T / (0.5 * m * (2 * R) ** 2)), // used the diameter in I = ½mr²
        ],
        solution: `I = ½mR² = ½(${m})(${n(R)})² = ${f(I, 4)} kg·m²\nα = T/I = ${T}/${f(I, 4)} = ${f(T / I, 4)} rad/s²\nω = ${n(rpm)} × 2π/60 = ${f(w, 4)} rad/s\nt = ω/α = ${f(t)} s`,
      };
    },
  },
  {
    id: "beam-shear-stress-at-y",
    version: 1,
    title: "Shear stress at a point in a rectangular beam (VQ/Ib)",
    topics: { "fe-civil": "mechanics-materials" },
    reference: "FE Reference Handbook: Mechanics of Materials, transverse shear stress",
    generate(r) {
      for (;;) {
        const b = r.range(100, 300, 10);
        const h = r.range(200, 600, 10);
        const V = r.range(20, 300, 5);
        const y = r.range(10, h / 2 - 20, 5);
        const I = (b * h ** 3) / 12;
        const Q = b * (h / 2 - y) * ((h / 2 + y) / 2);
        const tau = (V * 1000 * Q) / (I * b);
        if (tau < 0.05) continue;
        return {
          prompt: `A rectangular beam ${b} mm wide and ${h} mm deep carries a shear force of ${V} kN at a section. What is the shear stress at a point ${y} mm above the neutral axis?`,
          answer: tau,
          unit: "MPa",
          distractors: [
            (1.5 * V * 1000) / (b * h), // gave the maximum (at the neutral axis)
            (V * 1000) / (b * h), // gave the average shear stress V/A
            ((V * 1000) * b * (h / 2 - y) * (h / 2 - y) / 2) / (I * b), // took the centroid distance from the top, not from the neutral axis
          ],
          solution: `I = bh³/12 = ${f(I, 5)} mm⁴\nQ = area above y × distance to its centroid = ${b}(${h / 2} − ${y}) × (${h / 2} + ${y})/2 = ${f(Q, 5)} mm³\nτ = VQ/(Ib) = (${V} × 1,000)(${f(Q, 5)})/(${f(I, 5)} × ${b}) = ${f(tau)} MPa`,
        };
      }
    },
  },
];
