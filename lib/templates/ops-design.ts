import { f, n, type Template } from "./engine";

// Third batch from docs/EXAM-COVERAGE.md "Next batch": wind pressure, footing shear, braced cuts,
// crane mats, signal timing, intersection sight distance, sludge and nitrification, NRCS unit
// hydrograph peaks, detention storage and compaction. All problem text is original. Code factors and
// constants are stated in the prompt. Each template has an independent solver in verify.ts.

const rad = (x: number) => (x * Math.PI) / 180;

export const OPS_DESIGN: Template[] = [
  // ---------------------------------------------------------------- Structural
  {
    id: "wind-windward-pressure",
    version: 1,
    title: "Windward wall design wind pressure",
    topics: { "pe-civil": "structural" },
    reference: "ASCE 7 Chapters 26–27: velocity pressure and external pressure",
    generate(r) {
      const V = r.range(100, 180, 5);
      const Kz = r.pick([0.85, 0.94, 1.04, 1.13, 1.22]);
      const qz = 0.00256 * Kz * 1.0 * 1.0 * V * V;
      const p = qz * 0.85 * 0.85 * 0.8;
      return {
        prompt: `A low enclosed building has a basic wind speed of ${V} mph. At the height considered, Kz = ${Kz}, Kzt = 1.0 and Ke = 1.0. Using qz = 0.00256KzKztKeV² and an external pressure on the windward wall of p = qzKdGCp with Kd = 0.85, G = 0.85 and Cp = 0.8 (ignore internal pressure), what is the windward wall design pressure?`,
        answer: p,
        unit: "psf",
        distractors: [
          qz, // stopped at the velocity pressure
          qz * 0.85 * 0.8, // left out Kd
          qz * 0.85 * 0.85 * 0.5, // used the leeward-style coefficient 0.5
        ],
        solution: `qz = 0.00256(${Kz})(1.0)(1.0)(${V})² = ${f(qz)} psf\np = qzKdGCp = ${f(qz)} × 0.85 × 0.85 × 0.8 = ${f(p)} psf`,
      };
    },
  },
  {
    id: "footing-punching-shear-vu",
    version: 1,
    title: "Two-way (punching) shear demand on a square footing",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Section 22.6: critical section at d/2 from the column face",
    generate(r) {
      for (;;) {
        const B = r.range(6, 14, 0.5);
        const c = r.range(12, 24, 2);
        const d = r.range(12, 30, 1);
        const Pu = r.range(200, 1200, 10);
        const side = (c + d) / 12;
        if (side > 0.7 * B) continue;
        const qu = Pu / (B * B);
        const Vu = qu * (B * B - side * side);
        return {
          prompt: `A square column ${c} in × ${c} in sits on a square footing ${n(B)} ft × ${n(B)} ft with an effective depth d = ${d} in. The factored column load is ${Pu} kips; ignore the weight of the footing and soil. What is the factored two-way (punching) shear Vu on the critical section?`,
          answer: Vu,
          unit: "kips",
          distractors: [
            qu * (B * B - (c / 12) ** 2), // took the critical section at the column face
            qu * (B * B - ((c + 2 * d) / 12) ** 2), // took the critical section at d (not d/2) from the face
            Pu, // didn't subtract the soil pressure inside the critical section
          ],
          solution: `Net factored soil pressure qu = Pu/B² = ${Pu}/${n(B)}² = ${f(qu, 4)} ksf\nCritical section at d/2 from each face: side = c + d = ${c} + ${d} = ${c + d} in = ${f(side, 4)} ft\nVu = qu(B² − (c + d)²) = ${f(qu, 4)}(${f(B * B, 4)} − ${f(side * side, 4)}) = ${f(Vu)} kips`,
        };
      }
    },
  },
  {
    id: "footing-one-way-shear-vu",
    version: 1,
    title: "One-way (beam) shear demand on a square footing",
    topics: { "pe-civil": "structural" },
    reference: "ACI 318 Section 22.5: critical section at d from the column face",
    generate(r) {
      for (;;) {
        const B = r.range(6, 14, 0.5);
        const c = r.range(12, 24, 2);
        const d = r.range(12, 24, 1);
        const Pu = r.range(200, 1200, 10);
        const x = B / 2 - c / 24 - d / 12;
        if (x < 0.75) continue;
        const qu = Pu / (B * B);
        const Vu = qu * B * x;
        return {
          prompt: `A square column ${c} in × ${c} in sits on a square footing ${n(B)} ft × ${n(B)} ft with an effective depth d = ${d} in. The factored column load is ${Pu} kips; ignore the weight of the footing and soil. What is the factored one-way shear Vu at the critical section?`,
          answer: Vu,
          unit: "kips",
          distractors: [
            qu * B * (B / 2 - c / 24), // took the critical section at the column face
            qu * B * (B / 2 - d / 12), // measured d from the column centerline
            qu * B * (B / 2 - c / 24 - d / 24), // used d/2 (the two-way location)
          ],
          solution: `qu = Pu/B² = ${Pu}/${n(B)}² = ${f(qu, 4)} ksf\nCritical section at d from the column face: distance to footing edge = B/2 − c/2 − d = ${n(B / 2)} − ${f(c / 24, 4)} − ${f(d / 12, 4)} = ${f(x, 4)} ft\nVu = qu × B × ${f(x, 4)} = ${f(Vu)} kips`,
        };
      }
    },
  },

  // ---------------------------------------------------------------- Geotechnical / Construction
  {
    id: "braced-cut-strut-load",
    version: 1,
    title: "Strut load in a braced excavation in sand (apparent pressure)",
    topics: { "pe-civil": "geotechnical" },
    reference: "Braced excavations: Peck apparent earth pressure diagram for sand",
    generate(r) {
      const H = r.range(6, 14, 0.5);
      const gm = r.range(17, 20, 0.5);
      const phi = r.range(30, 38, 1);
      const sv = r.range(2, 3, 0.25);
      const sh = r.range(2, 5, 0.5);
      const Ka = Math.tan(rad(45 - phi / 2)) ** 2;
      const s = 0.65 * Ka * gm * H;
      const P = s * sv * sh;
      return {
        prompt: `A ${n(H)} m deep braced excavation in dry sand (γ = ${n(gm)} kN/m³, φ = ${phi}°) is supported by struts spaced ${n(sh)} m apart horizontally. An interior strut carries a tributary height of ${n(sv)} m. Using Peck's apparent pressure for sand, σ = 0.65KaγH (Rankine Ka), what is the load in that strut?`,
        answer: P,
        unit: "kN",
        distractors: [
          Ka * gm * H * sv * sh, // left out the 0.65
          0.65 * Ka * gm * H * sv, // forgot the horizontal spacing (per metre of wall)
          0.65 * (1 - Math.sin(rad(phi))) * gm * H * sv * sh, // used K₀ instead of Ka
        ],
        solution: `Ka = tan²(45° − ${phi}°/2) = ${f(Ka, 4)}\nσ = 0.65KaγH = 0.65 × ${f(Ka, 4)} × ${n(gm)} × ${n(H)} = ${f(s, 4)} kPa\nP = σ × tributary height × spacing = ${f(s, 4)} × ${n(sv)} × ${n(sh)} = ${f(P)} kN`,
      };
    },
  },
  {
    id: "crane-mat-area",
    version: 1,
    title: "Crane outrigger reaction and required mat area",
    topics: { "pe-civil": "construction" },
    reference: "Construction operations: crane outrigger loads and bearing",
    generate(r) {
      for (;;) {
        const W = r.range(60, 200, 5);
        const P = r.range(5, 60, 1);
        const R = r.range(20, 100, 5);
        const a = r.range(10, 14, 0.5);
        const qa = r.range(2, 6, 0.5);
        const front = (W * a + P * (R + a)) / (2 * a);
        if (W + P - front < 0) continue; // crane would tip
        const per = front / 2;
        const A = per / qa;
        return {
          prompt: `A mobile crane weighs ${W} kips (including counterweight), acting at its center of rotation. It lifts ${P} kips at a radius of ${R} ft from the center of rotation, with the boom straight over the front. The front and rear outrigger pairs are each ${n(a)} ft from the center of rotation, with two floats per pair. Ignoring the boom's weight and dynamic effects, what mat area is needed under each front float if the allowable soil bearing is ${n(qa)} ksf?`,
          answer: A,
          unit: "ft²",
          distractors: [
            (W + P) / 4 / qa, // shared the total load equally among four floats
            front / qa, // put the whole front-pair reaction on one float
            (W / 2 + P) / 2 / qa, // ignored the load's lever arm
          ],
          solution: `Moments about the rear floats (2a = ${f(2 * a)} ft apart from the front):\nFront pair: R_f = [W(a) + P(R + a)]/(2a) = [${W}(${n(a)}) + ${P}(${R} + ${n(a)})]/${f(2 * a)} = ${f(front, 4)} kips\nPer float = ${f(front, 4)}/2 = ${f(per, 4)} kips\nMat area = ${f(per, 4)}/${n(qa)} = ${f(A)} ft²`,
        };
      }
    },
  },
  {
    id: "borrow-volume-compaction",
    version: 1,
    title: "Borrow volume needed for a compacted fill",
    topics: { "pe-civil": "construction", "fe-civil": "geotechnical" },
    reference: "Earthwork: relative compaction and borrow requirements",
    generate(r) {
      const Vf = r.range(5000, 80000, 500);
      const gmax = r.range(110, 130, 0.5);
      const RC = r.pick([90, 92, 95, 98, 100]);
      const gb = r.range(90, 112, 0.5);
      const Vb = (Vf * (RC / 100) * gmax) / gb;
      return {
        prompt: `An embankment needs ${n(Vf)} yd³ of compacted fill. The specification requires ${RC}% relative compaction, and the standard Proctor maximum dry unit weight is ${n(gmax)} pcf. The borrow soil's in-place dry unit weight is ${n(gb)} pcf. How many cubic yards must be excavated from the borrow pit (bank measure)?`,
        answer: Vb,
        unit: "yd³",
        distractors: [
          (Vf * gmax) / gb, // ignored relative compaction (used 100%)
          (Vf * gb) / ((RC / 100) * gmax), // inverted the dry unit weight ratio
          Vf / (RC / 100), // divided by relative compaction only
        ],
        solution: `Field dry unit weight = ${RC}% × ${n(gmax)} = ${f((RC / 100) * gmax, 4)} pcf\nDry solids are conserved: V_borrow γ_borrow = V_fill γ_fill\nV_borrow = ${n(Vf)} × ${f((RC / 100) * gmax, 4)}/${n(gb)} = ${f(Vb)} yd³`,
      };
    },
  },
  {
    id: "compaction-water-to-add",
    version: 1,
    title: "Water to add per cubic yard to reach the target moisture content",
    topics: { "pe-civil": "construction", "fe-civil": "construction" },
    reference: "Earthwork: moisture conditioning",
    generate(r) {
      const gd = r.range(100, 125, 0.5);
      const w1 = r.range(4, 10, 0.5);
      const w2 = r.range(w1 + 2, 16, 0.5);
      const lb = gd * 27 * ((w2 - w1) / 100);
      const gal = lb / 8.34;
      return {
        prompt: `Fill is to be compacted to a dry unit weight of ${n(gd)} pcf at a moisture content of ${n(w2)}%. The soil arrives at ${n(w1)}% moisture. How many gallons of water must be added per cubic yard of compacted fill? (Water weighs 8.34 lb/gal.)`,
        answer: gal,
        unit: "gal/yd³",
        distractors: [
          (gd * ((w2 - w1) / 100)) / 8.34, // left the volume in ft³
          (gd * 27 * (w2 / 100)) / 8.34, // used the full target moisture, not the increase
          (gd * (1 + w1 / 100) * 27 * ((w2 - w1) / 100)) / 8.34, // used the moist (not dry) unit weight
        ],
        solution: `Dry soil per yd³ = ${n(gd)} × 27 = ${f(gd * 27, 5)} lb\nWater to add = ${f(gd * 27, 5)} × (${n(w2)} − ${n(w1)})/100 = ${f(lb, 4)} lb\n÷ 8.34 lb/gal = ${f(gal)} gal/yd³`,
      };
    },
  },

  // ---------------------------------------------------------------- Transportation
  {
    id: "signal-change-clearance",
    version: 1,
    title: "Yellow change plus red clearance interval",
    topics: { "pe-civil": "transportation", "fe-civil": "transportation" },
    reference: "ITE kinematic yellow change and red clearance intervals",
    generate(r) {
      const V = r.range(25, 55, 5);
      const G = r.range(-4, 4, 1);
      const W = r.range(40, 110, 5);
      const v = 1.47 * V;
      const y = 1.0 + v / (2 * 10 + 2 * 32.2 * (G / 100));
      const red = (W + 20) / v;
      return {
        prompt: `A signalized approach has a speed of ${V} mph on a ${G > 0 ? "+" : ""}${G}% grade. The intersection is ${W} ft wide (stop line to far side). Use v = 1.47 ft/s per mph, a perception-reaction time of 1.0 s, deceleration of 10 ft/s², g = 32.2 ft/s², and a vehicle length of 20 ft. What is the total of the yellow change interval, y = t + v/(2a + 2gG), and the red clearance interval, r = (W + L)/v?`,
        answer: y + red,
        unit: "s",
        sig: 3,
        distractors: [
          1.0 + v / 20 + red, // ignored the grade
          1.0 + v / (2 * 10 - 2 * 32.2 * (G / 100)) + red, // flipped the grade sign
          y + W / v, // left the vehicle length out of the clearance
          y, // gave the yellow interval only
        ],
        solution: `v = 1.47 × ${V} = ${f(v, 4)} ft/s\ny = 1.0 + ${f(v, 4)}/(2 × 10 + 2 × 32.2 × ${G / 100}) = ${f(y, 3)} s\nr = (${W} + 20)/${f(v, 4)} = ${f(red, 3)} s\nTotal = ${f(y + red, 3)} s`,
      };
    },
  },
  {
    id: "intersection-sight-distance",
    version: 1,
    title: "Intersection sight distance for a turn from a stop",
    topics: { "pe-civil": "transportation" },
    reference: "AASHTO Green Book: intersection sight distance, Case B",
    generate(r) {
      const V = r.range(30, 60, 5);
      const left = r.next() < 0.6;
      const lanes = left ? r.range(1, 4, 1) : 1;
      const tg = (left ? 7.5 : 6.5) + 0.5 * Math.max(0, lanes - 1);
      const ISD = 1.47 * V * tg;
      return {
        prompt: `A passenger car stopped on a minor road ${left ? `turns left onto a major road, crossing ${lanes} lane${lanes > 1 ? "s" : ""} before entering its travel lane` : "turns right onto a major road"}. The major road's design speed is ${V} mph. Use a time gap of 7.5 s for a left turn or 6.5 s for a right turn, plus 0.5 s for each lane crossed in excess of one (no grade adjustment), and ISD = 1.47Vt_g. What intersection sight distance is needed along the major road?`,
        answer: ISD,
        unit: "ft",
        distractors: [
          1.47 * V * (left ? 7.5 : 6.5), // left out the extra-lane time
          1.47 * V * (left ? 6.5 : 7.5), // used the other turn's time gap
          V * tg, // didn't convert mph to ft/s
          1.47 * V * ((left ? 7.5 : 6.5) + 0.5 * lanes), // added 0.5 s for every lane crossed
        ],
        solution: `t_g = ${left ? 7.5 : 6.5} + 0.5 × ${Math.max(0, lanes - 1)} = ${tg} s\nISD = 1.47Vt_g = 1.47 × ${V} × ${tg} = ${f(ISD)} ft`,
      };
    },
  },

  // ---------------------------------------------------------------- Water Resources & Environmental
  {
    id: "primary-sludge-volume",
    version: 1,
    title: "Daily volume of primary sludge",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Wastewater treatment: solids mass balance, sludge volume",
    generate(r) {
      const Q = r.range(5000, 60000, 500);
      const TSS = r.range(150, 350, 5);
      const rem = r.range(50, 70, 1);
      const ps = r.range(3, 6, 0.5);
      const M = (Q * TSS * (rem / 100)) / 1000; // kg/d
      const Vs = M / (1000 * 1.02 * (ps / 100));
      return {
        prompt: `A primary clarifier treats ${n(Q)} m³/d with an influent TSS of ${TSS} mg/L and removes ${rem}% of it. The sludge is ${n(ps)}% solids with a specific gravity of 1.02. What volume of sludge is produced per day?`,
        answer: Vs,
        unit: "m³/d",
        distractors: [
          M / 1000, // gave the volume of dry solids (forgot the solids fraction)
          (Q * TSS) / 1000 / (1000 * 1.02 * (ps / 100)), // ignored the removal efficiency
          M / (1000 * 1.02 * ps), // used the percent as a whole number
        ],
        solution: `Dry solids removed = ${n(Q)} m³/d × ${TSS} g/m³ × ${rem / 100} = ${f(M, 4)} kg/d\nSludge volume = M/(ρ_w × S × p_s) = ${f(M, 4)}/(1,000 × 1.02 × ${ps / 100}) = ${f(Vs)} m³/d`,
      };
    },
  },
  {
    id: "nitrification-oxygen",
    version: 1,
    title: "Oxygen required for nitrification",
    topics: { "pe-civil": "water-env" },
    reference: "Wastewater treatment: nitrification stoichiometry (4.57 g O₂/g N)",
    generate(r) {
      const Q = r.range(5000, 60000, 500);
      const N0 = r.range(25, 45, 1);
      const Ne = r.range(0.5, 2, 0.5);
      const O2 = (Q * (N0 - Ne) * 4.57) / 1000;
      return {
        prompt: `An activated sludge plant treating ${n(Q)} m³/d must nitrify ammonia from ${N0} mg/L to ${n(Ne)} mg/L as N. Using 4.57 g O₂ per g of ammonia-N oxidized to nitrate, how much oxygen does nitrification require?`,
        answer: O2,
        unit: "kg O₂/d",
        distractors: [
          (Q * N0 * 4.57) / 1000, // didn't subtract the effluent ammonia
          (Q * (N0 - Ne) * 3.43) / 1000, // used only the ammonia-to-nitrite step (3.43)
          (Q * (N0 - Ne) * 7.14) / 1000, // used the alkalinity factor 7.14
        ],
        solution: `Ammonia oxidized = ${N0} − ${n(Ne)} = ${f(N0 - Ne)} mg/L = g/m³\nO₂ = ${n(Q)} m³/d × ${f(N0 - Ne)} g/m³ × 4.57 = ${f(O2 * 1000, 4)} g/d = ${f(O2)} kg/d`,
      };
    },
  },
  {
    id: "unit-hydrograph-peak",
    version: 1,
    title: "Peak flow from a unit hydrograph and NRCS runoff depth",
    topics: { "pe-civil": "water-env" },
    reference: "Hydrology: NRCS runoff equation, unit hydrograph scaling",
    generate(r) {
      for (;;) {
        const CN = r.range(60, 95, 1);
        const P = r.range(2, 8, 0.1);
        const up = r.range(200, 3000, 10);
        const S = 1000 / CN - 10;
        if (P <= 0.2 * S + 0.3) continue;
        const Q = (P - 0.2 * S) ** 2 / (P + 0.8 * S);
        return {
          prompt: `A watershed's unit hydrograph (for 1 in of direct runoff, matching the storm duration) has a peak of ${n(up)} cfs. The curve number is ${CN} and the design storm is ${n(P)} in of rainfall over that duration. With the NRCS runoff equation (Ia = 0.2S), what is the peak direct runoff?`,
          answer: up * Q,
          unit: "cfs",
          distractors: [
            up * P, // scaled by rainfall instead of runoff depth
            up * (P - 0.2 * S), // subtracted initial abstraction only
            P > 0.2 * (1000 / CN) ? up * ((P - 0.2 * (1000 / CN)) ** 2 / (P + 0.8 * (1000 / CN))) : NaN, // used S = 1000/CN (forgot the −10)
          ],
          solution: `S = 1,000/CN − 10 = 1,000/${CN} − 10 = ${f(S, 4)} in\nQ = (P − 0.2S)²/(P + 0.8S) = (${n(P)} − ${f(0.2 * S, 4)})²/(${n(P)} + ${f(0.8 * S, 4)}) = ${f(Q, 4)} in\nPeak = ${n(up)} cfs/in × ${f(Q, 4)} in = ${f(up * Q)} cfs`,
        };
      }
    },
  },
  {
    id: "detention-storage-triangular",
    version: 1,
    title: "Detention storage by the triangular hydrograph method",
    topics: { "pe-civil": "water-env", "fe-civil": "water-env" },
    reference: "Stormwater: preliminary detention storage estimate",
    generate(r) {
      for (;;) {
        const Qp = r.range(50, 600, 5);
        const Qa = Math.round(Qp * r.range(0.2, 0.7, 0.01));
        const tb = r.range(1, 6, 0.25);
        const V = (0.5 * tb * 3600 * (Qp - Qa)) / 43560;
        if (V < 0.2) continue;
        return {
          prompt: `Post-development inflow to a pond is a triangular hydrograph with a peak of ${Qp} cfs and a base time of ${n(tb)} h. The allowable release is ${Qa} cfs. Estimating storage as ½ × base time × (inflow peak − allowable release), what detention volume is needed?`,
          answer: V,
          unit: "ac-ft",
          distractors: [
            (tb * 3600 * (Qp - Qa)) / 43560, // left out the ½
            (0.5 * tb * 3600 * Qp) / 43560, // ignored the allowable release
            (0.5 * tb * 3600 * (Qp + Qa)) / 43560, // added the release instead of subtracting it
          ],
          solution: `V = ½ × t_b × (Q_p − Q_a) = ½ × (${n(tb)} × 3,600 s) × (${Qp} − ${Qa}) = ${f(0.5 * tb * 3600 * (Qp - Qa), 5)} ft³\n÷ 43,560 ft²/ac = ${f(V)} ac-ft`,
        };
      }
    },
  },
];
