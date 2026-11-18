import type { Question } from "./types";

// Conceptual questions for knowledge areas that formula templates can't cover: ethics and contracts,
// OSHA excavation and fall protection, MUTCD signs and work zones, soil classification, treatment
// processes, structural determinacy and code categories. Original wording. The correct choice is
// listed first here; balanceChoices() in index.ts moves it to a stable, evenly spread position.

const fe = (x: Omit<Question, "exam" | "answer">): Question => ({ ...x, exam: "fe-civil", answer: 0 });
const pe = (x: Omit<Question, "exam" | "answer">): Question => ({ ...x, exam: "pe-civil", answer: 0 });

export const FE_CONCEPTS: Question[] = [
  // Ethics, licensure, liability and contracts
  fe({
    id: "fe-ethics-009",
    topic: "ethics",
    prompt: "An engineer is retained as an expert witness in a dispute over a failed retaining wall. Under the NCEES Model Rules, the engineer may give an opinion in testimony only when:",
    choices: [
      "It is founded on adequate knowledge of the facts and an honest conviction",
      "It supports the client who retained them",
      "Another engineer has reached the same opinion",
      "The engineer designed the wall",
    ],
    explanation: "Licensees issue statements, criticisms or arguments on technical matters, including testimony, only when founded on adequate knowledge of the facts and a background of technical competence, and with honest conviction. Advocacy for the retaining party doesn't change that.",
    reference: "FE Reference Handbook: Ethics, NCEES Model Rules",
  }),
  fe({
    id: "fe-ethics-010",
    topic: "ethics",
    prompt: "A licensed engineer moves to a new state and wants to offer civil engineering services there. What is generally required first?",
    choices: [
      "Obtain a license in the new state (often by comity or endorsement)",
      "Nothing, since a license from any state is valid nationwide",
      "Pass the FE exam again",
      "Register the firm with the federal government",
    ],
    explanation: "Licensure is by jurisdiction. Engineers must hold a license in the state where they practice or offer to practice. Most boards license already-licensed engineers by comity (endorsement), often streamlined through an NCEES Record.",
    reference: "FE Reference Handbook: Ethics, Licensure",
  }),
  fe({
    id: "fe-ethics-011",
    topic: "ethics",
    prompt: "Professional liability (errors and omissions) insurance for a consulting engineer primarily covers claims of:",
    choices: [
      "Negligence in performing professional services",
      "Injuries to the firm's own employees",
      "Damage to the firm's office and equipment",
      "Intentional fraud by the engineer",
    ],
    explanation: "Professional liability insurance covers claims that the firm failed to meet the standard of care (negligent acts, errors or omissions) in its professional work. Employee injuries are covered by workers' compensation, property by property insurance, and intentional fraud is generally excluded.",
    reference: "FE Reference Handbook: Ethics, Professional liability",
  }),
  fe({
    id: "fe-ethics-012",
    topic: "ethics",
    prompt: "Which contract type gives the owner the most certainty about total cost at the time the contract is signed?",
    choices: ["Lump sum (stipulated sum)", "Cost plus a percentage fee", "Cost plus a fixed fee", "Time and materials"],
    explanation: "Under a lump-sum contract the contractor agrees to deliver the defined scope for a fixed price, so the owner knows the price up front (changes aside). The cost-plus and time-and-materials types reimburse actual costs, so the final cost isn't known until the work is done.",
    reference: "FE Reference Handbook: Ethics, Contracts",
  }),
  fe({
    id: "fe-ethics-013",
    topic: "ethics",
    prompt: "A construction contract states that the contractor owes the owner $2,500 for each calendar day the project finishes past the completion date. This provision is called:",
    choices: ["Liquidated damages", "Retainage", "A performance bond", "Consequential damages"],
    explanation: "Liquidated damages are a pre-agreed daily amount for late completion, set in the contract because actual delay damages are hard to prove. Retainage is a portion of progress payments held back; a performance bond is a surety's guarantee of completion.",
    reference: "FE Reference Handbook: Ethics, Contracts",
  }),

  // Construction
  fe({
    id: "fe-const-003",
    topic: "construction",
    prompt: "In the design-build project delivery method, the owner holds a contract with:",
    choices: [
      "A single entity responsible for both design and construction",
      "A designer, and separately with the lowest responsible bidder",
      "A construction manager who acts only as an advisor",
      "Each trade contractor directly",
    ],
    explanation: "Design-build puts design and construction under one contract with one entity. Design-bid-build uses separate contracts for the designer and the contractor; construction manager as agent is advisory; multiple prime contracting has the owner contract with each trade.",
    reference: "FE Reference Handbook: Civil Engineering, Construction (project delivery)",
  }),
  fe({
    id: "fe-const-004",
    topic: "construction",
    prompt: "In a CPM schedule with no imposed finish date, what is the total float of every activity on the critical path?",
    choices: ["Zero", "Equal to its duration", "Equal to its free float plus one day", "The project duration minus its duration"],
    explanation: "When the late finish of the project equals its early finish, activities on the critical path have LS = ES and LF = EF, so total float is zero. Any delay to them delays the project.",
    reference: "FE Reference Handbook: Civil Engineering, Construction (CPM)",
  }),
  fe({
    id: "fe-const-005",
    topic: "construction",
    prompt: "Under OSHA excavation rules, at what depth must a trench (not in stable rock) have a protective system such as sloping, shoring or a trench box?",
    choices: ["5 ft or more", "3 ft or more", "10 ft or more", "20 ft or more"],
    explanation: "OSHA 29 CFR 1926.652 requires a protective system for excavations 5 ft deep or more, unless the excavation is entirely in stable rock. Shallower trenches need one only if a competent person finds signs of possible cave-in.",
    reference: "OSHA 29 CFR 1926 Subpart P",
  }),

  // Materials
  fe({
    id: "fe-mat-003",
    topic: "materials",
    prompt: "The main purpose of entraining air in concrete is to improve its:",
    choices: ["Resistance to freezing and thawing", "Compressive strength", "Modulus of elasticity", "Rate of strength gain"],
    explanation: "Entrained air creates tiny, well-distributed bubbles that relieve pressure as pore water freezes, greatly improving freeze-thaw durability. It also improves workability, but it slightly reduces strength.",
    reference: "FE Reference Handbook: Civil Engineering, Concrete",
  }),
  fe({
    id: "fe-mat-004",
    topic: "materials",
    prompt: "What is the approximate modulus of elasticity of structural steel?",
    choices: ["29,000 ksi", "3,600 ksi", "10,000 ksi", "1,600 ksi"],
    explanation: "Structural steel has E ≈ 29,000 ksi (200 GPa) regardless of grade. About 3,600 ksi is typical of 4,000 psi concrete, 10,000 ksi of aluminum, and 1,600 ksi of many structural lumber species.",
    reference: "FE Reference Handbook: Materials, properties of metals",
  }),
  fe({
    id: "fe-mat-005",
    topic: "materials",
    prompt: "Wood is strongest when loaded in compression:",
    choices: ["Parallel to the grain", "Perpendicular to the grain", "At 45° to the grain", "Equally in all directions"],
    explanation: "Wood fibers run along the grain, so compression parallel to grain is far stronger than compression perpendicular to grain, which crushes the cells. Design values reflect this (Fc vs. Fc⊥).",
    reference: "FE Reference Handbook: Materials, wood",
  }),

  // Geotechnical
  fe({
    id: "fe-geo-004",
    topic: "geotechnical",
    prompt: "An inorganic soil has 70% passing the No. 200 sieve, a liquid limit of 62 and a plasticity index of 35. What is its USCS group symbol?",
    choices: ["CH", "CL", "MH", "SC"],
    explanation: "More than 50% passes the No. 200 sieve, so it is fine-grained. LL ≥ 50 means high plasticity (H). The A-line is PI = 0.73(LL − 20) = 0.73(42) = 30.7; PI = 35 plots above it, so it is clay: CH.",
    reference: "FE Reference Handbook: Geotechnical, Unified Soil Classification System",
  }),
  fe({
    id: "fe-geo-005",
    topic: "geotechnical",
    prompt: "A coarse-grained soil has 4% fines, Cu = 8 and Cc = 1.5, and more than half of its coarse fraction passes the No. 4 sieve. What is its USCS group symbol?",
    choices: ["SW", "SP", "GW", "SM"],
    explanation: "More than half the coarse fraction passes the No. 4 sieve, so it is a sand. Fines under 5% means a clean sand. Cu ≥ 6 and 1 ≤ Cc ≤ 3 means well graded: SW.",
    reference: "FE Reference Handbook: Geotechnical, Unified Soil Classification System",
  }),
  fe({
    id: "fe-geo-006",
    topic: "geotechnical",
    prompt: "The sensitivity of a clay is defined as the ratio of its:",
    choices: [
      "Undisturbed to remolded unconfined compressive strength",
      "Remolded to undisturbed unconfined compressive strength",
      "Liquid limit to plastic limit",
      "Drained to undrained shear strength",
    ],
    explanation: "Sensitivity St = qu(undisturbed)/qu(remolded) at the same moisture content. Highly sensitive (quick) clays lose most of their strength when disturbed.",
    reference: "FE Reference Handbook: Geotechnical",
  }),

  // Transportation
  fe({
    id: "fe-trans-003",
    topic: "transportation",
    prompt: "Under the MUTCD, most permanent warning signs (for example, a curve ahead sign) use:",
    choices: ["A black legend on a yellow background", "A black legend on a white background", "A white legend on a green background", "A black legend on an orange background"],
    explanation: "Warning signs are black on yellow (school-related ones may be fluorescent yellow-green). Regulatory signs are generally black or red on white, guide signs white on green, and temporary traffic control warning signs black on orange.",
    reference: "MUTCD Part 2: Signs",
  }),
  fe({
    id: "fe-trans-004",
    topic: "transportation",
    prompt: "Under the MUTCD, yellow longitudinal pavement markings are used to:",
    choices: [
      "Separate traffic traveling in opposite directions",
      "Separate lanes of traffic traveling in the same direction",
      "Mark the right edge of the roadway",
      "Mark parking stalls",
    ],
    explanation: "Yellow lines separate opposing flows (and mark the left edge of divided and one-way roadways). White lines separate same-direction lanes and mark the right edge.",
    reference: "MUTCD Part 3: Markings",
  }),
  fe({
    id: "fe-trans-005",
    topic: "transportation",
    prompt: "An approach carries 1,800 vehicles in the peak hour, and the highest 15-minute count within that hour is 520 vehicles. What is the peak hour factor?",
    choices: ["0.87", "0.29", "0.96", "3.46"],
    explanation: "PHF = hourly volume/(4 × peak 15-min volume) = 1,800/(4 × 520) = 1,800/2,080 = 0.87.",
    reference: "FE Reference Handbook: Transportation, traffic flow",
  }),

  // Water resources and environmental
  fe({
    id: "fe-water-003",
    topic: "water-env",
    prompt: "When alum (aluminum sulfate) is added as a coagulant, which water quality parameter does it consume?",
    choices: ["Alkalinity", "Dissolved oxygen", "Hardness", "Nitrate"],
    explanation: "Alum hydrolyzes to aluminum hydroxide floc and releases acidity, which reacts with the water's bicarbonate alkalinity. Low-alkalinity water may need lime or soda ash added so coagulation works and pH doesn't drop.",
    reference: "FE Reference Handbook: Environmental, water treatment (coagulation)",
  }),
  fe({
    id: "fe-water-004",
    topic: "water-env",
    prompt: "Trihalomethanes (THMs) in drinking water form mainly when:",
    choices: [
      "Free chlorine reacts with natural organic matter",
      "Ozone reacts with nitrate",
      "Alum reacts with alkalinity",
      "UV light reacts with dissolved iron",
    ],
    explanation: "THMs and haloacetic acids are disinfection byproducts formed when free chlorine reacts with natural organic matter. Common controls are removing organics before chlorination (enhanced coagulation) and using chloramines for residual.",
    reference: "FE Reference Handbook: Environmental, disinfection",
  }),
  fe({
    id: "fe-water-005",
    topic: "water-env",
    prompt: "In lime-soda softening, removing calcium noncarbonate hardness requires adding:",
    choices: ["Soda ash (Na₂CO₃)", "Lime only", "Alum", "Carbon dioxide only"],
    explanation: "Lime removes carbonate hardness by raising pH and precipitating CaCO₃ (and Mg(OH)₂). Calcium noncarbonate hardness has no carbonate to precipitate with, so soda ash supplies it. Magnesium noncarbonate hardness needs both lime and soda ash.",
    reference: "FE Reference Handbook: Environmental, softening",
  }),

  // Structural
  fe({
    id: "fe-struct-003",
    topic: "structural",
    prompt: "A beam is fixed at one end and supported on a roller at the other. Its degree of static indeterminacy is:",
    choices: ["1", "0", "2", "3"],
    explanation: "The fixed support gives 3 reactions and the roller 1, for 4 unknowns. A planar body has 3 equilibrium equations, so it is indeterminate to the first degree (a propped cantilever).",
    reference: "FE Reference Handbook: Civil Engineering, Structural",
  }),
  fe({
    id: "fe-struct-004",
    topic: "structural",
    prompt: "A stable planar truss has 7 joints, 11 members and 3 support reaction components. It is:",
    choices: ["Statically determinate", "Indeterminate to the first degree", "Indeterminate to the second degree", "Unstable"],
    explanation: "For a planar truss compare m + r with 2j: 11 + 3 = 14 and 2(7) = 14. They are equal, so a stable truss with this count is statically determinate.",
    reference: "FE Reference Handbook: Statics, trusses",
  }),
  fe({
    id: "fe-struct-005",
    topic: "structural",
    prompt: "The influence line for the vertical reaction at the left support of a simply supported beam is:",
    choices: [
      "A straight line from 1 at the left support to 0 at the right support",
      "A straight line from 0 at the left support to 1 at the right support",
      "A triangle with a peak of 1 at midspan",
      "A constant value of 0.5 along the span",
    ],
    explanation: "With a unit load at distance x from the left support, R_L = (L − x)/L. That is 1 when the load is over the left support and falls linearly to 0 at the right support.",
    reference: "FE Reference Handbook: Civil Engineering, influence lines",
  }),
];

export const PE_CONCEPTS: Question[] = [
  // Construction: OSHA, delivery, QC
  pe({
    id: "pe-const-003",
    topic: "construction",
    prompt: "Under OSHA 29 CFR 1926 Subpart P, sloping or benching for an excavation deeper than what depth must be designed by a registered professional engineer?",
    choices: ["20 ft", "5 ft", "10 ft", "15 ft"],
    explanation: "Appendix B sloping and the tabulated options cover excavations up to 20 ft deep. Sloping or benching deeper than 20 ft must be designed by a registered professional engineer.",
    reference: "OSHA 29 CFR 1926.652",
  }),
  pe({
    id: "pe-const-004",
    topic: "construction",
    prompt: "OSHA requires a safe means of egress (such as a ladder) in trench excavations 4 ft or deeper. It must be located so that workers travel no more than how far laterally to reach it?",
    choices: ["25 ft", "10 ft", "50 ft", "100 ft"],
    explanation: "A stairway, ladder, ramp or other safe means of egress is required in trenches 4 ft or more deep, within 25 ft of lateral travel for employees.",
    reference: "OSHA 29 CFR 1926.651(c)(2)",
  }),
  pe({
    id: "pe-const-005",
    topic: "construction",
    prompt: "How far back from the edge of an excavation must excavated material (spoil) be kept, at a minimum, unless a retaining device is used?",
    choices: ["2 ft", "6 in", "5 ft", "10 ft"],
    explanation: "OSHA requires spoil and equipment to be kept at least 2 ft from the edge of the excavation, or held back by a retaining device, to protect workers from falling material.",
    reference: "OSHA 29 CFR 1926.651(j)(2)",
  }),
  pe({
    id: "pe-const-006",
    topic: "construction",
    prompt: "For an excavation less than 20 ft deep in OSHA Type B soil, what is the maximum allowable slope?",
    choices: ["1H:1V (45°)", "¾H:1V (53°)", "1½H:1V (34°)", "Vertical"],
    explanation: "OSHA Appendix B maximum allowable slopes: stable rock vertical, Type A ¾H:1V (53°), Type B 1H:1V (45°), Type C 1½H:1V (34°).",
    reference: "OSHA 29 CFR 1926 Subpart P, Appendix B",
  }),
  pe({
    id: "pe-const-007",
    topic: "construction",
    prompt: "In general construction, OSHA requires fall protection for workers on walking or working surfaces with an unprotected edge at least how far above a lower level?",
    choices: ["6 ft", "4 ft", "10 ft", "15 ft"],
    explanation: "OSHA 1926.501 sets the general construction trigger at 6 ft. Some activities have their own rules (for example, scaffolds at 10 ft and steel erection under Subpart R).",
    reference: "OSHA 29 CFR 1926.501(b)(1)",
  }),
  pe({
    id: "pe-const-008",
    topic: "construction",
    prompt: "Who must inspect an excavation and its protective system daily and after every rainstorm or other hazard-increasing event?",
    choices: ["A competent person", "A registered professional engineer", "The project owner", "An OSHA compliance officer"],
    explanation: "OSHA assigns daily excavation inspections to a competent person: someone able to identify existing and predictable hazards and authorized to take prompt corrective action.",
    reference: "OSHA 29 CFR 1926.651(k)",
  }),
  pe({
    id: "pe-const-009",
    topic: "construction",
    prompt: "The concrete maturity method is used to:",
    choices: [
      "Estimate in-place strength from the concrete's temperature history",
      "Measure the air content of fresh concrete",
      "Determine the slump of fresh concrete",
      "Find the chloride content of hardened concrete",
    ],
    explanation: "The maturity method (ASTM C1074) correlates a maturity index, computed from the measured temperature-time history, with strength from lab cylinders of the same mix. It supports decisions such as form stripping and post-tensioning.",
    reference: "ASTM C1074",
  }),
  pe({
    id: "pe-const-010",
    topic: "construction",
    prompt: "Under construction manager at risk (CMAR) delivery, the construction manager typically commits to:",
    choices: [
      "A guaranteed maximum price for the work",
      "Only advisory services with no cost risk",
      "Designing the project",
      "Accepting the lowest bid from the owner's designer",
    ],
    explanation: "A CMAR joins during design, then commits to a guaranteed maximum price and holds the trade contracts, taking on the risk of costs above the GMP. A CM agent is advisory only.",
    reference: "Construction project delivery methods",
  }),

  // Transportation: work zones, roadside, safety
  pe({
    id: "pe-trans-003",
    topic: "transportation",
    prompt: "In an MUTCD temporary traffic control zone, the area where road users are redirected out of their normal path, usually with tapers, is the:",
    choices: ["Transition area", "Advance warning area", "Activity area", "Termination area"],
    explanation: "The MUTCD divides a TTC zone into the advance warning area, transition area (where tapers shift traffic), activity area (including buffer and work space) and termination area.",
    reference: "MUTCD Part 6: Temporary Traffic Control",
  }),
  pe({
    id: "pe-trans-004",
    topic: "transportation",
    prompt: "An 11 ft lane is closed on a road with a posted speed of 55 mph. Using the MUTCD formula for speeds of 45 mph or more, what is the minimum merging taper length?",
    choices: ["605 ft", "555 ft", "1,109 ft", "302 ft"],
    explanation: "For posted speeds of 45 mph or more, L = WS = 11 × 55 = 605 ft. (Below 45 mph, L = WS²/60.)",
    reference: "MUTCD Part 6, taper length criteria",
  }),
  pe({
    id: "pe-trans-005",
    topic: "transportation",
    prompt: "Under the AASHTO Roadside Design Guide, a foreslope is considered recoverable (most drivers can stop or slow down on it) when it is:",
    choices: ["1V:4H or flatter", "Steeper than 1V:3H", "Between 1V:3H and 1V:4H", "1V:2H or flatter"],
    explanation: "Foreslopes 1V:4H or flatter are recoverable. Slopes between 1V:3H and 1V:4H are traversable but non-recoverable, and slopes steeper than 1V:3H are critical (vehicles are likely to overturn).",
    reference: "AASHTO Roadside Design Guide, clear zone concepts",
  }),
  pe({
    id: "pe-trans-006",
    topic: "transportation",
    prompt: "An intersection had 12 crashes over 3 years. The total entering volume averages 20,000 vehicles per day. What is the crash rate per million entering vehicles?",
    choices: ["0.55", "0.20", "1.64", "5.48"],
    explanation: "R = (crashes × 10⁶)/(365 × years × entering ADT) = (12 × 10⁶)/(365 × 3 × 20,000) = 12,000,000/21,900,000 = 0.55.",
    reference: "Highway safety analysis: crash rates",
  }),

  // Geotechnical: site characterization, seepage, problematic soils
  pe({
    id: "pe-geo-003",
    topic: "geotechnical",
    prompt: "A 60 in rock core run recovers pieces totaling 52 in. Pieces 4 in or longer total 42 in. What is the RQD?",
    choices: ["70%", "87%", "81%", "60%"],
    explanation: "RQD = (sum of intact pieces ≥ 4 in)/(total run length) = 42/60 = 70%. Recovery, 52/60 = 87%, is a different measure.",
    reference: "Rock classification: rock quality designation",
  }),
  pe({
    id: "pe-geo-004",
    topic: "geotechnical",
    prompt: "A quick (boiling) condition develops in sand under upward seepage when the hydraulic gradient reaches:",
    choices: ["γ'/γw", "γsat/γw", "1/γ'", "Zero"],
    explanation: "Effective stress drops to zero when the seepage force equals the buoyant weight: i·γw = γ', so i_c = γ'/γw, which is roughly 1 for most sands.",
    reference: "Seepage: critical hydraulic gradient",
  }),
  pe({
    id: "pe-geo-005",
    topic: "geotechnical",
    prompt: "Which soil type is generally the most susceptible to frost heave?",
    choices: ["Silt", "Clean gravel", "Clean coarse sand", "Massive rock"],
    explanation: "Silts combine fine pores (strong capillary rise) with enough permeability to feed growing ice lenses, so they heave the most. Clean gravels and sands drain freely; clays are too impermeable to supply water quickly.",
    reference: "Problematic soils: frost susceptibility",
  }),
  pe({
    id: "pe-geo-006",
    topic: "geotechnical",
    prompt: "Which clay mineral is most associated with expansive (shrink-swell) soils?",
    choices: ["Montmorillonite (smectite)", "Kaolinite", "Quartz", "Calcite"],
    explanation: "Montmorillonite (a smectite) adsorbs water between its layers and has a very high swell potential. Kaolinite swells little; quartz and calcite aren't clay minerals.",
    reference: "Problematic soils: expansive soils",
  }),

  // Water resources and environmental
  pe({
    id: "pe-env-003",
    topic: "water-env",
    prompt: "An activated sludge plant's sludge volume index has risen to about 250 mL/g. This most likely indicates:",
    choices: ["Bulking sludge with poor settling", "Excellent settling", "Too little aeration volume", "Complete nitrification"],
    explanation: "SVI below about 100 to 150 mL/g usually means good settling. Values well above 150 mL/g usually indicate bulking, often from filamentous organisms, which settles poorly in the secondary clarifier.",
    reference: "Wastewater treatment: sludge volume index",
  }),
  pe({
    id: "pe-env-004",
    topic: "water-env",
    prompt: "Nitrification consumes alkalinity at approximately what rate?",
    choices: ["7.14 mg as CaCO₃ per mg NH₄⁺-N oxidized", "4.57 mg as CaCO₃ per mg NH₄⁺-N oxidized", "1.0 mg as CaCO₃ per mg NH₄⁺-N oxidized", "It produces alkalinity"],
    explanation: "Oxidizing ammonia to nitrate uses about 7.14 mg of alkalinity (as CaCO₃) per mg of N. The 4.57 figure is the oxygen demand (mg O₂ per mg N). Denitrification recovers roughly half of the alkalinity.",
    reference: "Wastewater treatment: nitrification stoichiometry",
  }),
  pe({
    id: "pe-env-005",
    topic: "water-env",
    prompt: "In breakpoint chlorination of water that contains ammonia, a free chlorine residual starts to build once:",
    choices: [
      "The chlorine dose passes the breakpoint and the chloramines have been oxidized",
      "The first chlorine is added",
      "The combined residual reaches its maximum",
      "The pH drops below 5",
    ],
    explanation: "Chlorine first forms combined residual (chloramines), which rises and then falls as the chloramines are oxidized. Past the breakpoint, added chlorine shows up as free residual.",
    reference: "Drinking water treatment: chlorination",
  }),
  pe({
    id: "pe-env-006",
    topic: "water-env",
    prompt: "A total maximum daily load (TMDL) is the sum of:",
    choices: [
      "Wasteload allocations for point sources, load allocations for nonpoint sources, and a margin of safety",
      "Point source loads only",
      "Nonpoint source loads and background loads only",
      "The waterbody's current loads plus future growth",
    ],
    explanation: "TMDL = ΣWLA + ΣLA + MOS: wasteload allocations for point sources, load allocations for nonpoint sources and natural background, and a margin of safety (some TMDLs also reserve capacity for growth).",
    reference: "Clean Water Act Section 303(d); surface water quality",
  }),
  pe({
    id: "pe-water-002",
    topic: "water-env",
    prompt: "Cavitation is expected in a centrifugal pump when:",
    choices: [
      "The net positive suction head available is less than the NPSH required",
      "The discharge pressure exceeds the shutoff head",
      "The pump runs at its best efficiency point",
      "The suction pipe is larger than the discharge pipe",
    ],
    explanation: "If NPSHA (absolute pressure head at the suction minus vapor pressure head) falls below the pump's NPSHR, the pressure inside the impeller drops below vapor pressure, vapor bubbles form and collapse, and cavitation damage and performance loss follow.",
    reference: "Pumps: net positive suction head",
  }),

  // Structural
  pe({
    id: "pe-struct-004",
    topic: "structural",
    prompt: "Under ASCE 7, a hospital with surgery and emergency treatment facilities is assigned which risk category?",
    choices: ["IV", "III", "II", "I"],
    explanation: "Essential facilities such as hospitals with surgery or emergency treatment, fire and police stations, and emergency shelters are Risk Category IV, which raises importance factors for seismic, snow and ice loads.",
    reference: "ASCE 7 Table 1.5-1",
  }),
  pe({
    id: "pe-struct-005",
    topic: "structural",
    prompt: "Under the NDS for wood construction, what is the load duration factor CD for snow load?",
    choices: ["1.15", "0.90", "1.25", "1.60"],
    explanation: "NDS load duration factors: permanent (dead) 0.90, occupancy live 1.0, snow 1.15, construction 1.25, wind and earthquake 1.60, impact 2.0. Use the factor for the shortest-duration load in the combination.",
    reference: "NDS Table 2.3.2",
  }),
  pe({
    id: "pe-struct-006",
    topic: "structural",
    prompt: "Under the IBC, which document lists the special inspections and tests required for a project, prepared by the registered design professional in responsible charge?",
    choices: ["The statement of special inspections", "The certificate of occupancy", "The general contractor's daily log", "The geotechnical report"],
    explanation: "IBC Chapter 17 requires the registered design professional to prepare a statement of special inspections as part of the construction documents. It lists the inspections, tests and frequencies required.",
    reference: "IBC Chapter 17, Section 1704",
  }),
];
