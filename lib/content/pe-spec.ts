import type { Topic } from "./types";

// PE Civil module specifications (NCEES, knowledge areas effective April 2024). Since April 2024 each PE
// Civil module is its own 80-question exam, so each module lists every knowledge area it tests, with
// NCEES's question range and sub-topics (area and item names follow NCEES's headings).
// "skills" maps CivilPrep content to each area: calculation problem ids (lib/templates) and hand-written
// question ids (pe-...). A skill may serve several areas and modules. "topic" is the CivilPrep topic slug
// the area's practice falls under, used to weight smart practice for students who choose this module.

export interface KnowledgeArea {
  n: number;
  name: string;
  questions: string;
  items: string[];
  topic: Topic["slug"];
  skills: string[];
}

export const PE_MODULE_SPECS: Record<string, { effective: string; areas: KnowledgeArea[] }> = {
  "water-env": {
    effective: "April 2024",
    areas: [
      {
        n: 1,
        name: "Project Planning",
        questions: "4–6",
        topic: "construction",
        items: [
          "Quantity take-off methods",
          "Cost estimating",
          "Project schedules",
          "Activity identification and sequencing",
          "Economic and sustainability analysis (e.g., present worth, lifecycle costs, comparison of alternatives)",
        ],
        skills: ["estimate-at-completion", "earned-value-index", "cpm-total-float", "least-cost-crashing", "average-end-area-volume", "benefit-cost-ratio", "capitalized-cost", "pe-const-001", "pe-const-017", "euac-alternative", "cost-loaded-cumulative", "cost-index-capacity-scaling"],
      },
      {
        n: 2,
        name: "Soil Mechanics",
        questions: "3–5",
        topic: "geotechnical",
        items: [
          "Lateral earth pressure",
          "Soil consolidation and compaction",
          "Bearing capacity",
          "Settlement",
          "Slope stability",
        ],
        skills: ["rankine-active-thrust", "nc-clay-settlement", "oc-clay-settlement", "consolidation-time", "strip-footing-bearing-wt", "clay-bearing-undrained", "infinite-slope-seepage", "borrow-volume-compaction", "pe-geo-001", "pe-geo-002"],
      },
      {
        n: 3,
        name: "Materials",
        questions: "4–6",
        topic: "geotechnical",
        items: [
          "Soil classification and boring log interpretation",
          "Soil properties (e.g., strength, permeability, compressibility, phase relationships)",
          "Concrete (e.g., nonreinforced, reinforced)",
          "Piping materials",
          "Material test methods and specification conformance",
        ],
        skills: ["degree-of-saturation", "falling-head-permeability", "effective-stress", "aashto-group-index", "mix-design-fine-aggregate", "pe-const-011", "pe-const-012", "triaxial-friction-angle", "pressure-pipe-wall-thickness", "pe-geo-016", "liquidity-index"],
      },
      {
        n: 4,
        name: "Analysis and Design",
        questions: "6–9",
        topic: "water-env",
        items: [
          "Mass balance",
          "Hydraulic loading",
          "Solids loading (e.g., sediment loading, sludge)",
          "Hydraulic flow measurement",
        ],
        skills: ["detention-time", "clarifier-overflow-rate", "contracted-weir-flow", "v-notch-weir", "primary-sludge-volume", "clarifier-solids-loading", "pe-env-001", "thickener-diameter", "filter-backwash-percent", "sediment-basin-stokes"],
      },
      {
        n: 5,
        name: "Hydraulics–Closed Conduit",
        questions: "7–11",
        topic: "water-env",
        items: [
          "Energy and/or continuity equation (e.g., Bernoulli, grade line analyses, momentum equation)",
          "Pressure conduit (e.g., single pipe, force mains, Hazen-Williams, Darcy-Weisbach, major and minor losses)",
          "Pump application and analysis, including wet wells, lift stations, and cavitation",
          "Pipe network analysis (e.g., series, parallel, loop networks)",
        ],
        skills: ["continuity-pipe", "darcy-weisbach-si", "hazen-williams-headloss-us", "pump-system-power", "parallel-pipes-hw", "series-pipes-darcy", "pipe-bend-force", "pe-water-002", "dewatering-pump-power", "network-node-pressure", "hardy-cross-correction", "pump-operating-point", "water-hammer-pressure", "water-main-size"],
      },
      {
        n: 6,
        name: "Hydraulics–Open Channel",
        questions: "7–11",
        topic: "water-env",
        items: [
          "Open-channel flow",
          "Hydraulic grade lines and energy dissipation (e.g., plunge pool, drop structure, culvert outlet)",
          "Stormwater collection and drainage (e.g., culvert, stormwater inlets, gutter flow, street flow, storm sewer pipes)",
          "Sub- and supercritical flow",
        ],
        skills: ["manning-rect-si", "critical-depth-rect", "froude-number-rect", "hydraulic-jump-energy-loss", "hec22-gutter-flow", "culvert-outlet-control-hw", "storm-sewer-size", "pe-water-001", "orifice-outlet-diameter"],
      },
      {
        n: 7,
        name: "Hydrology",
        questions: "8–12",
        topic: "water-env",
        items: [
          "Storm characteristics (e.g., storm frequency, rainfall measurement, distribution)",
          "Runoff analysis (e.g., rational and SCS/NRCS methods)",
          "Hydrograph development and applications, including synthetic hydrographs",
          "Rainfall intensity, duration, frequency, and probability of exceedance",
          "Time of concentration",
          "Rainfall and stream gauging stations",
          "Depletions (e.g., evaporation, detention, percolation, diversions)",
          "Stormwater management and treatment (e.g., detention and retention ponds, infiltration, swales, constructed wetlands)",
        ],
        skills: ["rational-method", "nrcs-curve-number", "tr55-sheet-flow", "tr55-shallow-flow", "nrcs-lag-tc", "unit-hydrograph-peak", "unit-hydrograph-convolution", "muskingum-outflow", "detention-storage-triangular", "pe-env-010", "pe-env-014", "sequent-peak-storage", "gumbel-flood-frequency", "infiltration-trench-length", "linear-reservoir-routing", "orifice-outlet-diameter", "rational-method-idf"],
      },
      {
        n: 8,
        name: "Groundwater and Wells",
        questions: "4–6",
        topic: "water-env",
        items: [
          "Aquifers",
          "Groundwater flow",
          "Well and drawdown analysis",
        ],
        skills: ["thiem-confined-drawdown", "thiem-unconfined-flow", "two-well-superposition", "flow-net-seepage", "cooper-jacob-drawdown", "groundwater-travel-time", "pe-env-015", "pe-env-016"],
      },
      {
        n: 9,
        name: "Surface Water and Groundwater Quality",
        questions: "5–8",
        topic: "water-env",
        items: [
          "Stream degradation and oxygen dynamics",
          "Total maximum daily load (TMDL) (e.g., nutrient contamination, DO, load allocation)",
          "Biological and chemical contaminants",
        ],
        skills: ["bod-exertion", "bod-dilution", "streeter-phelps-do", "pe-env-002", "pe-env-006", "tmdl-load-reduction", "oxygen-sag-minimum-do", "landfill-leachate-balance"],
      },
      {
        n: 10,
        name: "Drinking Water Distribution and Treatment",
        questions: "6–9",
        topic: "water-env",
        items: [
          "Drinking water distribution systems",
          "Drinking water treatment processes",
          "Present, short-term, and long-term demands",
          "Storage",
          "Sedimentation",
          "Coagulation and flocculation",
          "Membrane processes and media filtration",
          "Disinfection, including disinfection byproducts",
          "Hardness and softening",
          "Other treatment (e.g., ion exchange, carbon adsorption, ozone, UV, specific constituent removal)",
        ],
        skills: ["chlorine-ct", "total-hardness", "rapid-mix-power", "filters-required", "pe-env-005", "pe-env-008", "pe-env-009", "pe-env-011", "distribution-storage-volume", "lime-softening-dose", "contact-basin-volume", "filter-backwash-percent", "ion-exchange-run-volume", "network-node-pressure", "water-main-size", "breakpoint-chlorine-dose"],
      },
      {
        n: 11,
        name: "Wastewater Collection and Treatment",
        questions: "7–11",
        topic: "water-env",
        items: [
          "Wastewater collection systems (e.g., lift stations, sewer networks, infiltration, inflow, smoke testing, maintenance, odor control)",
          "Wastewater treatment systems",
          "Preliminary treatment",
          "Primary treatment",
          "Secondary treatment (e.g., physical, chemical, biological processes)",
          "Nutrient removal",
          "Solids treatment, handling, and disposal",
          "Disinfection",
          "Advanced treatment (e.g., advanced oxidation process, effluent filtration, adsorption, reclaimed water)",
        ],
        skills: ["activated-sludge-srt", "food-to-microorganism", "aeration-basin-volume", "aeration-oxygen-demand", "nitrification-oxygen", "sewer-full-flow-capacity", "sewer-min-slope", "pe-env-003", "pe-env-004", "pe-env-007", "pe-env-012", "pe-env-013", "sludge-thickening-volume", "thickener-diameter", "trickling-filter-organic-loading", "aerated-grit-chamber", "wet-well-volume", "digester-methane"],
      },
      {
        n: 12,
        name: "Project Sitework",
        questions: "9–14",
        topic: "construction",
        items: [
          "Excavation and embankment (e.g., grading, cut and fill)",
          "Construction site layout and control",
          "Temporary and permanent soil erosion and sediment control (e.g., construction erosion control and permits, sediment transport, channel/outlet protection)",
          "Impact of construction on adjacent facilities",
          "Safety (e.g., construction, roadside, work zone)",
          "Basic horizontal and vertical curve elements",
          "Retaining walls",
          "Construction methods",
        ],
        skills: ["earthwork-truck-loads", "earthwork-waste-shrinkage", "average-end-area-volume", "vertical-curve-elevation", "crest-high-point", "horizontal-curve-length", "curve-external-distance", "retaining-wall-sliding", "retaining-wall-overturning", "pe-const-003", "pe-const-006", "pe-trans-003", "work-zone-taper-length", "rusle-soil-loss", "grade-stake-cut", "slope-stake-offset", "pe-const-020", "pe-const-021", "sediment-basin-stokes"],
      },
    ],
  },
  "structural": {
    effective: "April 2024",
    areas: [
      {
        n: 1,
        name: "Analysis of Structures–Loads and Load Applications",
        questions: "12–18",
        topic: "structural",
        items: [
          "Dead loads",
          "Live loads",
          "Construction loads",
          "Wind loads",
          "Seismic loads",
          "Moving loads (e.g., vehicular, cranes)",
          "Snow, rain, and ice",
          "Impact loads",
          "Earth pressure and surcharge loads",
          "Tributary areas and load paths (e.g., lateral and vertical)",
          "Load combinations",
        ],
        skills: ["lrfd-governing-combination", "tributary-girder-moment", "seismic-base-shear-elf", "wind-windward-pressure", "wall-thrust-surcharge-water", "pe-struct-004", "pe-struct-009", "flat-roof-snow-load", "live-load-reduction-column", "two-axle-max-moment", "shear-wall-uplift", "coulomb-active-thrust"],
      },
      {
        n: 2,
        name: "Analysis of Structures–Forces and Load Effects",
        questions: "17–26",
        topic: "structural",
        items: [
          "Diagrams (e.g., shear and moment)",
          "Axial (e.g., tension and compression)",
          "Shear",
          "Flexure",
          "Combined stresses",
          "Deflection",
          "Special topics (e.g., torsion, buckling, fatigue, progressive collapse, thermal deformation, bearing)",
        ],
        skills: ["udl-max-moment", "fixed-end-moment", "ss-udl-deflection-us", "cantilever-tip-deflection", "euler-buckling", "pe-struct-001", "propped-cantilever-reaction", "two-axle-max-moment", "moment-magnification-nonsway", "sway-moment-magnification", "rc-beam-deflection-ie"],
      },
      {
        n: 3,
        name: "Temporary Structures and Other Topics",
        questions: "5–8",
        topic: "construction",
        items: [
          "Special inspections",
          "Submittals",
          "Formwork, falsework, scaffolding, shoring and reshoring, bracing, and anchorage",
          "Impact of construction on adjacent facilities",
          "Safety (e.g., construction, roadside, work zone)",
        ],
        skills: ["wall-formwork-pressure", "pe-struct-006", "pe-const-015", "pe-const-003", "pe-const-007", "shoring-post-load", "pe-struct-012", "pe-struct-013"],
      },
      {
        n: 4,
        name: "Design and Details of Structures–Materials and Material Properties",
        questions: "10–15",
        topic: "structural",
        items: [
          "Soil classification and soil properties (e.g., strength, permeability, compressibility, phase relationships)",
          "Concrete (e.g., unreinforced, reinforced, cast-in-place, precast, pre-tensioned, post-tensioned)",
          "Steel (e.g., structural, cold-formed)",
          "Timber",
          "Masonry (e.g., brick veneer, CMU)",
          "Material test methods and specification conformance (e.g., concrete, steel, masonry, timber, other construction materials)",
        ],
        skills: ["mix-design-fine-aggregate", "degree-of-saturation", "pe-struct-005", "pe-struct-008", "pe-struct-011", "pe-const-011", "pe-const-012", "pe-const-014", "maturity-nurse-saul", "prestress-elastic-shortening", "development-length-tension", "wood-bolt-group-capacity", "timber-beam-stability-cl", "timber-beam-shear-capacity"],
      },
      {
        n: 5,
        name: "Design and Details of Structures–Component Design and Detailing",
        questions: "26–39",
        topic: "structural",
        items: [
          "Horizontal members (e.g., beams, slabs, diaphragms, struts)",
          "Vertical members (e.g., columns, bearing walls, shear walls)",
          "Systems (e.g., trusses, braces, frames, composite construction)",
          "Connections (e.g., bolted, welded, bearing, embedded, anchored, post-installed anchors)",
          "Shallow foundations (e.g., footings, combined footings, slabs, mats)",
          "Deep foundations (e.g., piers, piles, caissons, drilled shafts)",
          "Retaining walls",
        ],
        skills: ["rc-beam-design-moment", "rc-beam-shear-vc", "rc-tied-column-axial", "one-way-slab-min-thickness", "steel-required-z", "steel-ltb-inelastic", "steel-beam-shear", "aisc-column-capacity", "beam-column-interaction", "plate-tension-capacity", "composite-beam-phi-mn", "fillet-weld-strength", "bolt-shear-bearing", "timber-joist-allowable-moment", "timber-column-capacity", "cmu-wall-axial-asd", "footing-punching-shear-vu", "footing-one-way-shear-vu", "pile-group-efficiency", "retaining-wall-overturning", "pe-struct-002", "pe-struct-003", "pe-struct-007", "pe-struct-010", "bolt-group-eccentric", "prestress-elastic-shortening", "two-way-slab-thickness", "shear-wall-uplift", "base-plate-bearing", "development-length-tension", "web-local-yielding", "moment-magnification-nonsway", "wood-bolt-group-capacity", "base-plate-thickness", "sway-moment-magnification", "timber-beam-stability-cl", "block-shear-plate", "shear-studs-full-composite", "rc-beam-deflection-ie", "cantilever-stem-moment", "steel-ltb-elastic", "rc-tbeam-flexure", "spiral-reinforcement-ratio", "timber-beam-shear-capacity"],
      },
    ],
  },
  "geotechnical": {
    effective: "April 2024",
    areas: [
      {
        n: 1,
        name: "Site Characterization",
        questions: "8–12",
        topic: "geotechnical",
        items: [
          "Identification, validation, and interpretation of site data and proposed site development data (e.g., aerial photography, geologic and topographic maps, GIS and geotechnical data, as-built plans, planning studies and reports)",
          "Subsurface exploration planning",
          "Exploration techniques (e.g., hollow stem auger, cased boring, mud rotary, air rotary, rock coring, sonic drilling, Cone Penetrometer Test, geophysics, and test pits)",
          "Sampling techniques (e.g., split-barrel sampling, thin-walled tube sampling, handling and storage)",
          "In situ testing (e.g., standard penetration testing, cone penetration testing, pressure meter testing, pore pressure dissipation testing, dilatometer testing, dynamic cone penetration, plate load testing, field vane shear)",
          "Description and classification of soils (e.g., Burmeister, Unified Soil Classification System, AASHTO, USDA, and visual/manual)",
          "Rock classification and characterization (e.g., recovery, rock quality designation, rock mass rating systems, weathering, discontinuity)",
          "Groundwater exploration, sampling, and characterization",
        ],
        skills: ["spt-n160", "aashto-group-index", "pe-geo-003", "pe-geo-007", "pe-geo-008", "rqd-from-core-run"],
      },
      {
        n: 2,
        name: "Soil Mechanics, Laboratory Testing, and Analysis",
        questions: "8–12",
        topic: "geotechnical",
        items: [
          "Soil phase relationship and index property",
          "Chemical, electrical, and thermal properties (e.g., non-HAZMAT)",
          "Stress in soil mass (e.g., total, effective)",
          "Stress/strain, strength",
          "Permeability (e.g., falling head test, constant head test, grain-size correlations)",
        ],
        skills: ["degree-of-saturation", "effective-stress", "falling-head-permeability", "stress-21-method", "triaxial-friction-angle", "liquidity-index", "compression-index-oedometer", "pe-geo-019"],
      },
      {
        n: 3,
        name: "Construction Observation, Monitoring, and Quality Assurance/Quality Control",
        questions: "6–9",
        topic: "geotechnical",
        items: [
          "Earthwork (e.g., excavation, subgrade preparation, lab and field compaction, borrow studies, fill placement)",
          "Trench and construction safety",
          "Geotechnical instrumentation (e.g., inclinometer, settlement plates, piezometer, vibration monitoring)",
          "Temporary and permanent soil erosion and scour protection measures",
        ],
        skills: ["borrow-volume-compaction", "compaction-water-to-add", "pe-const-003", "pe-const-006", "pe-const-008", "sand-cone-relative-compaction", "rusle-soil-loss", "roller-compaction-production"],
      },
      {
        n: 4,
        name: "Earthquake Engineering and Dynamic Loads",
        questions: "5–8",
        topic: "geotechnical",
        items: [
          "Seismic site characterization",
          "Seismic analyses and design (e.g., liquefaction, pseudo static, earthquake loads)",
        ],
        skills: ["liquefaction-csr", "pe-geo-009", "pe-geo-010", "liquefaction-factor-of-safety", "pseudo-static-infinite-slope", "pe-geo-018", "mononobe-okabe-thrust"],
      },
      {
        n: 5,
        name: "Earth Structures, Ground Improvement, and Pavement",
        questions: "9–14",
        topic: "geotechnical",
        items: [
          "Ground improvement (e.g., grouting, soil mixing, preconsolidation/wick drains, lightweight materials, lime/cement stabilization, rigid inclusions, aggregate piers)",
          "Geosynthetic applications (e.g., separation, strength, filtration, drainage, reinforced soil slopes, internal stability of MSE)",
          "Slope stability evaluation and slope stabilization",
          "Embankments, earth dams, and levees (e.g., stress, settlement)",
          "Landfills and caps (e.g., interface stability, settlements, lining systems)",
          "Pavement and slab-on-grade design (e.g., rigid, flexible, porous, unpaved)",
          "Utility design and construction",
        ],
        skills: ["infinite-slope-seepage", "base-thickness-sn", "design-lane-esals", "pe-geo-012", "pseudo-static-infinite-slope", "mse-reinforcement-tension", "geotextile-aos", "landfill-leachate-balance", "preload-surcharge-time", "dynamic-compaction-depth", "mse-pullout-resistance"],
      },
      {
        n: 6,
        name: "Groundwater and Seepage",
        questions: "4–6",
        topic: "geotechnical",
        items: [
          "Dewatering, seepage analysis, groundwater flow, and impact on nearby structures",
          "Drainage design/infiltration and seepage control",
        ],
        skills: ["flow-net-seepage", "thiem-unconfined-flow", "pe-geo-004", "heave-exit-gradient", "groundwater-travel-time", "geotextile-aos"],
      },
      {
        n: 7,
        name: "Problematic Soil and Rock Conditions",
        questions: "4–6",
        topic: "geotechnical",
        items: [
          "Karst, collapsible, expansive, peat, organic, and sensitive soils",
          "Reactive/corrosive soils (e.g., identification, protective measures)",
          "Frost susceptibility",
          "Rock slopes and rockfalls",
        ],
        skills: ["pe-geo-005", "pe-geo-006", "pe-geo-013", "pe-geo-014", "pe-geo-015", "pe-geo-016", "pe-geo-017", "secondary-compression"],
      },
      {
        n: 8,
        name: "Retaining Structures (ASD or LRFD)",
        questions: "10–15",
        topic: "geotechnical",
        items: [
          "Lateral earth pressure and load distribution",
          "Rigid retaining wall analysis (e.g., CIP, gravity, external stability of MSE, soil nail, crib, bin)",
          "Cantilevered, anchored, and braced retaining wall analysis (e.g., soldier pile and lagging, sheet pile, secant pile, tangent pile, diaphragm walls, temporary support of excavation, and beams and column elements)",
          "Cofferdams",
          "Underpinning methods and effects on adjacent infrastructure",
          "Ground anchors, tie-backs, soil nails, and rock anchors (e.g., design and quality control)",
        ],
        skills: ["rankine-active-thrust", "passive-thrust-cohesion", "wall-thrust-surcharge-water", "retaining-wall-sliding", "retaining-wall-overturning", "cantilever-sheet-pile-depth", "braced-cut-strut-load", "pe-geo-002", "mse-reinforcement-tension", "mse-pullout-resistance", "coulomb-active-thrust", "mononobe-okabe-thrust", "cantilever-stem-moment", "braced-cut-clay-peck"],
      },
      {
        n: 9,
        name: "Shallow Foundations (ASD or LRFD)",
        questions: "6–9",
        topic: "geotechnical",
        items: [
          "Bearing capacity",
          "Settlement, including induced stress distribution",
        ],
        skills: ["strip-footing-bearing-wt", "clay-bearing-undrained", "nc-clay-settlement", "oc-clay-settlement", "consolidation-time", "stress-21-method", "pe-geo-001", "compression-index-oedometer", "preload-surcharge-time", "secondary-compression", "pile-group-settlement"],
      },
      {
        n: 10,
        name: "Deep Foundations (ASD or LRFD)",
        questions: "10–15",
        topic: "geotechnical",
        items: [
          "Geotechnical and structural capacity and settlement of deep foundations (e.g., driven pile, drilled shaft, micropile, helical screw piles, auger cast piles, beam/column)",
          "Lateral capacity and deformation of deep foundations",
          "Installation methods",
          "Static and dynamic load testing",
          "Integrity testing methods",
        ],
        skills: ["pile-alpha-capacity", "pile-group-efficiency", "drilled-shaft-beta", "pe-geo-011", "pile-elastic-shortening", "modified-gates-pile", "davisson-offset", "pe-geo-020", "pe-geo-021", "pe-geo-022", "rock-socket-side-resistance", "pile-group-settlement"],
      },
    ],
  },
  "transportation": {
    effective: "April 2024",
    areas: [
      {
        n: 1,
        name: "Project Management",
        questions: "6–9",
        topic: "construction",
        items: [
          "Quantity and cost estimating",
          "Project schedules (e.g., activity identification and sequencing)",
          "Economic analysis (e.g., present worth, lifecycle costs)",
        ],
        skills: ["estimate-at-completion", "earned-value-index", "cpm-total-float", "average-end-area-volume", "benefit-cost-ratio", "euac-alternative", "pavement-marking-quantity", "cost-loaded-cumulative", "cost-index-capacity-scaling"],
      },
      {
        n: 2,
        name: "Traffic Engineering (Capacity Analysis, Transportation Planning, and Safety Analysis)",
        questions: "10–15",
        topic: "transportation",
        items: [
          "Uninterrupted flow (e.g., level of service [LOS], capacity)",
          "Street segment interrupted flow (e.g., level of service [LOS], running time, travel speed)",
          "Intersection capacity (e.g., at grade, signalized, roundabout, interchange)",
          "Traffic analysis (e.g., volume studies, peak hour factor, speed studies, modal split, trip generation, traffic impact studies)",
          "Traffic safety analysis (e.g., conflict analysis, crash rates, collision diagrams)",
          "Nonmotorized facilities analysis (e.g., pedestrian, bicycle)",
          "Traffic forecasts and monitoring",
          "Highway safety analysis (e.g., crash modification factors, Highway Safety Manual)",
        ],
        skills: ["freeway-flow-rate", "critical-lane-vc", "incident-queue-delay", "pe-trans-006", "pe-trans-012", "pe-trans-013", "pe-trans-014", "pe-trans-015", "segment-crash-rate", "aadt-design-hour-volume", "roundabout-entry-capacity", "toll-booth-queue-wait", "epdo-crash-index", "parking-peak-accumulation", "walkway-pedestrian-space", "spot-speed-85th", "space-mean-speed", "signal-uniform-delay", "freeway-merge-flow", "gravity-model-trips", "trip-generation-regression", "detector-occupancy-density", "skid-mark-speed"],
      },
      {
        n: 3,
        name: "Roadside and Cross-Section Design",
        questions: "7–11",
        topic: "transportation",
        items: [
          "Forgiving roadside concepts (e.g., clear zone, recoverable slopes, roadside obstacles)",
          "Barrier design (e.g., barrier types, end treatments, crash cushions)",
          "Cross-section elements (e.g., lane widths, shoulders, bike lane, sidewalks, retaining walls)",
          "Nonmotorized design considerations (e.g., shared-use paths, bicycle facilities, pedestrian facilities, ADA compliance, traffic-calming features)",
        ],
        skills: ["pe-trans-005", "pe-trans-010", "pe-trans-016", "pe-trans-017", "pe-trans-018", "pe-trans-019"],
      },
      {
        n: 4,
        name: "Horizontal Design",
        questions: "8–12",
        topic: "transportation",
        items: [
          "Basic circular curve elements (e.g., middle ordinate, length, chord definition, radius definition, centerline stationing)",
          "Sight distance considerations",
          "Superelevation (e.g., rate, transitions, method, components)",
          "Special horizontal curves (e.g., compound/reverse curves, curve widening, coordination with vertical geometry)",
        ],
        skills: ["horizontal-curve-length", "curve-pt-station", "curve-external-distance", "middle-ordinate-clearance", "superelevation-min-radius", "superelevation-runoff-length", "spiral-curve-length", "required-superelevation"],
      },
      {
        n: 5,
        name: "Vertical Design",
        questions: "8–12",
        topic: "transportation",
        items: [
          "Vertical alignment (e.g., geometrics, vertical clearance)",
          "Stopping and passing sight distance (e.g., crest curve, sag curve)",
        ],
        skills: ["stopping-sight-distance", "crest-curve-length-ssd", "sag-curve-headlight", "vertical-curve-elevation", "crest-high-point", "pe-trans-002", "crest-curve-available-ssd"],
      },
      {
        n: 6,
        name: "Intersection Geometry",
        questions: "7–11",
        topic: "transportation",
        items: [
          "Intersection sight distance",
          "Interchanges (e.g., freeway merge, entrance and exit design, horizontal design, vertical design)",
          "At-grade intersection layout, including roundabouts",
        ],
        skills: ["intersection-sight-distance", "pe-trans-011", "left-turn-storage", "pe-trans-020", "pe-trans-021", "pe-trans-022", "roundabout-entry-capacity"],
      },
      {
        n: 7,
        name: "Traffic Signals",
        questions: "5–8",
        topic: "transportation",
        items: [
          "Traffic signal timing (e.g., clearance intervals, phasing, pedestrian crossing timing, railroad preemption)",
          "Traffic signal warrants",
          "Traffic signal design",
        ],
        skills: ["webster-cycle-length", "signal-change-clearance", "pedestrian-phase-time", "pe-trans-001", "pe-trans-007", "pe-trans-008", "signal-uniform-delay"],
      },
      {
        n: 8,
        name: "Traffic Control Design",
        questions: "5–8",
        topic: "transportation",
        items: [
          "Permanent signs and pavement markings",
          "Temporary traffic control",
        ],
        skills: ["pe-trans-003", "pe-trans-004", "pe-trans-009", "work-zone-taper-length", "pe-trans-023", "sign-letter-height", "pavement-marking-quantity", "pe-trans-024", "pe-trans-025"],
      },
      {
        n: 9,
        name: "Geotechnical and Pavement",
        questions: "6–9",
        topic: "transportation",
        items: [
          "Sampling, testing, evaluation, and soil stabilization techniques (e.g., soil classifications, subgrade resilient modulus, CBR, R-values, field tests, slope stability)",
          "Soil properties (e.g., strength, permeability, compressibility, phase relationships)",
          "Compaction, excavation, embankment, and mass balance",
          "Traffic characterization parameters, pavement design, and rehabilitation procedures (e.g., flexible and rigid pavement)",
        ],
        skills: ["aashto-group-index", "design-lane-esals", "axle-load-equivalency", "base-thickness-sn", "borrow-volume-compaction", "earthwork-waste-shrinkage", "earthwork-overhaul"],
      },
      {
        n: 10,
        name: "Drainage",
        questions: "8–12",
        topic: "water-env",
        items: [
          "Hydrology, including runoff and water quality mitigation measures",
          "Hydraulics, including culvert and stormwater collection system design (e.g., inlet capacities, pipe flow, hydraulic energy dissipation, peak flow mitigation/detention, open-channel flow)",
        ],
        skills: ["rational-method", "nrcs-curve-number", "tr55-sheet-flow", "hec22-gutter-flow", "culvert-outlet-control-hw", "storm-sewer-size", "pe-env-010", "infiltration-trench-length", "rational-method-idf"],
      },
    ],
  },
  "construction": {
    effective: "April 2024",
    areas: [
      {
        n: 1,
        name: "Soil Mechanics",
        questions: "6–9",
        topic: "geotechnical",
        items: [
          "Lateral earth pressure",
          "Soil consolidation and settlement",
          "Effective and total stresses",
          "Bearing capacity",
          "Slope stability",
        ],
        skills: ["rankine-active-thrust", "effective-stress", "nc-clay-settlement", "strip-footing-bearing-wt", "clay-bearing-undrained", "infinite-slope-seepage"],
      },
      {
        n: 2,
        name: "Site Layout and Development",
        questions: "5–8",
        topic: "construction",
        items: [
          "Layout and control (e.g., staking, benchmarks, elevations)",
          "Basic horizontal and vertical curve elements (e.g., middle ordinate, length, chord, radius)",
          "Site investigations (e.g., adjacent structures and properties, utilities)",
        ],
        skills: ["horizontal-curve-length", "curve-external-distance", "vertical-curve-elevation", "crest-high-point", "grade-stake-cut", "slope-stake-offset", "pe-const-020", "pe-const-021"],
      },
      {
        n: 3,
        name: "Material Properties",
        questions: "5–8",
        topic: "construction",
        items: [
          "Soil, rock and aggregates (e.g., boring log interpretation, classification, strength, permeability, compressibility)",
          "Concrete (e.g., mix design, admixtures, proportioning)",
          "Steel (e.g., structural, reinforcement, prestressed)",
          "Wood (e.g., sawn, engineered)",
        ],
        skills: ["mix-design-fine-aggregate", "degree-of-saturation", "aashto-group-index", "pe-struct-005", "triaxial-friction-angle", "rqd-from-core-run", "pe-geo-016", "liquidity-index"],
      },
      {
        n: 4,
        name: "Estimating Quantities and Costs",
        questions: "6–9",
        topic: "construction",
        items: [
          "Quantity take-off methods",
          "Cost estimating",
          "Engineering economic analysis (e.g., cost analysis for resource selection, break-even, net-present value, life-cycle costing)",
          "Work measurement and productivity (e.g., earned value)",
        ],
        skills: ["earthwork-truck-loads", "average-end-area-volume", "earthwork-waste-shrinkage", "borrow-volume-compaction", "earned-value-index", "estimate-at-completion", "benefit-cost-ratio", "capitalized-cost", "pe-const-001", "euac-alternative", "equipment-owning-cost", "cost-loaded-cumulative", "learning-curve-unit-time", "cost-index-capacity-scaling", "earthwork-overhaul", "cost-plus-incentive-fee"],
      },
      {
        n: 5,
        name: "Project Planning and Scheduling",
        questions: "7–11",
        topic: "construction",
        items: [
          "Construction sequencing",
          "Activity time analysis",
          "Project schedule analysis (e.g., network analysis, critical path method, linear schedules)",
          "Resource scheduling and leveling",
          "Time–cost trade-off",
        ],
        skills: ["cpm-total-float", "least-cost-crashing", "linear-schedule-lag", "pe-const-010", "pe-const-017", "pe-const-018", "pe-const-019", "cost-loaded-cumulative"],
      },
      {
        n: 6,
        name: "Material, Production, and Execution Quality Control",
        questions: "7–11",
        topic: "construction",
        items: [
          "Material test methods and specification conformance",
          "Weld and bolt installation",
          "Quality control process (QA/QC)",
          "Concrete placement",
          "Concrete maturity and early strength evaluation",
          "Compaction (e.g., soils, asphalt, aggregates)",
        ],
        skills: ["compaction-water-to-add", "pe-const-009", "pe-const-011", "pe-const-012", "pe-const-013", "pe-const-014", "sand-cone-relative-compaction", "maturity-nurse-saul", "pe-geo-022", "concrete-pump-time", "roller-compaction-production"],
      },
      {
        n: 7,
        name: "Structural Mechanics",
        questions: "7–11",
        topic: "structural",
        items: [
          "Loads (e.g., dead, live, construction, wind, preloading)",
          "Statics and stresses (e.g., bending, shear, axial, combined, deflection)",
          "Structural members (e.g., beams, columns, one-way slabs)",
          "Structural systems (e.g., foundations, retaining walls, trusses, frames, two-way slabs, slab-on-grade)",
        ],
        skills: ["udl-max-moment", "ss-udl-deflection-us", "tributary-girder-moment", "cantilever-tip-deflection", "lrfd-governing-combination", "one-way-slab-min-thickness", "flat-roof-snow-load", "propped-cantilever-reaction"],
      },
      {
        n: 8,
        name: "Hydraulics and Hydrology",
        questions: "4–6",
        topic: "water-env",
        items: [
          "Stormwater collection and drainage (e.g., open-channel flow, culvert, storm sewer, watersheds)",
          "Storm characteristics and runoff analysis (e.g., rational and SCS/NRCS methods, types of flow, flow characteristics, hydrographic application, erosion control, runoff time of concentration, storm frequency, rainfall measurement and distribution)",
          "Detention/retention ponds",
        ],
        skills: ["rational-method", "nrcs-curve-number", "manning-rect-si", "detention-storage-triangular", "culvert-outlet-control-hw", "dewatering-pump-power", "sediment-basin-stokes", "linear-reservoir-routing", "rational-method-idf"],
      },
      {
        n: 9,
        name: "Construction Operations and Methods",
        questions: "9–14",
        topic: "construction",
        items: [
          "Lifting and rigging",
          "Cranes (e.g., stability, outrigger loads, lifting capacity, crane types)",
          "Dewatering and pumping",
          "Equipment selection and operations",
          "Deep foundation installation",
          "Excavation and embankment (e.g., cut and fill analysis, borrow pit volume, haul distances)",
        ],
        skills: ["haul-fleet-size", "excavator-production-bcy", "two-leg-sling-tension", "crane-mat-area", "thiem-unconfined-flow", "pe-const-002", "pe-const-016", "cooper-jacob-drawdown", "dewatering-pump-power", "modified-gates-pile", "pe-geo-021", "equipment-owning-cost", "concrete-pump-time", "crane-lift-percent-capacity", "pump-operating-point", "earthwork-overhaul", "required-rimpull", "roller-compaction-production"],
      },
      {
        n: 10,
        name: "Design for Support of Construction Loads",
        questions: "10–15",
        topic: "construction",
        items: [
          "Formwork",
          "Falsework and scaffolding",
          "Shoring and reshoring",
          "Bracing and anchorage",
          "Support of excavation",
          "Construction loads on permanent structures (e.g., erection analysis, equipment loading)",
        ],
        skills: ["wall-formwork-pressure", "braced-cut-strut-load", "cantilever-sheet-pile-depth", "pe-const-015", "shoring-post-load", "heave-exit-gradient", "pe-struct-012", "form-tie-spacing", "braced-cut-clay-peck"],
      },
      {
        n: 11,
        name: "Health and Safety",
        questions: "4–6",
        topic: "construction",
        items: [
          "OSHA construction and industry regulations and safety management",
          "Work zone and public safety including maintenance of traffic",
        ],
        skills: ["pe-const-003", "pe-const-004", "pe-const-005", "pe-const-006", "pe-const-007", "pe-const-008", "pe-trans-003", "pe-trans-004", "work-zone-taper-length", "pe-trans-023"],
      },
    ],
  },
};

/** Midpoint of a "7–11" style range. */
export function midQuestions(range: string): number {
  const [a, b] = range.split("–").map(Number);
  return (a + b) / 2;
}

export function peModuleSpec(module: string | null | undefined) {
  return module ? PE_MODULE_SPECS[module] : undefined;
}

/** Topic weights for a PE module exam: each knowledge area's question midpoint, summed by CivilPrep topic. */
export function peModuleTopicWeights(module: string): Map<string, number> | null {
  const spec = PE_MODULE_SPECS[module];
  if (!spec) return null;
  const raw = new Map<string, number>();
  for (const a of spec.areas) raw.set(a.topic, (raw.get(a.topic) ?? 0) + midQuestions(a.questions));
  return raw;
}
