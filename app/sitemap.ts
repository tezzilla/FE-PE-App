import type { MetadataRoute } from "next";
import { EXPLAINERS } from "@/lib/content/explainers";
import { EXAMS, EXAM_IDS } from "@/lib/content/exams";
import { PE_MODULE_SPECS } from "@/lib/content/pe-spec";
import { COMPETITORS } from "@/lib/content/competitors";

const base = () => (process.env.APP_URL ?? "https://www.getcivilprep.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: `${base()}${path}`, changeFrequency: "weekly", priority });
  return [
    u("/", 1),
    u("/pricing", 0.9),
    u("/learn", 0.8),
    ...EXPLAINERS.map((e) => u(`/learn/${e.slug}`, 0.7)),
    ...EXAM_IDS.flatMap((id) => [u(`/exams/${id}`, 0.8), u(`/free/${id}`, 0.7), ...EXAMS[id].topics.map((t) => u(`/exams/${id}/topics/${t.slug}`, 0.6))]),
    ...Object.keys(PE_MODULE_SPECS).map((m) => u(`/exams/pe-civil/modules/${m}`, 0.7)),
    u("/compare", 0.5),
    ...COMPETITORS.map((c) => u(`/compare/${c.slug}`, 0.5)),
    u("/gift", 0.4),
    u("/refunds", 0.3),
  ];
}
