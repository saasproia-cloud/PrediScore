import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants/config";

// /robots.txt — dit aux moteurs ce qu'ils peuvent indexer.
// On laisse indexer les pages publiques PrediScore et on bloque les surfaces
// applicatives, auth et API.

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    "/app",
    "/connexion",
    "/auth",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Applebot = le crawler d'Apple (Spotlight, Siri, Safari Suggestions).
      // Explicite pour signaler qu'Apple est autorisé à indexer prediscore.
      { userAgent: "Applebot", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
