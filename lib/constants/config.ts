// Réglages produit centralisés.

// Domaine de production. Base de TOUTES les URLs absolues (SEO, sitemap, image
// de partage Open Graph, données structurées). En production Vercel, renseigner
// NEXT_PUBLIC_SITE_URL=https://prediscore.io pour figer aussi les callbacks OAuth.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://prediscore.io").replace(
  /\/$/,
  "",
);

// Nom de marque affiché. Les URLs restent en minuscules (`prediscore.io`).
export const SITE_NAME = "PrediScore";

// --- Mesure d'audience (analytics) ---
// ID PUBLIC : il part de toute façon dans le navigateur du visiteur, ce n'est
// PAS un secret (à la différence d'une clé API serveur). On le met donc ici, en
// clair, comme SITE_URL. Mettre "" pour désactiver proprement Clarity.

// Microsoft Clarity : heatmaps + enregistrements de sessions. Identifiant court
// alphanumérique (Settings → Overview, ou dans le snippet d'installation).
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "xengydmkc";
