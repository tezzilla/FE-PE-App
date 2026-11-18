import type { MetadataRoute } from "next";

const base = () => (process.env.APP_URL ?? "https://www.getcivilprep.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/review", "/dashboard", "/account", "/unsubscribe", "/free/*/set"] }],
    sitemap: `${base()}/sitemap.xml`,
  };
}
