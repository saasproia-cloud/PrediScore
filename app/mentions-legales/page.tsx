import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";
import { SUPPORT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/constants/contact";
import { SITE_NAME } from "@/lib/constants/config";

export const metadata: Metadata = {
  title: `Mentions légales — ${SITE_NAME}`,
};

export default function LegalNoticePage() {
  return (
    <LegalShell title="Mentions légales" updated={LEGAL_LAST_UPDATED}>
      <LegalSection title="Éditeur">
        <p>
          {SITE_NAME} est un service numérique d'analyse de matchs de football.
          Contact support et demandes administratives :{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>
          Responsable éditorial {SITE_NAME}. L'identité légale complète de
          l'éditeur devra être ajoutée ici avant une mise en production commerciale.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA
          91789, États-Unis — vercel.com.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Le contenu du site, le design, les textes et les analyses générées sont
          protégés. Les noms de clubs, ligues, compétitions et joueurs sont cités
          à titre informatif ; {SITE_NAME} n'est affilié à aucune entité sportive
          mentionnée.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute demande, écris à{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
