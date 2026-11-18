// Short original review notes per topic: what it covers, where to look, and the mistakes that cost
// points. Keyed by topic slug; `pe` overrides the text on the PE, where the same slug is a depth module.

import type { ExamId } from "./types";

export interface TopicGuide {
  summary: string;
  handbook: string;
  traps: string[];
}

type Entry = TopicGuide & { pe?: Partial<TopicGuide> };

const GUIDES: Record<string, Entry> = {
  "math-stats": {
    summary: "Algebra, trigonometry, analytic geometry, calculus basics, and descriptive statistics and probability. Most problems are quick if you recognize the form.",
    handbook: "FE Reference Handbook: Mathematics; Probability and Statistics",
    traps: [
      "Using population (n) instead of sample (n − 1) standard deviation, or the reverse.",
      "Calculator in degrees when the problem is in radians.",
      "Forgetting the ± root or a second solution in a trig equation.",
      "Mixing up a probability of exactly k with at least k.",
    ],
  },
  ethics: {
    summary: "Licensure, the engineer's obligations to the public, employers, clients and other licensees, and business practices. Public health, safety and welfare always come first.",
    handbook: "FE Reference Handbook: Ethics (NCEES Model Law and Model Rules)",
    traps: [
      "Picking the answer that is loyal to the client over public safety.",
      "Assuming a quiet fix is enough when disclosure to an employer, client or board is required.",
      "Sealing or approving work outside your competence or not under your responsible charge.",
      "Treating gifts or undisclosed conflicts of interest as minor.",
    ],
  },
  economics: {
    summary: "Time value of money, equivalent annual worth, present worth, rate of return, depreciation and break-even. Draw the cash-flow diagram first.",
    handbook: "FE Reference Handbook: Engineering Economics (factor tables)",
    traps: [
      "Wrong compounding period: convert the rate and n to the same period.",
      "Gradient series start: the first gradient payment is at end of period 2.",
      "Treating salvage value as a cost instead of a positive return.",
      "Comparing alternatives with different lives without using annual worth or a common period.",
    ],
  },
  statics: {
    summary: "Equilibrium of particles and rigid bodies, trusses, frames, friction, centroids and moments of inertia.",
    handbook: "FE Reference Handbook: Statics",
    traps: [
      "Missing a reaction or using the wrong number of unknowns for a support type.",
      "Sign errors in moments: pick a positive direction and stick with it.",
      "Using the centroidal moment of inertia without the parallel axis term.",
      "Assuming friction is at its maximum when the body isn't on the verge of slipping.",
    ],
  },
  dynamics: {
    summary: "Kinematics and kinetics of particles and rigid bodies: constant acceleration, projectiles, work-energy, impulse-momentum.",
    handbook: "FE Reference Handbook: Dynamics",
    traps: [
      "Using constant-acceleration equations when acceleration varies.",
      "Forgetting gravity's sign or the launch height in projectile problems.",
      "Mixing weight (lb) and mass (slug) in F = ma.",
    ],
  },
  "mechanics-materials": {
    summary: "Stress and strain under axial, torsion, bending and shear; deflection; combined stress; columns.",
    handbook: "FE Reference Handbook: Mechanics of Materials (including beam tables)",
    traps: [
      "Using diameter where the formula wants radius (torsion, area).",
      "Wrong c in Mc/I: it's the distance to the extreme fiber from the neutral axis.",
      "Wrong effective length factor K for column end conditions.",
      "Unit mismatch between ksi, psi and inches vs feet in deflection formulas.",
    ],
  },
  materials: {
    summary: "Properties and testing of concrete, steel, asphalt, wood, aggregates and soils as construction materials.",
    handbook: "FE Reference Handbook: Materials Science / Structure of Matter; Civil Engineering (concrete)",
    traps: [
      "Thinking more water makes concrete stronger: higher w/c lowers strength.",
      "Reading yield strength from the wrong point on a stress-strain curve.",
      "Confusing modulus of elasticity with strength.",
    ],
  },
  fluids: {
    summary: "Fluid properties, hydrostatics, continuity, energy and momentum equations, pipe flow and head loss.",
    handbook: "FE Reference Handbook: Fluid Mechanics",
    traps: [
      "Gauge vs absolute pressure.",
      "Forgetting velocity head or elevation change in the energy equation.",
      "Using kinematic viscosity where dynamic viscosity is needed in Reynolds number, or vice versa.",
      "Hydrostatic resultant acts below the centroid, not at it.",
    ],
  },
  surveying: {
    summary: "Angles and distances, leveling, traverses, areas, earthwork volumes, horizontal and vertical curves.",
    handbook: "FE Reference Handbook: Civil Engineering (surveying and curves)",
    traps: [
      "Bearings vs azimuths: convert carefully before computing latitudes and departures.",
      "Leveling: add the backsight, subtract the foresight.",
      "Degrees-minutes-seconds entered as decimals.",
      "Average-end-area volumes in cubic feet when the answer wants cubic yards (÷ 27).",
    ],
  },
  "water-env": {
    summary: "Hydrology, open channel and pipe flow, groundwater, water and wastewater treatment, and water quality.",
    handbook: "FE Reference Handbook: Civil Engineering (water resources) and Environmental Engineering",
    traps: [
      "Manning's constant: 1.49 in US units, 1.0 in SI.",
      "Hydraulic radius is area over wetted perimeter, not depth (except wide channels).",
      "Rational method: intensity must match a duration equal to the time of concentration.",
      "MGD to cfs conversions (1 MGD ≈ 1.547 cfs).",
    ],
    pe: {
      summary: "Depth module: hydrology (runoff, hydrographs, detention), hydraulics (open channel, culverts, pumps, pipe networks), groundwater and wells, water and wastewater treatment, and water quality.",
      handbook: "PE Civil Reference Handbook: Water Resources and Environmental; plus the design standards NCEES lists for the module",
      traps: [
        "Manning's constant: 1.49 in US units, 1.0 in SI.",
        "Hydraulic jump and critical depth: check Froude number before choosing a formula.",
        "Pump problems: system curve vs pump curve, and NPSH available vs required.",
        "SCS runoff: rainfall depth and curve number must match antecedent conditions; Ia = 0.2S.",
        "Unit hydrograph: convolution lags by one time step per rainfall increment.",
      ],
    },
  },
  structural: {
    summary: "Analysis of determinate structures, loads and load combinations, and basic design of steel and reinforced concrete members.",
    handbook: "FE Reference Handbook: Civil Engineering (structural); design references cited in the handbook",
    traps: [
      "Using service loads where factored (LRFD) loads are required.",
      "Wrong tributary width or area for distributed loads.",
      "Forgetting self-weight.",
      "Mixing kips and pounds, or inches and feet, in moment calculations.",
    ],
    pe: {
      summary: "Depth module: loads and analysis, steel, concrete, timber and masonry member and connection design, foundations and temporary structures, per the codes NCEES lists.",
      handbook: "PE Civil Reference Handbook: Structural; ASCE 7, AISC 360, ACI 318 and the other standards NCEES lists",
      traps: [
        "Wrong load combination or missing the governing one.",
        "Effective length and unbraced length mix-ups in steel compression and flexure.",
        "Concrete: using d instead of h, or forgetting to check the tension-controlled strain.",
        "Development length and spacing checks skipped.",
      ],
    },
  },
  geotechnical: {
    summary: "Soil properties and classification, phase relationships, effective stress, consolidation, shear strength, bearing capacity and earth pressure.",
    handbook: "FE Reference Handbook: Civil Engineering (geotechnical)",
    traps: [
      "Total vs effective stress: subtract pore pressure below the water table.",
      "Using dry unit weight below the water table instead of buoyant or saturated.",
      "Moisture content is by dry weight, not total weight.",
      "Consolidation: normally vs over-consolidated formulas.",
    ],
    pe: {
      summary: "Depth module: site characterization, soil mechanics, earthquake and slope stability, shallow and deep foundations, retaining structures and earthwork.",
      handbook: "PE Civil Reference Handbook: Geotechnical; plus the standards NCEES lists for the module",
      traps: [
        "Effective vs total stress in bearing and settlement.",
        "Bearing capacity: correct for water table depth and footing shape.",
        "Pile capacity: skin friction in clay vs sand uses different methods.",
        "Slope stability factor of safety with seepage forces left out.",
      ],
    },
  },
  transportation: {
    summary: "Geometric design (horizontal and vertical curves, sight distance), traffic flow and capacity, pavement basics and safety.",
    handbook: "FE Reference Handbook: Civil Engineering (transportation)",
    traps: [
      "Grades in percent vs decimal in vertical curve equations.",
      "Speed in mph vs ft/s (× 1.47).",
      "Superelevation e and side friction f as decimals in the curve radius formula.",
      "Peak hour factor applied the wrong way.",
    ],
    pe: {
      summary: "Depth module: traffic engineering and capacity, horizontal and vertical design, intersections, safety analysis, pavement design and traffic control.",
      handbook: "PE Civil Reference Handbook: Transportation; AASHTO Green Book, HCM, MUTCD, HSM as NCEES lists",
      traps: [
        "HCM adjustments applied to the wrong flow (vehicles vs passenger-car equivalents).",
        "Sight distance on crest vs sag curves uses different formulas.",
        "Crash rates per million vehicles vs per million vehicle-miles.",
      ],
    },
  },
  construction: {
    summary: "Project scheduling, estimating, earthwork, productivity, temporary structures and construction safety.",
    handbook: "FE Reference Handbook: Civil Engineering (construction)",
    traps: [
      "Critical path: the longest path, not the shortest.",
      "Bank, loose and compacted volumes mixed up.",
      "Earned value: CV and SV use EV, not AC, as the base.",
    ],
    pe: {
      summary: "Depth module: earthwork, estimating, scheduling, material quality control, temporary structures and site safety.",
      handbook: "PE Civil Reference Handbook: Construction; OSHA 1926 and other standards NCEES lists",
      traps: [
        "Float: total vs free float.",
        "Formwork pressure: rate of placement and temperature both matter.",
        "Crane and rigging problems: sling angle increases tension.",
      ],
    },
  },
};

export function topicGuide(exam: ExamId, slug: string): TopicGuide | null {
  const g = GUIDES[slug];
  if (!g) return null;
  const { pe, ...base } = g;
  return exam === "pe-civil" && pe ? { ...base, ...pe } : base;
}
