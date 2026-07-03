import Script from "next/script";
import { CLARITY_ID } from "@/lib/constants/config";

// Microsoft Clarity — heatmaps + enregistrements de sessions.
//
// Installé via next/script (l'équivalent Next.js de « coller le snippet dans le
// <head> » : le tag est injecté proprement sur toutes les pages).
// `strategy="afterInteractive"` = chargé APRÈS l'affichage → le site reste rapide.
//
// On ne charge le tracker QU'EN PRODUCTION : en local (npm run dev) rien ne part,
// sinon Clarity enregistrerait des sessions « localhost » qui fausseraient tes
// données. Sur prediscore.io (production) il se charge normalement.

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
