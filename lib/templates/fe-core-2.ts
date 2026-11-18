import { f, n, type Template } from "./engine";

// FE Civil problem types for knowledge areas that had little template coverage (statics, mechanics of
// materials, dynamics, fluids, surveying, economics), written from the NCEES FE Civil specification
// (July 2020). All problem text is original. Each template has an independent solver in verify.ts.

const g = 9.81;
const rad = (x: number) => (x * Math.PI) / 180;

export const FE_CORE_2: Template[] = [
  {
    id: "truss-apex-member-force",
    version: 1,
    title: "Member force in a simple triangular truss",
    topics: { "fe-civil": "statics" },
    reference: "FE Reference Handbook: Statics, method of joints",
    generate(r) {
      const P = r.range(10, 120, 1);
      const th = r.range(25, 60, 1);
      const F = P / (2 * Math.sin(rad(th)));
      return {
        prompt: `A symmetric triangular truss is pinned at one end and on a roller at the other. Its two top members each rise at ${th}° from horizontal and meet at the apex, where a vertical load of ${P} kN is applied. A bottom chord ties the supports. What is the force in each top member?`,
        answer: F,
        unit: "kN (compression)",
        distractors: [
          P / (2 * Math.cos(rad(th))), // used cos instead of sin for the vertical component
          P / Math.sin(rad(th)), // gave each member the full load
          P / (2 * Math.tan(rad(th))), // found the bottom chord tension instead
        ],
        solution: `By symmetry each support takes ${P}/2 = ${f(P / 2)} kN.\nAt the apex, the vertical components of the two top members carry the load: 2F sin ${th}° = ${P}\nF = ${P}/(2 sin ${th}°) = ${f(F)} kN (compression)`,
      };
    },
  },
  {
    id: "tee-section-centroid",
    version: 1,
    title: "Centroid of a T-section",
    topics: { "fe-civil": "statics" },
    reference: "FE Reference Handbook: Statics, centroids of composite areas",
    generate(r) {
      const bf = r.range(150, 400, 10);
      const tf = r.range(15, 40, 5);
      const tw = r.range(10, 30, 2);
      const hw = r.range(150, 450, 10);
      const Af = bf * tf;
      const Aw = tw * hw;
      const y = (Aw * (hw / 2) + Af * (hw + tf / 2)) / (Aw + Af);
      return {
        prompt: `A T-section has a flange ${bf} mm wide and ${tf} mm thick sitting on top of a web ${tw} mm thick and ${hw} mm tall. How far is the centroid above the bottom of the web?`,
        answer: y,
        unit: "mm",
        distractors: [
          (Aw * (hw / 2) + Af * (tf / 2)) / (Aw + Af), // measured the flange centroid from the top of the web
          (hw + tf) / 2, // took half the total depth
          (hw / 2 + (hw + tf / 2)) / 2, // averaged the two centroids without area weighting
        ],
        solution: `Flange: A = ${bf} × ${tf} = ${n(Af)} mm², ȳ = ${hw} + ${tf}/2 = ${f(hw + tf / 2)} mm\nWeb: A = ${tw} × ${hw} = ${n(Aw)} mm², ȳ = ${hw}/2 = ${f(hw / 2)} mm\nȳ = ΣAȳ/ΣA = (${n(Af)} × ${f(hw + tf / 2)} + ${n(Aw)} × ${f(hw / 2)})/${n(Af + Aw)} = ${f(y)} mm`,
      };
    },
  },
  {
    id: "solid-shaft-torsion",
    version: 1,
    title: "Maximum shear stress in a solid circular shaft",
    topics: { "fe-civil": "mechanics-materials" },
    reference: "FE Reference Handbook: Mechanics of Materials, torsion",
    generate(r) {
      const T = r.range(0.5, 20, 0.5);
      const d = r.range(30, 150, 5);
      const tau = (16 * T * 1e6) / (Math.PI * d ** 3);
      return {
        prompt: `A solid steel shaft ${d} mm in diameter transmits a torque of ${n(T)} kN·m. What is the maximum shear stress in the shaft?`,
        answer: tau,
        unit: "MPa",
        distractors: [
          (32 * T * 1e6) / (Math.PI * d ** 3), // used the diameter instead of the radius for c
          (16 * T * 1e6) / (Math.PI * (d / 2) ** 3), // put the radius into the 16T/πd³ form
          (4 * T * 1e6) / (Math.PI * d ** 3), // used c = d/4
        ],
        solution: `τ_max = Tc/J with c = d/2 and J = πd⁴/32, so τ_max = 16T/(πd³)\nT = ${n(T)} kN·m = ${n(T * 1e6)} N·mm\nτ_max = 16(${n(T * 1e6)})/(π × ${d}³) = ${f(tau)} MPa`,
      };
    },
  },
  {
    id: "principal-stress-max",
    version: 1,
    title: "Maximum principal stress for plane stress",
    topics: { "fe-civil": "mechanics-materials" },
    reference: "FE Reference Handbook: Mechanics of Materials, Mohr's circle",
    generate(r) {
      for (;;) {
        const sx = r.range(-60, 120, 5);
        const sy = r.range(-60, 80, 5);
        const txy = r.range(5, 60, 5);
        const c = (sx + sy) / 2;
        const R = Math.sqrt(((sx - sy) / 2) ** 2 + txy ** 2);
        const s1 = c + R;
        if (s1 < 5) continue;
        return {
          prompt: `At a point in a plate, σx = ${sx} MPa, σy = ${sy} MPa and τxy = ${txy} MPa (tension positive). What is the maximum principal stress?`,
          answer: s1,
          unit: "MPa",
          distractors: [
            c + Math.sqrt((sx - sy) ** 2 + txy ** 2), // didn't halve (σx − σy)
            R, // reported the maximum in-plane shear stress
            Math.abs(c - R) === s1 ? c + txy : Math.abs(c - R), // gave the size of the other principal stress
          ],
          solution: `Center: (σx + σy)/2 = (${sx} + ${sy})/2 = ${f(c)} MPa\nRadius: R = √[((σx − σy)/2)² + τxy²] = √[(${f((sx - sy) / 2)})² + ${txy}²] = ${f(R)} MPa\nσ₁ = ${f(c)} + ${f(R)} = ${f(s1)} MPa`,
        };
      }
    },
  },
  {
    id: "incline-push-force",
    version: 1,
    title: "Force to push a block up an incline with friction",
    topics: { "fe-civil": "statics" },
    reference: "FE Reference Handbook: Statics, friction",
    generate(r) {
      const W = r.range(100, 2000, 50);
      const th = r.range(10, 40, 1);
      const mu = r.range(0.15, 0.5, 0.05);
      const P = W * (Math.sin(rad(th)) + mu * Math.cos(rad(th)));
      return {
        prompt: `A ${n(W)} N crate sits on a ramp inclined ${th}° from horizontal. The coefficient of kinetic friction is ${n(mu)}. What force, applied parallel to the ramp, pushes the crate up at constant speed?`,
        answer: P,
        unit: "N",
        distractors: [
          W * (Math.sin(rad(th)) - mu * Math.cos(rad(th))), // friction in the wrong direction (that's sliding down)
          W * (Math.cos(rad(th)) + mu * Math.sin(rad(th))), // swapped sin and cos
          W * (Math.sin(rad(th)) + mu), // used the full weight as the normal force
        ],
        solution: `Normal force N = W cos ${th}° = ${f(W * Math.cos(rad(th)))} N\nFriction opposes motion (down the ramp): μN = ${f(mu * W * Math.cos(rad(th)))} N\nP = W sin ${th}° + μW cos ${th}° = ${f(W * Math.sin(rad(th)))} + ${f(mu * W * Math.cos(rad(th)))} = ${f(P)} N`,
      };
    },
  },
  {
    id: "drop-onto-spring",
    version: 1,
    title: "Maximum spring compression from a dropped mass",
    topics: { "fe-civil": "dynamics" },
    reference: "FE Reference Handbook: Dynamics, work-energy principle",
    generate(r) {
      const m = r.range(2, 50, 1);
      const h = r.range(0.2, 2, 0.1);
      const k = r.range(2, 40, 1); // kN/m
      const K = k * 1000;
      const W = m * g;
      const x = (W + Math.sqrt(W * W + 2 * K * W * h)) / K;
      return {
        prompt: `A ${m} kg mass is dropped from rest ${n(h)} m above the top of a vertical spring with stiffness ${k} kN/m. Ignoring air resistance and the spring's mass, what is the maximum compression of the spring?`,
        answer: x * 1000,
        unit: "mm",
        distractors: [
          Math.sqrt((2 * W * h) / K) * 1000, // ignored the extra drop while the spring compresses
          (W / K) * 1000, // gave the static deflection
          Math.sqrt((W * h) / K) * 1000, // dropped the 2 from ½kx²
        ],
        solution: `Energy: mg(h + x) = ½kx², with mg = ${m} × 9.81 = ${f(W)} N and k = ${n(K)} N/m\n½(${n(K)})x² − ${f(W)}x − ${f(W)}(${n(h)}) = 0\nx = [mg + √((mg)² + 2kmgh)]/k = ${f(x, 4)} m = ${f(x * 1000)} mm`,
      };
    },
  },
  {
    id: "curve-pt-station",
    version: 1,
    title: "Station of the PT on a horizontal curve",
    topics: { "fe-civil": "surveying", "pe-civil": "transportation" },
    reference: "FE Reference Handbook: Transportation, horizontal circular curves",
    generate(r) {
      const R = r.range(500, 3000, 50);
      const I = r.range(15, 75, 1);
      const pi = r.range(5000, 40000, 0.01);
      const T = R * Math.tan(rad(I / 2));
      const L = R * rad(I);
      const PT = pi - T + L;
      const sta = (x: number) => {
        const h = Math.floor(x / 100);
        return `${h}+${(x - h * 100).toFixed(2).padStart(5, "0")}`;
      };
      return {
        prompt: `A horizontal circular curve with radius ${n(R)} ft has a deflection angle of ${I}°. The PI is at station ${sta(pi)}. What is the station of the PT, in feet (station 12+00 = 1,200 ft)?`,
        answer: PT,
        unit: "ft",
        sig: 7,
        minGap: 0.001,
        distractors: [
          pi + T, // added the tangent length to the PI (stations run along the curve, not the tangents)
          pi - T + 2 * R * Math.sin(rad(I / 2)), // used the long chord instead of the arc length
          pi + L, // added the arc length to the PI
        ],
        solution: `T = R tan(I/2) = ${n(R)} tan ${I / 2}° = ${f(T, 5)} ft\nL = RI(π/180) = ${n(R)} × ${I} × π/180 = ${f(L, 5)} ft\nPC = PI − T = ${f(pi, 7)} − ${f(T, 5)} = ${f(pi - T, 7)} ft\nPT = PC + L = ${f(PT, 7)} ft (station ${sta(PT)})`,
      };
    },
  },
  {
    id: "venturi-flow",
    version: 1,
    title: "Flow through a venturi meter",
    topics: { "fe-civil": "fluids" },
    reference: "FE Reference Handbook: Fluid Mechanics, venturi meters",
    generate(r) {
      const D1 = r.pick([0.15, 0.2, 0.25, 0.3, 0.4]);
      const beta = r.pick([0.4, 0.5, 0.6, 0.7]);
      const D2 = Number((D1 * beta).toFixed(3));
      const dh = r.range(0.1, 1.5, 0.05);
      const Cd = r.range(0.95, 0.99, 0.01);
      const A1 = (Math.PI * D1 * D1) / 4;
      const A2 = (Math.PI * D2 * D2) / 4;
      const Q = Cd * A2 * Math.sqrt((2 * g * dh) / (1 - (A2 / A1) ** 2));
      return {
        prompt: `A venturi meter in a ${n(D1)} m water pipe has a throat diameter of ${n(D2)} m. A differential manometer shows a piezometric head difference of ${n(dh)} m of water between the inlet and the throat. The discharge coefficient is ${n(Cd)}. What is the flow rate?`,
        answer: Q * 1000,
        unit: "L/s",
        distractors: [
          Cd * A2 * Math.sqrt(2 * g * dh) * 1000, // ignored the approach velocity term
          A2 * Math.sqrt((2 * g * dh) / (1 - (A2 / A1) ** 2)) * 1000, // left out Cd
          Cd * A1 * Math.sqrt((2 * g * dh) / (1 - (A2 / A1) ** 2)) * 1000, // used the pipe area instead of the throat area
        ],
        solution: `A₁ = π(${n(D1)})²/4 = ${f(A1, 4)} m², A₂ = π(${n(D2)})²/4 = ${f(A2, 4)} m²\nQ = C_d A₂ √[2gΔh/(1 − (A₂/A₁)²)] = ${n(Cd)} × ${f(A2, 4)} × √[2(9.81)(${n(dh)})/(1 − ${f((A2 / A1) ** 2, 4)})]\n= ${f(Q, 4)} m³/s = ${f(Q * 1000)} L/s`,
      };
    },
  },
  {
    id: "breakeven-volume",
    version: 1,
    title: "Break-even production volume",
    topics: { "fe-civil": "economics" },
    reference: "FE Reference Handbook: Engineering Economics, break-even analysis",
    generate(r) {
      for (;;) {
        const F = r.range(20000, 500000, 5000);
        const p = r.range(20, 200, 1);
        const v = r.range(5, 150, 1);
        if (p - v < 5) continue;
        const N = F / (p - v);
        return {
          prompt: `A precast plant has fixed costs of $${n(F)} per year. Each unit sells for $${p} and costs $${v} in materials and labor to make. How many units per year must it sell to break even?`,
          answer: N,
          unit: "units",
          distractors: [
            F / p, // ignored the variable cost
            F / v, // divided by the variable cost
            F / (p + v), // added instead of subtracting the variable cost
          ],
          solution: `At break-even, revenue = total cost: pN = F + vN\nN = F/(p − v) = ${n(F)}/(${p} − ${v}) = ${f(N)} units`,
        };
      }
    },
  },
];
