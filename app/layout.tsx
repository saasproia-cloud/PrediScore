import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Analytics } from "@/components/analytics/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/constants/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const DESCRIPTION =
  "Analyses de matchs de foot par IA : probabilités réelles, scénarios et niveau de confiance transparent, sur +200 ligues. Modèle statistique Dixon-Coles nourri par des données live.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — L'IA qui décrypte chaque match de foot`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "PrediScore",
    "prediscore",
    "analyse de match",
    "pronostic football IA",
    "probabilités match foot",
    "prédiction football",
    "stats football",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — L'IA qui décrypte chaque match de foot`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — L'IA qui décrypte chaque match de foot`,
    description: DESCRIPTION,
  },
};

// Données structurées (JSON-LD) : c'est ce qui aide Google à afficher le logo et
// le nom officiel "PrediScore" à côté du résultat de recherche, et à reconnaître la
// marque. `sameAs` listera tes profils sociaux officiels une fois créés.
const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: DESCRIPTION,
    // Profils sociaux officiels — aide Google à relier la marque à ses comptes.
    sameAs: [
      "https://www.tiktok.com/@prediscoreapp",
      "https://www.instagram.com/prediscore.app/",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-FR",
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`dark ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
