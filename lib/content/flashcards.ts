// Original formula and concept flashcards. Formulas are standard engineering relationships; the wording,
// selection and notes are ours. `ref` points to the section of the NCEES handbook (FE) or the usual design
// reference (PE) where the student will find it on exam day. We cite sections, never copy pages.

import type { ExamId } from "./types";

export interface Flashcard {
  id: string;
  /** Topic slug on the FE (and on the PE unless peTopic is set). */
  topic: string;
  /** PE depth module the card belongs to when its FE topic doesn't exist on the PE. */
  peTopic?: string;
  exams: ExamId[];
  front: string;
  back: string;
  ref: string;
  /** Visible on the free tier. */
  free?: boolean;
}

const FE: ExamId[] = ["fe-civil"];
const BOTH: ExamId[] = ["fe-civil", "pe-civil"];

const HB = "FE Reference Handbook";

export const FLASHCARDS: Flashcard[] = [
  // Mathematics & Statistics
  { id: "fc-math-quadratic", topic: "math-stats", exams: FE, free: true, front: "Roots of ax² + bx + c = 0", back: "x = [−b ± √(b² − 4ac)] / 2a\nDiscriminant b² − 4ac < 0 gives complex roots.", ref: `${HB}: Mathematics` },
  { id: "fc-math-stdev", topic: "math-stats", exams: FE, front: "Sample standard deviation", back: "s = √[ Σ(xᵢ − x̄)² / (n − 1) ]\nUse n (not n − 1) for a whole population (σ).", ref: `${HB}: Probability and Statistics` },
  { id: "fc-math-binomial", topic: "math-stats", exams: FE, front: "Binomial probability of exactly k successes in n trials", back: "P(k) = C(n, k) · pᵏ · (1 − p)ⁿ⁻ᵏ\nC(n, k) = n! / [k!(n − k)!]", ref: `${HB}: Probability and Statistics` },
  { id: "fc-math-dist", topic: "math-stats", exams: FE, front: "Distance between points (x₁, y₁) and (x₂, y₂)", back: "d = √[(x₂ − x₁)² + (y₂ − y₁)²]", ref: `${HB}: Mathematics` },

  // Ethics
  { id: "fc-ethics-priority", topic: "ethics", exams: FE, front: "An engineer's first obligation, above employer and client", back: "Protect the health, safety and welfare of the public.\nIf overruled on a safety issue, notify the employer or client and the appropriate authority.", ref: `${HB}: Ethics` },
  { id: "fc-ethics-seal", topic: "ethics", exams: FE, front: "When may a licensee seal plans?", back: "Only for work they prepared or that was prepared under their responsible charge (direct supervision), and only within their competence.", ref: `${HB}: Ethics` },

  // Economics
  { id: "fc-econ-fp", topic: "economics", exams: FE, free: true, front: "Future worth of a single present amount (F/P)", back: "F = P(1 + i)ⁿ", ref: `${HB}: Engineering Economics` },
  { id: "fc-econ-pa", topic: "economics", exams: FE, front: "Present worth of a uniform series (P/A)", back: "P = A · [(1 + i)ⁿ − 1] / [i(1 + i)ⁿ]", ref: `${HB}: Engineering Economics` },
  { id: "fc-econ-ap", topic: "economics", exams: FE, front: "Capital recovery: uniform payment from a present amount (A/P)", back: "A = P · [i(1 + i)ⁿ] / [(1 + i)ⁿ − 1]", ref: `${HB}: Engineering Economics` },
  { id: "fc-econ-sl", topic: "economics", exams: FE, front: "Straight-line depreciation per year", back: "D = (C − S) / n\nC = first cost, S = salvage value, n = recovery period", ref: `${HB}: Engineering Economics` },
  { id: "fc-econ-eff", topic: "economics", exams: FE, front: "Effective annual interest from nominal rate r compounded m times a year", back: "iₑ = (1 + r/m)ᵐ − 1", ref: `${HB}: Engineering Economics` },

  // Statics
  { id: "fc-statics-eq", topic: "statics", exams: FE, free: true, front: "Equilibrium of a rigid body in 2D", back: "ΣFx = 0, ΣFy = 0, ΣM = 0 (about any point)", ref: `${HB}: Statics` },
  { id: "fc-statics-friction", topic: "statics", exams: FE, front: "Maximum static friction force", back: "F = μs · N\nSliding impends when the required friction reaches μs·N.", ref: `${HB}: Statics` },
  { id: "fc-statics-centroid-tri", topic: "statics", exams: FE, front: "Centroid of a triangle measured from its base", back: "ȳ = h/3", ref: `${HB}: Statics (centroids)` },
  { id: "fc-statics-parallel", topic: "statics", exams: FE, front: "Parallel axis theorem", back: "I = I꜀ + A·d²\nI꜀ about the centroidal axis, d = distance between axes", ref: `${HB}: Statics` },
  { id: "fc-statics-rect-i", peTopic: "structural", topic: "statics", exams: BOTH, front: "Moment of inertia of a rectangle about its centroidal axis", back: "I = b·h³ / 12 (h measured perpendicular to the axis)", ref: `${HB}: Statics` },

  // Dynamics
  { id: "fc-dyn-const-acc", topic: "dynamics", exams: FE, front: "Constant-acceleration kinematics (three equations)", back: "v = v₀ + a·t\ns = v₀·t + ½·a·t²\nv² = v₀² + 2·a·s", ref: `${HB}: Dynamics` },
  { id: "fc-dyn-work-energy", topic: "dynamics", exams: FE, front: "Work-energy principle", back: "T₁ + U₁→₂ = T₂\nKinetic energy T = ½·m·v²", ref: `${HB}: Dynamics` },
  { id: "fc-dyn-impulse", topic: "dynamics", exams: FE, front: "Impulse-momentum", back: "m·v₁ + ∫F dt = m·v₂", ref: `${HB}: Dynamics` },

  // Mechanics of Materials
  { id: "fc-mom-flexure", peTopic: "structural", topic: "mechanics-materials", exams: BOTH, front: "Bending (flexural) stress", back: "σ = M·c / I\nc = distance from the neutral axis to the extreme fiber", ref: `${HB}: Mechanics of Materials` },
  { id: "fc-mom-axial", topic: "mechanics-materials", exams: FE, front: "Axial deformation of a bar", back: "δ = P·L / (A·E)", ref: `${HB}: Mechanics of Materials` },
  { id: "fc-mom-torsion", topic: "mechanics-materials", exams: FE, front: "Shear stress in a circular shaft under torque", back: "τ = T·r / J\nSolid shaft J = π·d⁴ / 32", ref: `${HB}: Mechanics of Materials` },
  { id: "fc-mom-shear", topic: "mechanics-materials", exams: FE, front: "Maximum shear stress in a rectangular beam", back: "τmax = 1.5 · V / A", ref: `${HB}: Mechanics of Materials` },
  { id: "fc-mom-euler", peTopic: "structural", topic: "mechanics-materials", exams: BOTH, front: "Euler critical buckling load", back: "Pcr = π²·E·I / (K·L)²\nK = 1.0 pinned-pinned, 0.5 fixed-fixed, 2.0 fixed-free", ref: `${HB}: Mechanics of Materials (columns)` },
  { id: "fc-mom-ss-udl", peTopic: "structural", topic: "mechanics-materials", exams: BOTH, front: "Simply supported beam, uniform load w: max moment and deflection", back: "Mmax = w·L² / 8 at midspan\nΔmax = 5·w·L⁴ / (384·E·I)", ref: `${HB}: Mechanics of Materials (beam tables)` },

  // Materials
  { id: "fc-mat-wc", topic: "materials", exams: FE, front: "Effect of a higher water-cement ratio on concrete", back: "Lower strength and durability, higher workability. Strength depends mainly on w/c.", ref: `${HB}: Materials (concrete)` },
  { id: "fc-mat-hooke", topic: "materials", exams: FE, front: "Hooke's law and Poisson's ratio", back: "σ = E·ε (elastic range)\nν = −ε_lateral / ε_axial", ref: `${HB}: Materials` },

  // Fluids
  { id: "fc-fluids-bernoulli", peTopic: "water-env", topic: "fluids", exams: BOTH, free: true, front: "Energy (Bernoulli) equation between two points, with head loss", back: "p₁/γ + V₁²/2g + z₁ = p₂/γ + V₂²/2g + z₂ + h_L", ref: `${HB}: Fluid Mechanics` },
  { id: "fc-fluids-continuity", peTopic: "water-env", topic: "fluids", exams: BOTH, front: "Continuity for incompressible flow", back: "Q = A₁·V₁ = A₂·V₂", ref: `${HB}: Fluid Mechanics` },
  { id: "fc-fluids-darcy", peTopic: "water-env", topic: "fluids", exams: BOTH, front: "Darcy-Weisbach head loss", back: "h_f = f · (L/D) · V²/2g\nf from the Moody diagram (Re and ε/D)", ref: `${HB}: Fluid Mechanics` },
  { id: "fc-fluids-re", topic: "fluids", exams: FE, front: "Reynolds number in a pipe and the laminar limit", back: "Re = V·D/ν = ρ·V·D/μ\nLaminar below about 2,000 (laminar f = 64/Re)", ref: `${HB}: Fluid Mechanics` },
  { id: "fc-fluids-hydrostatic", topic: "fluids", exams: FE, front: "Hydrostatic pressure at depth h", back: "p = γ·h (gauge)\nResultant on a submerged plane surface F = γ·h꜀·A, acting below the centroid", ref: `${HB}: Fluid Mechanics` },

  // Surveying
  { id: "fc-survey-hcurve", peTopic: "transportation", topic: "surveying", exams: BOTH, front: "Horizontal curve: length and tangent", back: "L = π·R·Δ / 180 (Δ in degrees)\nT = R · tan(Δ/2)", ref: `${HB}: Surveying / Transportation (horizontal curves)` },
  { id: "fc-survey-level", topic: "surveying", exams: FE, front: "Differential leveling: elevation of the next point", back: "HI = known elevation + backsight\nNew elevation = HI − foresight", ref: `${HB}: Surveying` },
  { id: "fc-survey-area", topic: "surveying", exams: FE, front: "Area of a closed traverse from coordinates", back: "A = ½ · | Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ) |  (coordinate / cross-multiplication method)", ref: `${HB}: Surveying` },

  // Water Resources & Environmental
  { id: "fc-water-manning", topic: "water-env", exams: BOTH, free: true, front: "Manning's equation (US units)", back: "Q = (1.49/n) · A · R^(2/3) · S^(1/2)\nR = A / P (wetted perimeter). SI: 1.0 instead of 1.49.", ref: `${HB}: Water Resources (open channel flow)` },
  { id: "fc-water-rational", topic: "water-env", exams: BOTH, front: "Rational method peak runoff", back: "Q = C · i · A\nQ in cfs, i in in/hr, A in acres. Use i for a duration equal to the time of concentration.", ref: `${HB}: Water Resources (hydrology)` },
  { id: "fc-water-hazen", topic: "water-env", exams: BOTH, front: "Hazen-Williams velocity (US units)", back: "V = 1.318 · C · R^0.63 · S^0.54\nHigher C = smoother pipe", ref: `${HB}: Water Resources (pressure conduit flow)` },
  { id: "fc-water-froude", topic: "water-env", exams: BOTH, front: "Froude number and flow regime", back: "Fr = V / √(g·D_h), D_h = A/T\nFr < 1 subcritical, = 1 critical, > 1 supercritical", ref: `${HB}: Water Resources (open channel flow)` },
  { id: "fc-water-critical-rect", topic: "water-env", exams: BOTH, front: "Critical depth in a rectangular channel", back: "y꜀ = (q² / g)^(1/3), q = Q / b (flow per unit width)", ref: `${HB}: Water Resources (open channel flow)` },
  { id: "fc-water-scs", topic: "water-env", exams: BOTH, front: "NRCS (SCS) curve number runoff depth", back: "S = 1000/CN − 10\nQ = (P − 0.2S)² / (P + 0.8S) for P > 0.2S (inches)", ref: `${HB}: Water Resources (hydrology)` },
  { id: "fc-water-bod", topic: "water-env", exams: BOTH, front: "BOD exerted by time t", back: "BOD_t = L₀ · (1 − e^(−k·t))\nL₀ = ultimate BOD", ref: `${HB}: Environmental Engineering` },
  { id: "fc-water-detention", topic: "water-env", exams: BOTH, front: "Hydraulic detention time and overflow rate", back: "θ = V / Q\nOverflow (surface loading) rate = Q / A_surface", ref: `${HB}: Environmental Engineering (treatment)` },
  { id: "fc-water-darcy-gw", topic: "water-env", exams: BOTH, front: "Darcy's law for groundwater", back: "Q = K · i · A, i = dh/dL\nSeepage velocity = Darcy velocity / effective porosity", ref: `${HB}: Water Resources (groundwater)` },

  // Structural
  { id: "fc-struct-load-combo", topic: "structural", exams: BOTH, front: "Two common LRFD load combinations (ASCE 7)", back: "1.4D\n1.2D + 1.6L + 0.5(Lr or S or R)", ref: "ASCE 7, Chapter 2 (load combinations)" },
  { id: "fc-struct-cantilever", topic: "structural", exams: BOTH, front: "Cantilever with point load P at the tip: max moment and deflection", back: "Mmax = P·L at the support\nΔmax = P·L³ / (3·E·I)", ref: `${HB}: Mechanics of Materials (beam tables)` },
  { id: "fc-struct-whitney", topic: "structural", exams: BOTH, front: "Reinforced concrete beam: depth of the compression block", back: "a = As·fy / (0.85·f'c·b)\nMn = As·fy·(d − a/2)", ref: "ACI 318 / FE Handbook: Design of Reinforced Concrete" },

  // Geotechnical
  { id: "fc-geo-phase", topic: "geotechnical", exams: BOTH, free: true, front: "Key soil phase relationship linking S, e, w and Gs", back: "S·e = w·Gs", ref: `${HB}: Geotechnical (phase relationships)` },
  { id: "fc-geo-effective", topic: "geotechnical", exams: BOTH, front: "Effective stress", back: "σ' = σ − u\nu = γw · (depth below water table)", ref: `${HB}: Geotechnical` },
  { id: "fc-geo-rankine", topic: "geotechnical", exams: BOTH, front: "Rankine active earth pressure coefficient (level backfill, smooth wall)", back: "Ka = tan²(45° − φ/2)\nKp = tan²(45° + φ/2)", ref: `${HB}: Geotechnical (retaining walls)` },
  { id: "fc-geo-consol", topic: "geotechnical", exams: BOTH, front: "Primary consolidation settlement, normally consolidated clay", back: "S = [Cc·H / (1 + e₀)] · log₁₀[(σ'₀ + Δσ) / σ'₀]", ref: `${HB}: Geotechnical (consolidation)` },

  // Transportation
  { id: "fc-trans-ssd", topic: "transportation", exams: BOTH, free: true, front: "Stopping sight distance (US units)", back: "SSD = 1.47·V·t + V² / [30·(a/32.2 ± G)]\nV in mph, t = 2.5 s typical, a = 11.2 ft/s²", ref: "AASHTO Green Book / FE Handbook: Transportation" },
  { id: "fc-trans-qkv", topic: "transportation", exams: BOTH, front: "Fundamental traffic flow relationship", back: "q = k · v\nflow (veh/hr) = density (veh/mi) × speed (mph)", ref: `${HB}: Transportation (traffic flow)` },
  { id: "fc-trans-vcurve", topic: "transportation", exams: BOTH, front: "Vertical curve: elevation along the curve", back: "y = y_PVC + g₁·x + (r/2)·x², r = (g₂ − g₁) / L\nHigh/low point at x = −g₁ / r", ref: `${HB}: Transportation (vertical curves)` },
  { id: "fc-trans-superelev", topic: "transportation", exams: BOTH, front: "Minimum curve radius from superelevation and side friction", back: "R = V² / [15·(e + f)]\nV in mph, R in ft, e and f as decimals (e.g. 0.06, not 6%)", ref: "AASHTO Green Book / FE Handbook: Transportation" },

  // Construction
  { id: "fc-const-cpm", topic: "construction", exams: BOTH, front: "CPM total float", back: "TF = LS − ES = LF − EF\nActivities with zero total float are on the critical path.", ref: `${HB}: Construction (scheduling)` },
  { id: "fc-const-earned", topic: "construction", exams: BOTH, front: "Earned value: cost and schedule variance", back: "CV = EV − AC (negative = over budget)\nSV = EV − PV (negative = behind schedule)\nCPI = EV/AC, SPI = EV/PV", ref: `${HB}: Construction (project control)` },
  { id: "fc-const-swell", topic: "construction", exams: BOTH, front: "Bank, loose and compacted earthwork volumes", back: "Loose = Bank × (1 + swell)\nCompacted = Bank × (1 − shrinkage)", ref: `${HB}: Construction (earthwork)` },
];

/** The card's topic on a given exam. */
export function cardTopic(c: Flashcard, exam: ExamId) {
  return exam === "pe-civil" ? (c.peTopic ?? c.topic) : c.topic;
}

export function flashcardsFor(exam: ExamId, topic?: string): Flashcard[] {
  return FLASHCARDS.filter((c) => c.exams.includes(exam) && (!topic || cardTopic(c, exam) === topic));
}

export function getFlashcard(id: string) {
  return FLASHCARDS.find((c) => c.id === id);
}
