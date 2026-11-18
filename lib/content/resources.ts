// Links to official exam documents and the design standards NCEES supplies on the exam.
// We link only; we never host NCEES, publisher or government documents.
// Checked against NCEES pages and the April 2027 PE Civil design standards lists in November 2026.
// NCEES posts updated specs about 6 months before they take effect: recheck each spring and fall.

import type { ExamId } from "./types";

export const RESOURCES_CHECKED = "November 2026";

export interface ResourceLink {
  title: string;
  url: string;
  note?: string;
  /** Free to read or download, vs. sold by the publisher. */
  cost?: "free" | "purchase";
}

export interface ResourceSection {
  id: string;
  title: string;
  intro?: string;
  links: ResourceLink[];
}

const MYNCEES = "https://account.ncees.org/login";
const ECFR_1926 = "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1926";
const FHWA_HYDRAULICS = "https://www.fhwa.dot.gov/engineering/hydraulics/library_listing.cfm";
const FHWA_GEOTECH = "https://www.fhwa.dot.gov/engineering/geotech/library_listing.cfm";
const UFC_LIBRARY = "https://www.wbdg.org/dod/ufc";
const AASHTO_PE = "https://store.transportation.org/Page/PEExamCollectionDiscount";
const EM_1110_2_1902 = "https://www.publications.usace.army.mil/Portals/76/Publications/EngineerManuals/EM_1110-2-1902.pdf";

const examDay: ResourceSection = {
  id: "exam-day",
  title: "Registering and exam day",
  links: [
    { title: "MyNCEES account", url: MYNCEES, note: "Register, schedule, and download your free reference handbook. You may only have one account.", cost: "free" },
    { title: "Pearson VUE: NCEES exams", url: "https://www.pearsonvue.com/us/en/ncees.html", note: "Test center information. Scheduling itself happens through MyNCEES once you're authorized.", cost: "free" },
    { title: "NCEES Examinee Guide (November 2026)", url: "https://ncees.org/wp-content/uploads/2026/11/NCEESExamGuide_November-2026_3.pdf", note: "Rules, ID requirements, breaks, rescheduling (at least 48 hours ahead), fees.", cost: "free" },
    { title: "Approved calculators", url: "https://ncees.org/exams/", note: "Only Casio fx-115 / fx-991, HP 33s / 35s, and TI-30X / TI-36X models. Practice with the one you'll bring.", cost: "free" },
    { title: "State licensing board directory", url: "https://ncees.org/about/member-licensing-board-directory/", note: "Eligibility, experience and application rules differ by state.", cost: "free" },
  ],
};

const FE: ResourceSection[] = [
  {
    id: "official",
    title: "Official exam documents",
    links: [
      { title: "NCEES FE exam page", url: "https://ncees.org/exams/fe-exam/", note: "Current specifications, fees and handbook version.", cost: "free" },
      { title: "FE Civil exam specifications (PDF)", url: "https://ncees.org/wp-content/uploads/FE-Civil-CBT-specs.pdf", note: "The 14 knowledge areas and question ranges. Confirm it's the newest version on the FE exam page.", cost: "free" },
      { title: "FE Reference Handbook", url: MYNCEES, note: "Free download from your MyNCEES dashboard. The same searchable PDF is on screen during the exam, so practice with it.", cost: "free" },
    ],
  },
  examDay,
];

const PE_OFFICIAL: ResourceSection = {
  id: "official",
  title: "Official exam documents",
  intro: "80 questions in 9 hours (including a tutorial and an optional break). Updated design standards take effect with the April 2027 exam.",
  links: [
    { title: "NCEES PE Civil exam page", url: "https://ncees.org/exams/pe-exam/civil/", note: "Specifications and design standards for each depth module.", cost: "free" },
    { title: "PE Civil Reference Handbook", url: MYNCEES, note: "Free download from your MyNCEES dashboard. NCEES doesn't sell printed copies.", cost: "free" },
    { title: "Water Resources & Environmental specs + standards (April 2027)", url: "https://ncees.org/wp-content/uploads/2026/09/PE-Civil-WRE-2027-Specs-2.pdf", cost: "free" },
    { title: "Structural specs + standards (April 2027)", url: "https://ncees.org/wp-content/uploads/2026/04/PE-Civil-STR-2027-Specs.pdf", cost: "free" },
    { title: "Geotechnical specs + standards (April 2027)", url: "https://ncees.org/wp-content/uploads/2026/04/PE-Civil-GEO-2027-Specs.pdf", cost: "free" },
    { title: "Transportation specs + standards (April 2027)", url: "https://ncees.org/wp-content/uploads/2026/04/PE-Civil-TRN-2027-Specs.pdf", cost: "free" },
    { title: "Construction specs + standards (April 2027)", url: "https://ncees.org/wp-content/uploads/2026/04/PE-Civil-CON-2027-Specs.pdf", cost: "free" },
  ],
};

const PE_STANDARDS_INTRO =
  "NCEES supplies these on the exam as searchable PDFs, one chapter at a time. Answers are scored against the edition listed, so study from that edition. Free government documents are worth downloading now; for paid standards, you don't need to buy them to sit the exam, but practicing with them helps.";

const PE: ResourceSection[] = [
  PE_OFFICIAL,
  {
    id: "water-env",
    title: "Design standards: Water Resources & Environmental",
    intro: PE_STANDARDS_INTRO,
    links: [
      { title: "FHWA HDS-5: Hydraulic Design of Highway Culverts, 3rd ed. (2012, HIF-12-026)", url: FHWA_HYDRAULICS, note: "In FHWA's hydraulics library.", cost: "free" },
      { title: "FHWA HEC-14: Hydraulic Design of Energy Dissipators for Culverts and Channels, 3rd ed. (2006, NHI-06-086)", url: FHWA_HYDRAULICS, note: "In FHWA's hydraulics library.", cost: "free" },
      { title: "Recommended Standards for Water Works (2022) and for Wastewater Facilities (2014): \"10 States Standards\"", url: "https://www.health.state.mn.us/communities/environment/water/tenstates/standards.html", cost: "free" },
      { title: "USACE EM 1110-2-1902: Slope Stability (2003)", url: EM_1110_2_1902, cost: "free" },
      { title: "UFC 3-220-05: Dewatering and Groundwater Control (2004)", url: UFC_LIBRARY, note: "Search the UFC library for 3-220-05.", cost: "free" },
      { title: "29 CFR 1926: OSHA Safety and Health Regulations for Construction", url: ECFR_1926, note: "Exam covers selected subparts, including M (fall protection) and P (excavations).", cost: "free" },
    ],
  },
  {
    id: "structural",
    title: "Design standards: Structural",
    intro: PE_STANDARDS_INTRO,
    links: [
      { title: "ASCE 7-22: Minimum Design Loads for Buildings and Other Structures", url: "https://www.asce.org", cost: "purchase" },
      { title: "ACI 318-19 (2022): Building Code Requirements for Structural Concrete", url: "https://www.concrete.org", cost: "purchase" },
      { title: "AISC Steel Construction Manual, 16th ed. (2022)", url: "https://www.aisc.org", cost: "purchase" },
      { title: "AASHTO LRFD Bridge Design Specifications, 10th ed. (2024)", url: AASHTO_PE, note: "PE/SE exam edition sold by AASHTO.", cost: "purchase" },
      { title: "International Building Code, 2024 (without supplements)", url: "https://www.iccsafe.org", cost: "purchase" },
      { title: "AWC NDS Wood Design Package (NDS 2024, Supplement 2024, SDPWS 2021)", url: "https://www.awc.org", note: "The exam uses Allowable Stress Design (ASD) only for wood.", cost: "purchase" },
      { title: "TMS 402/602-22: Masonry Structures", url: "https://www.masonrysociety.org", cost: "purchase" },
      { title: "PCI Design Handbook, 8th ed. (2017)", url: "https://www.pci.org", cost: "purchase" },
      { title: "29 CFR 1926: OSHA construction (selected subparts L, M, Q, R)", url: ECFR_1926, cost: "free" },
      { title: "29 CFR 1910: OSHA general industry (selected fall protection and platform sections)", url: "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1910", cost: "free" },
    ],
  },
  {
    id: "geotechnical",
    title: "Design standards: Geotechnical",
    intro: PE_STANDARDS_INTRO,
    links: [
      { title: "FHWA Soils and Foundations Reference Manual, Vols. I and II (2006, NHI-06-088/089)", url: FHWA_GEOTECH, cost: "free" },
      { title: "FHWA GEC 5: Geotechnical Site Characterization (2017, NHI-16-072)", url: FHWA_GEOTECH, cost: "free" },
      { title: "FHWA GEC 10: Drilled Shafts (2018, NHI-18-024)", url: FHWA_GEOTECH, cost: "free" },
      { title: "FHWA GEC 12: Driven Pile Foundations, Vols. I and II (2016, NHI-16-009/010)", url: FHWA_GEOTECH, cost: "free" },
      { title: "FHWA GEC 3: LRFD Seismic Analysis and Design of Transportation Geotechnical Features (2011, NHI-11-032)", url: FHWA_GEOTECH, cost: "free" },
      { title: "FHWA Geosynthetic Design & Construction Guidelines (2008, NHI-07-092)", url: FHWA_GEOTECH, cost: "free" },
      { title: "FHWA Geotechnical Aspects of Pavements (2006, NHI-05-037)", url: FHWA_GEOTECH, cost: "free" },
      { title: "USACE EM 1110-2-1902: Slope Stability (2003)", url: EM_1110_2_1902, cost: "free" },
      { title: "UFC 3-220-05 (Dewatering, 2004), 3-220-10 (Soil Mechanics, 2022), 3-220-20 (Foundations and Earth Structures, 2025)", url: UFC_LIBRARY, note: "Newer editions may be posted; study the editions listed here, which are the ones NCEES scores against.", cost: "free" },
      { title: "ASCE 7-22: Minimum Design Loads", url: "https://www.asce.org", cost: "purchase" },
      { title: "29 CFR 1926: OSHA construction (selected subparts E, M, P, CC)", url: ECFR_1926, cost: "free" },
    ],
  },
  {
    id: "transportation",
    title: "Design standards: Transportation",
    intro: PE_STANDARDS_INTRO,
    links: [
      { title: "MUTCD, 11th ed. (2023)", url: "https://mutcd.fhwa.dot.gov/", note: "FHWA has since posted Revision 1; the exam lists the 2023 11th edition.", cost: "free" },
      { title: "FHWA HDS-5: Hydraulic Design of Highway Culverts, 3rd ed. (2012)", url: FHWA_HYDRAULICS, cost: "free" },
      {
        title: "AASHTO PE Exam Collection: Green Book (7th ed.), Roadside Design Guide (4th), Pedestrian Facilities (2nd), Highway Safety Manual (1st + 2014 supplement), MEPDG (3rd), Guide for Design of Pavement Structures (1993)",
        url: AASHTO_PE,
        note: "AASHTO sells these as a discounted PE exam bundle.",
        cost: "purchase",
      },
      { title: "Highway Capacity Manual, 7th ed. (2022)", url: "https://www.mytrb.org", cost: "purchase" },
    ],
  },
  {
    id: "construction",
    title: "Design standards: Construction",
    intro: PE_STANDARDS_INTRO,
    links: [
      { title: "MUTCD Part 6: Temporary Traffic Control, 11th ed. (2023)", url: "https://mutcd.fhwa.dot.gov/", cost: "free" },
      { title: "29 CFR 1926: OSHA Safety and Health Regulations for Construction", url: ECFR_1926, cost: "free" },
      { title: "29 CFR 1903 and 1904: OSHA inspections; recording and reporting injuries", url: "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII", cost: "free" },
      { title: "ACI SP-4: Formwork for Concrete, 8th ed. (2014, includes ACI 347R)", url: "https://www.concrete.org", cost: "purchase" },
      { title: "ACI 318-19 (2022): Structural Concrete", url: "https://www.concrete.org", cost: "purchase" },
      { title: "AISC Steel Construction Manual, 16th ed. (2022)", url: "https://www.aisc.org", cost: "purchase" },
      { title: "ASCE 37-14: Design Loads on Structures During Construction", url: "https://www.asce.org", cost: "purchase" },
      { title: "PCA EB001: Design and Control of Concrete Mixtures, 17th ed. (2021)", url: "https://www.cement.org", cost: "purchase" },
    ],
  },
  examDay,
];

export function resourcesFor(exam: ExamId): ResourceSection[] {
  return exam === "fe-civil" ? FE : PE;
}
