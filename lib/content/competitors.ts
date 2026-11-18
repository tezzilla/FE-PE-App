// Facts for the comparison pages. Every competitor fact here comes from the competitor's own published
// pages or review sites found on 2026-11-18 (see docs/PRICING-RESEARCH.md and docs/COMPETITOR-FEATURES.md),
// and the PrepFE entries were re-read from prepfe.com the same day. Prices change: re-check each spring
// and fall, and update CHECKED. Where we don't know, say "Not advertised", never "No".
// Trademarks belong to their owners; CivilPrep is not affiliated with any of these companies.

export const CHECKED = "November 2026";

export interface Competitor {
  slug: string;
  name: string;
  kind: string;
  summary: string;
  url: string;
  rows: Record<RowKey, string>;
  chooseThem: string[];
  chooseUs: string[];
}

export type RowKey = "format" | "feprice" | "peprice" | "exams" | "bank" | "adaptive" | "plan" | "flashcards" | "video" | "guarantee" | "coverage";

export const ROWS: { key: RowKey; label: string }[] = [
  { key: "format", label: "Format" },
  { key: "feprice", label: "FE Civil price" },
  { key: "peprice", label: "PE Civil price" },
  { key: "exams", label: "Full-length timed exams" },
  { key: "bank", label: "Practice problems" },
  { key: "adaptive", label: "Adaptive practice (targets weak topics)" },
  { key: "plan", label: "Study plan from your exam date" },
  { key: "flashcards", label: "Flashcards" },
  { key: "video", label: "Video lessons" },
  { key: "guarantee", label: "Pass guarantee" },
  { key: "coverage", label: "Exams covered" },
];

export const CIVILPREP: Record<RowKey, string> = {
  format: "Practice platform: problems, smart practice, timed exams",
  feprice: "$29/month, or $69 for 3 months",
  peprice: "$59/month, or $249 for 6 months",
  exams: "Yes: 110-question FE and 80-question PE simulations",
  bank: "Written questions plus calculation problems that never repeat",
  adaptive: "Yes: smart practice, spaced review and a readiness score",
  plan: "Yes: weekly targets, focus topics and scheduled practice exams",
  flashcards: "Yes, with spaced repetition and handbook references",
  video: "No",
  guarantee: "No",
  coverage: "FE Civil and PE Civil (all 5 depth modules)",
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "ppi2pass",
    name: "PPI2Pass",
    kind: "Full review course (Kaplan)",
    url: "https://ppi2pass.com",
    summary:
      "PPI2Pass sells complete review courses with instruction, practice exams and a learning path. It's a strong choice if you want structured lessons. CivilPrep focuses on the practice itself, at a small fraction of the price.",
    rows: {
      format: "Full course: on-demand or live instruction",
      feprice: "About $1,195 (4 months) to $1,495 (6 months) on-demand; live courses about $1,295 to $1,795",
      peprice: "On-demand up to about $2,795 per year",
      exams: "Yes (advertises 5 full-length FE exams)",
      bank: "Advertises about 550 FE problems",
      adaptive: "Not advertised",
      plan: "Yes: a learning path that adjusts to your weekly hours",
      flashcards: "Yes",
      video: "Yes",
      guarantee: "Offered with some bundles",
      coverage: "Many FE and PE disciplines",
    },
    chooseThem: ["You learn best from structured lessons and an instructor", "Your employer is paying and cost isn't a concern"],
    chooseUs: [
      "You already know the material and need lots of exam-style practice",
      "You want practice that targets your weak topics automatically",
      "You'd rather spend about $69 to $249 than $1,000 or more",
    ],
  },
  {
    slug: "school-of-pe",
    name: "School of PE",
    kind: "Full review course and question bank",
    url: "https://www.schoolofpe.com",
    summary:
      "School of PE offers video lecture courses and a separate question bank. Its courses include extras like instructor access on some plans. CivilPrep gives you adaptive practice and full timed exams for less than their question bank alone.",
    rows: {
      format: "Video lecture courses, plus a separate question bank",
      feprice: "Course: about $349/month, or $1,099 to $1,999 for 4 to 12 months. Question bank: about $139/month",
      peprice: "Course: about $499/month or $1,599 to $2,799. Question bank: about $139/month or $399 for 4 months",
      exams: "Yes",
      bank: "Large question bank with a quiz generator",
      adaptive: "Not advertised",
      plan: "Yes: personalized study plan",
      flashcards: "Not advertised",
      video: "Yes",
      guarantee: "Yes, on some course plans (not monthly)",
      coverage: "Many FE and PE disciplines",
    },
    chooseThem: ["You want recorded lectures that walk through every topic", "You want direct instructor questions (on some plans)"],
    chooseUs: [
      "You want an affordable monthly price you can cancel anytime",
      "You want practice picked for your weak topics and a readiness score",
      "Your budget is closer to $69 than $1,000",
    ],
  },
  {
    slug: "prepfe",
    name: "PrepFE",
    kind: "FE practice question platform",
    url: "https://www.prepfe.com",
    summary:
      "PrepFE is the closest product to CivilPrep: an online FE practice platform with fixed-length passes. It covers seven FE disciplines and offers a pass guarantee with conditions. CivilPrep adds adaptive practice, a study plan, and the PE Civil in the same product.",
    rows: {
      format: "Practice problems and practice exams",
      feprice: "$79.99 (1 month), $99.99 (3 months) or $119.99 (6 months), one payment",
      peprice: "Not covered (separate PE product)",
      exams: "Yes: timed and topic practice exams",
      bank: "Advertises 500+ FE problems",
      adaptive: "Strengths and weaknesses breakdown; adaptive question selection not advertised",
      plan: "Not advertised",
      flashcards: "Yes (reference handbook)",
      video: "Not advertised",
      guarantee: "Yes: a free repeat subscription if you fail and meet its practice requirements",
      coverage: "FE only, 7 disciplines",
    },
    chooseThem: ["You're taking an FE discipline other than Civil", "A pass guarantee matters most to you"],
    chooseUs: [
      "You want smart practice that picks problems for your weak topics",
      "You want a study plan built from your exam date",
      "You'll take the PE Civil later and want one place for both",
      "You'd pay $69 for 3 months instead of $99.99",
    ],
  },
];

export const getCompetitor = (slug: string) => COMPETITORS.find((c) => c.slug === slug);
