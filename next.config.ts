import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { dev }) {
    if (dev) {
      // The local SQLite database (prisma/dev.db) changes on every write. Without this, each write
      // triggers a hot reload mid-request, which intermittently breaks requests in development.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/prisma/*.db", "**/prisma/*.db-journal"],
      };
    }
    return config;
  },
};

export default nextConfig;
