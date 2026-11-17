import type { Question } from "./types";

// Original practice questions modeled on the PE Civil specifications. Keep content original.

const q = (x: Omit<Question, "exam">): Question => ({ ...x, exam: "pe-civil" });

export const PE_CIVIL: Question[] = [
  // Structural
  q({
    id: "pe-struct-001",
    topic: "structural",
    free: true,
    prompt:
      "A fixed-fixed beam spans 24 ft and carries a uniform load of 2 kip/ft. What is the fixed-end moment?",
    choices: ["48 kip·ft", "96 kip·ft", "144 kip·ft", "192 kip·ft"],
    answer: 1,
    explanation: "FEM = wL²/12 = (2)(24)²/12 = 96 kip·ft",
    reference: "PE Civil Reference Handbook: Structural, Beam Formulas",
  }),
  q({
    id: "pe-struct-002",
    topic: "structural",
    prompt:
      "A laterally braced steel beam (Fy = 50 ksi) must resist a factored moment Mu = 400 kip·ft. Assuming the section is compact and Mn = FyZ, what is the minimum required plastic section modulus (LRFD, φ = 0.90)?",
    choices: ["96.0 in³", "106.7 in³", "120.0 in³", "160.0 in³"],
    answer: 1,
    explanation: "Z_req = Mu/(φFy) = (400 × 12 kip·in)/(0.90 × 50 ksi) = 4,800/45 = 106.7 in³",
    reference: "AISC 360, Chapter F",
  }),
  q({
    id: "pe-struct-003",
    topic: "structural",
    prompt:
      "A singly reinforced rectangular concrete beam has b = 12 in, d = 20 in, As = 3.00 in², f'c = 4,000 psi, fy = 60,000 psi. What is the design flexural strength φMn?",
    choices: ["216 kip·ft", "240 kip·ft", "267 kip·ft", "300 kip·ft"],
    answer: 1,
    explanation:
      "a = Asfy/(0.85f'c b) = 180/(0.85 × 4 × 12) = 4.41 in. c = a/β₁ = 4.41/0.85 = 5.19 in; c/d = 0.26 < 0.375, tension-controlled, φ = 0.90. Mn = 180(20 − 4.41/2) = 3,203 kip·in = 266.9 kip·ft. φMn = 0.90 × 266.9 = 240 kip·ft",
    reference: "ACI 318, Chapters 21 and 22",
  }),

  // Geotechnical
  q({
    id: "pe-geo-001",
    topic: "geotechnical",
    free: true,
    prompt:
      "A 4 m thick normally consolidated clay layer has Cc = 0.30 and e₀ = 0.90. At mid-layer σ'₀ = 100 kPa, and a new fill adds Δσ = 50 kPa. What is the primary consolidation settlement?",
    choices: ["63 mm", "111 mm", "176 mm", "250 mm"],
    answer: 1,
    explanation:
      "S = [Cc H/(1 + e₀)] log[(σ'₀ + Δσ)/σ'₀] = [0.30 × 4/1.90] log(150/100) = 0.632 × 0.176 = 0.111 m = 111 mm",
    reference: "PE Civil Reference Handbook: Geotechnical, Consolidation",
  }),
  q({
    id: "pe-geo-002",
    topic: "geotechnical",
    prompt:
      "A 6 m tall smooth vertical wall retains level, dry sand with γ = 18 kN/m³ and φ = 30°. What is the Rankine active thrust per meter of wall?",
    choices: ["36 kN/m", "108 kN/m", "216 kN/m", "324 kN/m"],
    answer: 1,
    explanation: "Ka = tan²(30°) = 1/3. Pa = ½ Ka γ H² = ½(1/3)(18)(6)² = 108 kN/m, acting at H/3 above the base",
    reference: "PE Civil Reference Handbook: Geotechnical, Lateral Earth Pressure",
  }),

  // Transportation
  q({
    id: "pe-trans-001",
    topic: "transportation",
    free: true,
    prompt:
      "Using Webster's method, find the optimum cycle length for a signal with total lost time L = 12 s and sum of critical flow ratios Y = 0.60.",
    choices: ["38.3 s", "46.0 s", "57.5 s", "72.0 s"],
    answer: 2,
    explanation: "C₀ = (1.5L + 5)/(1 − Y) = (1.5 × 12 + 5)/(1 − 0.60) = 23/0.40 = 57.5 s",
    reference: "PE Civil Reference Handbook: Transportation, Signal Timing",
  }),
  q({
    id: "pe-trans-002",
    topic: "transportation",
    prompt:
      "A crest vertical curve joins a +3% grade to a −3% grade. Required stopping sight distance is 500 ft. Using AASHTO criteria (h₁ = 3.5 ft, h₂ = 2.0 ft), what is the minimum curve length?",
    choices: ["463 ft", "540 ft", "695 ft", "1,000 ft"],
    answer: 2,
    explanation:
      "A = 6. Try S < L: L = AS²/2,158 = 6(500)²/2,158 = 695 ft. Since 695 > 500, the S < L assumption holds. L = 695 ft",
    reference: "AASHTO Green Book, Crest Vertical Curves",
  }),

  // Water Resources & Environmental
  q({
    id: "pe-water-001",
    topic: "water-env",
    free: true,
    prompt:
      "A concrete rectangular channel (n = 0.015) is 3 m wide, flows 1.5 m deep, and has slope 0.001. Using Manning's equation (SI), what is the discharge?",
    choices: ["3.9 m³/s", "5.2 m³/s", "7.8 m³/s", "11.7 m³/s"],
    answer: 2,
    explanation:
      "A = 4.5 m², P = 6 m, R = 0.75 m. Q = (1/n)AR^(2/3)S^(1/2) = (1/0.015)(4.5)(0.825)(0.0316) = 7.8 m³/s",
    reference: "PE Civil Reference Handbook: Water Resources, Manning's Equation",
  }),
  q({
    id: "pe-env-001",
    topic: "water-env",
    prompt: "A clarifier has a volume of 1,500 m³ and treats 6,000 m³/d. What is the hydraulic detention time?",
    choices: ["2.5 hr", "4 hr", "6 hr", "8 hr"],
    answer: 2,
    explanation: "t = V/Q = 1,500/6,000 = 0.25 d = 6 hr",
    reference: "PE Civil Reference Handbook: Environmental, Detention Time",
  }),
  q({
    id: "pe-env-002",
    topic: "water-env",
    prompt: "A wastewater has ultimate BOD L₀ = 250 mg/L and rate constant k = 0.23 d⁻¹ (base e). What is BOD₅?",
    choices: ["79 mg/L", "120 mg/L", "171 mg/L", "250 mg/L"],
    answer: 2,
    explanation: "BOD₅ = L₀(1 − e^(−kt)) = 250(1 − e^(−1.15)) = 250(0.683) = 171 mg/L",
    reference: "PE Civil Reference Handbook: Environmental, BOD Exertion",
  }),

  // Construction
  q({
    id: "pe-const-001",
    topic: "construction",
    free: true,
    prompt:
      "At a status date, budgeted cost of work performed (EV) = $400,000, actual cost (AC) = $450,000, and planned value (PV) = $500,000. What is the cost performance index?",
    choices: ["0.80", "0.89", "1.13", "1.25"],
    answer: 1,
    explanation: "CPI = EV/AC = 400,000/450,000 = 0.89. The project is over budget. (SPI = EV/PV = 0.80.)",
    reference: "PE Civil Reference Handbook: Construction, Earned Value",
  }),
  q({
    id: "pe-const-002",
    topic: "construction",
    prompt:
      "A scraper carries 20 LCY per load with a cycle time of 6 min. Using a 50-minute working hour, what is the hourly production?",
    choices: ["120 LCY/hr", "167 LCY/hr", "200 LCY/hr", "333 LCY/hr"],
    answer: 1,
    explanation: "Cycles/hr = 50/6 = 8.33. Production = 8.33 × 20 = 167 LCY/hr",
    reference: "PE Civil Reference Handbook: Construction, Equipment Productivity",
  }),
];
