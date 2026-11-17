import type { MetadataRoute } from "next";

// Lets students "Add to Home Screen" and open the site full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivilPrep: FE & PE Civil prep",
    short_name: "CivilPrep",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ea580c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
