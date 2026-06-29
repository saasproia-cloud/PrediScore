import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Un autre package-lock.json existe plus haut dans l'arborescence
  // (~/package-lock.json) : on force la racine de tracing sur ce projet.
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    remotePatterns: [
      // Logos d'équipes / ligues — CDN public d'API-Football.
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "media-*.api-sports.io" },
    ],
  },
};

export default nextConfig;
