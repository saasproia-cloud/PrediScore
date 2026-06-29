import Script from "next/script";
import { CLARITY_ID } from "@/lib/constants/config";

// Mesure d'audience : Microsoft Clarity (heatmaps + enregistrements de sessions).
//
// Règle clé : on ne charge le tracker QU'EN PRODUCTION. En local (npm run dev)
// rien ne part — sinon Clarity enregistrerait des sessions « localhost » inutiles
// et tes propres tests fausseraient les données.
//
// `strategy="afterInteractive"` = le script se charge APRÈS l'affichage de la
// page. L'analytics ne passe jamais avant ton contenu : le site reste rapide.

const isProd = process.env.NODE_ENV === "production";

export function Analytics() {
  if (!isProd || !CLARITY_ID) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
