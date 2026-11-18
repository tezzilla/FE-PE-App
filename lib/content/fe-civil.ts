import type { Question } from "./types";

// Original practice questions. Do not paste NCEES or third-party course questions here:
// they are copyrighted. Write new problems modeled on the published exam specifications.

const q = (x: Omit<Question, "exam">): Question => ({ ...x, exam: "fe-civil" });

export const FE_CIVIL: Question[] = [
  // Mathematics & Statistics
  q({
    id: "fe-math-001",
    topic: "math-stats",
    free: true,
    prompt: "What is the slope of the line passing through the points (2, 3) and (6, 11)?",
    choices: ["1.5", "2.0", "2.5", "4.0"],
    answer: 1,
    explanation: "m = (y2 − y1)/(x2 − x1) = (11 − 3)/(6 − 2) = 8/4 = 2.0",
    reference: "FE Reference Handbook: Mathematics, Straight Line",
  }),
  q({
    id: "fe-math-002",
    topic: "math-stats",
    prompt: "Evaluate the definite integral of 3x² dx from x = 0 to x = 2.",
    choices: ["4", "6", "8", "12"],
    answer: 2,
    explanation: "∫3x² dx = x³. Evaluated from 0 to 2: 2³ − 0 = 8.",
    reference: "FE Reference Handbook: Mathematics, Integral Calculus",
  }),
  q({
    id: "fe-math-003",
    topic: "math-stats",
    prompt: "For the sample 4, 8, 6, 10, 12, what is the sample standard deviation?",
    choices: ["2.83", "3.16", "3.54", "10.0"],
    answer: 1,
    explanation:
      "Mean = 40/5 = 8. Squared deviations: 16, 0, 4, 4, 16, sum = 40. Sample variance = 40/(n − 1) = 40/4 = 10. s = √10 = 3.16. (2.83 is the population standard deviation, dividing by n.)",
    reference: "FE Reference Handbook: Probability and Statistics, Dispersion",
  }),

  // Ethics
  q({
    id: "fe-ethics-001",
    topic: "ethics",
    free: true,
    prompt:
      "An engineer reviewing a colleague's drawings finds a design error that could endanger public safety. The colleague refuses to correct it. What should the engineer do?",
    choices: [
      "Say nothing, since the drawings are the colleague's responsibility",
      "Fix the drawings without telling anyone",
      "Report the issue to their employer and, if it remains uncorrected, to the appropriate authority",
      "Post the drawings publicly online",
    ],
    answer: 2,
    explanation:
      "The NCEES Model Rules require licensees to hold paramount the safety, health, and welfare of the public. If their judgment is overruled where public safety is at risk, they notify their employer or client and other authority as appropriate.",
    reference: "FE Reference Handbook: Ethics, NCEES Model Rules",
  }),
  q({
    id: "fe-ethics-002",
    topic: "ethics",
    prompt:
      "A supplier offers a design engineer an expensive vacation while the engineer is preparing a specification that could favor that supplier's product. The engineer should:",
    choices: [
      "Accept, since gifts are common in industry",
      "Accept only if the product is the best one",
      "Decline the offer",
      "Accept and disclose it after the project ends",
    ],
    answer: 2,
    explanation:
      "Licensees shall not accept gifts or valuable consideration from parties dealing with their client or employer in connection with work for which they are responsible. Decline.",
    reference: "FE Reference Handbook: Ethics, NCEES Model Rules",
  }),
  q({
    id: "fe-ethics-003",
    topic: "ethics",
    prompt:
      "A licensed engineer is asked by a developer to seal a set of drainage plans prepared by an unlicensed designer the engineer has never supervised. The developer offers a fee for the seal alone. What should the engineer do?",
    choices: [
      "Seal the plans after a quick check of the calculations",
      "Seal the plans, since the designer is experienced",
      "Decline unless the work was prepared under the engineer's responsible charge, or the engineer redoes it fully",
      "Seal the plans but add a note that someone else prepared them",
    ],
    answer: 2,
    explanation:
      "Engineers may only seal work they prepared or that was prepared under their direct supervision (responsible charge). Sealing others' unsupervised work for a fee is \"plan stamping\" and is prohibited, no matter how competent the designer is.",
    reference: "FE Reference Handbook: Ethics (licensee obligations)",
  }),
  q({
    id: "fe-ethics-004",
    topic: "ethics",
    prompt:
      "A structural engineer is asked to design a complex wastewater treatment process, which is outside their training and experience. What is the appropriate response?",
    choices: [
      "Accept, because any licensed engineer may practice in any discipline",
      "Accept and learn on the job without telling the client",
      "Decline, or accept only if qualified engineers handle the parts outside their competence",
      "Accept, but charge less to reflect the risk",
    ],
    answer: 2,
    explanation:
      "Engineers undertake assignments only when qualified by education or experience in the specific technical field. They may coordinate a project and use qualified associates for the parts outside their competence, but they shouldn't perform or seal that work themselves.",
    reference: "FE Reference Handbook: Ethics (competence)",
  }),
  q({
    id: "fe-ethics-005",
    topic: "ethics",
    prompt:
      "While reviewing bids for a city, an engineer learns that a firm owned by their spouse has submitted a bid. What should the engineer do first?",
    choices: [
      "Evaluate the bids normally, since they will be fair",
      "Disclose the relationship to the city promptly and follow its direction, such as stepping back from the evaluation",
      "Withdraw quietly without telling anyone",
      "Ask the spouse's firm to withdraw its bid",
    ],
    answer: 1,
    explanation:
      "A conflict of interest that could influence, or appear to influence, the engineer's judgment must be disclosed promptly to the employer or client. The client then decides how to handle it; recusal is common.",
    reference: "FE Reference Handbook: Ethics (conflicts of interest)",
  }),
  q({
    id: "fe-ethics-006",
    topic: "ethics",
    prompt:
      "An engineer's client asks them to keep a design report confidential. Later, the engineer learns the client plans to build in a way that will clearly endanger the public, and the client refuses to change course. What should the engineer do?",
    choices: [
      "Keep the information confidential, since the client asked",
      "Notify the appropriate authorities, because public safety outweighs the client's confidentiality",
      "Publish the report online so the public can decide",
      "Resign and say nothing further",
    ],
    answer: 1,
    explanation:
      "Engineers keep client information confidential except where disclosure is needed to protect public health, safety and welfare, or is required by law. When overruled on a public-safety issue, they notify the employer or client and the appropriate authority.",
    reference: "FE Reference Handbook: Ethics (public safety, confidentiality)",
  }),
  q({
    id: "fe-ethics-007",
    topic: "ethics",
    prompt:
      "An engineer leaves a firm and prepares a marketing brochure for their new company. Which statement can they include?",
    choices: [
      "That they personally designed every project their former firm completed while they were employed there",
      "Their actual role on specific past projects, described accurately",
      "That their old firm's designs were unsafe, to win clients",
      "A guarantee that their designs will pass any review without changes",
    ],
    answer: 1,
    explanation:
      "Engineers may advertise truthfully, giving an accurate account of their own role. They may not misrepresent their qualifications or responsibility for past work, and they shouldn't make false or malicious statements about other engineers.",
    reference: "FE Reference Handbook: Ethics (truthfulness, professional conduct)",
  }),
  q({
    id: "fe-ethics-008",
    topic: "ethics",
    prompt:
      "An engineer has good reason to believe another licensee is practicing while impaired and making errors in signed designs. What is the engineer's obligation?",
    choices: [
      "None, since it's the other engineer's license",
      "Report what they know to the state licensing board",
      "Discuss it on social media to warn the public",
      "Correct the other engineer's designs without telling anyone",
    ],
    answer: 1,
    explanation:
      "Licensees who know of a violation of the licensing rules by another licensee are expected to report it to the board and cooperate with its investigation. Boards exist to protect the public; quietly fixing designs or public accusations aren't appropriate substitutes.",
    reference: "FE Reference Handbook: Ethics (licensee obligations to the board)",
  }),

  // Engineering Economics
  q({
    id: "fe-econ-001",
    topic: "economics",
    free: true,
    prompt: "What is the present worth of $10,000 received 5 years from now at an interest rate of 6% per year?",
    choices: ["$7,000", "$7,473", "$7,921", "$13,382"],
    answer: 1,
    explanation: "P = F(P/F, 6%, 5) = 10,000 / (1.06)^5 = 10,000 / 1.3382 = $7,473",
    reference: "FE Reference Handbook: Engineering Economics, Factor Table",
  }),
  q({
    id: "fe-econ-002",
    topic: "economics",
    prompt:
      "A $50,000 loan is repaid in 10 equal end-of-year payments at 8% interest. What is the annual payment?",
    choices: ["$5,000", "$6,250", "$7,451", "$9,000"],
    answer: 2,
    explanation:
      "A = P(A/P, 8%, 10) = 50,000 × [0.08(1.08)^10] / [(1.08)^10 − 1] = 50,000 × 0.14903 = $7,451",
    reference: "FE Reference Handbook: Engineering Economics, Factor Table",
  }),

  // Statics
  q({
    id: "fe-statics-001",
    topic: "statics",
    free: true,
    prompt:
      "A simply supported beam spans 10 m with a single 20 kN point load located 3 m from the left support. What is the left support reaction?",
    choices: ["6 kN", "10 kN", "14 kN", "20 kN"],
    answer: 2,
    explanation: "Sum moments about the right support: R_A × 10 = 20 × (10 − 3). R_A = 140/10 = 14 kN.",
    reference: "FE Reference Handbook: Statics, Equilibrium",
  }),
  q({
    id: "fe-statics-002",
    topic: "statics",
    prompt: "Two forces act at a point: 30 N due east and 40 N due north. What is the magnitude of the resultant?",
    choices: ["10 N", "35 N", "50 N", "70 N"],
    answer: 2,
    explanation: "R = √(30² + 40²) = √2500 = 50 N",
    reference: "FE Reference Handbook: Statics, Resultants",
  }),

  // Dynamics
  q({
    id: "fe-dyn-001",
    topic: "dynamics",
    free: true,
    prompt: "A car starts from rest and accelerates uniformly at 3 m/s² for 5 s. How far does it travel?",
    choices: ["7.5 m", "15 m", "37.5 m", "75 m"],
    answer: 2,
    explanation: "s = v₀t + ½at² = 0 + ½(3)(5)² = 37.5 m",
    reference: "FE Reference Handbook: Dynamics, Constant Acceleration",
  }),
  q({
    id: "fe-dyn-002",
    topic: "dynamics",
    prompt: "An object is dropped from rest at a height of 20 m. Neglecting air resistance, what is its speed at impact?",
    choices: ["14.0 m/s", "19.8 m/s", "39.2 m/s", "196 m/s"],
    answer: 1,
    explanation: "v = √(2gh) = √(2 × 9.81 × 20) = √392.4 = 19.8 m/s",
    reference: "FE Reference Handbook: Dynamics, Kinematics",
  }),

  // Mechanics of Materials
  q({
    id: "fe-mom-001",
    topic: "mechanics-materials",
    free: true,
    prompt:
      "A 2 m long steel rod with cross-sectional area 500 mm² carries an axial tensile load of 50 kN. With E = 200 GPa, what is the elongation?",
    choices: ["0.5 mm", "1.0 mm", "2.0 mm", "10 mm"],
    answer: 1,
    explanation: "δ = PL/(AE) = (50,000 N)(2,000 mm) / [(500 mm²)(200,000 MPa)] = 1.0 mm",
    reference: "FE Reference Handbook: Mechanics of Materials, Uniaxial Loading",
  }),
  q({
    id: "fe-mom-002",
    topic: "mechanics-materials",
    prompt:
      "A simply supported beam with a 6 m span carries a uniform load of 10 kN/m. What is the maximum bending moment?",
    choices: ["30 kN·m", "45 kN·m", "90 kN·m", "180 kN·m"],
    answer: 1,
    explanation: "M_max = wL²/8 = (10)(6)²/8 = 45 kN·m at midspan",
    reference: "FE Reference Handbook: Mechanics of Materials, Simply Supported Beam Diagrams",
  }),
  q({
    id: "fe-mom-003",
    topic: "mechanics-materials",
    prompt:
      "What is the moment of inertia about the horizontal centroidal axis of a rectangle 200 mm wide and 400 mm deep?",
    choices: ["2.67 × 10⁸ mm⁴", "5.33 × 10⁸ mm⁴", "1.07 × 10⁹ mm⁴", "4.27 × 10⁹ mm⁴"],
    answer: 2,
    explanation: "I = bh³/12 = (200)(400)³/12 = 1.067 × 10⁹ mm⁴",
    reference: "FE Reference Handbook: Statics, Properties of Areas",
  }),

  // Materials
  q({
    id: "fe-mat-001",
    topic: "materials",
    free: true,
    prompt: "Standard concrete compressive strength f'c is typically specified at what age?",
    choices: ["7 days", "14 days", "28 days", "56 days"],
    answer: 2,
    explanation: "Design strength f'c is conventionally based on cylinders tested at 28 days.",
    reference: "FE Reference Handbook: Civil Engineering, Concrete",
  }),
  q({
    id: "fe-mat-002",
    topic: "materials",
    prompt: "Holding all else constant, increasing the water-cement ratio of a concrete mix will:",
    choices: [
      "Increase strength and decrease workability",
      "Decrease strength and increase workability",
      "Increase both strength and durability",
      "Have no effect on strength",
    ],
    answer: 1,
    explanation:
      "More water raises workability but increases porosity, which lowers strength and durability (Abrams' law).",
    reference: "FE Reference Handbook: Materials Science, Concrete",
  }),

  // Fluid Mechanics
  q({
    id: "fe-fluids-001",
    topic: "fluids",
    free: true,
    prompt: "What is the gage pressure 5 m below the surface of a body of fresh water (γ = 9.81 kN/m³)?",
    choices: ["4.9 kPa", "9.81 kPa", "49.1 kPa", "490 kPa"],
    answer: 2,
    explanation: "p = γh = (9.81 kN/m³)(5 m) = 49.1 kPa",
    reference: "FE Reference Handbook: Fluid Mechanics, Hydrostatic Pressure",
  }),
  q({
    id: "fe-fluids-002",
    topic: "fluids",
    prompt:
      "Water flows at 2 m/s in a 0.30 m diameter pipe that reduces to 0.15 m diameter. What is the velocity in the smaller pipe?",
    choices: ["1 m/s", "4 m/s", "8 m/s", "16 m/s"],
    answer: 2,
    explanation: "Continuity: V₂ = V₁(D₁/D₂)² = 2 × (0.30/0.15)² = 2 × 4 = 8 m/s",
    reference: "FE Reference Handbook: Fluid Mechanics, Continuity Equation",
  }),

  // Surveying
  q({
    id: "fe-survey-001",
    topic: "surveying",
    free: true,
    prompt:
      "A benchmark has elevation 100.00 ft. The backsight on the benchmark reads 4.25 ft and the foresight on point P reads 2.10 ft. What is the elevation of P?",
    choices: ["97.85 ft", "101.05 ft", "102.15 ft", "106.35 ft"],
    answer: 2,
    explanation: "HI = 100.00 + 4.25 = 104.25 ft. Elev P = HI − FS = 104.25 − 2.10 = 102.15 ft",
    reference: "FE Reference Handbook: Civil Engineering, Surveying",
  }),
  q({
    id: "fe-survey-002",
    topic: "surveying",
    prompt: "A circular horizontal curve has radius 500 ft and intersection angle Δ = 30°. What is the length of the curve?",
    choices: ["134.0 ft", "250.0 ft", "261.8 ft", "523.6 ft"],
    answer: 2,
    explanation:
      "L = RΔ (radians) = 500 × (30π/180) = 261.8 ft. (134.0 ft is the tangent length T = R tan(Δ/2).)",
    reference: "FE Reference Handbook: Civil Engineering, Horizontal Curves",
  }),

  // Water Resources & Environmental
  q({
    id: "fe-water-001",
    topic: "water-env",
    free: true,
    prompt:
      "Using the rational method, find the peak runoff from a 10-acre site with C = 0.6 and rainfall intensity 3 in/hr.",
    choices: ["1.8 cfs", "18 cfs", "30 cfs", "180 cfs"],
    answer: 1,
    explanation: "Q = CiA = (0.6)(3 in/hr)(10 ac) = 18 cfs (1 ac·in/hr ≈ 1.008 cfs)",
    reference: "FE Reference Handbook: Civil Engineering, Hydrology, Rational Formula",
  }),
  q({
    id: "fe-water-002",
    topic: "water-env",
    prompt: "A rectangular channel is 4 m wide with a flow depth of 1 m. What is the hydraulic radius?",
    choices: ["0.50 m", "0.67 m", "1.00 m", "4.00 m"],
    answer: 1,
    explanation: "R = A/P = (4 × 1)/(4 + 2 × 1) = 4/6 = 0.67 m",
    reference: "FE Reference Handbook: Civil Engineering, Open-Channel Flow",
  }),
  q({
    id: "fe-env-001",
    topic: "water-env",
    prompt:
      "In a BOD test, a 5% dilution of wastewater has initial DO 8.0 mg/L and DO after 5 days of 3.0 mg/L (unseeded). What is the BOD₅?",
    choices: ["5 mg/L", "50 mg/L", "100 mg/L", "250 mg/L"],
    answer: 2,
    explanation: "BOD₅ = (D₁ − D₂)/P = (8.0 − 3.0)/0.05 = 100 mg/L",
    reference: "FE Reference Handbook: Environmental Engineering, BOD",
  }),

  // Structural
  q({
    id: "fe-struct-001",
    topic: "structural",
    free: true,
    prompt: "What is the theoretical effective length factor K for a column fixed at the base and free at the top?",
    choices: ["0.5", "0.7", "1.0", "2.0"],
    answer: 3,
    explanation: "A fixed-free (flagpole) column buckles like half of a pinned-pinned column of twice the length: K = 2.0.",
    reference: "FE Reference Handbook: Mechanics of Materials, Columns",
  }),
  q({
    id: "fe-struct-002",
    topic: "structural",
    prompt:
      "A pinned-pinned steel column is 4 m long with I = 8 × 10⁶ mm⁴ and E = 200 GPa. What is the Euler buckling load?",
    choices: ["247 kN", "493 kN", "987 kN", "3,948 kN"],
    answer: 2,
    explanation:
      "P_cr = π²EI/(KL)² = π²(200,000 MPa)(8 × 10⁶ mm⁴)/(4,000 mm)² = 9.87 × 10⁵ N = 987 kN",
    reference: "FE Reference Handbook: Mechanics of Materials, Columns",
  }),

  // Geotechnical
  q({
    id: "fe-geo-001",
    topic: "geotechnical",
    free: true,
    prompt: "A soil has a void ratio of 0.60. What is its porosity?",
    choices: ["0.375", "0.40", "0.60", "1.50"],
    answer: 0,
    explanation: "n = e/(1 + e) = 0.60/1.60 = 0.375",
    reference: "FE Reference Handbook: Civil Engineering, Phase Relationships",
  }),
  q({
    id: "fe-geo-002",
    topic: "geotechnical",
    prompt:
      "The water table is 2 m below the ground surface. Soil above has γ = 18 kN/m³; soil below has γ_sat = 20 kN/m³. What is the vertical effective stress at 6 m depth? (γ_w = 9.81 kN/m³)",
    choices: ["39.2 kPa", "76.8 kPa", "96.4 kPa", "116 kPa"],
    answer: 1,
    explanation:
      "σ = 18(2) + 20(4) = 116 kPa. u = 9.81(4) = 39.2 kPa. σ' = 116 − 39.2 = 76.8 kPa",
    reference: "FE Reference Handbook: Civil Engineering, Effective Stress",
  }),
  q({
    id: "fe-geo-003",
    topic: "geotechnical",
    prompt: "What is the Rankine active earth pressure coefficient for a cohesionless soil with φ = 30°?",
    choices: ["0.333", "0.500", "0.577", "3.00"],
    answer: 0,
    explanation: "Ka = tan²(45° − φ/2) = tan²(30°) = 0.333. (3.00 is the passive coefficient Kp.)",
    reference: "FE Reference Handbook: Civil Engineering, Retaining Walls",
  }),

  // Transportation
  q({
    id: "fe-trans-001",
    topic: "transportation",
    free: true,
    prompt:
      "A freeway lane has a traffic density of 40 veh/mi and a space-mean speed of 45 mph. What is the flow rate?",
    choices: ["85 veh/hr", "1,125 veh/hr", "1,800 veh/hr", "2,400 veh/hr"],
    answer: 2,
    explanation: "q = kv = (40 veh/mi)(45 mi/hr) = 1,800 veh/hr",
    reference: "FE Reference Handbook: Civil Engineering, Traffic Flow Relationships",
  }),
  q({
    id: "fe-trans-002",
    topic: "transportation",
    prompt:
      "Find the stopping sight distance on a level road for a design speed of 60 mph, perception-reaction time 2.5 s, and deceleration 11.2 ft/s².",
    choices: ["220 ft", "345 ft", "566 ft", "780 ft"],
    answer: 2,
    explanation:
      "SSD = 1.47Vt + 1.075V²/a = 1.47(60)(2.5) + 1.075(60)²/11.2 = 220.5 + 345.5 = 566 ft",
    reference: "FE Reference Handbook: Civil Engineering, Stopping Sight Distance",
  }),

  // Construction
  q({
    id: "fe-const-001",
    topic: "construction",
    free: true,
    prompt:
      "Activities: A (3 d) and B (5 d) start the project. C (6 d) follows A. D (2 d) follows B. E (4 d) follows both C and D. What is the project duration?",
    choices: ["11 days", "13 days", "15 days", "20 days"],
    answer: 1,
    explanation: "Paths: A-C-E = 3 + 6 + 4 = 13 d. B-D-E = 5 + 2 + 4 = 11 d. Critical path A-C-E, 13 days.",
    reference: "FE Reference Handbook: Civil Engineering, Construction, CPM",
  }),
  q({
    id: "fe-const-002",
    topic: "construction",
    prompt: "1,000 bank cubic yards of soil with 25% swell is excavated. What is the loose volume?",
    choices: ["750 LCY", "800 LCY", "1,000 LCY", "1,250 LCY"],
    answer: 3,
    explanation: "Loose = Bank × (1 + swell) = 1,000 × 1.25 = 1,250 LCY",
    reference: "FE Reference Handbook: Civil Engineering, Earthwork",
  }),
];
